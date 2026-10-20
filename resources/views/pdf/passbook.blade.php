<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Passbook - {{ $member->name }} - {{ $year }}</title>
    <style>
        @page {
            margin: 20px;
            size: landscape;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.2;
        }
        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 16px;
            color: #333;
        }
        .header h2 {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #666;
        }
        .member-info {
            margin-bottom: 15px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .member-info table {
            width: 100%;
            border-collapse: collapse;
        }
        .member-info td {
            padding: 3px;
            vertical-align: top;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 4px 6px;
            text-align: center;
            vertical-align: middle;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
            font-size: 9px;
        }
        .shares-header { background-color: #dbeafe !important; }
        .savings-header { background-color: #dcfce7 !important; }
        .special-savings-header { background-color: #f3e8ff !important; }
        .building-header { background-color: #ffedd5 !important; }
        .loan-interest-header { background-color: #fee2e2 !important; }
        .monthly-total-header { background-color: #ccfbf1 !important; }
        .final-balance-header { background-color: #e0e7ff !important; }
        
        .shares-cell { background-color: #eff6ff; }
        .savings-cell { background-color: #f0fdf4; }
        .special-savings-cell { background-color: #faf5ff; }
        .building-cell { background-color: #fff7ed; }
        .loan-interest-cell { background-color: #fef2f2; }
        .monthly-total-cell { background-color: #f0fdfa; font-weight: bold; }
        .final-balance-cell { background-color: #eef2ff; font-weight: bold; }
        
        .opening-balance {
            background-color: #fef3c7 !important;
            font-weight: bold;
        }
        .closing-balance {
            background-color: #e5e7eb !important;
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .text-bold {
            font-weight: bold;
        }
        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 9px;
            color: #666;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MEMBER PASSBOOK</h1>
        <h2>{{ $year }} -  <span style="text-transform: uppercase;">Stack Naira Multipurpose Cooperative Society</span></h2>
    </div>

    <div class="member-info">
        <table>
            <tr>
                <td width="25%"><strong>Member Name:</strong> {{ $member->name }}</td>
                <td width="25%"><strong>Mobile:</strong> {{ $member->mobile }}</td>
                <td width="25%"><strong>Category:</strong> {{ $member->category }}</td>
                <td width="25%"><strong>Status:</strong> {{ $member->nstatus ? 'Active' : 'Inactive' }}</td>
            </tr>
            <tr>
                <td><strong>Year:</strong> {{ $year }}</td>
                <td><strong>Total Entries:</strong> {{ count($entries) - 1 }} months</td>
                <td><strong>Generated:</strong> {{ $generated_date }}</td>
                <td><strong>Total Yearly Amount:</strong> {{ number_format($total_yearly_amount, 2) }}</td>
            </tr>
        </table>
    </div>

    <table>
        <thead>
            <tr>
                <th rowspan="2" style="width: 100px;">Date/Month</th>
                <th colspan="3" class="shares-header">SHARES</th>
                <th colspan="3" class="savings-header">SAVINGS</th>
                <th colspan="3" class="special-savings-header">SPECIAL SAVINGS</th>
                <th colspan="3" class="building-header">BUILDING FUND</th>
                <th colspan="3" class="loan-interest-header">LOAN INTEREST</th>
                <th rowspan="2" class="monthly-total-header" style="width: 70px;">MONTHLY TOTAL</th>
                <th rowspan="2" class="final-balance-header" style="width: 80px;">FINAL BALANCE</th>
            </tr>
            <tr>
                <!-- Shares Sub-headers -->
                <th class="shares-header">Dr.</th>
                <th class="shares-header">Cr.</th>
                <th class="shares-header">Balance</th>
                
                <!-- Savings Sub-headers -->
                <th class="savings-header">Dr.</th>
                <th class="savings-header">Cr.</th>
                <th class="savings-header">Balance</th>
                
                <!-- Special Savings Sub-headers -->
                <th class="special-savings-header">Dr.</th>
                <th class="special-savings-header">Cr.</th>
                <th class="special-savings-header">Balance</th>
                
                <!-- Building Fund Sub-headers -->
                <th class="building-header">Dr.</th>
                <th class="building-header">Cr.</th>
                <th class="building-header">Balance</th>
                
                <!-- Loan Interest Sub-headers -->
                <th class="loan-interest-header">Dr.</th>
                <th class="loan-interest-header">Cr.</th>
                <th class="loan-interest-header">Balance</th>
            </tr>
        </thead>
        <tbody>
            @foreach($entries as $entry)
            <tr class="{{ $entry['is_opening_balance'] ? 'opening-balance' : '' }}">
                <!-- Date/Month Column -->
                <td class="text-bold">
                    @if($entry['is_opening_balance'])
                    OPENING BALANCE<br>
                    <small>{{ $entry['date_display'] }}</small>
                    @else
                    {{ $entry['month_name'] }}<br>
                    <small>{{ $entry['date_display'] }}</small>
                    @endif
                </td>
                
                <!-- SHARES Columns -->
                <td class="shares-cell">{{ $entry['shares_dr'] ? number_format($entry['shares_dr'], 2) : '-' }}</td>
                <td class="shares-cell">{{ $entry['shares_cr'] ? number_format($entry['shares_cr'], 2) : '-' }}</td>
                <td class="shares-cell text-bold">{{ number_format($entry['shares_balance'], 2) }}</td>
                
                <!-- SAVINGS Columns -->
                <td class="savings-cell">{{ $entry['savings_dr'] ? number_format($entry['savings_dr'], 2) : '-' }}</td>
                <td class="savings-cell">{{ $entry['savings_cr'] ? number_format($entry['savings_cr'], 2) : '-' }}</td>
                <td class="savings-cell text-bold">{{ number_format($entry['savings_balance'], 2) }}</td>
                
                <!-- SPECIAL SAVINGS Columns -->
                <td class="special-savings-cell">{{ $entry['special_savings_dr'] ? number_format($entry['special_savings_dr'], 2) : '-' }}</td>
                <td class="special-savings-cell">{{ $entry['special_savings_cr'] ? number_format($entry['special_savings_cr'], 2) : '-' }}</td>
                <td class="special-savings-cell text-bold">{{ number_format($entry['special_savings_balance'], 2) }}</td>
                
                <!-- BUILDING FUND Columns -->
                <td class="building-cell">{{ $entry['building_dr'] ? number_format($entry['building_dr'], 2) : '-' }}</td>
                <td class="building-cell">{{ $entry['building_cr'] ? number_format($entry['building_cr'], 2) : '-' }}</td>
                <td class="building-cell text-bold">{{ number_format($entry['building_balance'], 2) }}</td>
                
                <!-- LOAN INTEREST Columns -->
                <td class="loan-interest-cell">{{ $entry['loan_interest_dr'] ? number_format($entry['loan_interest_dr'], 2) : '-' }}</td>
                <td class="loan-interest-cell">{{ $entry['loan_interest_cr'] ? number_format($entry['loan_interest_cr'], 2) : '-' }}</td>
                <td class="loan-interest-cell text-bold">{{ number_format($entry['loan_interest_balance'], 2) }}</td>
                
                <!-- MONTHLY TOTAL Column -->
                <td class="monthly-total-cell text-bold">{{ number_format($entry['monthly_total'], 2) }}</td>
                
                <!-- FINAL BALANCE Column -->
                <td class="final-balance-cell text-bold">{{ number_format($entry['final_balance'], 2) }}</td>
            </tr>
            @endforeach
            
            <!-- Closing Balance Row -->
            <tr class="closing-balance">
                <td class="text-bold">CLOSING BALANCE {{ $year }}</td>
                
                <!-- Shares Final Balance -->
                <td colspan="3" class="shares-header text-bold">
                    {{ number_format($final_balances['SHARES'], 2) }}
                </td>
                
                <!-- Savings Final Balance -->
                <td colspan="3" class="savings-header text-bold">
                    {{ number_format($final_balances['SAVINGS'], 2) }}
                </td>
                
                <!-- Special Savings Final Balance -->
                <td colspan="3" class="special-savings-header text-bold">
                    {{ number_format($final_balances['SSAVINGS'], 2) }}
                </td>
                
                <!-- Building Fund Final Balance -->
                <td colspan="3" class="building-header text-bold">
                    {{ number_format($final_balances['BUILDING'], 2) }}
                </td>
                
                <!-- Loan Interest Final Balance -->
                <td colspan="3" class="loan-interest-header text-bold">
                    {{ number_format($final_balances['LOAN_INTEREST'], 2) }}
                </td>
                
                <!-- Yearly Total -->
                <td class="monthly-total-header text-bold">
                    {{ number_format($total_yearly_amount, 2) }}
                </td>
                
                <!-- Grand Final Balance -->
                <td class="final-balance-header text-bold">
                    {{ number_format($entries[count($entries) - 1]['final_balance'], 2) }}
                </td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <table>
            <tr>
                <td width="33%">
                    <strong>Prepared By:</strong><br>
                   Stack Naira Multipurpose Cooperative Society
                </td>
                <td width="34%" class="text-center">
                    <strong>Generated:</strong> {{ $generated_date }}<br>
                    <strong>Page:</strong> <span class="page-number"></span>
                </td>
                <td width="33%" class="text-right">
                    <strong>Printed By:</strong><br>
                    {{ optional(auth()->user())->name ?? 'N/A' }}
                </td>
                <td width="33%" class="text-right">
                    <strong>Verified By:</strong><br>
                    ____________________
                </td>
            </tr>
        </table>
    </div>

    <script type="text/php">
        if (isset($pdf)) {
            $text = "Page {PAGE_NUM} of {PAGE_COUNT}";
            $size = 9;
            $font = $fontMetrics->getFont("Arial, sans-serif");
            $width = $fontMetrics->get_text_width($text, $font, $size) / 2;
            $x = ($pdf->get_width() - $width) / 2;
            $y = $pdf->get_height() - 35;
            $pdf->page_text($x, $y, $text, $font, $size);
        }
    </script>
</body>
</html>