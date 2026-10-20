<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Statement of Account - {{ $member->name }}</title>
    <style>
        /* General Styles */
        @page { margin: 25px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #333; line-height: 1.4; -webkit-print-color-adjust: exact; }
        h1, h2, h3, h4 { margin: 0 0 10px 0; padding: 0; }
        .text-right { text-align: right; }

        /* Header */
        .header-table { width: 100%; border-bottom: 2px solid #007bff; padding-bottom: 5px; margin-bottom: 15px; border-collapse: collapse; }
        .header-table td { vertical-align: top; padding: 0; }
        .company-logo { width: 60px; height: 60px; display: block; border-radius: 5px; overflow: hidden; }
        .company-info { text-align: center; }
        .company-name { font-size: 16px; font-weight: bold; color: #007bff; margin-bottom: 3px; }
        .company-details { font-size: 9px; color: #666; line-height: 1.3; }
        .statement-title h1 { font-size: 14px; color: #007bff; font-weight: bold; margin-top: 5px; }
        .statement-title p { margin: 0; font-size: 9px; color: #666; }

        /* Member Info */
        .member-info { margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: #f9f9f9; }
        .member-info h3 { font-size: 12px; margin-bottom: 8px; color: #007bff; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .member-info td { padding: 3px 0; font-size: 10px; }

        /* Summary Sections (Table-based layout for PDF stability) */
        .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .summary-table td { vertical-align: top; width: 50%; padding: 0 5px; }

        .account-summary, .ajo-breakdown {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 10px;
        }
        .account-summary { background: #f8f9fa; }
        .ajo-breakdown { background: #e8f4fd; border-color: #b8daff; }

        .account-summary h3, .ajo-breakdown h3 {
            margin-top: 0; margin-bottom: 10px; text-align: center;
            font-size: 11px; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #333;
        }

        .balances-grid, .ajo-grid {
            width: 100%;
        }
        .balance-card, .ajo-card {
            border-left: 4px solid #ccc;
            padding: 6px 8px;
            margin-bottom: 6px;
            border-radius: 4px;
            background: #fff;
        }
        .balance-card.positive { border-left-color: #28a745; }
        .balance-card.negative { border-left-color: #dc3545; }
        .balance-type, .ajo-label { font-size: 9px; color: #666; margin-bottom: 2px; font-weight: bold; text-transform: uppercase; }
        .balance-amount, .ajo-amount { font-size: 11px; font-weight: bold; }
        .balance-amount.positive { color: #28a745; }
        .balance-amount.negative { color: #dc3545; }
        .ajo-amount { color: #007bff; }

        /* Statement Summary */
        .statement-summary {
            width: 100%;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
            margin: 15px 0;
            padding: 10px 0;
        }
        .statement-summary td {
            text-align: center;
            width: 25%;
        }
        .summary-label { font-size: 9px; color: #666; text-transform: uppercase; margin-bottom: 2px; }
        .summary-value { font-size: 13px; font-weight: bold; color: #333; }

        /* Transaction Table */
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table th, .table td { border: 1px solid #e9ecef; padding: 6px 8px; text-align: left; }
        .table th { background-color: #f2f2f2; font-size: 9px; font-weight: bold; color: #555; text-transform: uppercase; }
        .table td { font-size: 9px; }
        .debit { color: #dc3545; font-weight: bold; }
        .credit { color: #28a745; font-weight: bold; }
        .table tbody tr:nth-child(even) { background-color: #fcfcfc; }

        /* Period & Footer */
        .period { margin-bottom: 15px; font-size: 10px; color: #666; text-align: center; }
        .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #999; border-top: 1px dashed #eee; padding-top: 10px; }
    </style>
</head>
<body>

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="width: 15%;">
                <div class="company-logo" style="background-color: #f0f0f0;">
                    @if(file_exists(public_path('storage/company-logo.png')))
                        <img src="{{ public_path('storage/company-logo.png') }}" style="width: 100%; height: 100%; object-fit: cover;" alt="Company Logo">
                    @else
                        <div style="text-align: center; font-size: 8px; color: #999; padding-top: 15px;">
                            COMPANY<br>LOGO
                        </div>
                    @endif
                </div>
            </td>
            <td style="width: 70%;" class="company-info">
                <div class="company-name">STACK NAIRA</div>
                <div class="company-details">
                    Opp Railway Line Unity Road, Ilorin Kwara State Nigeria<br>
                    Email: Stacknaira@gmail.com | Phone: 08088297179
                </div>
                <div class="statement-title">
                    <h1>STATEMENT OF ACCOUNT</h1>
                    <p>Generated on: {{ now()->format('F j, Y \a\t g:i A') }}</p>
                </div>
            </td>
            <td style="width: 15%;"></td>
        </tr>
    </table>

    <!-- Member Info -->
    <div class="member-info">
        <h3>Client Details</h3>
        <table width="100%">
            <tr>
                <td width="33%"><strong>Name:</strong> {{ $member->name }}</td>
                <td width="33%"><strong>Account No:</strong> {{ $member->account_number }}</td>
                <td width="34%"><strong>Mobile:</strong> {{ $member->mobile }}</td>
            </tr>
            <tr>
                <td><strong>Email:</strong> {{ $member->email }}</td>
                <td><strong>Bank:</strong> {{ $member->bank_name }}</td>
                <td><strong>Category:</strong> {{ $member->category }}</td>
            </tr>
        </table>
    </div>

    <!-- Account + Ajo Summary -->
    <table class="summary-table">
        <tr>
            <td>
                <div class="account-summary">
                    <h3>Account Balances Summary</h3>
                    <div class="balances-grid">
                        @php
                            $mainAccounts = ['SHARES', 'SAVINGS', 'SSAVINGS', 'WALLET', 'BUILDING'];
                            $accountNames = [
                                'SHARES' => 'Shares', 'SAVINGS' => 'Savings',
                                'SSAVINGS' => 'Special Savings', 'WALLET' => 'Wallet',
                                'BUILDING' => 'Building Fund'
                            ];
                        @endphp

                        @foreach($mainAccounts as $type)
                            @if(isset($summary[$type]))
                                @php
                                    $amount = $summary[$type];
                                    $isPositive = $amount >= 0;
                                @endphp
                                <div class="balance-card {{ $isPositive ? 'positive' : 'negative' }}">
                                    <div class="balance-type">{{ $accountNames[$type] ?? $type }}</div>
                                    <div class="balance-amount {{ $isPositive ? 'positive' : 'negative' }}">
                                        ₦{{ number_format(abs($amount), 2) }}
                                    </div>
                                </div>
                            @endif
                        @endforeach
                    </div>
                </div>
            </td>

            @if(isset($summary['AJO_GROUP']) || isset($summary['AJO_NORMAL']) || isset($summary['AJO_CONTRIBUTIONS']) || isset($summary['AJO_PAYOUTS']))
            <td>
                <div class="ajo-breakdown">
                    <h3>Ajo/Contribution Summary</h3>
                    <div class="ajo-grid">
                        @if(isset($summary['AJO_CONTRIBUTIONS']))
                        <div class="ajo-card" style="border-left-color: #1e88e5;">
                            <div class="ajo-label">Total Contributions</div>
                            <div class="ajo-amount">₦{{ number_format($summary['AJO_CONTRIBUTIONS'], 2) }}</div>
                        </div>
                        @endif

                        @if(isset($summary['AJO_PAYOUTS']))
                        <div class="ajo-card" style="border-left-color: #43a047;">
                            <div class="ajo-label">Total Payouts</div>
                            <div class="ajo-amount" style="color:#43a047;">₦{{ number_format($summary['AJO_PAYOUTS'], 2) }}</div>
                        </div>
                        @endif

                        @if(isset($summary['AJO_GROUP']))
                        <div class="ajo-card" style="border-left-color: {{ $summary['AJO_GROUP'] >= 0 ? '#28a745' : '#dc3545' }};">
                            <div class="ajo-label">Net Group Balance</div>
                            <div class="ajo-amount" style="color: {{ $summary['AJO_GROUP'] >= 0 ? '#28a745' : '#dc3545' }};">
                                ₦{{ number_format(abs($summary['AJO_GROUP']), 2) }}
                            </div>
                        </div>
                        @endif

                        @if(isset($summary['AJO_NORMAL']))
                        <div class="ajo-card" style="border-left-color: {{ $summary['AJO_NORMAL'] >= 0 ? '#28a745' : '#dc3545' }};">
                            <div class="ajo-label">Personal Ajo</div>
                            <div class="ajo-amount" style="color: {{ $summary['AJO_NORMAL'] >= 0 ? '#28a745' : '#dc3545' }};">
                                ₦{{ number_format(abs($summary['AJO_NORMAL']), 2) }}
                            </div>
                        </div>
                        @endif
                    </div>
                </div>
            </td>
            @endif
        </tr>
    </table>

    <!-- Period -->
    @if($period['start'] || $period['end'])
    <div class="period">
        <p><strong>Reporting Period:</strong>
            {{ $period['start'] ? \Carbon\Carbon::parse($period['start'])->format('M j, Y') : 'Inception' }}
            to
            {{ $period['end'] ? \Carbon\Carbon::parse($period['end'])->format('M j, Y') : 'Date' }}
        </p>
    </div>
    @endif

    <!-- Statement Summary -->
    <table class="statement-summary">
        <tr>
            <td>
                <div class="summary-label">Opening Balance</div>
                <div class="summary-value">₦{{ number_format($opening_balance, 2) }}</div>
            </td>
            <td>
                <div class="summary-label">Total Transactions</div>
                <div class="summary-value">{{ count($transactions) }}</div>
            </td>
            <td>
                <div class="summary-label">Net Movement</div>
                <div class="summary-value" style="color: {{ ($closing_balance - $opening_balance) >= 0 ? '#28a745' : '#dc3545' }};">
                    ₦{{ number_format($closing_balance - $opening_balance, 2) }}
                </div>
            </td>
            <td>
                <div class="summary-label">Closing Balance</div>
                <div class="summary-value">₦{{ number_format($closing_balance, 2) }}</div>
            </td>
        </tr>
    </table>

    <!-- Transaction History -->
    <h2>Transaction History</h2>
    <table class="table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Reference</th>
                <th class="text-right">Debit (₦)</th>
                <th class="text-right">Credit (₦)</th>
                <th class="text-right">Balance (₦)</th>
            </tr>
        </thead>
        <tbody>
            @php $runningBalance = $opening_balance; @endphp
            @forelse($transactions as $transaction)
                @php $runningBalance += $transaction->credit - $transaction->debit; @endphp
                <tr>
                    <td>{{ \Carbon\Carbon::parse($transaction->created_at)->format('M j, Y') }}</td>
                    <td>{{ $transaction->description }}</td>
                    <td>{{ $transaction->type }}</td>
                    <td>{{ $transaction->reference }}</td>
                    <td class="text-right debit">{{ $transaction->debit > 0 ? number_format($transaction->debit, 2) : '-' }}</td>
                    <td class="text-right credit">{{ $transaction->credit > 0 ? number_format($transaction->credit, 2) : '-' }}</td>
                    <td class="text-right">{{ number_format($runningBalance, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align:center; color:#666; font-size:10px;">No transactions found for the selected period.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Footer -->
    <div class="footer">
        <p>This is a computer-generated statement from STACK NAIRA. No signature is required.</p>
        <p>Generated by {{ config('app.name') }}</p>
    </div>

    <!-- Page Numbers (for DOMPDF) -->
    <script type="text/php">
        if (isset($pdf)) {
            $pdf->page_script('
                if ($PAGE_COUNT > 1) {
                    $font = $fontMetrics->get_font("DejaVu Sans", "normal");
                    $pdf->text(500, 820, "Page $PAGE_NUM of $PAGE_COUNT", $font, 8);
                }
            ');
        }
    </script>

</body>
</html>
