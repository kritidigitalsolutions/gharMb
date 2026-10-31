import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AdminLoader from '../components/common/AdminLoader';
import API from '../api/api';
import Badge from '../components/ui/Badge';
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
  Check,
  Copy,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Download,
  Filter
} from 'lucide-react';
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  formatRupeeForPDF,
  formatRupeeForUI
} from '../utils/exportEngine';

const ReportsScreen = () => {
  // ── 01. Category & Filter States ──────────────────────────────────────────
  const [reportType, setReportType] = useState('properties'); // 'properties' | 'users' | 'revenue' | 'leads'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState('all'); // 'all' | '30d' | '90d' | 'ytd' | 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingFormat, setDownloadingFormat] = useState(null); // 'Excel' | 'CSV' | 'PDF' | null

  // ── 02. Data States ───────────────────────────────────────────────────────
  const [liveStats, setLiveStats] = useState(null);
  const [rawRecords, setRawRecords] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const lastSyncTimestampRef = useRef(Date.now());

  // ── 03. Sliding Indicator Geometries ──────────────────────────────────────
  const categoryTabRefs = useRef({});
  const [categoryIndicatorStyle, setCategoryIndicatorStyle] = useState({ left: 4, width: 0, opacity: 0 });

  // ── 04. Toast Notification System ─────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

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

  // ── 05. Data Fetchers ─────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setIsRefreshingStats(true);
    try {
      const res = await API.get('/admin/dashboard/stats');
      const data = res.data;
      if (data && data.status === 'success') {
        setLiveStats(data.data.stats);
        lastSyncTimestampRef.current = Date.now();
        setLastSyncTime('Just now');
      }
    } catch (err) {
      console.error('Error fetching live stats for reports:', err);
    } finally {
      setIsRefreshingStats(false);
    }
  }, []);

  const fetchCategoryData = useCallback(async (type) => {
    setIsLoadingData(true);

    try {
      if (type === 'properties') {
        const res = await API.get('/admin/properties', { params: { limit: 1000 } });
        const items = res.data?.data?.properties || [];
        setRawRecords(items);
      } else if (type === 'users') {
        const res = await API.get('/admin/users', { params: { limit: 1000 } });
        const items = res.data?.data?.users || [];
        setRawRecords(items);
      } else if (type === 'revenue') {
        const res = await API.get('/admin/dashboard/revenue');
        const items = res.data?.data?.tokenTransactions || [];
        setRawRecords(items);
      } else {
        const res = await API.get('/admin/dashboard/enquiries');
        const json = res.data;
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
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCategoryData(reportType);
  }, [reportType, fetchStats, fetchCategoryData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const diffSec = Math.floor((Date.now() - lastSyncTimestampRef.current) / 1000);
      if (diffSec < 60) setLastSyncTime('Just now');
      else if (diffSec < 3600) setLastSyncTime(`${Math.floor(diffSec / 60)}m ago`);
      else setLastSyncTime(`${Math.floor(diffSec / 3600)}h ago`);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── 06. Pipeline Switch Categories (Pastel Design Tokens) ─────────────────
  const categories = useMemo(() => {
    return [
      {
        id: 'properties',
        label: 'Properties Portfolio',
        icon: Building2,
        count: liveStats?.totalProperties ?? (reportType === 'properties' ? rawRecords.length : 0),
        activeBg: 'bg-[#52c99b] dark:bg-[#1a4a38]',
        activeText: 'text-[#064e3b] dark:text-[#6ee7b7]',
        activeCountBg: 'bg-[#064e3b]/15 text-[#064e3b] dark:bg-[#6ee7b7]/25 dark:text-[#6ee7b7]'
      },
      {
        id: 'users',
        label: 'Users & Partners',
        icon: Users,
        count: liveStats?.totalUsers ?? (reportType === 'users' ? rawRecords.length : 0),
        activeBg: 'bg-[#c4b5fd] dark:bg-[#3b1968]',
        activeText: 'text-[#4c1d95] dark:text-[#ddd6fe]',
        activeCountBg: 'bg-[#4c1d95]/15 text-[#4c1d95] dark:bg-[#ddd6fe]/25 dark:text-[#ddd6fe]'
      },
      {
        id: 'revenue',
        label: 'Revenue & Escrow',
        icon: Wallet,
        count: `₹${((liveStats?.revenueGenerated || 0) / 100000).toFixed(1).replace(/\.0$/, '')}L`,
        activeBg: 'bg-[#fef08a] dark:bg-[#4d3209]',
        activeText: 'text-[#78350f] dark:text-[#fef08a]',
        activeCountBg: 'bg-[#78350f]/15 text-[#78350f] dark:bg-[#fef08a]/25 dark:text-[#fef08a]'
      },
      {
        id: 'leads',
        label: 'Inquiries & Leads',
        icon: MessageSquare,
        count: liveStats?.totalEnquiries ?? (reportType === 'leads' ? rawRecords.length : 0),
        activeBg: 'bg-[#bae6fd] dark:bg-[#113c54]',
        activeText: 'text-[#075985] dark:text-[#7dd3fc]',
        activeCountBg: 'bg-[#075985]/15 text-[#075985] dark:bg-[#7dd3fc]/25 dark:text-[#7dd3fc]'
      }
    ];
  }, [liveStats, reportType, rawRecords]);

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === reportType) || categories[0];
  }, [categories, reportType]);

  // Update category sliding indicator
  useEffect(() => {
    const updateIndicator = () => {
      const el = categoryTabRefs.current[reportType];
      if (el) {
        setCategoryIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          opacity: 1
        });
      }
    };
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    const t = setTimeout(updateIndicator, 50);
    return () => {
      window.removeEventListener('resize', updateIndicator);
      clearTimeout(t);
    };
  }, [reportType, categories]);

  // ── 07. Filter Records by Date Scope & Search Query ───────────────────────
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

  // ── 08. Dynamic Category KPI Metrics ──────────────────────────────────────
  const categoryMetrics = useMemo(() => {
    if (reportType === 'properties') {
      const totalVal = filteredRecords.reduce((s, p) => s + (Number(p.price) || 0), 0);
      const liveCount = filteredRecords.filter((p) => (p.approvalStatus || '').toLowerCase() === 'approved').length;
      const pendingCount = filteredRecords.filter((p) => (p.approvalStatus || '').toLowerCase() === 'pending').length;

      return [
        {
          title: 'Total Portfolio',
          value: filteredRecords.length,
          sub: 'Filtered Catalog',
          accent: 'border-t-[#52c99b]',
          icon: Building2,
          iconBg: 'bg-[#52c99b]/15 text-[#064e3b] dark:text-[#6ee7b7]',
          badge: <Badge color="emerald" variant="pastel" size="xs">Catalog</Badge>
        },
        {
          title: 'Live & Approved',
          value: liveCount,
          sub: 'Active on App',
          accent: 'border-t-[#52c99b]',
          icon: CheckCircle2,
          iconBg: 'bg-[#52c99b]/15 text-[#064e3b] dark:text-[#6ee7b7]',
          badge: <Badge.Approved size="xs">Live</Badge.Approved>
        },
        {
          title: 'Needs Audit',
          value: pendingCount,
          sub: 'Pending Verification',
          accent: 'border-t-[#fef08a]',
          icon: Clock,
          iconBg: 'bg-[#fef08a]/25 text-[#78350f] dark:text-[#fef08a]',
          badge: <Badge.Pending size="xs" pulse={pendingCount > 0}>Needs Audit</Badge.Pending>
        },
        {
          title: 'Portfolio Valuation',
          value: totalVal >= 10000000 ? `₹${(totalVal / 10000000).toFixed(2)} Cr` : `₹${(totalVal / 100000).toFixed(1)} L`,
          sub: 'Total Property Value',
          accent: 'border-t-[#c4b5fd]',
          icon: Wallet,
          iconBg: 'bg-[#c4b5fd]/25 text-[#4c1d95] dark:text-[#ddd6fe]',
          badge: <Badge color="purple" variant="pastel" size="xs">Valuation</Badge>
        }
      ];
    } else if (reportType === 'users') {
      const verifiedCount = filteredRecords.filter((u) => u.isVerified).length;
      const builderCount = filteredRecords.filter((u) => (u.role || '').toLowerCase() === 'builder').length;
      const activeCount = filteredRecords.filter((u) => (u.status || '').toLowerCase() === 'active').length;

      return [
        {
          title: 'Total Accounts',
          value: filteredRecords.length,
          sub: 'Registered Users',
          accent: 'border-t-[#c4b5fd]',
          icon: Users,
          iconBg: 'bg-[#c4b5fd]/25 text-[#4c1d95] dark:text-[#ddd6fe]',
          badge: <Badge color="purple" variant="pastel" size="xs">Accounts</Badge>
        },
        {
          title: 'Active Users',
          value: activeCount,
          sub: 'Good Standing',
          accent: 'border-t-[#52c99b]',
          icon: CheckCircle2,
          iconBg: 'bg-[#52c99b]/15 text-[#064e3b] dark:text-[#6ee7b7]',
          badge: <Badge.Active size="xs">Active</Badge.Active>
        },
        {
          title: 'Verified Partners',
          value: verifiedCount,
          sub: 'KYC & License Cleared',
          accent: 'border-t-[#52c99b]',
          icon: CheckCircle2,
          iconBg: 'bg-[#52c99b]/15 text-[#064e3b] dark:text-[#6ee7b7]',
          badge: <Badge.Verified size="xs">Verified</Badge.Verified>
        },
        {
          title: 'Builders & Developers',
          value: builderCount,
          sub: 'Commercial Entities',
          accent: 'border-t-[#fed7aa]',
          icon: Building2,
          iconBg: 'bg-[#fed7aa]/30 text-[#9a3412] dark:text-[#fed7aa]',
          badge: <Badge color="peach" variant="pastel" size="xs">Builders</Badge>
        }
      ];
    } else if (reportType === 'revenue') {
      const grossRev = filteredRecords.reduce((s, t) => s + (Number(t.amountNum) || Number(String(t.amount || '').replace(/[^0-9.-]+/g, '')) || 0), 0);
      const settledCount = filteredRecords.filter((t) => ['settled', 'completed', 'approved', 'released'].includes((t.status || '').toLowerCase())).length;
      const pendingCount = filteredRecords.filter((t) => (t.status || '').toLowerCase() === 'pending').length;

      return [
        {
          title: 'Total Transactions',
          value: filteredRecords.length,
          sub: 'Token Ledgers',
          accent: 'border-t-[#fef08a]',
          icon: Wallet,
          iconBg: 'bg-[#fef08a]/25 text-[#78350f] dark:text-[#fef08a]',
          badge: <Badge color="amber" variant="pastel" size="xs">Ledger</Badge>
        },
        {
          title: 'Settled Escrows',
          value: settledCount,
          sub: 'Released to Sellers',
          accent: 'border-t-[#52c99b]',
          icon: CheckCircle2,
          iconBg: 'bg-[#52c99b]/15 text-[#064e3b] dark:text-[#6ee7b7]',
          badge: <Badge.Active size="xs">Settled</Badge.Active>
        },
        {
          title: 'Held in Escrow',
          value: pendingCount,
          sub: 'Awaiting Free-Look',
          accent: 'border-t-[#fef08a]',
          icon: Clock,
          iconBg: 'bg-[#fef08a]/25 text-[#78350f] dark:text-[#fef08a]',
          badge: <Badge.Pending size="xs" pulse={pendingCount > 0}>Held</Badge.Pending>
        },
        {
          title: 'Gross Volume',
          value: `₹${grossRev.toLocaleString('en-IN')}`,
          sub: 'Total Escrow Sum',
          accent: 'border-t-[#52c99b]',
          icon: Sparkles,
          iconBg: 'bg-[#52c99b]/15 text-[#064e3b] dark:text-[#6ee7b7]',
          badge: <Badge color="emerald" variant="pastel" size="xs">Volume</Badge>
        }
      ];
    } else {
      const propEnqCount = filteredRecords.filter((e) => (e.inquiryType || '').includes('Property')).length;
      const siteVisitCount = filteredRecords.filter((e) => (e.inquiryType || '').includes('Visit')).length;
      const devLeadCount = filteredRecords.filter((e) => (e.inquiryType || '').includes('Developer')).length;

      return [
        {
          title: 'Total Inquiries',
          value: filteredRecords.length,
          sub: 'Combined Leads',
          accent: 'border-t-[#bae6fd]',
          icon: MessageSquare,
          iconBg: 'bg-[#bae6fd]/25 text-[#075985] dark:text-[#7dd3fc]',
          badge: <Badge color="sky" variant="pastel" size="xs">Inquiries</Badge>
        },
        {
          title: 'Property Inquiries',
          value: propEnqCount,
          sub: 'Direct Buyers',
          accent: 'border-t-[#52c99b]',
          icon: Building2,
          iconBg: 'bg-[#52c99b]/15 text-[#064e3b] dark:text-[#6ee7b7]',
          badge: <Badge color="emerald" variant="pastel" size="xs">Direct</Badge>
        },
        {
          title: 'Scheduled Site Visits',
          value: siteVisitCount,
          sub: 'Physical Tours',
          accent: 'border-t-[#c4b5fd]',
          icon: Calendar,
          iconBg: 'bg-[#c4b5fd]/25 text-[#4c1d95] dark:text-[#ddd6fe]',
          badge: <Badge color="purple" variant="pastel" size="xs">Site Visits</Badge>
        },
        {
          title: 'Developer Leads',
          value: devLeadCount,
          sub: 'Project Inquiries',
          accent: 'border-t-[#fed7aa]',
          icon: Users,
          iconBg: 'bg-[#fed7aa]/30 text-[#9a3412] dark:text-[#fed7aa]',
          badge: <Badge color="peach" variant="pastel" size="xs">Developer</Badge>
        }
      ];
    }
  }, [reportType, filteredRecords]);

  // ── 09. File Downloader Export Engine ──────────────────────────────────────
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
          0: { cellWidth: 29 },
          1: { cellWidth: 49 },
          2: { cellWidth: 19 },
          3: { cellWidth: 18 },
          4: { cellWidth: 17 },
          5: { cellWidth: 25 },
          6: { halign: 'right', cellWidth: 27 },
          7: { halign: 'center', cellWidth: 18 },
          8: { halign: 'center', cellWidth: 18 },
          9: { cellWidth: 29 },
          10: { halign: 'right', cellWidth: 20 }
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
          0: { cellWidth: 22 },
          1: { cellWidth: 32 },
          2: { cellWidth: 48 },
          3: { cellWidth: 26 },
          4: { halign: 'center', cellWidth: 18 },
          5: { halign: 'center', cellWidth: 20 },
          6: { halign: 'center', cellWidth: 22 },
          7: { cellWidth: 33 },
          8: { halign: 'center', cellWidth: 18 },
          9: { halign: 'right', cellWidth: 30 }
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
          0: { cellWidth: 26 },
          1: { cellWidth: 32 },
          2: { cellWidth: 26 },
          3: { cellWidth: 32 },
          4: { cellWidth: 43 },
          5: { halign: 'right', cellWidth: 28 },
          6: { halign: 'center', cellWidth: 22 },
          7: { cellWidth: 20 },
          8: { cellWidth: 22 },
          9: { halign: 'right', cellWidth: 18 }
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
          0: { cellWidth: 24 },
          1: { cellWidth: 26 },
          2: { cellWidth: 32 },
          3: { cellWidth: 26 },
          4: { cellWidth: 44 },
          5: { cellWidth: 47 },
          6: { halign: 'center', cellWidth: 20 },
          7: { cellWidth: 26 },
          8: { halign: 'right', cellWidth: 24 }
        };
      }

      if (rows.length === 0) {
        rows.push(['No records found matching current date scope and filters', ...Array(headers.length - 1).fill('—')]);
      }

      let summaryMetrics = [];
      let pdfSummaryRow = null;
      const reportSubtitles = {
        properties: 'Property Portfolio & Inventory Report',
        users: 'User Accounts & Partner Directory',
        revenue: 'Financial Revenue & Escrow Ledger',
        leads: 'Client Inquiries & Site Visits Report'
      };

      if (reportType === 'properties') {
        const totalVal = filteredRecords.reduce((s, p) => s + (Number(p.price) || 0), 0);
        const liveCount = filteredRecords.filter((p) => (p.approvalStatus || '').toLowerCase() === 'approved').length;
        summaryMetrics = [
          { label: 'Total Properties', value: filteredRecords.length },
          { label: 'Live & Approved', value: liveCount },
          { label: 'Pending Review', value: filteredRecords.length - liveCount },
          { label: 'Total Valuation', value: formatRupeeForPDF(totalVal) }
        ];
        if (filteredRecords.length > 0) {
          pdfSummaryRow = ['Total Portfolio Valuation', '', '', '', '', '', formatRupeeForPDF(totalVal), '', '', '', ''];
        }
      } else if (reportType === 'users') {
        const verifiedCount = filteredRecords.filter((u) => u.isVerified).length;
        const builderCount = filteredRecords.filter((u) => (u.role || '').toLowerCase() === 'builder').length;
        summaryMetrics = [
          { label: 'Total Registered', value: filteredRecords.length },
          { label: 'Verified Accounts', value: verifiedCount },
          { label: 'Partner Builders', value: builderCount },
          { label: 'Standard Users', value: filteredRecords.length - builderCount }
        ];
      } else if (reportType === 'revenue') {
        const grossRev = filteredRecords.reduce((s, t) => s + (Number(t.amountNum) || Number(String(t.amount || '').replace(/[^0-9.-]+/g, '')) || 0), 0);
        const settledCount = filteredRecords.filter((t) => ['settled', 'completed', 'success', 'approved', 'released'].includes((t.status || '').toLowerCase())).length;
        summaryMetrics = [
          { label: 'Total Transactions', value: filteredRecords.length },
          { label: 'Settled Escrows', value: settledCount },
          { label: 'Pending Escrow', value: filteredRecords.length - settledCount },
          { label: 'Gross Volume', value: formatRupeeForPDF(grossRev) }
        ];
        if (filteredRecords.length > 0) {
          pdfSummaryRow = ['Total Gross Volume', '', '', '', '', formatRupeeForPDF(grossRev), '', '', '', ''];
        }
      } else {
        const propEnqCount = filteredRecords.filter((e) => (e.inquiryType || '').includes('Property')).length;
        const siteVisitCount = filteredRecords.filter((e) => (e.inquiryType || '').includes('Visit')).length;
        summaryMetrics = [
          { label: 'Total Inquiries', value: filteredRecords.length },
          { label: 'Property Inquiries', value: propEnqCount },
          { label: 'Scheduled Visits', value: siteVisitCount },
          { label: 'Developer Leads', value: filteredRecords.length - propEnqCount - siteVisitCount }
        ];
      }

      if (format === 'PDF') {
        exportToPDF({
          categoryTitle: safeCategoryName,
          reportSubtitle: reportSubtitles[reportType] || `${safeCategoryName} Report`,
          dateScope: scopeLabel,
          summaryMetrics,
          headers,
          rows,
          summaryRow: pdfSummaryRow,
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

      showToast(`${safeCategoryName} report exported successfully as ${format}!`, 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast(`Export failed: ${err.message || 'Unknown error'}`, 'error');
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
        return ['Transaction ID', 'Buyer', 'Seller / Beneficiary', 'Amount', 'Escrow Status', 'Date'];
      case 'leads':
        return ['Client Name', 'Phone', 'Target Listing / Project', 'Inquiry Type', 'Status', 'Received Date'];
      default:
        return ['Property Title', 'City', 'Category', 'Price (INR)', 'Status', 'Date Listed'];
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* ── 01. TOAST NOTIFICATION ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] animate-slide-down">
          {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={16} className="text-rose-500 shrink-0" />}
          {toast.type === 'info' && <Sparkles size={16} className="text-brand shrink-0" />}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 02. TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Reports & Data Export
            </h1>
            <Badge color="emerald" variant="pastel" size="xs" dot pulse>
              Live Engine • {lastSyncTime}
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Generate, audit, and export verified datasets across property listings, partner developers, revenue ledger, and buyer inquiries
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchStats();
            fetchCategoryData(reportType);
          }}
          disabled={isRefreshingStats || isLoadingData}
          className="h-8 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw size={13} className={isRefreshingStats || isLoadingData ? 'animate-spin text-brand' : ''} />
          <span>{isRefreshingStats || isLoadingData ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* ── 03. SLIDING PIPELINE SWITCH (Properties / Users / Revenue / Leads) ── */}
      <div className="flex items-center overflow-x-auto scrollbar-none py-1 border-b border-[var(--border)]">
        <div className="relative inline-flex items-center p-1 bg-[var(--bg-muted)]/80 rounded-full border border-[var(--border)] text-xs font-semibold select-none shadow-inner-xs">
          {/* Sliding Pill Indicator */}
          <span
            className={`absolute top-1 bottom-1 rounded-full shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${activeCategory.activeBg}`}
            style={{
              left: `${categoryIndicatorStyle.left}px`,
              width: `${categoryIndicatorStyle.width}px`,
              opacity: categoryIndicatorStyle.opacity
            }}
          />

          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = reportType === cat.id;

            return (
              <button
                key={cat.id}
                ref={(el) => { categoryTabRefs.current[cat.id] = el; }}
                type="button"
                onClick={() => {
                  setReportType(cat.id);
                  setSearchQuery('');
                }}
                className={`relative z-10 px-4 py-1.5 rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? `${cat.activeText} font-bold`
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
                }`}
              >
                <Icon size={13} className="shrink-0" />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
                    isActive
                      ? cat.activeCountBg
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 04. DYNAMIC 4-CARD KPI OVERVIEW FOR SELECTED CATEGORY ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {categoryMetrics.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`group bg-[var(--bg-surface)] border border-[var(--border)] border-t-2 ${card.accent} rounded-2xl p-4 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    {card.title}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                      {card.value}
                    </span>
                  </div>
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} group-hover:scale-110 transition-transform`}>
                  <Icon size={18} strokeWidth={2.2} />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">{card.sub}</span>
                {card.badge}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 05. ACTION & EXPORT TOOLBAR (DATE RANGE + DIRECT EXPORT PILLS) ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-3.5 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Date Scope Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
            <Calendar size={13} className="text-brand" />
            <span>Scope:</span>
          </div>

          {/* Quick Preset Segmented Control */}
          <div className="flex items-center gap-0.5 bg-[var(--bg-muted)]/80 p-0.5 rounded-full border border-[var(--border)]">
            {[
              { id: 'all', label: 'All Time' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: 'ytd', label: 'YTD' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleDatePreset(p.id)}
                className={`h-6.5 px-3 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  activeDatePreset === p.id
                    ? 'bg-[var(--bg-surface)] text-brand shadow-xs font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="h-7.5 px-2.5 bg-[var(--bg-muted)]/80 text-[11px] font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand cursor-pointer"
            />
            <span className="text-[11px] text-[var(--text-muted)] font-medium">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="h-7.5 px-2.5 bg-[var(--bg-muted)]/80 text-[11px] font-medium text-[var(--text-primary)] rounded-lg border border-[var(--border)] focus:outline-none focus:border-brand cursor-pointer"
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

        {/* Direct Download Buttons (Pastel Badge Token Styled) */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          {/* Export Excel (.xlsx) */}
          <button
            type="button"
            onClick={() => handleExecuteExport('Excel')}
            disabled={!!downloadingFormat || isLoadingData}
            className="h-8 px-3.5 rounded-full bg-[#52c99b] hover:bg-[#52c99b]/80 text-[#064e3b] text-xs font-bold flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
            title="Download Excel Sheet (.xlsx)"
          >
            {downloadingFormat === 'Excel' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={13} />
            )}
            <span>Export Excel</span>
          </button>

          {/* Export CSV (.csv) */}
          <button
            type="button"
            onClick={() => handleExecuteExport('CSV')}
            disabled={!!downloadingFormat || isLoadingData}
            className="h-8 px-3.5 rounded-full bg-[#bae6fd] hover:bg-[#bae6fd]/80 text-[#075985] text-xs font-bold flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
            title="Download CSV file (.csv)"
          >
            {downloadingFormat === 'CSV' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileCode size={13} />
            )}
            <span>Export CSV</span>
          </button>

          {/* Export PDF (.pdf) */}
          <button
            type="button"
            onClick={() => handleExecuteExport('PDF')}
            disabled={!!downloadingFormat || isLoadingData}
            className="h-8 px-3.5 rounded-full bg-[#ffc5bb] hover:bg-[#ffc5bb]/80 text-[#992211] text-xs font-bold flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
            title="Download Printable PDF Report (.pdf)"
          >
            {downloadingFormat === 'PDF' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileText size={13} />
            )}
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ── 06. LIVE RECORD PREVIEW TABLE ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
        {/* Table Toolbar */}
        <div className="p-3 px-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-[var(--text-primary)] capitalize">
              {reportType} Data Preview
            </h2>
            <Badge color="slate" variant="pastel" size="xs">
              {filteredRecords.length} Records
            </Badge>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${reportType}...`}
              className="w-full h-8 pl-8 pr-7 text-[11px] bg-[var(--bg-muted)]/60 border border-[var(--border)] rounded-full text-[var(--text-primary)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Fluid Responsive Table */}
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed min-w-[850px]">
            <colgroup>
              {reportType === 'properties' ? (
                <>
                  <col className="w-[30%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                </>
              ) : reportType === 'users' ? (
                <>
                  <col className="w-[22%]" />
                  <col className="w-[26%]" />
                  <col className="w-[16%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                </>
              ) : reportType === 'revenue' ? (
                <>
                  <col className="w-[16%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                </>
              ) : (
                <>
                  <col className="w-[18%]" />
                  <col className="w-[16%]" />
                  <col className="w-[26%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                </>
              )}
            </colgroup>
            <thead className="bg-[var(--bg-muted)]/40 text-[var(--text-muted)] uppercase text-[9.5px] font-semibold tracking-wider border-b border-[var(--border)] select-none">
              <tr>
                {getTableHeaders().map((header, i) => (
                  <th
                    key={i}
                    className={`py-2 px-3 align-middle ${
                      (i === 3 && reportType === 'properties') || (i === 3 && reportType === 'revenue') ? 'text-right' : i === 4 ? 'text-center' : i === 5 ? 'text-right' : ''
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/60 text-xs">
              {isLoadingData ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <AdminLoader
                      text={`Loading ${reportType} reports dataset...`}
                      subtext="Reconciling schemas, metrics, and timestamps"
                      minHeight="min-h-[160px]"
                    />
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[var(--text-muted)]">
                    {searchQuery ? `No records found matching "${searchQuery}".` : 'No records found for current filters and scope.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.slice(0, 100).map((row, idx) => {
                  let col1, col2, col3, col4, col5, col6;

                  if (reportType === 'properties') {
                    col1 = (
                      <div className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-brand transition-colors truncate" title={row.title || row.propertyName}>
                        {row.title || row.propertyName || 'Untitled Property'}
                      </div>
                    );
                    col2 = <span className="text-[var(--text-muted)] truncate block">{capitalize(row.city || 'Gurugram')}</span>;
                    col3 = <Badge.Category type={row.category || row.propertyType || 'Residential'} size="xs" />;
                    col4 = <span className="font-bold text-[var(--text-primary)] text-xs">{formatRupeeForUI(row.price)}</span>;
                    col5 = (
                      <div className="flex justify-center">
                        {String(row.approvalStatus || '').toLowerCase() === 'approved' ? (
                          <Badge.Approved size="xs">Live</Badge.Approved>
                        ) : String(row.approvalStatus || '').toLowerCase() === 'rejected' ? (
                          <Badge.Rejected size="xs">Rejected</Badge.Rejected>
                        ) : (
                          <Badge.Pending size="xs" pulse>Needs Audit</Badge.Pending>
                        )}
                      </div>
                    );
                    col6 = <span className="text-[10.5px] text-[var(--text-muted)] whitespace-nowrap block">{formatDateDisplay(row.createdAt)}</span>;
                  } else if (reportType === 'users') {
                    col1 = <span className="font-semibold text-xs text-[var(--text-primary)] truncate block">{row.name || 'Anonymous User'}</span>;
                    col2 = <span className="text-[var(--text-muted)] font-mono text-[10.5px] truncate block">{row.email || '—'}</span>;
                    col3 = <span className="text-[var(--text-muted)] font-mono text-[10.5px] truncate block">{row.phone || '—'}</span>;
                    col4 = (
                      <Badge color={(row.role || '').toLowerCase() === 'builder' ? 'purple' : (row.role || '').toLowerCase() === 'agent' ? 'sky' : 'slate'} variant="pastel" size="xs">
                        {capitalize(row.role || 'user')}
                      </Badge>
                    );
                    col5 = (
                      <div className="flex justify-center">
                        {String(row.status || '').toLowerCase() === 'active' ? (
                          <Badge.Active size="xs">Active</Badge.Active>
                        ) : (
                          <Badge.Offline size="xs">Suspended</Badge.Offline>
                        )}
                      </div>
                    );
                    col6 = <span className="text-[10.5px] text-[var(--text-muted)] whitespace-nowrap block">{formatDateDisplay(row.createdAt)}</span>;
                  } else if (reportType === 'revenue') {
                    const tokenCode = row.id || row.tokenRequestId || (row._id ? `#TKN-${row._id.slice(-6).toUpperCase()}` : '—');
                    col1 = <span className="font-mono text-xs font-semibold text-[var(--text-primary)] leading-tight block">{tokenCode}</span>;
                    col2 = <span className="font-semibold text-xs text-[var(--text-primary)] truncate block">{row.buyer || 'Verified Client'}</span>;
                    col3 = <span className="text-[var(--text-muted)] text-xs truncate block">{row.seller || 'Property Owner'}</span>;
                    col4 = <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">{formatRupeeForUI(row.amountNum || row.amount)}</span>;
                    col5 = (
                      <div className="flex justify-center">
                        {['settled', 'released', 'approved'].includes((row.status || row.escrowStatus || '').toLowerCase()) ? (
                          <Badge.Active size="xs">Settled</Badge.Active>
                        ) : ['refunded'].includes((row.status || row.escrowStatus || '').toLowerCase()) ? (
                          <Badge.Offline size="xs">Refunded</Badge.Offline>
                        ) : (
                          <Badge.Pending size="xs" pulse>Escrow Held</Badge.Pending>
                        )}
                      </div>
                    );
                    col6 = <span className="text-[10.5px] text-[var(--text-muted)] whitespace-nowrap block">{row.date || formatDateDisplay(row.createdAt)}</span>;
                  } else {
                    col1 = <span className="font-semibold text-xs text-[var(--text-primary)] truncate block">{row.clientName || 'Inquirer'}</span>;
                    col2 = <span className="text-[var(--text-muted)] font-mono text-[10.5px] truncate block">{row.clientPhone || '—'}</span>;
                    col3 = <span className="text-[var(--text-primary)] text-xs truncate block" title={row.propertyTitle}>{row.propertyTitle || 'Listing Consultation'}</span>;
                    col4 = (
                      <Badge color={(row.inquiryType || '').includes('Visit') ? 'purple' : (row.inquiryType || '').includes('Developer') ? 'peach' : 'sky'} variant="pastel" size="xs">
                        {row.inquiryType || 'General Lead'}
                      </Badge>
                    );
                    col5 = (
                      <div className="flex justify-center">
                        {['completed', 'resolved', 'contacted'].includes((row.status || '').toLowerCase()) ? (
                          <Badge.Active size="xs">Contacted</Badge.Active>
                        ) : (
                          <Badge.Pending size="xs" pulse>Pending</Badge.Pending>
                        )}
                      </div>
                    );
                    col6 = <span className="text-[10.5px] text-[var(--text-muted)] whitespace-nowrap block">{formatDateDisplay(row.createdAt)}</span>;
                  }

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-[var(--bg-muted)]/35 transition-colors group"
                    >
                      <td className="py-1.5 px-3 align-middle overflow-hidden">
                        {col1}
                      </td>
                      <td className="py-1.5 px-3 align-middle overflow-hidden">
                        {col2}
                      </td>
                      <td className="py-1.5 px-3 align-middle overflow-hidden">
                        {col3}
                      </td>
                      <td className={`py-1.5 px-3 align-middle overflow-hidden ${(reportType === 'properties' || reportType === 'revenue') ? 'text-right' : ''}`}>
                        {col4}
                      </td>
                      <td className="py-1.5 px-3 align-middle text-center whitespace-nowrap overflow-hidden">
                        {col5}
                      </td>
                      <td className="py-1.5 px-3 align-middle text-right whitespace-nowrap overflow-hidden">
                        {col6}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Minimal Clean Footer */}
        <div className="p-2 px-3 border-t border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between text-[10.5px] text-[var(--text-muted)]">
          <span>Live preview sample (up to 100 entries) • Complete dataset compiled upon export</span>
          <div className="flex items-center gap-2">
            <span>Scope:</span>
            <Badge color="slate" variant="pastel" size="xs">
              {startDate && endDate ? `${startDate} to ${endDate}` : activeDatePreset.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsScreen;
