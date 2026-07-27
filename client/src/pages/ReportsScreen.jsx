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
          setToastMessage(`Report gharmb_${reportType}_report.${format === 'Excel' ? 'xlsx' : format.toLowerCase()} downloaded successfully.`);
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
        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-5 lg:col-span-1 h-fit">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Filter size={16} className="text-brand" /> Report Parameters
          </h3>

          {/* Report Category Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Report Category</label>
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
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range inputs */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billing Period</label>
            <div className="space-y-2">
              <div className="relative">
                <Calendar className="absolute top-2.5 left-3 text-slate-400" size={14} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brand/40 bg-slate-50/50"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute top-2.5 left-3 text-slate-400" size={14} />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brand/40 bg-slate-50/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Report Preview & Downloads */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 capitalize">{reportType} Analytics Summary</h3>
                <p className="text-xs text-slate-400">Previewing compiled telemetry before exporting formats</p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                Date: {startDate} to {endDate}
              </span>
            </div>

            {/* Compiled Preview Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getActivePreview().map((item, i) => (
                <div key={i} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1 hover:border-slate-200 transition-colors">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{item.title}</span>
                  <h4 className="text-base font-extrabold text-slate-800">{item.count}</h4>
                  <p className="text-[10px] text-slate-500">{item.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Export Actions Panel */}
          <div className="mt-8 pt-4 border-t border-slate-100 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Download Formats</span>
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
                className="py-3 px-4 border border-green-200 hover:bg-green-50 rounded-xl text-xs font-bold text-green-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet size={14} />
                Export XLSX
              </button>
              <button
                type="button"
                onClick={() => triggerExport('CSV')}
                disabled={isCompiling}
                className="py-3 px-4 border border-blue-200 hover:bg-blue-50 rounded-xl text-xs font-bold text-blue-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-5 transform scale-100 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-brand" size={18} />
                <h4 className="text-sm font-bold text-slate-800">Generating Report</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg uppercase">
                {exportFormat} Format
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="truncate max-w-[280px] text-slate-500 font-semibold">{compileStep}</span>
                <span className="text-brand font-extrabold">{compileProgress}%</span>
              </div>
              {/* Progress bar container */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand rounded-full transition-all duration-200 ease-out" 
                  style={{ width: `${compileProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 text-[10px] space-y-1 text-slate-500">
              <div className="flex justify-between">
                <span className="font-semibold">Category:</span>
                <span className="font-bold text-slate-700 capitalize">{reportType}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Period:</span>
                <span className="font-bold text-slate-700">{startDate} to {endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Security Level:</span>
                <span className="font-bold text-slate-700">Admin Encrypted</span>
              </div>
            </div>

            <div className="text-[9px] text-slate-400 text-center italic">
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
            className="text-[10px] font-bold text-slate-400 hover:text-white ml-2 cursor-pointer bg-slate-800 hover:bg-slate-700 p-1 px-2 rounded-md transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportsScreen;
