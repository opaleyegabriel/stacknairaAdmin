import React, { useState, useRef, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
    User,
    Phone,
    Mail,
    Building,
    Banknote,
    Users,
    ArrowLeft,
    Eye,
    Calendar,
    Wallet,
    Target,
    Camera,
    Download,
    Printer,
    FileText,
    X,
    Loader2,
    Search,
    ArrowRight,
    CreditCard,
    PiggyBank,
    Coins,
    Home
} from 'lucide-react';
import type { Member, BalanceSummary, AjoMembership, Referral, Balance, StatementRequest } from '@/types/member';

interface MemberShowProps {
    member: Member & {
        setups: any[];
        building_track?: any;
        registration_track?: any;
        bank_witness?: any;
        referrals_made: Referral[];
        referred_by?: any;
        contribution_plan?: any;
        balances: Balance[];
        ajo_memberships: AjoMembership[];
        ajo_contributions: any[];
        ajo_payouts: any[];
    };
    balanceSummary: BalanceSummary;
}

export default function MemberShow({ member, balanceSummary }: MemberShowProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
    const [statementDialogOpen, setStatementDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [transactionsSearch, setTransactionsSearch] = useState('');
    const [referralsSearch, setReferralsSearch] = useState('');
    const [transactionsPage, setTransactionsPage] = useState(1);
    const [referralsPage, setReferralsPage] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Inside your component function:
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash.message) {
            toast.success(flash.message);
        }
        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);
    const { data, setData, post, processing, errors } = useForm<StatementRequest>({
        start_date: '',
        end_date: '',
        type: 'ALL',
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getAccountIcon = (type: string) => {
        switch (type) {
            case 'SHARES': return <Coins className="w-4 h-4" />;
            case 'SAVINGS': return <PiggyBank className="w-4 h-4" />;
            case 'SSAVINGS': return <CreditCard className="w-4 h-4" />;
            case 'WALLET': return <Wallet className="w-4 h-4" />;
            case 'BUILDING': return <Home className="w-4 h-4" />;
            case 'AJO': return <Banknote className="w-4 h-4" />;
            default: return <Wallet className="w-4 h-4" />;
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handlePhotoUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file first');
            return;
        }

        setUploading(true);
        try {
            await router.post(route('members.update-photo', member.id), {
                photo: selectedFile,
            }, {
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Photo updated successfully!');
                    setPhotoDialogOpen(false);
                    setSelectedFile(null);
                },
                onError: (errors) => {
                    toast.error('Failed to upload photo. Please try again.');
                    console.error('Upload error:', errors);
                }
            });
        } catch (error) {
            toast.error('An error occurred while uploading the photo');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePhoto = () => {
        if (confirm('Are you sure you want to remove this photo?')) {
            router.delete(route('members.remove-photo', member.id), {
                onSuccess: () => {
                    toast.success('Photo removed successfully!');
                },
                onError: () => {
                    toast.error('Failed to remove photo');
                }
            });
        }
    };

    const handleGenerateStatement = (action: 'preview' | 'download' | 'print') => {
        if (action === 'preview') {
            router.get(route('members.statement-preview', member.id), data, {
                onSuccess: () => {
                    toast.success('Opening statement preview...');
                }
            });
        } else {
            const params = new URLSearchParams({
                ...data,
                download: action === 'download' ? '1' : '0',
            });
            
            window.open(route('members.generate-statement', [member.id]) + '?' + params.toString(), '_blank');
            toast.success(`Statement ${action === 'download' ? 'download' : 'print'} started`);
        }
    };

    // Filter transactions based on search
    const filteredTransactions = member.balances.filter(transaction => 
        transaction.description?.toLowerCase().includes(transactionsSearch.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(transactionsSearch.toLowerCase()) ||
        transaction.type?.toLowerCase().includes(transactionsSearch.toLowerCase())
    );

    // Filter referrals based on search
    const filteredReferrals = member.referrals_made.filter(referral =>
        referral.referred_member?.name?.toLowerCase().includes(referralsSearch.toLowerCase()) ||
        referral.mobile?.toLowerCase().includes(referralsSearch.toLowerCase())
    );

    // Pagination settings
    const transactionsPerPage = 10;
    const referralsPerPage = 5;

    // Calculate paginated data
    const paginatedTransactions = filteredTransactions.slice(
        (transactionsPage - 1) * transactionsPerPage,
        transactionsPage * transactionsPerPage
    );

    const paginatedReferrals = filteredReferrals.slice(
        (referralsPage - 1) * referralsPerPage,
        referralsPage * referralsPerPage
    );

    const totalTransactionsPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
    const totalReferralsPages = Math.ceil(filteredReferrals.length / referralsPerPage);

    return (
        <AppLayout>
            <Head title={`Member - ${member.name}`} />
            <div className="py-6">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" asChild>
                                <Link href={route('members.index')}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Members
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
                                <p className="text-sm text-gray-600">Member Details</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Dialog open={statementDialogOpen} onOpenChange={setStatementDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Statement
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Generate Statement</DialogTitle>
                                        <DialogDescription>
                                            Generate account statement for {member.name}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="start_date">Start Date</Label>
                                                <Input
                                                    id="start_date"
                                                    type="date"
                                                    value={data.start_date}
                                                    onChange={(e) => setData('start_date', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="end_date">End Date</Label>
                                                <Input
                                                    id="end_date"
                                                    type="date"
                                                    value={data.end_date}
                                                    onChange={(e) => setData('end_date', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="type">Account Type</Label>
                                            <Select
                                                value={data.type}
                                                onValueChange={(value) => setData('type', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select account type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">All Accounts</SelectItem>
                                                    <SelectItem value="SHARES">Shares</SelectItem>
                                                    <SelectItem value="SAVINGS">Savings</SelectItem>
                                                    <SelectItem value="SSAVINGS">Special Savings</SelectItem>
                                                    <SelectItem value="WALLET">Wallet</SelectItem>
                                                    <SelectItem value="AJO">AJO</SelectItem>
                                                    <SelectItem value="BUILDING">Building</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter className="flex space-x-2">
                                        <Button 
                                            variant="outline" 
                                            onClick={() => handleGenerateStatement('preview')}
                                            disabled={processing}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Preview
                                        </Button>
                                        <Button 
                                            onClick={() => handleGenerateStatement('download')}
                                            disabled={processing}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            variant="secondary" 
                                            onClick={() => handleGenerateStatement('print')}
                                            disabled={processing}
                                        >
                                            <Printer className="w-4 h-4 mr-2" />
                                            Print
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Badge variant={member.nstatus ? 'default' : 'destructive'}>
                                {member.nstatus ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center mb-4">
                                        <div className="relative">
                                            <img
                                                src={member.photo_url}
                                                alt={member.name}
                                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                                            />
                                            <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        className="absolute bottom-0 right-0 rounded-full w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                        <Camera className="w-3 h-3" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Update Photo</DialogTitle>
                                                        <DialogDescription>
                                                            Upload a new photo for {member.name}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div className="flex justify-center">
                                                            <img
                                                                src={member.photo_url}
                                                                alt="Current photo"
                                                                className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="photo">Choose New Photo</Label>
                                                            <Input
                                                                id="photo"
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleFileSelect}
                                                                disabled={uploading}
                                                            />
                                                            {selectedFile && (
                                                                <div className="text-sm text-green-600">
                                                                    Selected: {selectedFile.name}
                                                                </div>
                                                            )}
                                                            {uploading && (
                                                                <div className="flex items-center text-sm text-blue-600">
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                    Uploading photo...
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                onClick={handlePhotoUpload}
                                                                className="flex-1"
                                                                disabled={!selectedFile || uploading}
                                                            >
                                                                {uploading ? (
                                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                ) : (
                                                                    <Camera className="w-4 h-4 mr-2" />
                                                                )}
                                                                {uploading ? 'Uploading...' : 'Upload Photo'}
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={handleRemovePhoto}
                                                                className="flex-1"
                                                                disabled={!member.photo || uploading}
                                                            >
                                                                <X className="w-4 h-4 mr-2" />
                                                                Remove Photo
                                                            </Button>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setPhotoDialogOpen(false);
                                                                setSelectedFile(null);
                                                            }}
                                                            disabled={uploading}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                        <h3 className="mt-3 font-semibold text-center">{member.name}</h3>
                                        <p className="text-sm text-gray-500">{member.category}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center text-sm">
                                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                            {member.email}
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                            {member.mobile}
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            Joined {formatDate(member.created_at)}
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="mt-6 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span>Referrals:</span>
                                            <Badge variant="secondary">
                                                {member.referrals_made?.length || 0}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Groups:</span>
                                            <Badge variant="secondary">
                                                {member.ajo_memberships?.length || 0}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Building:</span>
                                            <Badge variant={member.building_track ? 'default' : 'outline'}>
                                                {member.building_track ? 'Paid' : 'Not Paid'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Registered:</span>
                                            <Badge variant={member.registration_track ? 'default' : 'outline'}>
                                                {member.registration_track ? 'Complete' : 'Incomplete'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-5">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="financial">Financial</TabsTrigger>
                                    <TabsTrigger value="referrals">Referrals</TabsTrigger>
                                    <TabsTrigger value="contributions">Contributions</TabsTrigger>
                                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                                </TabsList>

                                {/* Overview Tab */}
                                <TabsContent value="overview">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {/* Bank Information */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center text-sm">
                                                    <Banknote className="w-4 h-4 mr-2" />
                                                    Bank Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Bank:</span>
                                                    <span className="font-medium">{member.bank_name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Account Name:</span>
                                                    <span className="font-medium">{member.account_name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Account Number:</span>
                                                    <span className="font-medium">{member.account_number}</span>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Bank Witness */}
                                        {member.bank_witness && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center text-sm">
                                                        <Users className="w-4 h-4 mr-2" />
                                                        Bank Witness
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span>Name:</span>
                                                        <span className="font-medium">{member.bank_witness.name}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Mobile:</span>
                                                        <span className="font-medium">{member.bank_witness.witnessMobile}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Address:</span>
                                                        <span className="font-medium">{member.bank_witness.address}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Contribution Plan */}
                                        {member.contribution_plan && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center text-sm">
                                                        <Target className="w-4 h-4 mr-2" />
                                                        Contribution Plan
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span>Frequency:</span>
                                                        <span className="font-medium">{member.contribution_plan.frequency}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Amount:</span>
                                                        <span className="font-medium">
                                                            {formatCurrency(member.contribution_plan.amount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Status:</span>
                                                        <Badge variant="default">
                                                            {member.contribution_plan.status}
                                                        </Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Member Setups */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Account Setups</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {member.setups.map((setup) => (
                                                        <div key={setup.id} className="flex justify-between text-sm">
                                                            <span>{setup.type}:</span>
                                                            <span>{setup.pcent}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                {/* Financial Tab */}
                                <TabsContent value="financial">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {Object.entries(balanceSummary).map(([type, amount]) => (
                                            <Card key={type}>
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <CardTitle className="text-sm font-medium flex items-center">
                                                        {getAccountIcon(type)}
                                                        <span className="ml-2">{type}</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold">
                                                        {formatCurrency(amount)}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Current balance
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* Referrals Tab */}
                                <TabsContent value="referrals">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Referral Network</CardTitle>
                                            <CardDescription>
                                                Members referred by and referred to
                                            </CardDescription>
                                            <div className="flex items-center space-x-2 mt-4">
                                                <div className="relative flex-1 max-w-sm">
                                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search referrals..."
                                                        className="pl-8"
                                                        value={referralsSearch}
                                                        onChange={(e) => {
                                                            setReferralsSearch(e.target.value);
                                                            setReferralsPage(1); // Reset to first page when searching
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {/* Referred By */}
                                            {member.referred_by && (
                                                <div className="mb-6">
                                                    <h4 className="mb-3 font-semibold">Referred By</h4>
                                                    <div className="p-3 border rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-medium">
                                                                    {member.referred_by.referrer?.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {member.referred_by.referrer?.mobile}
                                                                </div>
                                                            </div>
                                                            <Badge>
                                                                {formatCurrency(member.referred_by.amount)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Referrals Made */}
                                            <div>
                                                <h4 className="mb-3 font-semibold">
                                                    Referrals ({filteredReferrals.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {paginatedReferrals.map((referral) => (
                                                        <div key={referral.id} className="p-3 border rounded-lg">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <div className="font-medium">
                                                                        {referral.referred_member?.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {referral.mobile}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-medium">
                                                                        {formatCurrency(referral.amount)}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {formatDate(referral.created_at)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Pagination */}
                                                {totalReferralsPages > 1 && (
                                                    <div className="flex items-center justify-between mt-4">
                                                        <div className="text-sm text-gray-500">
                                                            Showing {((referralsPage - 1) * referralsPerPage) + 1} to {Math.min(referralsPage * referralsPerPage, filteredReferrals.length)} of {filteredReferrals.length} referrals
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setReferralsPage(prev => Math.max(prev - 1, 1))}
                                                                disabled={referralsPage === 1}
                                                            >
                                                                Previous
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setReferralsPage(prev => Math.min(prev + 1, totalReferralsPages))}
                                                                disabled={referralsPage === totalReferralsPages}
                                                            >
                                                                Next
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {filteredReferrals.length === 0 && (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                        <div>No referrals found</div>
                                                        {referralsSearch && (
                                                            <Button
                                                                variant="outline"
                                                                className="mt-2"
                                                                onClick={() => setReferralsSearch('')}
                                                            >
                                                                Clear search
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Contributions Tab */}
                                <TabsContent value="contributions">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Ajo Groups & Contributions</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {member.ajo_memberships.map((membership) => (
                                                    <div key={membership.id} className="p-4 border rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <h4 className="font-semibold">
                                                                    {membership.group?.group_name}
                                                                </h4>
                                                                <p className="text-sm text-gray-500">
                                                                    Round {membership.group?.current_round} • {membership.group?.status}
                                                                </p>
                                                            </div>
                                                            <Badge variant="outline">
                                                                {formatCurrency(membership.group?.amount || 0)}
                                                            </Badge>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-500">Joined:</span>{' '}
                                                                {formatDate(membership.joined_at)}
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Has Received:</span>{' '}
                                                                <Badge variant={membership.has_received ? 'default' : 'outline'}>
                                                                    {membership.has_received ? 'Yes' : 'No'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Transactions Tab */}
                                <TabsContent value="transactions">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Recent Transactions</CardTitle>
                                            <div className="flex items-center space-x-2 mt-4">
                                                <div className="relative flex-1 max-w-sm">
                                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search transactions..."
                                                        className="pl-8"
                                                        value={transactionsSearch}
                                                        onChange={(e) => {
                                                            setTransactionsSearch(e.target.value);
                                                            setTransactionsPage(1); // Reset to first page when searching
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {paginatedTransactions.map((transaction) => (
                                                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                        <div className="flex-1">
                                                            <div className="font-medium">
                                                                {transaction.description}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                <Badge variant="outline" className="mr-2">
                                                                    {transaction.type}
                                                                </Badge>
                                                                {formatDate(transaction.created_at)}
                                                                {transaction.reference && (
                                                                    <span className="ml-2">• Ref: {transaction.reference}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {transaction.debit > 0 && (
                                                                <div className="font-medium text-green-600">
                                                                    +{formatCurrency(transaction.debit)}
                                                                </div>
                                                            )}
                                                            {transaction.credit > 0 && (
                                                                <div className="font-medium text-red-600">
                                                                    -{formatCurrency(transaction.credit)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Pagination */}
                                            {totalTransactionsPages > 1 && (
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="text-sm text-gray-500">
                                                        Showing {((transactionsPage - 1) * transactionsPerPage) + 1} to {Math.min(transactionsPage * transactionsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setTransactionsPage(prev => Math.max(prev - 1, 1))}
                                                            disabled={transactionsPage === 1}
                                                        >
                                                            Previous
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setTransactionsPage(prev => Math.min(prev + 1, totalTransactionsPages))}
                                                            disabled={transactionsPage === totalTransactionsPages}
                                                        >
                                                            Next
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {filteredTransactions.length === 0 && (
                                                <div className="text-center py-8 text-gray-500">
                                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                    <div>No transactions found</div>
                                                    {transactionsSearch && (
                                                        <Button
                                                            variant="outline"
                                                            className="mt-2"
                                                            onClick={() => setTransactionsSearch('')}
                                                        >
                                                            Clear search
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}