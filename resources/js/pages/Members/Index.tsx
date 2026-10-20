import { Head, Link, router, usePage } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'
import debounce from 'lodash/debounce'
import { toast } from 'sonner'
import { Search, Plus, User, Phone, Mail, Calendar, Building, Users, Eye, MoreHorizontal, Edit, Trash2, Filter, CreditCard, Wallet, Target, BadgeIcon, CheckCircle, XCircle, TrendingUp, Info, Lock, Banknote } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import InertiaPagination from '@/components/inertia-pagination'
import type { Member, PaginatedResponse, MemberSetup } from '@/types/member'
import { route } from 'ziggy-js'
import { can } from '@/lib/can';

const breadcrumbs = [{ title: 'Members', href: route('members.index') }]

interface PaginatedMembers {
  data: Member[]
  links: { url: string | null; label: string; active: boolean }[]
  from: number
  to: number
  total: number
}

interface StatusCounts {
  all: number
  active: number
  inactive: number
}

interface CategoryCounts {
  all: number
  'Category A': number
  'Category B': number
  'Category C': number
  'Category D': number
}

interface Props {
  members: PaginatedMembers
  filters: {
    search?: string
    status?: string
    category?: string
    registration?: string // Add registration filter

  }
  statusCounts: StatusCounts
  categoryCounts: CategoryCounts
  stats: {
    totalMembers: number
    activeMembers: number
    totalReferrals: number
    totalGroups: number
    fullyRegisteredCount: number
  }
  registrationCounts: { // Add registration counts
    all: number
    registered: number
    pending: number
  }
}

type EditMode = 'name' | 'email' | 'phone' | 'category' | 'account' | null

interface SetupForm {
  type: string
  pcent: string
  exists: boolean
  disabled?: boolean
}

