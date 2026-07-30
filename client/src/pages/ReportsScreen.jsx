import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle,
  Loader2
} from 'lucide-react';

const ReportsScreen = () => {
  const [reportType, setReportType] = useState('properties'); // 'properties', 'users', 'leads', 'revenue'
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-16');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [compileStep, setCompileStep] = useState('');
  const [exportFormat, setExportFormat] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Mock compiled data preview for properties
  const propertyReportPreview = [
    { title: 'Properties Listed', count: '1,490 Listings', details: '+12.5% increase vs last month' },
    { title: 'Live Approved Listings', count: '1,240 Properties', details: '83% approval rate' },
    { title: 'Pending Moderation', count: '184 Listings', details: 'Average queue wait time: 18 mins' },
    { title: 'Premium Listings Added', count: '82 Listings', details: 'Featured spots occupied: 12%' }
  ];

  // Mock compiled data preview for users
  const userReportPreview = [
    { title: 'Total New Signups', count: '482 Profiles', details: 'Buyers: 65% | Sellers/Agents: 35%' },
    { title: 'Active App Sessions', count: '4,102 Sessions', details: 'Mobile App DAU: 2,400' },
    { title: 'RERA Certifications Approved', count: '18 Builders', details: 'Rejected licenses: 2' },
    { title: 'Deactivated/Banned Accounts', count: '4 Users', details: 'Reason: Spam listings' }
  ];

  // Mock compiled data preview for revenue
  const revenueReportPreview = [
    { title: 'Premium Subscription Fees', count: '₹6,42,000', details: 'Razorpay online gateway settles' },
    { title: 'Featured Showcase Spotlights', count: '₹4,20,000', details: 'Commission fees: 2%' },
    { title: 'Boost Listing Credits Purchased', count: '₹1,80,000', details: 'In-app coins purchase triggers' },
    { title: 'Refunded Token Escrows', count: '₹2,50,000', details: 'Held in trust deposits' }
  ];

  // Mock compiled data preview for leads
  const leadReportPreview = [
    { title: 'WhatsApp Enquiries logged', count: '3,200 Chats', details: 'Direct mobile redirection' },
    { title: 'Callbacks Requested', count: '1,800 Leads', details: 'Average agent pickup time: 8 mins' },
    { title: 'Visit Bookings Scheduled', count: '482 Schedules', details: 'Conversion to deposit: 14%' },
    { title: 'Brochures Downloaded', count: '1,100 Files', details: 'Tata/Godrej PDF brochures' }
  ];

  const getActivePreview = () => {
    switch (reportType) {
      case 'users': return userReportPreview;
      case 'revenue': return revenueReportPreview;
      case 'leads': return leadReportPreview;
      default: return propertyReportPreview;
    }
  };

  const downloadReportFile = (type, fmt, start, end) => {
    let content = [];
    let mimeType = 'text/plain';
    let extension = fmt.toLowerCase() === 'excel' ? 'xlsx' : fmt.toLowerCase();

    // Compile mock CSV / text table contents
    if (type === 'properties') {
      content = [
        ['Property ID', 'Property Title', 'Builder/Owner', 'Location', 'Price', 'Stage', 'Date Listed', 'RERA Status'],
        ['PROP-9821', 'Godrej Woods Sector 43', 'Godrej Properties', 'Noida, Sector 43', '₹2.45 Cr', 'Submitted', '16 Jun 2026', 'Verified'],
        ['PROP-4920', 'Premium 3 BHK Builder Floor', 'Sandeep Sharma', 'DLF Phase 2, Gurugram', '₹1.85 Cr', 'Docs Review', '15 Jun 2026', 'Verified'],
        ['PROP-1082', 'Vatika City Penthouse', 'Amit Varma', 'Sohna Road, Gurugram', '₹3.20 Cr', 'Photo Review', '14 Jun 2026', 'Verified'],
        ['PROP-3011', 'DLF Regal Gardens', 'DLF Limited', 'Sector 90, Gurugram', '₹1.95 Cr', 'Admin Approval', '12 Jun 2026', 'Verified'],
        ['PROP-4102', 'Adani Samsara Vilasa', 'Adani Realty', 'Sector 63, Gurugram', '₹4.10 Cr', 'Live', '10 Jun 2026', 'Verified']
      ];
    } else if (type === 'users') {
      content = [
        ['User ID', 'Name', 'Email Address', 'Phone Number', 'User Role', 'Account Status', 'KYC Verification', 'Join Date'],
        ['USR-1082', 'Rishika Chaudhary', 'rishika.chaudhary@gharmb.com', '+91 98102 34567', 'Admin', 'Active', 'Verified', '01 Jan 2026'],
        ['USR-4920', 'Sandeep Sharma', 'sandeep.sharma@realtors.in', '+91 99991 23456', 'Agent', 'Active', 'Verified', '12 Feb 2026'],
        ['USR-9821', 'Amit Varma', 'amit.varma@gmail.com', '+91 98765 43210', 'Owner', 'Active', 'Verified', '15 Mar 2026'],
        ['USR-3044', 'Alok Mishra', 'alok.mishra@yahoo.com', '+91 90123 45678', 'Buyer', 'Active', 'Pending', '16 Jun 2026'],
        ['USR-1049', 'Vikram Singh', 'vikram@vikramdevelopers.com', '+91 88888 77777', 'Builder', 'Active', 'Verified', '10 May 2026']
      ];
    } else if (type === 'revenue') {
      content = [
        ['Transaction ID', 'Payer/Buyer', 'Beneficiary/Seller', 'Property Listing', 'Amount (INR)', 'Payment Mode', 'Settlement Status', 'Date'],
        ['TKN-8830', 'Alok Mishra', 'Vikram Developers', 'Godrej Woods Sec 43', '50,000', 'Escrow Token Deposit', 'Pending', '16 Jun 2026'],
        ['TKN-4921', 'Sanjay Aggarwal', 'Tata Value Homes', 'Tata Primanti Villa', '1,00,000', 'Escrow Token Deposit', 'Released', '15 Jun 2026'],
        ['TKN-3120', 'Pooja Mehta', 'Sandeep Sharma', '3 BHK Builder Floor', '25,000', 'Escrow Token Deposit', 'Refunded', '14 Jun 2026'],
        ['SUB-9810', 'Godrej Properties', 'Gharmb Platform', 'Premium Subscription Fee', '6,42,000', 'Razorpay Gateway', 'Settled', '12 Jun 2026'],
        ['BST-4102', 'Adani Realty', 'Gharmb Platform', 'Listing Boost Credits', '1,80,000', 'Platform Wallet', 'Settled', '10 Jun 2026']
      ];
    } else {
      content = [
        ['Lead ID', 'Enquirer Name', 'Contact Info', 'Target Builder/Agent', 'Target Property', 'Lead Source', 'Follow-up Status', 'Enquiry Date'],
        ['LED-9821', 'Karan Johar', '+91 98111 22233', 'Godrej Properties', 'Godrej Woods Sec 43', 'WhatsApp Link Click', 'Callback Scheduled', '16 Jun 2026'],
        ['LED-4920', 'Deepika Padukone', '+91 99999 88888', 'Tata Value Homes', 'Tata Primanti Villa', 'Call Callback Request', 'Follow-up Pending', '15 Jun 2026'],
        ['LED-1082', 'Ranbir Kapoor', '+91 98765 11111', 'Sandeep Sharma', '3 BHK Builder Floor', 'Portal Forms Inquiry', 'Completed', '14 Jun 2026'],
        ['LED-3011', 'Priyanka Chopra', '+91 90123 99999', 'Adani Realty', 'Adani Samsara Vilasa', 'Brochure Downloads', 'Email Sent', '12 Jun 2026']
      ];
    }

    let fileContentString = '';

    if (fmt === 'CSV' || fmt === 'Excel') {
      mimeType = fmt === 'CSV' ? 'text/csv' : 'application/octet-stream';
      // Format as CSV table
      fileContentString = content.map(row => 
        row.map(val => `"${val.replace(/"/g, '""')}"`).join(',')
      ).join('\n');
    } else if (fmt === 'PDF') {
      mimeType = 'text/plain';
      extension = 'pdf';
      const divider = '='.repeat(100);
      fileContentString = `${divider}\n`;
      fileContentString += `                  GHARMB PLATFORM ADMINISTRATIVE EXPORT REPORT\n`;
      fileContentString += `                  Category: ${type.toUpperCase()} | Period: ${start} to ${end}\n`;
      fileContentString += `                  Security Protocol: AES-256 Digital Encrypted Access\n`;
      fileContentString += `${divider}\n\n`;

      content.forEach((row, rowIndex) => {
        if (rowIndex === 0) {
          fileContentString += row.map(header => header.padEnd(25)).join('') + '\n';
          fileContentString += '-'.repeat(180) + '\n';
        } else {
          fileContentString += row.map(val => val.padEnd(25)).join('') + '\n';
        }
      });
      fileContentString += `\n${divider}\n`;
      fileContentString += `EOF - Gharmb Reporting Engine v1.0\n`;
    }

    const blob = new Blob([fileContentString], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gharmb_${type}_report_${start}_to_${end}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerExport = (format) => {
    setIsCompiling(true);
    setCompileProgress(0);
    setExportFormat(format);
    setCompileStep('Connecting to secure DB database cluster...');
    
    // Simulate compilation steps over 3 seconds
    const duration = 3000;
    const intervalTime = 100;
    const stepsCount = duration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = Math.min(Math.round((currentStep / stepsCount) * 100), 100);
      setCompileProgress(progress);

      if (progress < 20) {
        setCompileStep('Connecting to secure database cluster...');
      } else if (progress < 45) {
        setCompileStep(`Querying ${reportType} logs from ${startDate} to ${endDate}...`);
      } else if (progress < 70) {
        setCompileStep('Analyzing data rows, trend vectors & financial sums...');
      } else if (progress < 90) {
        setCompileStep(`Building compiled schema layout for ${format} structure...`);
      } else if (progress < 100) {
        setCompileStep('Signing report security keys & packaging file...');
      } else {
        setCompileStep('Download stream ready!');
        clearInterval(interval);
        setTimeout(() => {
          setIsCompiling(false);
          // Trigger the real file download stream
          downloadReportFile(reportType, format, startDate, endDate);
          setToastMessage(`Report gharmb_${reportType}_report_${startDate}_to_${endDate}.${format === 'Excel' ? 'xlsx' : format.toLowerCase()} downloaded successfully.`);
          setShowToast(true);
        }, 300);
      }
    }, intervalTime);
  };

  // Automatically hide toast notification after 4 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="space-y-6 relative">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters and Config Panel */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs space-y-5 lg:col-span-1 h-fit">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <Filter size={16} className="text-brand" /> Report Parameters
          </h3>

          {/* Report Category Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Report Category</label>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'properties', label: 'Property Inventory Report' },
                { id: 'users', label: 'User Signup & Access Report' },
                { id: 'revenue', label: 'Payment & Financial Ledger' },
                { id: 'leads', label: 'Leads & Conversion Report' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setReportType(cat.id)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    reportType === cat.id
                      ? 'bg-brand text-white shadow-lg shadow-brand/10'
                      : 'bg-[var(--bg-muted)] text-[var(--text-subtle)] hover:bg-[var(--bg-muted)]/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range inputs */}
          <div className="space-y-3 pt-3 border-t border-[var(--border)]">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Billing Period</label>
            <div className="space-y-2">
              <div className="relative">
                <Calendar className="absolute top-2.5 left-3 text-[var(--text-muted)]" size={14} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border)] rounded-xl text-xs text-[var(--text-subtle)] focus:outline-none focus:border-brand/40 bg-[var(--bg-muted)]"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute top-2.5 left-3 text-[var(--text-muted)]" size={14} />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[var(--border)] rounded-xl text-xs text-[var(--text-subtle)] focus:outline-none focus:border-brand/40 bg-[var(--bg-muted)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Report Preview & Downloads */}
        <div className="lg:col-span-2 p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-muted)] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] capitalize">{reportType} Analytics Summary</h3>
                <p className="text-xs text-[var(--text-muted)]">Previewing compiled telemetry before exporting formats</p>
              </div>
              <span className="text-[10px] font-bold text-[var(--text-subtle)] bg-[var(--bg-muted)] px-2.5 py-1 rounded-lg">
                Date: {startDate} to {endDate}
              </span>
            </div>

            {/* Compiled Preview Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getActivePreview().map((item, i) => (
                <div key={i} className="p-4 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl space-y-1 hover:border-[var(--border)] transition-colors">
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block">{item.title}</span>
                  <h4 className="text-base font-extrabold text-[var(--text-primary)]">{item.count}</h4>
                  <p className="text-[10px] text-[var(--text-subtle)]">{item.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Export Actions Panel */}
          <div className="mt-8 pt-4 border-t border-[var(--border)] space-y-3">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Download Formats</span>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => triggerExport('PDF')}
                disabled={isCompiling}
                className="py-3 px-4 border border-brand/20 hover:bg-brand-light/35 rounded-xl text-xs font-bold text-brand transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={14} />
                Export PDF
              </button>
              <button
                type="button"
                onClick={() => triggerExport('Excel')}
                disabled={isCompiling}
                className="py-3 px-4 border border-green-500/25 hover:bg-green-500/100/10 rounded-xl text-xs font-bold text-green-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet size={14} />
                Export XLSX
              </button>
              <button
                type="button"
                onClick={() => triggerExport('CSV')}
                disabled={isCompiling}
                className="py-3 px-4 border border-blue-500/25 hover:bg-blue-500/100/10 rounded-xl text-xs font-bold text-blue-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileCode size={14} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Compilation Overlay Modal */}
      {isCompiling && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-5 transform scale-100 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-brand" size={18} />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Generating Report</h4>
              </div>
              <span className="text-[10px] font-bold text-[var(--text-subtle)] bg-[var(--bg-muted)] px-2.5 py-1 rounded-lg uppercase">
                {exportFormat} Format
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-[var(--text-subtle)]">
                <span className="truncate max-w-[280px] text-[var(--text-subtle)] font-semibold">{compileStep}</span>
                <span className="text-brand font-extrabold">{compileProgress}%</span>
              </div>
              {/* Progress bar container */}
              <div className="w-full h-2 bg-[var(--bg-muted)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand rounded-full transition-all duration-200 ease-out" 
                  style={{ width: `${compileProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-[var(--bg-muted)]/70 border border-[var(--border)] rounded-xl p-3 text-[10px] space-y-1 text-[var(--text-subtle)]">
              <div className="flex justify-between">
                <span className="font-semibold">Category:</span>
                <span className="font-bold text-[var(--text-subtle)] capitalize">{reportType}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Period:</span>
                <span className="font-bold text-[var(--text-subtle)]">{startDate} to {endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Security Level:</span>
                <span className="font-bold text-[var(--text-subtle)]">Admin Encrypted</span>
              </div>
            </div>

            <div className="text-[9px] text-[var(--text-muted)] text-center italic">
              Please do not close this tab or refresh the dashboard
            </div>
          </div>
        </div>
      )}

      {/* Custom Success Toast */}
      {showToast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle className="text-green-400 shrink-0" size={18} />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white">Compilation Success</p>
            <p className="text-[10px] text-slate-300">{toastMessage}</p>
          </div>
          <button 
            type="button"
            onClick={() => setShowToast(false)}
            className="text-[10px] font-bold text-[var(--text-muted)] hover:text-white ml-2 cursor-pointer bg-slate-800 hover:bg-slate-700 p-1 px-2 rounded-md transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportsScreen;
