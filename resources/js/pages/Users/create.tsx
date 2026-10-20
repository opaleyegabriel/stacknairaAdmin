import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/input-error';
import { Loader2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { route } from 'ziggy-js';

interface CurrentUser {
  roles: { name: string }[];
}

interface State {
  id: number;
  state: string;
}

interface Location {
  id: number;
  location: string;
  state_id: number;
}

export default function CreateUser({
  roles,
  currentUser,
  states = [],
  locations = []
}: {
  roles: string[];
  currentUser: CurrentUser;
  states: State[];
  locations: Location[];
}) {
  const { data, setData, post, processing, errors } = useForm<{
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    status: string;
    roles: string[];
    state_id: string;
    location_id: string;
    accessible_states: number[];
    accessible_locations: number[];
  }>({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    status: '',
    roles: [],
    state_id: '',
    location_id: '',
    accessible_states: [],
    accessible_locations: [],
  });

  // Filter locations based on selected state
  const filteredLocations = data.state_id 
    ? locations.filter(location => location.state_id === parseInt(data.state_id))
    : [];

  // Filter locations for multiple selection based on selected states
  const filteredMultipleLocations = data.accessible_states.length > 0
    ? locations.filter(location => data.accessible_states.includes(location.state_id))
    : locations;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    post(route('users.store'));
  }

  return (
    <AppLayout breadcrumbs={[{ title: 'Create User', href: route('users.create') }]}>
      <Head title="Create User" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="rounded border p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="text-xl text-slate-600">Create User</div>
            <Button>
              <Link href={route('users.index')} prefetch>
                Go Back
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Basic Information */}
                  <div className="col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      type="text"
                      id="name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      aria-invalid={!!errors.name}
                    />
                    <InputError message={errors.name} />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      id="email"
                      autoComplete="off"
                      name="email"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      aria-invalid={!!errors.email}
                    />
                    <InputError message={errors.email} />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      type="text"
                      id="phone"
                      value={data.phone}
                      onChange={(e) => setData('phone', e.target.value)}
                      aria-invalid={!!errors.phone}
                    />
                    <InputError message={errors.phone} />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      type="password"
                      id="password"
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      aria-invalid={!!errors.password}
                    />
                    <InputError message={errors.password} />
                  </div>

                  <div className='col-span-2 md:col-span-1'>
                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                    <Input
                      type="password"
                      name="password_confirmation"
                      value={data.password_confirmation}
                      onChange={(e) => setData('password_confirmation', e.target.value)}
                      placeholder="Confirm Password"
                    />
                    <InputError message={errors.password_confirmation} />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <Label htmlFor="status">Status</Label>
                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Active</SelectItem>
                        <SelectItem value="0">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <InputError message={errors.status} />
                  </div>

                  {/* Primary Location Access */}
                  <div className="col-span-2">
                    <h3 className="text-lg font-semibold mb-4 text-slate-700">Primary Location Assignment</h3>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <Label htmlFor="state_id">Primary State *</Label>
                    <Select 
                      value={data.state_id} 
                      onValueChange={(value) => {
                        setData('state_id', value);
                        setData('location_id', ''); // Reset location when state changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id.toString()}>
                            {state.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InputError message={errors.state_id} />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <Label htmlFor="location_id">Primary Location *</Label>
                    <Select 
                      value={data.location_id} 
                      onValueChange={(value) => setData('location_id', value)}
                      disabled={!data.state_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={data.state_id ? "Select Location" : "Select State First"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id.toString()}>
                            {location.location}
                          </SelectItem>
                        ))}
                        {data.state_id && filteredLocations.length === 0 && (
                          <SelectItem value="" disabled>No locations found for this state</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <InputError message={errors.location_id} />
                    {!data.state_id && (
                      <p className="text-sm text-amber-600 mt-1">Please select a state first</p>
                    )}
                  </div>

                  {/* Multiple States Access */}
                  <div className="col-span-2">
                    <h3 className="text-lg font-semibold mb-4 text-slate-700">Additional Access (Multiple Selection)</h3>
                  </div>

                  <div className="col-span-2">
                    <Label className="mb-2">Accessible States</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {states.map((state) => (
                        <div key={state.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`state-${state.id}`}
                            checked={data.accessible_states.includes(state.id)}
                            onCheckedChange={(checked) => {
                              const newStates = checked
                                ? [...data.accessible_states, state.id]
                                : data.accessible_states.filter((id) => id !== state.id);
                              
                              setData('accessible_states', newStates);
                              
                              // Remove locations from inaccessible states
                              if (!checked) {
                                const locationsToKeep = data.accessible_locations.filter(
                                  locId => {
                                    const location = locations.find(l => l.id === locId);
                                    return location && newStates.includes(location.state_id);
                                  }
                                );
                                setData('accessible_locations', locationsToKeep);
                              }
                            }}
                          />
                          <Label htmlFor={`state-${state.id}`}>{state.state}</Label>
                        </div>
                      ))}
                    </div>
                    <InputError message={errors.accessible_states} />
                  </div>

                  {/* Multiple Locations Access */}
                  <div className="col-span-2">
                    <Label className="mb-2">Accessible Locations</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredMultipleLocations.map((location) => (
                        <div key={location.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`location-${location.id}`}
                            checked={data.accessible_locations.includes(location.id)}
                            onCheckedChange={(checked) => {
                              setData(
                                'accessible_locations',
                                checked
                                  ? [...data.accessible_locations, location.id]
                                  : data.accessible_locations.filter((id) => id !== location.id)
                              );
                            }}
                            disabled={!data.accessible_states.includes(location.state_id)}
                          />
                          <Label 
                            htmlFor={`location-${location.id}`}
                            className={!data.accessible_states.includes(location.state_id) ? "text-gray-400" : ""}
                          >
                            {location.location}
                            <span className="text-xs text-gray-500 block">
                              ({states.find(s => s.id === location.state_id)?.state})
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                    <InputError message={errors.accessible_locations} />
                    {data.accessible_states.length === 0 && (
                      <p className="text-sm text-amber-600 mt-1">Select states above to see their locations</p>
                    )}
                  </div>

                  {/* Roles */}
                  <div className="col-span-2">
                    <Label htmlFor="roles" className="mb-2">Roles</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {roles
                        .filter((role) => {
                          if (role === 'Super Admin') {
                            return currentUser.roles.some(r => r.name === 'Super Admin');
                          }
                          return true;
                        })
                        .map((role) => (
                          <div key={role} className="flex items-center gap-2">
                            <Checkbox
                              id={`role-${role}`}
                              checked={data.roles.includes(role)}
                              onCheckedChange={(checked) => {
                                setData(
                                  'roles',
                                  checked
                                    ? [...data.roles, role]
                                    : data.roles.filter((p) => p !== role)
                                );
                              }}
                            />
                            <Label htmlFor={`role-${role}`}>
                              {role.replace(/_/g, ' ')}
                            </Label>
                          </div>
                        ))}
                    </div>
                    <InputError message={errors.roles} />
                  </div>
                </div>
                <div className="mt-4 text-end">
                  <Button size="lg" type="submit" disabled={processing}>
                    {processing && <Loader2 className="animate-spin mr-2" />}
                    Create User
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}