export default function MembersIndex({ members, filters, statusCounts, categoryCounts, stats, registrationCounts}: Props) {
  const { flash } = usePage<{ flash: { message?: string } }>().props
  const [searchQuery, setSearchQuery] = useState(filters.search || '')
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all')
  const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all')
  const [registrationFilter, setRegistrationFilter] = useState(filters.registration || 'all') // Add registration filter state

  // Edit state
  const [editMode, setEditMode] = useState<EditMode>(null)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    account_name: '',
    account_number: ''
  })
  const [setupForms, setSetupForms] = useState<SetupForm[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (flash.message) {
      toast.success(flash.message)
    }
  }, [flash.message])

  const handleSearch = useRef(
    debounce((query: string) => {
      router.get(
        route('members.index'),
        { search: query, status: statusFilter, category: categoryFilter, registration: registrationFilter }, 
        { preserveState: true, replace: true }
      )
    }, 500)
  ).current

  const handleFilter = () => {
    router.get(
      route('members.index'),
      { search: searchQuery, status: statusFilter, category: categoryFilter, registration: registrationFilter },
      { preserveState: true, replace: true }
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setRegistrationFilter('all') // Reset registration filter
    router.get(route('members.index'), {}, { preserveState: true, replace: true })
  }

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setSearchQuery(query)
    handleSearch(query)
  }

  function onStatusChange(value: string) {
    setStatusFilter(value)
    router.get(
      route('members.index'),
      { search: searchQuery, status: value, category: categoryFilter },
      { preserveState: true, replace: true }
    )
  }

  function onCategoryChange(value: string) {
    setCategoryFilter(value)
    router.get(
      route('members.index'),
      { search: searchQuery, status: statusFilter, category: value },
      { preserveState: true, replace: true }
    )
  }
   // Add function to handle registration filter change
  function onRegistrationChange(value: string) {
    setRegistrationFilter(value)
    router.get(
      route('members.index'),
      { 
        search: searchQuery, 
        status: statusFilter, 
        category: categoryFilter,
        registration: value 
      },
      { preserveState: true, replace: true }
    )
  }

  function updateStatus(memberId: number, status: boolean) {
    if (confirm(`Are you sure you want to ${status ? 'activate' : 'deactivate'} this member?`)) {
      router.patch(route('members.update-status', memberId), { nstatus: status })
    }
  }

  // Edit functions
  const openEditDialog = async (mode: EditMode, member: Member) => {
    setEditMode(mode)
    setEditingMember(member)
    setEditForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.mobile || '',
      category: member.category || '',
      account_name: member.account_name || '',
      account_number: member.account_number || ''
    })

    // If opening category dialog, fetch member setups
    if (mode === 'category') {
      try {
        const response = await fetch(route('members.setups', member.id))
        const setups = await response.json()
        
        // Initialize setup forms with existing values or defaults
        const setupTypes = ['SHARES', 'SSAVINGS', 'WALLET', 'SAVINGS', 'BUILDING']
        const defaultValues = {
          'SHARES': '7.69',
          'SSAVINGS': '30.00',
          'WALLET': '0.00',
          'SAVINGS': '0.00',
          'BUILDING': '200.00'
        }

        // Define which setups are disabled
        const disabledSetups = ['SHARES', 'BUILDING']
        
        const setupFormsData = setupTypes.map(type => {
          const existingSetup = setups.find((s: MemberSetup) => s.type === type)
          return {
            type,
            pcent: existingSetup ? existingSetup.pcent.toString() : defaultValues[type as keyof typeof defaultValues],
            exists: !!existingSetup,
            disabled: disabledSetups.includes(type)
          }
        })
        
        setSetupForms(setupFormsData)
      } catch (error) {
        console.error('Failed to fetch setups:', error)
        toast.error('Failed to load member setups')
      }
    }
  }

  const closeEditDialog = () => {
    setEditMode(null)
    setEditingMember(null)
    setEditForm({ 
      name: '', 
      email: '', 
      phone: '', 
      category: '', 
      account_name: '', 
      account_number: '' 
    })
    setSetupForms([])
    setIsSubmitting(false)
  }

  const handleSetupChange = (index: number, value: string) => {
    const setup = setupForms[index]
    // Don't allow changes for disabled setups
    if (setup.disabled) return

    const updatedSetups = [...setupForms]
    updatedSetups[index].pcent = value
    setSetupForms(updatedSetups)
  }

  const handleEditSubmit = async () => {
    if (!editingMember || !editMode) return

    setIsSubmitting(true)

    try {
      let routeName = ''
      let formData = {}

      switch (editMode) {
        case 'name':
          routeName = 'members.update-name'
          formData = { name: editForm.name }
          break
        case 'email':
          routeName = 'members.update-email'
          formData = { email: editForm.email }
          break
        case 'phone':
          routeName = 'members.update-phone'
          formData = { phone: editForm.phone }
          break
        case 'category':
          routeName = 'members.update-category'
          formData = { 
            category: editForm.category,
            setups: setupForms.map(setup => ({
              type: setup.type,
              pcent: parseFloat(setup.pcent) || 0
            }))
          }
          break
        case 'account':
          routeName = 'members.update-account'
          formData = { 
            account_name: editForm.account_name,
            account_number: editForm.account_number
          }
          break
      }

      await router.patch(route(routeName, editingMember.id), formData)
      closeEditDialog()
      toast.success(`${editMode.charAt(0).toUpperCase() + editMode.slice(1)} updated successfully!`)
    } catch (error) {
      toast.error('Failed to update. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if member can edit phone (no category and no balances)
  const canEditPhone = (member: Member) => {
    return !member.category && (!member.balances || member.balances.length === 0)
  }

  const getStatusColor = (status: boolean) => {
    return status ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Use stats from props (totals for ALL members)
  const { totalMembers, activeMembers, totalReferrals, totalGroups, fullyRegisteredCount } = stats

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || registrationFilter !== 'all'

  // Status options with counts
  const statusOptions = {
    all: `All Members (${statusCounts.all})`,
    active: `Active (${statusCounts.active})`,
    inactive: `Inactive (${statusCounts.inactive})`
  }

  // Category options with counts
  const categoryOptions = {
    all: `All Categories (${categoryCounts.all})`,
    'Category A': `Category A (${categoryCounts['Category A']})`,
    'Category B': `Category B (${categoryCounts['Category B']})`,
    'Category C': `Category C (${categoryCounts['Category C']})`,
    'Category D': `Category D (${categoryCounts['Category D']})`
  }
  const registrationOptions = {
    all: `All (${registrationCounts.all})`,
    registered: `Registered (${registrationCounts.registered})`,
    pending: `Pending (${registrationCounts.pending})`
  }


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Members Management" />
      
      <div className="flex flex-col gap-4 p-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Members Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage and view all members in the system
            </p>
          </div>
        </div>

        {/* Stats Cards - Showing totals for ALL members */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                All system members
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeMembers}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fully Registered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{fullyRegisteredCount}</div>
              <p className="text-xs text-muted-foreground">
                Completed registration
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalReferrals}</div>
              <p className="text-xs text-muted-foreground">
                All referrals made
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ajo Groups</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totalGroups}</div>
              <p className="text-xs text-muted-foreground">
                Group memberships
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        {/* Filters Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Update grid to have 5 columns for all filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={onSearchChange}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={onStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusOptions).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={onCategoryChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryOptions).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Registration Status Filter - NEW */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Registration Status</label>
                <Select value={registrationFilter} onValueChange={onRegistrationChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(registrationOptions).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Empty column for alignment */}
              <div className="space-y-2">
                <label className="text-sm font-medium invisible">Actions</label>
                <div className="h-10 flex items-end">
                  {/* This empty div maintains alignment */}
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-end gap-2 mt-4">
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
              <Button onClick={handleFilter}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Members Directory</CardTitle>
                <CardDescription>
                  Showing {members.from}-{members.to} of {members.total} members
                  {hasActiveFilters && ' (filtered)'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Groups</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.data.map((member, index) => (
                    <TableRow key={member.id} className="group hover:bg-muted/25 transition-colors">
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1 + members.from - 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                            {member.photo ? (
                              <img 
                                src={member.photo_url}
                                alt={member.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">
                              <code>{member.account_number}</code>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{member.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{member.mobile}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{member.bank_name || 'Wema Bank'}</div>
                          <div className="text-xs text-muted-foreground">
                            {member.account_name} • {member.account_number}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {member.category || 'Not Set'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {member.is_fully_registered ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Registered
                              </Badge>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-amber-600" />
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Pending
                              </Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{member.referrals_made_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{member.ajo_memberships_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(member.nstatus)}>
                          {member.nstatus ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(member.created_at)}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                            {can('view_members_details') && (
                              <DropdownMenuItem asChild>
                                <Link href={route('members.show', { member: member.id })} prefetch>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {/* Edit Options */}
                            {can('edit_members_name') && (
                              <DropdownMenuItem onClick={() => openEditDialog('name', member)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Name
                              </DropdownMenuItem>
                            )}
                            {can('edit_members_email') && (
                              <DropdownMenuItem onClick={() => openEditDialog('email', member)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Edit Email
                              </DropdownMenuItem>
                            )}
                            {canEditPhone(member) && can('edit_members_phone') && (
                              <DropdownMenuItem onClick={() => openEditDialog('phone', member)}>
                                <Phone className="h-4 w-4 mr-2" />
                                Edit Phone
                              </DropdownMenuItem>
                            )}

                            {can('edit_members_category') && (
                              <DropdownMenuItem onClick={() => openEditDialog('category', member)}>
                                <BadgeIcon className="h-4 w-4 mr-2" />
                                {member.category ? 'Update Category & Setups' : 'Set Category & Setups'}
                              </DropdownMenuItem>
                            )}

                            {can('edit_members_account') && (
                              <DropdownMenuItem onClick={() => openEditDialog('account', member)}>
                                <Banknote className="h-4 w-4 mr-2" />
                                Edit Account Details
                              </DropdownMenuItem>
                            )}

                            {/* Status Update Actions */}
                            {member.nstatus ? (
                              <DropdownMenuItem onClick={() => updateStatus(member.id, false)}>
                                <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                                Deactivate Member
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => updateStatus(member.id, true)}>
                                <User className="h-4 w-4 mr-2 text-green-600" />
                                Activate Member
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {members.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <div>No members found</div>
                        {hasActiveFilters ? (
                          <div className="text-sm mt-1">
                            Try adjusting your filter criteria
                          </div>
                        ) : (
                          <div className="text-sm mt-1">
                            No members in the system
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {members.data.length > 0 && (
              <div className="p-6 border-t">
                <InertiaPagination data={members} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={editMode === 'name'} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member Name</DialogTitle>
            <DialogDescription>
              Update the member name for {editingMember?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter member name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Name'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Email Dialog */}
      <Dialog open={editMode === 'email'} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Email Address</DialogTitle>
            <DialogDescription>
              Update the email address for {editingMember?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Phone Dialog */}
      <Dialog open={editMode === 'phone'} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Phone Number</DialogTitle>
            <DialogDescription>
              Update the phone number for {editingMember?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            {editingMember && !canEditPhone(editingMember) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>Restricted:</strong> Phone number cannot be edited for members with category or balance records.
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditSubmit} 
              disabled={isSubmitting || (editingMember && !canEditPhone(editingMember))}
            >
              {isSubmitting ? 'Updating...' : 'Update Phone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog - Updated with disabled SHARES and BUILDING */}
      <Dialog open={editMode === 'category'} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember?.category ? 'Update Category & Setups' : 'Set Category & Setups'}
            </DialogTitle>
            <DialogDescription>
              {editingMember?.category 
                ? `Update category from "${editingMember.category}" and modify setups.`
                : 'Set member category and configure setups.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Category A">Category A</SelectItem>
                  <SelectItem value="Category B">Category B</SelectItem>
                  <SelectItem value="Category C">Category C</SelectItem>
                  <SelectItem value="Category D">Category D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Editable Setup Forms */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Setup Configuration:</span>
              </div>
              
              <div className="space-y-3">
                {setupForms.map((setup, index) => (
                  <div key={setup.type} className={`space-y-2 p-3 rounded ${
                    setup.disabled ? 'bg-gray-100 border border-gray-200' : 'bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`setup-${setup.type}`} className="text-sm font-medium">
                          {setup.type}
                        </label>
                        {setup.disabled && (
                          <Lock className="h-3 w-3 text-gray-500" />
                        )}
                      </div>
                      {setup.exists && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          Existing
                        </Badge>
                      )}
                    </div>
                    <Input
                      id={`setup-${setup.type}`}
                      type="number"
                      step="0.01"
                      value={setup.pcent}
                      onChange={(e) => handleSetupChange(index, e.target.value)}
                      placeholder={`Enter ${setup.type} percentage`}
                      disabled={setup.disabled}
                      className={setup.disabled ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : ''}
                    />
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>
                        {setup.exists 
                          ? `Current setup value: ${setup.pcent}%` 
                          : 'New setup will be created'
                        }
                      </span>
                      {setup.disabled && (
                        <span className="text-amber-600 font-medium">Fixed Value</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Note:</strong> SHARES and BUILDING have fixed values and cannot be modified. 
                    Other setups can be edited and will be updated or created based on your input.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : editingMember?.category ? 'Update Category & Setups' : 'Set Category & Setups'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Details Dialog */}
      <Dialog open={editMode === 'account'} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account Details</DialogTitle>
            <DialogDescription>
              Update bank account information for {editingMember?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Fixed Bank Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank Name</label>
              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded border">
                <Lock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Wema Bank</span>
              </div>
              <p className="text-xs text-gray-500">
                Bank name is fixed to Wema Bank and cannot be changed.
              </p>
            </div>

            {/* Account Name */}
            <div className="space-y-2">
              <label htmlFor="account_name" className="text-sm font-medium">
                Account Name
              </label>
              <Input
                id="account_name"
                value={editForm.account_name}
                onChange={(e) => setEditForm({ ...editForm, account_name: e.target.value })}
                placeholder="Enter account holder name"
              />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <label htmlFor="account_number" className="text-sm font-medium">
                Account Number
              </label>
              <Input
                id="account_number"
                value={editForm.account_number}
                onChange={(e) => setEditForm({ ...editForm, account_number: e.target.value })}
                placeholder="Enter 10-digit account number"
                maxLength={10}
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Note:</strong> Bank name is fixed to Wema Bank. Only account name and account number can be updated.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Account Details'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}