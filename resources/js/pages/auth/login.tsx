import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm, FormEventHandler } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { route } from 'ziggy-js';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    // 1. Define form state using useForm hook - changed 'email' to 'login'
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '', // Changed from 'email' to 'login'
        password: '',
        remember: false,
    });

    // 2. Define the manual submit handler as requested
    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // The post request sends data (login, password, remember) to the 'login' route
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email or phone number and password below to log in" // Updated description
        >
            <Head title="Log in" />

            {/* 3. Use a standard HTML form element with the onSubmit handler */}
            <form 
                onSubmit={submit}
                className="flex flex-col gap-6"
            >
                <>
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="login">Email or Phone Number</Label> {/* Updated label */}
                            <Input
                                id="login" // Changed from 'email' to 'login'
                                type="text" // Changed from 'email' to 'text'
                                name="login" // Changed from 'email' to 'login'
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="username" // Changed from 'email' to 'username'
                                placeholder="email@example.com or 08012345678" // Updated placeholder
                                value={data.login} // Bind value to form data
                                onChange={(e) => setData('login', e.target.value)} // Update form data on change
                            />
                            <InputError message={errors.login} /> {/* Updated error field */}
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                {canResetPassword && (
                                    <TextLink
                                        href={route('password.request')}
                                        className="ml-auto text-sm"
                                        tabIndex={5}
                                    >
                                        Forgot password?
                                    </TextLink>
                                )}
                            </div>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder="Password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="remember"
                                name="remember"
                                tabIndex={3}
                                checked={data.remember}
                                onCheckedChange={(checked) => setData('remember', checked)}
                            />
                            <Label htmlFor="remember">Remember me</Label>
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            )}
                            Log in
                        </Button>
                    </div>

                    {/* <div className="text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <TextLink
                            href={route('register')}
                            tabIndex={5}
                        >
                            Sign up
                        </TextLink>
                    </div> */}
                </>
            </form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}