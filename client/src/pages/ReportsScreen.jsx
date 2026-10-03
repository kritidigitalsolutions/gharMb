import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Calendar,
  FileSpreadsheet,
  FileCode,
  RefreshCw,
  Search,
  Loader2,
  Building2,
  Users,
  Wallet,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  X,
  Check
} from 'lucide-react';
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  formatRupeeForPDF,
  formatRupeeForUI
} from '../utils/exportEngine';

const ReportsScreen = () => {
  // Category & Filter State
  const [reportType, setReportType] = useState('properties'); // 'properties' | 'users' | 'revenue' | 'leads'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState('all'); // 'all' | '30d' | '90d' | 'ytd' | 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingFormat, setDownloadingFormat] = useState(null); // 'Excel' | 'CSV' | 'PDF' | null
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [liveStats, setLiveStats] = useState(null);
  const [rawRecords, setRawRecords] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);

  const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const API_BASE = RAW_API_URL.replace(/\/+api\/?$/i, '').replace(/\/+$/, '');

  const capitalize = (str) => {
    if (!str) return '—';
    return String(str)
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDateDisplay = (dateVal) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return String(dateVal);
    }
  };

  const handleDatePreset = (preset) => {
    setActiveDatePreset(preset);
    const end = new Date();
    let start = new Date();

    if (preset === '30d') {
      start.setDate(end.getDate() - 30);
    } else if (preset === '90d') {
      start.setDate(end.getDate() - 90);
    } else if (preset === 'ytd') {
      start = new Date(end.getFullYear(), 0, 1);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const fetchStats = useCallback(async () => {
    setIsRefreshingStats(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setIsRefreshingStats(false);
        return;
      }
      const res = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setLiveStats(data.data.stats);
      }
    } catch (err) {
      console.error('Error fetching live stats for reports:', err);
    } finally {
      setIsRefreshingStats(false);
    }
  }, [API_BASE]);

  const fetchCategoryData = useCallback(async (type) => {
    setIsLoadingData(true);
    const token = localStorage.getItem('adminToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      if (type === 'properties') {
        const res = await fetch(`${API_BASE}/api/admin/properties?limit=5000`, { headers });
        const json = await res.json();
        const items = json?.data?.properties || [];
        setRawRecords(items);
      } else if (type === 'users') {
        const res = await fetch(`${API_BASE}/api/admin/users?limit=5000`, { headers });
        const json = await res.json();
        const items = json?.data?.users || [];
        setRawRecords(items);
      } else if (type === 'revenue') {
        const res = await fetch(`${API_BASE}/api/admin/dashboard/revenue`, { headers });
        const json = await res.json();
        const items = json?.data?.tokenTransactions || [];
        setRawRecords(items);
      } else {
        const res = await fetch(`${API_BASE}/api/admin/dashboard/enquiries`, { headers });
        const json = await res.json();
        const propEnq = (json?.data?.propertyEnquiries || []).map((e) => ({
          ...e,
          inquiryType: 'Property Inquiry',
          clientName: e.client?.name || 'Prospective Buyer',
          clientPhone: e.client?.phone || '—',
          clientEmail: e.client?.email || '—',
          propertyTitle: e.property?.title || 'Listing Consultation'
        }));
        const devEnq = (json?.data?.developerEnquiries || []).map((e) => ({
          ...e,
          inquiryType: 'Developer Lead',
          clientName: e.client?.name || 'Prospective Buyer',
          clientPhone: e.client?.phone || '—',
          clientEmail: e.client?.email || '—',
          propertyTitle: e.developer?.companyName ? `Developer: ${e.developer.companyName}` : 'Project Inquiry'
        }));
        const visitReq = (json?.data?.visitRequests || []).map((e) => ({
          ...e,
          inquiryType: 'Site Visit',
          clientName: e.user?.name || 'Registered Buyer',
          clientPhone: e.user?.phone || '—',
          clientEmail: e.user?.email || '—',
          propertyTitle: e.property?.title || 'Scheduled Property Tour'
        }));

        const combined = [...propEnq, ...devEnq, ...visitReq].sort((a, b) => {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        setRawRecords(combined);
      }
    } catch (err) {
      console.error(`Error fetching ${type} records:`, err);
      setRawRecords([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchStats();
    fetchCategoryData(reportType);
  }, [reportType, fetchStats, fetchCategoryData]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3200);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const categories = [
    {
      id: 'properties',
      label: 'Properties',
      icon: Building2,
      count: liveStats?.totalProperties ?? (reportType === 'properties' ? rawRecords.length : 0),
      sublabel: `${liveStats?.liveProperties ?? 0} Live`
    },
    {
      id: 'users',
      label: 'Users & Builders',
      icon: Users,
      count: liveStats?.totalUsers ?? (reportType === 'users' ? rawRecords.length : 0),
      sublabel: `${liveStats?.totalBuilders ?? 0} Builders`
    },
    {
      id: 'revenue',
      label: 'Revenue Ledger',
      icon: Wallet,
      count: `₹${(liveStats?.revenueGenerated || 0).toLocaleString('en-IN')}`,
      sublabel: 'Settled'
    },
    {
      id: 'leads',
      label: 'Leads & Enquiries',
      icon: MessageSquare,
      count: liveStats?.totalEnquiries ?? (reportType === 'leads' ? rawRecords.length : 0),
      sublabel: `${liveStats?.siteVisits ?? 0} Visits`
    }
  ];

  // Filter records by Date Scope & Search Query
  const filteredRecords = useMemo(() => {
    return rawRecords.filter((item) => {
      if (startDate || endDate) {
        const itemDateStr = item.createdAt || item.date || item.joinedDate;
        if (itemDateStr) {
          const itemDate = new Date(itemDateStr);
          if (!isNaN(itemDate.getTime())) {
            if (startDate) {
              const start = new Date(startDate);
              start.setHours(0, 0, 0, 0);
              if (itemDate < start) return false;
            }
            if (endDate) {
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              if (itemDate > end) return false;
            }
          }
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchableFields = [
          item.title,
          item.propertyName,
          item.city,
          item.locality,
          item.name,
          item.email,
          item.phone,
          item.buyer,
          item.buyerPhone,
          item.seller,
          item.clientName,
          item.propertyTitle,
          item.submissionId,
          item.tokenRequestId,
          item.id,
          item._id
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableFields.includes(q)) return false;
      }

      return true;
    });
  }, [rawRecords, startDate, endDate, searchQuery]);

  // Unified File Downloader
  const handleExecuteExport = async (format) => {
    if (downloadingFormat) return;
    setDownloadingFormat(format);

    try {
      const todayIso = new Date().toISOString().split('T')[0];
      const scopeLabel =
        startDate && endDate
          ? `${startDate} to ${endDate}`
          : activeDatePreset === 'all'
          ? 'Complete Platform Archive'
          : `${activeDatePreset.toUpperCase()} Scope`;

      const safeCategoryName = capitalize(reportType);
      const fileDateSuffix = startDate && endDate ? `${startDate}_to_${endDate}` : `all_time_${todayIso}`;

      let headers = [];
      let rows = [];
      let summaryRow = null;
      let columnAlignments = {};

      if (reportType === 'properties') {
        headers = [
          'Property ID',
          'Property Title',
          'Category',
          'Listing For',
          'City',
          'Locality',
          'Price (INR)',
          'Status',
          'Tier',
          'Owner / Partner',
          'Date Listed'
        ];

        rows = filteredRecords.map((p) => [
          p.submissionId || (p._id ? `#${p._id.toString().slice(-6).toUpperCase()}` : '—'),
          p.title || p.propertyName || 'Untitled Property',
          capitalize(p.category || p.propertyType || 'Residential'),
          capitalize(p.listingFor || 'Sale'),
          capitalize(p.city || 'Gurugram'),
          capitalize(p.locality || '—'),
          format === 'Excel'
            ? Number(p.price) || 0
            : format === 'PDF'
            ? formatRupeeForPDF(p.price)
            : formatRupeeForUI(p.price),
          capitalize(p.approvalStatus || 'Pending'),
          p.listingTier || (p.isFeatured ? 'Featured' : 'Standard'),
          p.owner?.companyName || p.owner?.name || p.owner?.phone || 'Direct Owner',
          formatDateDisplay(p.createdAt)
        ]);

        const totalValuation = filteredRecords.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
        summaryRow = ['TOTAL VALUATION', '', '', '', '', '', totalValuation, '', '', '', ''];

        columnAlignments = {
          0: { cellWidth: 22 },
          1: { cellWidth: 44 },
          2: { cellWidth: 20 },
          3: { cellWidth: 18 },
          4: { cellWidth: 20 },
          5: { cellWidth: 22 },
          6: { halign: 'right', cellWidth: 26 },
          7: { halign: 'center', cellWidth: 18 },
          8: { cellWidth: 16 },
          9: { cellWidth: 26 },
          10: { cellWidth: 20 }
        };
      } else if (reportType === 'users') {
        headers = [
          'User ID',
          'Full Name',
          'Email Address',
          'Phone Number',
          'Role',
          'Account Status',
          'Verification',
          'Company Name',
          'Listings',
          'Joined Date'
        ];

        rows = filteredRecords.map((u) => [
          u._id ? `#${u._id.toString().slice(-6).toUpperCase()}` : '—',
          u.name || 'Anonymous User',
          u.email || '—',
          u.phone || '—',
          capitalize(u.role || 'user'),
          capitalize(u.status || 'active'),
          u.isVerified ? 'Verified' : 'Unverified',
          u.companyName || '—',
          u.listingsCount ?? 0,
          formatDateDisplay(u.createdAt)
        ]);

        columnAlignments = {
          0: { cellWidth: 20 },
          1: { cellWidth: 32 },
          2: { cellWidth: 42 },
          3: { cellWidth: 26 },
          4: { cellWidth: 18 },
          5: { halign: 'center', cellWidth: 18 },
          6: { halign: 'center', cellWidth: 20 },
          7: { cellWidth: 30 },
          8: { halign: 'center', cellWidth: 16 },
          9: { cellWidth: 20 }
        };
      } else if (reportType === 'revenue') {
        headers = [
          'Transaction ID',
          'Buyer Name',
          'Buyer Phone',
          'Seller / Partner',
          'Property Listing',
          'Token Amount (INR)',
          'Escrow Status',
          'Payment Mode',
          'UTR / Reference',
          'Transaction Date'
        ];

        rows = filteredRecords.map((t) => {
          const rawAmt = Number(t.amountNum) || Number(String(t.amount || '').replace(/[^0-9.-]+/g, '')) || 0;
          return [
            t.id || t.tokenRequestId || (t._id ? `#TKN-${t._id.toString().slice(-6).toUpperCase()}` : '—'),
            t.buyer || 'Verified Client',
            t.buyerPhone || '—',
            t.seller || 'Property Owner',
            t.property || 'Property Listing',
            format === 'Excel' ? rawAmt : format === 'PDF' ? formatRupeeForPDF(rawAmt) : formatRupeeForUI(rawAmt),
            capitalize(t.status || t.escrowStatus || 'Escrow Held'),
            t.paymentMethod || 'UPI / NetBanking',
            t.utrRef || 'Pending Verification',
            t.date || formatDateDisplay(t.createdAt)
          ];
        });

        const grossRevenue = filteredRecords.reduce((sum, t) => {
          const amt = Number(t.amountNum) || Number(String(t.amount || '').replace(/[^0-9.-]+/g, '')) || 0;
          return sum + amt;
        }, 0);
        summaryRow = ['TOTAL REVENUE', '', '', '', '', grossRevenue, '', '', '', ''];

        columnAlignments = {
          0: { cellWidth: 24 },
          1: { cellWidth: 30 },
          2: { cellWidth: 24 },
          3: { cellWidth: 30 },
          4: { cellWidth: 36 },
          5: { halign: 'right', cellWidth: 26 },
          6: { halign: 'center', cellWidth: 20 },
          7: { cellWidth: 20 },
          8: { cellWidth: 24 },
          9: { cellWidth: 20 }
        };
      } else {
        headers = [
          'Inquiry ID',
          'Inquiry Type',
          'Client Name',
          'Client Phone',
          'Client Email',
          'Target Property / Project',
          'Lead Status',
          'Preferred Visit Date',
          'Received Date'
        ];

        rows = filteredRecords.map((e) => [
          e._id ? `#${e._id.toString().slice(-6).toUpperCase()}` : '—',
          e.inquiryType || 'Property Inquiry',
          e.clientName || 'Inquirer',
          e.clientPhone || '—',
          e.clientEmail || '—',
          e.propertyTitle || 'Consultation Request',
          capitalize(e.status || 'Pending'),
          formatDateDisplay(e.visitPreferredDate || e.preferredDate),
          formatDateDisplay(e.createdAt)
        ]);

        columnAlignments = {
          0: { cellWidth: 20 },
          1: { cellWidth: 24 },
          2: { cellWidth: 28 },
          3: { cellWidth: 24 },
          4: { cellWidth: 38 },
          5: { cellWidth: 40 },
          6: { halign: 'center', cellWidth: 20 },
          7: { cellWidth: 24 },
          8: { cellWidth: 20 }
        };
      }

      if (rows.length === 0) {
        rows.push(['No records found matching current date scope and filters', ...Array(headers.length - 1).fill('—')]);
      }

      // Compute dynamic summary metrics for PDF header
      let summaryMetrics = [];
      if (reportType === 'properties') {
        const totalVal = filteredRecords.reduce((s, p) => s + (Number(p.price) || 0), 0);
        const liveCount = filteredRecords.filter((p) => (p.approvalStatus || '').toLowerCase() === 'approved').length;
        summaryMetrics = [
          { label: 'Total In Scope', value: filteredRecords.length, accentColor: [79, 70, 229] },
          { label: 'Live / Approved', value: liveCount, accentColor: [5, 150, 105] },
          { label: 'Pending Review', value: filteredRecords.length - liveCount, accentColor: [217, 119, 6] },
          { label: 'Total Valuation', value: formatRupeeForPDF(totalVal), accentColor: [79, 70, 229] }
        ];
      } else if (reportType === 'users') {
        const verifiedCount = filteredRecords.filter((u) => u.isVerified).length;
        const builderCount = filteredRecords.filter((u) => (u.role || '').toLowerCase() === 'builder').length;
        summaryMetrics = [
          { label: 'Total Users', value: filteredRecords.length, accentColor: [79, 70, 229] },
          { label: 'Verified Accounts', value: verifiedCount, accentColor: [5, 150, 105] },
          { label: 'Registered Builders', value: builderCount, accentColor: [14, 165, 233] },
          { label: 'Standard Users', value: filteredRecords.length - builderCount, accentColor: [100, 116, 139] }
        ];
      } else if (reportType === 'revenue') {
        const grossRev = filteredRecords.reduce((s, t) => s + (Number(t.amountNum) || Number(String(t.amount || '').replace(/[^0-9.-]+/g, '')) || 0), 0);
        const settledCount = filteredRecords.filter((t) => ['settled', 'completed', 'success'].includes((t.status || '').toLowerCase())).length;
        summaryMetrics = [
          { label: 'Transactions', value: filteredRecords.length, accentColor: [79, 70, 229] },
          { label: 'Settled Escrows', value: settledCount, accentColor: [5, 150, 105] },
          { label: 'Pending Escrow', value: filteredRecords.length - settledCount, accentColor: [217, 119, 6] },
          { label: 'Gross Volume', value: formatRupeeForPDF(grossRev), accentColor: [79, 70, 229] }
        ];
      } else {
        const propEnqCount = filteredRecords.filter((e) => (e.inquiryType || '').includes('Property')).length;
        const siteVisitCount = filteredRecords.filter((e) => (e.inquiryType || '').includes('Visit')).length;
        summaryMetrics = [
          { label: 'Total Leads', value: filteredRecords.length, accentColor: [79, 70, 229] },
          { label: 'Property Inquiries', value: propEnqCount, accentColor: [14, 165, 233] },
          { label: 'Site Visits', value: siteVisitCount, accentColor: [5, 150, 105] },
          { label: 'Developer Leads', value: filteredRecords.length - propEnqCount - siteVisitCount, accentColor: [217, 119, 6] }
        ];
      }

      if (format === 'PDF') {
        exportToPDF({
          categoryTitle: safeCategoryName,
          dateScope: scopeLabel,
          summaryMetrics,
          headers,
          rows,
          columnAlignments,
          filename: `gharmb_${reportType}_report_${fileDateSuffix}.pdf`
        });
      } else if (format === 'Excel') {
        exportToExcel({
          categoryTitle: safeCategoryName,
          sheetName: `${safeCategoryName} Data`,
          dateScope: scopeLabel,
          headers,
          rows,
          summaryRow,
          filename: `gharmb_${reportType}_report_${fileDateSuffix}.xlsx`
        });
      } else if (format === 'CSV') {
        exportToCSV({
          categoryTitle: safeCategoryName,
          dateScope: scopeLabel,
          headers,
          rows,
          filename: `gharmb_${reportType}_report_${fileDateSuffix}.csv`
        });
      }

      setToastMessage(`${safeCategoryName} (${rows.length} records) exported as ${format}.`);
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error('Export error:', err);
      setToastMessage(`Export failed: ${err.message || 'Unknown error'}`);
      setToastType('error');
      setShowToast(true);
    } finally {
      setTimeout(() => {
        setDownloadingFormat(null);
      }, 400);
    }
  };

  const getTableHeaders = () => {
    switch (reportType) {
      case 'users':
        return ['User Name', 'Email Address', 'Phone', 'Role', 'Status', 'Registered Date'];
      case 'revenue':
        return ['Transaction ID', 'Buyer', 'Seller / Partner', 'Amount', 'Status', 'Date'];
      case 'leads':
        return ['Client Name', 'Phone', 'Property Listing', 'Type', 'Status', 'Date Received'];
      default:
        return ['Property Title', 'City', 'Type', 'Price', 'Status', 'Date Listed'];
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase().trim();
    if (['approved', 'active', 'settled', 'resolved', 'verified'].includes(s)) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-500',
        label: capitalize(s)
      };
    }
    if (['pending', 'in progress', 'under review', 'escrow held', 'contacted', 'scheduled'].includes(s)) {
      return {
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        dot: 'bg-amber-500',
        label: capitalize(s)
      };
    }
    return {
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      dot: 'bg-rose-500',
      label: s ? capitalize(s) : 'Rejected'
    };
  };

  return (
    <div className="w-full space-y-3.5">
      {/* ─── 1. COMPACT TOP HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              Reports & Data Export
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Select category, date range, and export records directly.
          </p>
        </div>

        {/* Sync Button */}
        <button
          type="button"
          onClick={() => {
            fetchStats();
            fetchCategoryData(reportType);
          }}
          disabled={isRefreshingStats || isLoadingData}
          className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-medium transition-all duration-150 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw size={13} className={isRefreshingStats || isLoadingData ? 'animate-spin text-brand' : ''} />
          <span>{isRefreshingStats || isLoadingData ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* ─── 2. SLEEK SEGMENTED CATEGORY TABS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = reportType === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setReportType(cat.id);
                setSearchQuery('');
              }}
              className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden ${
                isActive
                  ? 'bg-[var(--bg-surface)] border-brand ring-1 ring-brand/40 shadow-xs'
                  : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-[var(--bg-muted)]/30'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-brand/10 text-brand'
                      : 'bg-[var(--bg-muted)] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div className="truncate">
                  <p
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-brand' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {cat.label}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] font-medium">
                    {cat.count} {cat.sublabel ? `• ${cat.sublabel}` : ''}
                  </p>
                </div>
              </div>

              {isActive && (
                <div className="w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={2.5} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── 3. UNIFIED ACTION BAR (DATE SCOPE + DIRECT EXPORTS IN ONE ROW) ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] mr-1">
            <Calendar size={13} className="text-brand" />
            <span>Scope:</span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-muted)] p-0.5 rounded-lg border border-[var(--border)]">
            {[
              { id: 'all', label: 'All' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: 'ytd', label: 'YTD' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleDatePreset(p.id)}
                className={`h-6 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  activeDatePreset === p.id
                    ? 'bg-[var(--bg-surface)] text-brand shadow-xs font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Start and End Date Inputs */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="h-7 px-2 bg-[var(--bg-muted)] text-[11px] font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand cursor-pointer"
            />
            <span className="text-[11px] text-[var(--text-muted)] font-medium">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="h-7 px-2 bg-[var(--bg-muted)] text-[11px] font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand cursor-pointer"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setActiveDatePreset('all');
                }}
                className="text-[11px] text-rose-500 hover:underline px-1 cursor-pointer font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Direct Download Buttons */}
        <div className="flex items-center gap-2">
          {/* Excel XLSX */}
          <button
            type="button"
            onClick={() => handleExecuteExport('Excel')}
            disabled={!!downloadingFormat || isLoadingData}
            className="h-8 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Download Excel Sheet (.xlsx)"
          >
            {downloadingFormat === 'Excel' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={13} />
            )}
            <span>Export Excel</span>
          </button>

          {/* CSV */}
          <button
            type="button"
            onClick={() => handleExecuteExport('CSV')}
            disabled={!!downloadingFormat || isLoadingData}
            className="h-8 px-3 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Download CSV file (.csv)"
          >
            {downloadingFormat === 'CSV' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileCode size={13} />
            )}
            <span>Export CSV</span>
          </button>

          {/* PDF */}
          <button
            type="button"
            onClick={() => handleExecuteExport('PDF')}
            disabled={!!downloadingFormat || isLoadingData}
            className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Download Printable PDF Report (.pdf)"
          >
            {downloadingFormat === 'PDF' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileText size={13} />
            )}
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* ─── 4. LIVE RECORD PREVIEW TABLE ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs overflow-hidden transition-all duration-200">
        {/* Table Toolbar */}
        <div className="p-3 px-3.5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-[var(--text-primary)] capitalize">
              {reportType} Preview
            </h2>
            <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border)]">
              {filteredRecords.length} Records
            </span>
          </div>

          {/* Search filter */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${reportType}...`}
              className="h-7 pl-7 pr-7 text-[11px] bg-[var(--bg-muted)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-brand w-44 sm:w-56"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>

        {/* Clean Fluid Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-muted)]/50">
                {getTableHeaders().map((header, i) => (
                  <th
                    key={i}
                    className={`py-2.5 px-3.5 align-middle ${
                      i === 3 && reportType === 'properties' ? 'text-right' : i === 4 ? 'text-center' : i === 5 ? 'text-right' : ''
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {isLoadingData ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-3.5"><div className="h-3.5 bg-[var(--bg-muted)] rounded w-28" /></td>
                    <td className="py-3 px-3.5"><div className="h-3.5 bg-[var(--bg-muted)] rounded w-20" /></td>
                    <td className="py-3 px-3.5"><div className="h-3.5 bg-[var(--bg-muted)] rounded w-20" /></td>
                    <td className="py-3 px-3.5"><div className="h-3.5 bg-[var(--bg-muted)] rounded w-16" /></td>
                    <td className="py-3 px-3.5"><div className="h-3.5 bg-[var(--bg-muted)] rounded w-14 mx-auto" /></td>
                    <td className="py-3 px-3.5"><div className="h-3.5 bg-[var(--bg-muted)] rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[var(--text-muted)]">
                    {searchQuery ? `No records found matching "${searchQuery}".` : 'No records found for this dataset.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.slice(0, 100).map((row, idx) => {
                  let col1, col2, col3, col4, col5, col6;

                  if (reportType === 'properties') {
                    col1 = row.title || row.propertyName || 'Untitled Property';
                    col2 = capitalize(row.city || 'Gurugram');
                    col3 = capitalize(row.category || row.propertyType || 'Residential');
                    col4 = formatRupeeForUI(row.price);
                    col5 = row.approvalStatus || 'approved';
                    col6 = formatDateDisplay(row.createdAt);
                  } else if (reportType === 'users') {
                    col1 = row.name || 'Anonymous User';
                    col2 = row.email || '—';
                    col3 = row.phone || '—';
                    col4 = capitalize(row.role || 'user');
                    col5 = row.status || 'Active';
                    col6 = formatDateDisplay(row.createdAt);
                  } else if (reportType === 'revenue') {
                    col1 = row.id || row.tokenRequestId || (row._id ? `#TKN-${row._id.slice(-6).toUpperCase()}` : '—');
                    col2 = row.buyer || 'Verified Client';
                    col3 = row.seller || 'Property Owner';
                    col4 = formatRupeeForUI(row.amountNum || row.amount);
                    col5 = row.status || row.escrowStatus || 'Settled';
                    col6 = row.date || formatDateDisplay(row.createdAt);
                  } else {
                    col1 = row.clientName || 'Inquirer';
                    col2 = row.clientPhone || '—';
                    col3 = row.propertyTitle || 'Consultation';
                    col4 = row.inquiryType || 'General Lead';
                    col5 = row.status || 'Pending';
                    col6 = formatDateDisplay(row.createdAt);
                  }

                  const badge = getStatusBadge(col5);

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-[var(--bg-muted)]/50 transition-colors duration-150"
                    >
                      <td className="py-2.5 px-3.5 align-middle font-semibold text-[var(--text-primary)]">
                        {col1}
                      </td>
                      <td className="py-2.5 px-3.5 align-middle text-[var(--text-muted)]">
                        {col2}
                      </td>
                      <td className="py-2.5 px-3.5 align-middle text-[var(--text-subtle)]">
                        {col3}
                      </td>
                      <td className="py-2.5 px-3.5 align-middle font-bold text-[var(--text-primary)]">
                        {col4}
                      </td>
                      <td className="py-2.5 px-3.5 align-middle text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 align-middle text-right text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                        {col6}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Minimal Footer */}
        <div className="p-2.5 px-3.5 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>Live preview sample • Full dataset compiled upon export</span>
          <div className="flex items-center gap-1 text-[var(--text-muted)]">
            <span>Range:</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {startDate && endDate ? `${startDate} to ${endDate}` : activeDatePreset.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 5. CLEAN NON-BLOCKING TOAST ─── */}
      {showToast && (
        <div
          className={`fixed bottom-5 right-5 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 border ${
            toastType === 'error'
              ? 'bg-rose-950 border-rose-800 text-rose-100'
              : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}
        >
          {toastType === 'error' ? (
            <AlertCircle className="text-rose-400 shrink-0" size={16} />
          ) : (
            <CheckCircle2 className="text-emerald-400 shrink-0" size={16} />
          )}
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="text-slate-400 hover:text-white ml-1 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportsScreen;
