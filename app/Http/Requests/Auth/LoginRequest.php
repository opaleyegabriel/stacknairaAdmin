<?php

// namespace App\Http\Requests\Auth;

// use App\Models\User;
// use Illuminate\Auth\Events\Lockout;
// use Illuminate\Foundation\Http\FormRequest;
// use Illuminate\Support\Facades\Auth;
// use Illuminate\Support\Facades\RateLimiter;
// use Illuminate\Validation\ValidationException;

// class LoginRequest extends FormRequest
// {
//     /**
//      * Determine if the user is authorized to make this request.
//      */
//     public function authorize(): bool
//     {
//         return true;
//     }

//     /**
//      * Get the validation rules that apply to the request.
//      *
//      * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
//      */
//     public function rules(): array
//     {
//         return [
//             'email' => ['required', 'string', 'email'],
//             'password' => ['required', 'string'],
//         ];
//     }

//     /**
//      * Validate the request's credentials and return the user without logging them in.
//      *
//      * @throws \Illuminate\Validation\ValidationException
//      */
//     public function validateCredentials(): User
//     {
//         $this->ensureIsNotRateLimited();

//         /** @var User|null $user */
//         $user = Auth::getProvider()->retrieveByCredentials($this->only('email', 'password'));

//         if (! $user || ! Auth::getProvider()->validateCredentials($user, $this->only('password'))) {
//             RateLimiter::hit($this->throttleKey());

//             throw ValidationException::withMessages([
//                 'email' => __('auth.failed'),
//             ]);
//         }

//         RateLimiter::clear($this->throttleKey());

//         return $user;
//     }

//     /**
//      * Ensure the login request is not rate limited.
//      *
//      * @throws \Illuminate\Validation\ValidationException
//      */
//     public function ensureIsNotRateLimited(): void
//     {
//         if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
//             return;
//         }

//         event(new Lockout($this));

//         $seconds = RateLimiter::availableIn($this->throttleKey());

//         throw ValidationException::withMessages([
//             'email' => __('auth.throttle', [
//                 'seconds' => $seconds,
//                 'minutes' => ceil($seconds / 60),
//             ]),
//         ]);
//     }

//     /**
//      * Get the rate-limiting throttle key for the request.
//      */
//     public function throttleKey(): string
//     {
//         return $this->string('email')
//             ->lower()
//             ->append('|'.$this->ip())
//             ->transliterate()
//             ->value();
//     }
// }



namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Models\Merchant;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'login' => 'required|string',
            'password' => 'required|string',
        ];
    }

    /**
     * Get the validation attributes for custom error messages.
     */
    public function attributes(): array
    {
        return [
            'login' => 'email or phone number',
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! $this->validateCredentials()) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Validate the user credentials and create user from merchant if needed.
     */
    public function validateCredentials()
    {
        $login = $this->input('login');
        $password = $this->input('password');
        $remember = $this->boolean('remember');

        // First, try to find user in users table
        $user = $this->findUser($login);
        
        // If user not found, check if merchant exists and create user
        if (!$user) {
            $user = $this->createUserFromMerchant($login, $password);
        }

        // If we have a user, attempt login
        if ($user) {
            $credentials = [
                'email' => $user->email,
                'password' => $password,
            ];

            if (Auth::attempt($credentials, $remember)) {
                return Auth::user();
            }
        }

        return null;
    }

    /**
     * Find user by email or phone
     */
    private function findUser($login)
    {
        return User::where('email', $login)
                    ->orWhere('phone', $login)
                    ->first();
    }

    /**
     * Create user from merchant data if merchant exists
     */
    private function createUserFromMerchant($login, $password)
    {
        // Find merchant by phone number (merchant field)
        $merchant = Merchant::where('merchant', $login)->first();

        if (!$merchant) {
            return null;
        }

        // Check if user already exists with merchant's phone or email
        $existingUser = User::where('phone', $merchant->merchant)
                           ->orWhere('email', $this->generateEmailFromMerchant($merchant))
                           ->first();

        if ($existingUser) {
            return $existingUser;
        }

        // Create new user from merchant data
        $user = User::create([
            'name' => $merchant->name,
            'email' => $this->generateEmailFromMerchant($merchant),
            'phone' => $merchant->merchant,
            'password' => Hash::make($password),
            'status' => $merchant->status,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 🔐 Assign merchant role to the new user
        $this->assignMerchantRole($user);

        return $user;
    }

    /**
     * Assign merchant role to user
     */
    private function assignMerchantRole(User $user)
    {
        $merchantRole = Role::where('name', 'Merchant')->first();
        
        if ($merchantRole) {
            $user->assignRole($merchantRole);
        } else {
            // Create the merchant role if it doesn't exist
            $merchantRole = Role::create(['name' => 'Merchant', 'guard_name' => 'web']);
            $user->assignRole($merchantRole);
        }
    }

    /**
     * Generate email from merchant data if not available
     */
    private function generateEmailFromMerchant($merchant)
    {
        // You might want to modify this logic based on your needs
        $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $merchant->name));
        return $cleanName . '@merchant.local';
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'login' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('login')).'|'.$this->ip());
    }
}