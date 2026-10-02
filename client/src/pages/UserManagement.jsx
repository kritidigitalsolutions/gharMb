import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Lock,
  Unlock,
  Eye,
  Edit3,
  X,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Clock,
  Building2,
  Building,
  MapPin,
  Award,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  UserMinus,
  Sparkles,
  Home,
  CheckCheck
} from 'lucide-react';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const API_BASE = RAW_API_URL.replace(/\/+api\/?$/i, '').replace(/\/+$/, '');
const API_URL = `${API_BASE}/api`;

const UserManagement = () => {
  // Core Directory State
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Inspector Drawer State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDrawerTab, setUserDrawerTab] = useState('Overview');
  const [realProperties, setRealProperties] = useState([]);
  const [realEnquiries, setRealEnquiries] = useState({
    sent: { property: [], developer: [] },
    received: { property: [], developer: [] }
  });
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);

  // Search & Filter Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All'); // 'All' | 'Buyer' | 'Seller' | 'Agent' | 'Builder'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Blocked' | 'Unverified'

  // Sorting & Pagination
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals (Rendered strictly when requested)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('Document verification incomplete or mismatch');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Non-blocking Toast Feedback (Replaces browser alert/confirm)
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // Add User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Buyer',
    status: 'Active',
    isVerified: false
  });

  // Edit User Form State
  const [editUserData, setEditUserData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: 'Buyer',
    status: 'Active',
    isVerified: false,
    reraNumber: '',
    companyName: '',
    gstNumber: '',
    agentVerificationStatus: 'unverified',
    builderVerificationStatus: 'unverified'
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const copyToClipboard = (text, label) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard?.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  const mapApiToUiRole = (apiRole) => {
    switch (apiRole) {
      case 'buyer': return 'Buyer';
      case 'owner': return 'Seller';
      case 'agent': return 'Agent';
      case 'builder': return 'Builder';
      case 'tenant': return 'Tenant';
      default: return apiRole || 'Buyer';
    }
  };

  const mapUiToApiRole = (uiRole) => {
    switch (uiRole) {
      case 'Buyer': return 'buyer';
      case 'Seller': return 'owner';
      case 'Agent': return 'agent';
      case 'Builder': return 'builder';
      case 'Tenant': return 'tenant';
      default: return uiRole ? uiRole.toLowerCase() : 'buyer';
    }
  };

  // --- Fetch Users (always from real API) ---
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        const mappedUsers = (data.data.users || []).map(u => ({
          ...u,
          id: u._id,
          role: mapApiToUiRole(u.role),
          status: u.status || 'Active',
          date: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
        }));
        setUsers(mappedUsers);
      } else {
        setError(data.message || 'Failed to fetch users.');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Could not connect to backend. Please ensure the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
    showToast('User directory refreshed successfully.', 'info');
  };

  // Fetch Drawer properties & enquiries when drawer opens (always real API)
  useEffect(() => {
    if (!selectedUser) return;

    const fetchDrawerData = async () => {
      setIsDrawerLoading(true);
      try {
        if (userDrawerTab === 'Listings') {
          const response = await fetch(`${API_URL}/admin/properties?owner=${selectedUser.id}`, {
            headers: getAuthHeaders()
          });
          const data = await response.json();
          if (response.ok && data.status === 'success') {
            setRealProperties(data.data.properties || []);
          } else {
            setRealProperties([]);
          }
        } else if (userDrawerTab === 'Enquiries') {
          const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}/enquiries`, {
            headers: getAuthHeaders()
          });
          const data = await response.json();
          if (response.ok && data.status === 'success') {
            setRealEnquiries(data.data || { sent: { property: [], developer: [] }, received: { property: [], developer: [] } });
          } else {
            setRealEnquiries({ sent: { property: [], developer: [] }, received: { property: [], developer: [] } });
          }
        }
      } catch (err) {
        console.error('Error fetching drawer details:', err);
      } finally {
        setIsDrawerLoading(false);
      }
    };

    fetchDrawerData();
  }, [selectedUser, userDrawerTab]);

  // Verification Helper
  const getVerificationState = (u) => {
    if (u.role === 'Agent') {
      const status = u.agentVerificationStatus || (u.isVerified ? 'approved' : 'unverified');
      return {
        isApproved: status === 'approved',
        isPending: status === 'pending',
        isRejected: status === 'rejected',
        label: status === 'approved' ? 'Verified Agent' : status === 'pending' ? 'Pending Review' : status === 'rejected' ? 'Rejected' : 'Unverified',
        status
      };
    }
    if (u.role === 'Builder') {
      const status = u.builderVerificationStatus || (u.isVerified ? 'approved' : 'unverified');
      return {
        isApproved: status === 'approved',
        isPending: status === 'pending',
        isRejected: status === 'rejected',
        label: status === 'approved' ? 'Verified Builder' : status === 'pending' ? 'Pending Review' : status === 'rejected' ? 'Rejected' : 'Unverified',
        status
      };
    }
    return {
      isApproved: !!u.isVerified,
      isPending: false,
      isRejected: false,
      label: u.isVerified ? 'Verified Profile' : 'Unverified',
      status: u.isVerified ? 'approved' : 'unverified'
    };
  };

  // --- Handlers: Verification Actions (always real API) ---
  const handleVerifyAgent = async (userId, targetStatus, explicitReason = '') => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/verify-agent`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          agentVerificationStatus: targetStatus,
          agentRejectionReason: explicitReason
        })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        showToast(`Agent status updated to ${targetStatus}!`, targetStatus === 'approved' ? 'success' : 'info');
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(prev => ({
            ...prev,
            isVerified: targetStatus === 'approved',
            agentVerificationStatus: targetStatus,
            agentRejectionReason: targetStatus === 'rejected' ? explicitReason : undefined
          }));
        }
        await fetchUsers();
      } else {
        showToast(data.message || 'Failed to update agent verification.', 'error');
      }
    } catch (err) {
      console.error('Error verifying agent:', err);
      showToast('Network connection error.', 'error');
    }
  };

  const handleVerifyDeveloper = async (userId, targetStatus, explicitReason = '') => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/verify-developer`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          builderVerificationStatus: targetStatus,
          builderRejectionReason: explicitReason
        })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        showToast(`Developer status updated to ${targetStatus}!`, targetStatus === 'approved' ? 'success' : 'info');
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(prev => ({
            ...prev,
            isVerified: targetStatus === 'approved',
            builderVerificationStatus: targetStatus,
            builderRejectionReason: targetStatus === 'rejected' ? explicitReason : undefined
          }));
        }
        await fetchUsers();
      } else {
        showToast(data.message || 'Failed to update developer verification.', 'error');
      }
    } catch (err) {
      console.error('Error verifying developer:', err);
      showToast('Network connection error.', 'error');
    }
  };

  // Toggle KYC status cleanly (always real API)
  const toggleKycVerification = async (u) => {
    if (u.role === 'Agent') {
      const isApproved = u.agentVerificationStatus === 'approved' || (u.isVerified && u.agentVerificationStatus !== 'rejected');
      const newStatus = isApproved ? 'unverified' : 'approved';
      await handleVerifyAgent(u.id, newStatus);
    } else if (u.role === 'Builder') {
      const isApproved = u.builderVerificationStatus === 'approved' || (u.isVerified && u.builderVerificationStatus !== 'rejected');
      const newStatus = isApproved ? 'unverified' : 'approved';
      await handleVerifyDeveloper(u.id, newStatus);
    } else {
      const newVerified = !u.isVerified;
      try {
        const response = await fetch(`${API_URL}/admin/users/${u.id}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ isVerified: newVerified })
        });
        if (response.ok) {
          showToast(`KYC status updated to ${newVerified ? 'Verified' : 'Unverified'}!`);
          if (selectedUser && selectedUser.id === u.id) {
            setSelectedUser(prev => ({ ...prev, isVerified: newVerified }));
          }
          await fetchUsers();
        }
      } catch (err) {
        console.error('Error toggling KYC verification:', err);
        showToast('Failed to update verification status.', 'error');
      }
    }
  };

  // Toggle Single User Status (Active <-> Blocked) - always real API
  const toggleUserStatus = async (id) => {
    const userToToggle = users.find(u => u.id === id);
    if (!userToToggle) return;
    const newStatus = userToToggle.status === 'Active' ? 'Blocked' : 'Active';
    try {
      const response = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        showToast(`Account status updated to ${newStatus}`);
        if (selectedUser && selectedUser.id === id) {
          setSelectedUser({ ...selectedUser, status: newStatus });
        }
        await fetchUsers();
      } else {
        showToast(data.message || 'Failed to toggle account status.', 'error');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      showToast('Network connection error.', 'error');
    }
  };

  // Sorting Handler
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    const nextOrder = isAsc ? 'desc' : 'asc';
    setSortOrder(nextOrder);
    setSortField(field);

    const sortedUsers = [...users].sort((a, b) => {
      const aVal = a[field] ?? '';
      const bVal = b[field] ?? '';
      if (typeof aVal === 'string') {
        return nextOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return nextOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });
    setUsers(sortedUsers);
  };

  // Add User Handler (always real API)
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.name?.trim() || !newUser.phone?.trim()) {
      showToast('Please complete Name and Phone fields.', 'error');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: mapUiToApiRole(newUser.role),
          status: newUser.status,
          isVerified: newUser.isVerified
        })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setIsAddUserModalOpen(false);
        showToast(`User profile created successfully!`, 'success');
        setNewUser({ name: '', email: '', phone: '', role: 'Buyer', status: 'Active', isVerified: false });
        await fetchUsers();
      } else {
        showToast(data.message || 'Failed to create user profile.', 'error');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      showToast('Network connection error.', 'error');
    }
  };

  // Edit User Handler
  const openEditUserModal = (user) => {
    const isApproved = user.isVerified || user.agentVerificationStatus === 'approved' || user.builderVerificationStatus === 'approved';
    setEditUserData({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'Buyer',
      status: user.status || 'Active',
      isVerified: isApproved,
      reraNumber: user.reraNumber || '',
      companyName: user.companyName || '',
      gstNumber: user.gstNumber || '',
      agentVerificationStatus: user.agentVerificationStatus || (isApproved ? 'approved' : 'unverified'),
      builderVerificationStatus: user.builderVerificationStatus || (isApproved ? 'approved' : 'unverified')
    });
    setIsEditUserModalOpen(true);
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editUserData.name?.trim()) {
      showToast('Please fill in the Name field.', 'error');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/admin/users/${editUserData.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editUserData.name,
          email: editUserData.email,
          phone: editUserData.phone,
          role: mapUiToApiRole(editUserData.role),
          status: editUserData.status,
          isVerified: editUserData.isVerified,
          reraNumber: editUserData.reraNumber,
          companyName: editUserData.companyName,
          gstNumber: editUserData.gstNumber,
          agentVerificationStatus: editUserData.role === 'Agent' ? editUserData.agentVerificationStatus : undefined,
          builderVerificationStatus: editUserData.role === 'Builder' ? editUserData.builderVerificationStatus : undefined
        })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setIsEditUserModalOpen(false);
        showToast('User details updated successfully!', 'success');
        if (selectedUser && selectedUser.id === editUserData.id) {
          setSelectedUser(prev => ({ ...prev, ...editUserData }));
        }
        await fetchUsers();
      } else {
        showToast(data.message || 'Failed to update user.', 'error');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      showToast('Network connection error.', 'error');
    }
  };

  // Delete User - always real API
  const confirmDeleteExecution = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        if (selectedUser?.id === userToDelete.id) setSelectedUser(null);
        showToast(`User profile deleted permanently.`, 'success');
        await fetchUsers();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to delete user.', 'error');
      }
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast('Network connection error.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Rejection Submission
  const confirmRejectionSubmit = async () => {
    if (!rejectingUser) return;
    setIsSubmittingReject(true);
    try {
      if (rejectingUser.role === 'Agent') {
        await handleVerifyAgent(rejectingUser.id, 'rejected', rejectReason);
      } else {
        await handleVerifyDeveloper(rejectingUser.id, 'rejected', rejectReason);
      }
      setShowRejectModal(false);
      setRejectingUser(null);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const id = (u.id || u._id || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || email.includes(query) || id.includes(query) || phone.includes(query);
      const matchesRole = selectedRole === 'All' || u.role === selectedRole;
      
      let matchesStatus = true;
      if (statusFilter === 'Active') matchesStatus = u.status === 'Active';
      else if (statusFilter === 'Blocked') matchesStatus = u.status === 'Blocked';
      else if (statusFilter === 'Unverified') {
        const v = getVerificationState(u);
        matchesStatus = !v.isApproved;
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, selectedRole, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Statistics
  const activeCount = useMemo(() => users.filter(u => u.status === 'Active').length, [users]);
  const verifiedCount = useMemo(() => users.filter(u => u.isVerified || u.agentVerificationStatus === 'approved' || u.builderVerificationStatus === 'approved').length, [users]);
  const suspendedCount = useMemo(() => users.filter(u => u.status === 'Blocked').length, [users]);

  const roleCounts = useMemo(() => ({
    All: users.length,
    Buyer: users.filter(u => u.role === 'Buyer').length,
    Seller: users.filter(u => u.role === 'Seller').length,
    Agent: users.filter(u => u.role === 'Agent').length,
    Builder: users.filter(u => u.role === 'Builder').length,
  }), [users]);

  return (
    <div className="space-y-3.5 pb-8 relative text-[var(--text-primary)]">

      {/* ─── 01. UNIFIED TOP CONTROL STRIP (Editorial, Clean, Minimal) ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        
        {/* Left: Section Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <h1 className="text-xs sm:text-[13px] font-bold tracking-tight text-[var(--text-primary)]">
              User Directory & Accounts
            </h1>
          </div>

          <span className="text-[var(--border)] hidden sm:inline">|</span>

          {/* Directory Count Tag */}
          <span className="text-[11px] font-medium text-[var(--text-muted)] hidden sm:inline">
            {users.length} registered profiles
          </span>
        </div>

        {/* Right: Quick Status Filter Pills & Actions */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto justify-end text-[11px]">
          
          <button
            type="button"
            onClick={() => { setStatusFilter('All'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 border cursor-pointer ${
              statusFilter === 'All'
                ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] border-[var(--text-primary)] font-semibold shadow-2xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <span>All ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('Active'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 border cursor-pointer ${
              statusFilter === 'Active'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold shadow-2xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Active</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 font-bold">
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('Unverified'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 border cursor-pointer ${
              statusFilter === 'Unverified'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold shadow-2xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Unverified</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 font-bold">
              {users.length - verifiedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('Blocked'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 border cursor-pointer ${
              statusFilter === 'Blocked'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold shadow-2xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Suspended</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/15 font-bold">
              {suspendedCount}
            </span>
          </button>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-[var(--border)] transition-colors cursor-pointer ml-1"
            title="Refresh database records"
          >
            <RefreshCw size={12} className={isLoading || isRefreshing ? 'animate-spin text-brand' : ''} />
          </button>

          {/* Add User Primary Action */}
          <button
            type="button"
            onClick={() => setIsAddUserModalOpen(true)}
            className="py-1 px-3 bg-brand hover:bg-brand-dark text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98 ml-1"
          >
            <Plus size={13} />
            <span>Add User</span>
          </button>

        </div>
      </div>

      {/* ─── 02. CLEAN, ALIGNED 4-METRIC ROW ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Metric 1: Total Users */}
        <div className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
              Total Users
            </span>
            <div className="flex items-baseline gap-1.5">
              <h4 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {users.length}
              </h4>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">accounts</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-brand flex items-center justify-center shrink-0 border border-orange-500/15">
            <Users size={17} />
          </div>
        </div>

        {/* Metric 2: Active Accounts */}
        <div className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
              Active Accounts
            </span>
            <div className="flex items-baseline gap-1.5">
              <h4 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {activeCount}
              </h4>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {users.length > 0 ? `${Math.round((activeCount / users.length) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/15">
            <UserCheck size={17} />
          </div>
        </div>

        {/* Metric 3: Verified Profiles */}
        <div className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
              Verified Profiles
            </span>
            <div className="flex items-baseline gap-1.5">
              <h4 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {verifiedCount}
              </h4>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                KYC passed
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/15">
            <ShieldCheck size={17} />
          </div>
        </div>

        {/* Metric 4: Suspended Accounts */}
        <div className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
              Suspended
            </span>
            <div className="flex items-baseline gap-1.5">
              <h4 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {suspendedCount}
              </h4>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                restricted
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/15">
            <UserX size={17} />
          </div>
        </div>

      </div>

      {/* ─── 03. MAIN DIRECTORY WORKBENCH CONTAINER ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xs overflow-hidden flex flex-col">
        
        {/* Controls Header: Search & Role Tabs */}
        <div className="p-3 border-b border-[var(--border)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[var(--bg-surface)]">
          
          {/* Search bar */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute top-1/2 -translate-y-1/2 left-3 text-[var(--text-muted)]" size={13} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search user by name, email, or phone..."
              className="w-full pl-8.5 pr-8 py-1.5 border border-[var(--border)] bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Role Segmented Pills */}
          <div className="inline-flex items-center gap-1 bg-[var(--bg-muted)]/70 p-0.5 rounded-lg border border-[var(--border)] text-[11px] self-start md:self-auto overflow-x-auto max-w-full">
            {['All', 'Buyer', 'Seller', 'Agent', 'Builder'].map((role) => {
              const count = roleCounts[role] || 0;
              const isActive = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{role}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    isActive ? 'bg-brand/10 text-brand' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Directory Content Area */}
        {isLoading ? (
          <div className="py-24 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-2.5">
            <RefreshCw size={20} className="animate-spin text-brand" />
            <span className="font-semibold">Loading user directory...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center space-y-3 px-4">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] mx-auto">
              <UserMinus size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[var(--text-primary)]">No matching user records</h4>
              <p className="text-[11px] text-[var(--text-muted)]">No users found matching your active filter criteria.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('All');
                setStatusFilter('All');
              }}
              className="px-3 py-1 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-brand border border-brand/30 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table: Clean, Minimal, Strictly Aligned (No multi-select checkboxes) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[var(--bg-muted)]/40 border-b border-[var(--border)] text-[var(--text-muted)] text-[9.5px] font-semibold uppercase tracking-wider select-none">
                    <th className="py-2 px-3.5 cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => handleSort('name')}>
                      User Profile
                    </th>
                    <th className="py-2 px-3.5 cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => handleSort('email')}>
                      Email
                    </th>
                    <th className="py-2 px-3.5 cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => handleSort('phone')}>
                      Phone No.
                    </th>
                    <th className="py-2 px-3.5 cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => handleSort('role')}>
                      Role
                    </th>
                    <th className="py-2 px-3.5">
                      KYC Status
                    </th>
                    <th className="py-2 px-3.5 text-center cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => handleSort('listings')}>
                      Listings
                    </th>
                    <th className="py-2 px-3.5">
                      Status
                    </th>
                    <th className="py-2 px-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/70 text-xs">
                  {paginatedUsers.map((u) => {
                    const vState = getVerificationState(u);

                    return (
                      <tr 
                        key={u.id} 
                        className="transition-colors duration-150 align-middle hover:bg-[var(--bg-muted)]/30"
                      >
                        {/* User Profile (Avatar + Name) */}
                        <td className="py-1.5 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6.5 h-6.5 rounded-full bg-brand/10 text-brand font-bold text-[10.5px] flex items-center justify-center shrink-0 border border-brand/20">
                              {(u.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-[var(--text-primary)] truncate block leading-tight">
                                {u.name}
                              </span>
                              {u.companyName && (
                                <span className="text-[9.5px] text-[var(--text-muted)] font-normal truncate block leading-tight">
                                  {u.companyName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email Column */}
                        <td className="py-1.5 px-3.5">
                          <div className="flex items-center gap-1.5 text-[var(--text-primary)] text-xs">
                            <Mail size={11} className="text-[var(--text-muted)] shrink-0" />
                            <span 
                              onClick={() => copyToClipboard(u.email, 'Email')}
                              className="truncate max-w-[200px] hover:text-brand cursor-pointer transition-colors"
                              title="Click to copy email"
                            >
                              {u.email}
                            </span>
                          </div>
                        </td>

                        {/* Phone Number Column */}
                        <td className="py-1.5 px-3.5">
                          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-mono text-[11px]">
                            <Phone size={10.5} className="text-[var(--text-muted)] shrink-0" />
                            <span 
                              onClick={() => copyToClipboard(u.phone, 'Phone')}
                              className="hover:text-brand cursor-pointer transition-colors whitespace-nowrap"
                              title="Click to copy phone"
                            >
                              {u.phone}
                            </span>
                          </div>
                        </td>

                        {/* Role Pill */}
                        <td className="py-1.5 px-3.5">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9.5px] font-semibold uppercase tracking-wide border ${
                            u.role === 'Builder' ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' :
                            u.role === 'Agent' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' :
                            u.role === 'Seller' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 
                            'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        {/* KYC / Verification Status & Toggle */}
                        <td className="py-1.5 px-3.5">
                          <div className="flex items-center gap-2">
                            {vState.isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                <ShieldCheck size={10.5} />
                                <span>Verified</span>
                              </span>
                            ) : vState.isPending ? (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded animate-pulse">
                                <Clock size={10.5} />
                                <span>Pending</span>
                              </span>
                            ) : vState.isRejected ? (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                                <XCircle size={10.5} />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-[var(--text-muted)] bg-[var(--bg-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                                <ShieldAlert size={10.5} />
                                <span>Unverified</span>
                              </span>
                            )}

                            {/* Minimal Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => toggleKycVerification(u)}
                              className={`relative inline-flex h-3.5 w-6 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                vState.isApproved ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                              title={vState.isApproved ? 'Click to mark unverified' : 'Click to verify profile'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  vState.isApproved ? 'translate-x-2.5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </td>

                        {/* Listings */}
                        <td className="py-1.5 px-3.5 text-center font-semibold text-[var(--text-primary)]">
                          {u.listings ? (
                            <span className="px-1.5 py-0.5 bg-[var(--bg-muted)] rounded text-[10.5px]">
                              {u.listings}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)] text-[11px]">—</span>
                          )}
                        </td>

                        {/* Status (Active / Suspended) */}
                        <td className="py-1.5 px-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-semibold ${
                            u.status === 'Active' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{u.status}</span>
                          </span>
                        </td>

                        {/* Actions Group (Aligned & Minimal) */}
                        <td className="py-1.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setUserDrawerTab(u.role === 'Agent' || u.role === 'Builder' ? 'Documents' : 'Overview');
                              }}
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-md transition-colors cursor-pointer"
                              title="Inspect profile"
                            >
                              <Eye size={12.5} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditUserModal(u)}
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-md transition-colors cursor-pointer"
                              title="Edit user details"
                            >
                              <Edit3 size={12.5} />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleUserStatus(u.id)}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                u.status === 'Active'
                                  ? 'text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10'
                                  : 'text-emerald-600 hover:bg-emerald-500/10'
                              }`}
                              title={u.status === 'Active' ? 'Suspend account' : 'Activate account'}
                            >
                              {u.status === 'Active' ? <Lock size={12.5} /> : <Unlock size={12.5} />}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setUserToDelete(u);
                                setShowDeleteModal(true);
                              }}
                              className="p-1 text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 size={12.5} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards */}
            <div className="block md:hidden divide-y divide-[var(--border)]/70">
              {paginatedUsers.map((u) => {
                const vState = getVerificationState(u);
                return (
                  <div key={u.id} className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-brand/10 text-brand font-bold text-xs flex items-center justify-center shrink-0 border border-brand/20">
                          {(u.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-xs text-[var(--text-primary)] truncate">{u.name}</h4>
                          {u.companyName && (
                            <span className="text-[10px] text-[var(--text-muted)] truncate block">{u.companyName}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${
                        u.role === 'Builder' ? 'bg-purple-500/10 text-purple-700 border-purple-500/20' :
                        u.role === 'Agent' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20' :
                        u.role === 'Seller' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 
                        'bg-slate-500/10 text-slate-700 border-slate-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-[var(--text-muted)] pt-1">
                      <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
                        <Mail size={11} className="text-[var(--text-muted)] shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                          <Phone size={10} className="text-[var(--text-muted)] shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                        <span className="font-semibold text-[var(--text-primary)]">{u.listings || 0} listings</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/50">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-[10px] font-semibold text-[var(--text-secondary)]">{u.status}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => { setSelectedUser(u); setUserDrawerTab('Overview'); }}
                          className="px-2 py-1 bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-md text-[11px] font-semibold"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditUserModal(u)}
                          className="px-2 py-1 bg-brand text-white rounded-md text-[11px] font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Directory Footer & Pagination */}
        {filteredUsers.length > 0 && (
          <div className="p-3 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-3 bg-[var(--bg-surface)] text-xs">
            <span className="text-[var(--text-muted)] font-medium text-[11px]">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} profiles
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-[var(--border)] rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] disabled:opacity-40 cursor-pointer transition-colors"
                title="Previous page"
              >
                <ChevronLeft size={13} />
              </button>

              <span className="px-2.5 py-1 bg-[var(--bg-muted)]/60 border border-[var(--border)] rounded-lg text-[11px] font-semibold text-[var(--text-primary)]">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-[var(--border)] rounded-lg hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] disabled:opacity-40 cursor-pointer transition-colors"
                title="Next page"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ─── 04. DETAILED USER PROFILE INSPECTOR MODAL ─── */}
      {selectedUser && (() => {
        const vState = getVerificationState(selectedUser);
        const isAgentOrBuilder = selectedUser.role === 'Agent' || selectedUser.role === 'Builder';
        const drawerTabs = isAgentOrBuilder 
          ? ['Overview', 'Documents', 'Listings', 'Enquiries']
          : ['Overview', 'Listings', 'Enquiries'];

        return (
          <div 
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedUser(null); }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          >
            <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl max-w-lg w-full shadow-2xl border border-[var(--border)] p-5 space-y-4 relative max-h-[90vh] overflow-y-auto">
              
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                title="Close"
              >
                <X size={15} />
              </button>

              {/* Profile Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand font-bold text-base flex items-center justify-center shrink-0 border border-brand/20">
                  {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">{selectedUser.name}</h3>
                    <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded uppercase bg-brand/10 text-brand">
                      {selectedUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">{selectedUser.email}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-muted)] border border-[var(--border)] px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <span className="text-[var(--text-muted)]">User ID:</span>
                      <span className="font-semibold text-brand">#{selectedUser.id}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedUser.id, 'User ID')}
                      className="text-[var(--text-muted)] hover:text-brand p-1 rounded hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                      title="Copy User ID"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                </div>
              </div>

              {/* KYC Status Strip */}
              <div className="p-3 bg-[var(--bg-muted)]/50 border border-[var(--border)] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className={vState.isApproved ? 'text-emerald-500' : 'text-[var(--text-muted)]'} />
                  <div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">Verification</span>
                    <span className={`text-xs font-semibold ${vState.isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                      {vState.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAgentOrBuilder && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => selectedUser.role === 'Agent' ? handleVerifyAgent(selectedUser.id, 'approved') : handleVerifyDeveloper(selectedUser.id, 'approved')}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          vState.isApproved ? 'bg-emerald-500/10 text-emerald-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {vState.isApproved ? 'Approved ✓' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingUser(selectedUser);
                          setShowRejectModal(true);
                        }}
                        className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-md text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => toggleKycVerification(selectedUser)}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      vState.isApproved ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    title="Toggle KYC"
                  >
                    <span className={`inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      vState.isApproved ? 'translate-x-3' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[var(--border)] text-xs gap-4 font-semibold">
                {drawerTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setUserDrawerTab(tab)}
                    className={`pb-2 transition-all cursor-pointer relative ${
                      userDrawerTab === tab ? 'text-brand font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{tab}</span>
                    {userDrawerTab === tab && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {isDrawerLoading ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={15} className="animate-spin text-brand" />
                  <span>Loading data...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {userDrawerTab === 'Overview' && (
                    <div className="space-y-2 p-3 bg-[var(--bg-muted)]/30 border border-[var(--border)] rounded-xl text-xs">
                      <div className="flex justify-between py-1 border-b border-[var(--border)]/40">
                        <span className="text-[var(--text-muted)]">User ID</span>
                        <span className="font-mono text-brand font-semibold">{selectedUser.id}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[var(--border)]/40">
                        <span className="text-[var(--text-muted)]">Registration Date</span>
                        <span className="font-semibold text-[var(--text-primary)]">{selectedUser.date}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[var(--border)]/40">
                        <span className="text-[var(--text-muted)]">Phone</span>
                        <span className="font-semibold text-[var(--text-primary)]">{selectedUser.phone}</span>
                      </div>
                      {selectedUser.reraNumber && (
                        <div className="flex justify-between py-1 border-b border-[var(--border)]/40">
                          <span className="text-[var(--text-muted)]">RERA Number</span>
                          <span className="font-mono font-bold text-brand">{selectedUser.reraNumber}</span>
                        </div>
                      )}
                      {selectedUser.companyName && (
                        <div className="flex justify-between py-1 border-b border-[var(--border)]/40">
                          <span className="text-[var(--text-muted)]">Company</span>
                          <span className="font-semibold text-[var(--text-primary)]">{selectedUser.companyName}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span className="text-[var(--text-muted)]">Listings Count</span>
                        <span className="font-bold text-[var(--text-primary)]">{selectedUser.listings || 0} listings</span>
                      </div>
                    </div>
                  )}

                  {userDrawerTab === 'Documents' && (
                    <div className="space-y-2 text-xs">
                      <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Submitted Documents</p>
                      <div className="space-y-1.5">
                        <div className="p-2.5 bg-[var(--bg-muted)]/40 border border-[var(--border)] rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-blue-500" />
                            <span>RERA Registration Certificate</span>
                          </div>
                          {selectedUser.verificationDocs?.reraCertificate ? (
                            <a
                              href={selectedUser.verificationDocs.reraCertificate}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10.5px] font-bold text-brand hover:underline flex items-center gap-0.5"
                            >
                              <span>View</span>
                              <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)]">Not Uploaded</span>
                          )}
                        </div>

                        <div className="p-2.5 bg-[var(--bg-muted)]/40 border border-[var(--border)] rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-purple-500" />
                            <span>Aadhaar / Identity Proof</span>
                          </div>
                          {selectedUser.verificationDocs?.aadhaarCard ? (
                            <a
                              href={selectedUser.verificationDocs.aadhaarCard}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10.5px] font-bold text-brand hover:underline flex items-center gap-0.5"
                            >
                              <span>View</span>
                              <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)]">Not Uploaded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {userDrawerTab === 'Listings' && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {realProperties.length === 0 ? (
                        <div className="text-center py-6 text-[var(--text-muted)] text-xs">
                          No listings posted yet.
                        </div>
                      ) : (
                        realProperties.map((p) => (
                          <div key={p._id} className="p-2 bg-[var(--bg-muted)]/40 border border-[var(--border)] rounded-lg flex items-center justify-between text-xs">
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-[var(--text-primary)] truncate">{p.title}</p>
                              <p className="text-[10px] text-[var(--text-muted)]">{p.city} • ₹{p.price}</p>
                            </div>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                              {p.approvalStatus || 'approved'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {userDrawerTab === 'Enquiries' && (
                    <div className="text-center py-6 text-[var(--text-muted)] text-xs">
                      No customer leads or inquiries logged.
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => openEditUserModal(selectedUser)}
                  className="px-3 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => toggleUserStatus(selectedUser.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    selectedUser.status === 'Active'
                      ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {selectedUser.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ─── 05. ADD USER MODAL (Clean, Aligned, Minimal) ─── */}
      {isAddUserModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddUserModalOpen(false); }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl max-w-md w-full shadow-2xl border border-[var(--border)] p-5 space-y-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Add User Profile</h3>
                <p className="text-[10.5px] text-[var(--text-muted)]">Register a new user in the platform directory</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-2 border border-[var(--border)] bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-lg outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. rahul@example.com"
                  className="w-full p-2 border border-[var(--border)] bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-lg outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="e.g. +91 99887 76655"
                  className="w-full p-2 border border-[var(--border)] bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-lg outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--bg-muted)]/50 text-[var(--text-primary)] outline-none"
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="Seller">Seller</option>
                    <option value="Agent">Agent</option>
                    <option value="Builder">Builder</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Status</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                    className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--bg-muted)]/50 text-[var(--text-primary)] outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="add-verify"
                  checked={newUser.isVerified}
                  onChange={(e) => setNewUser({ ...newUser, isVerified: e.target.checked })}
                  className="rounded border-[var(--border)] text-brand focus:ring-brand accent-brand cursor-pointer"
                />
                <label htmlFor="add-verify" className="text-xs font-semibold text-[var(--text-secondary)] select-none cursor-pointer">
                  Mark profile as KYC verified
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="flex-1 py-1.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg font-bold shadow-2xs cursor-pointer transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 06. EDIT USER MODAL ─── */}
      {isEditUserModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditUserModalOpen(false); }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-2xl max-w-md w-full shadow-2xl border border-[var(--border)] p-5 space-y-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Edit User Details</h3>
                <p className="text-[10px] text-[var(--text-muted)] font-mono">#{editUserData.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditUserModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  className="w-full p-2 border border-[var(--border)] bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-lg outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  className="w-full p-2 border border-[var(--border)] bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-lg outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editUserData.phone}
                  onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                  className="w-full p-2 border border-[var(--border)] bg-[var(--bg-muted)]/50 focus:bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-lg outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Role</label>
                  <select
                    value={editUserData.role}
                    onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                    className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--bg-muted)]/50 text-[var(--text-primary)] outline-none"
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="Seller">Seller</option>
                    <option value="Agent">Agent</option>
                    <option value="Builder">Builder</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase">Status</label>
                  <select
                    value={editUserData.status}
                    onChange={(e) => setEditUserData({ ...editUserData, status: e.target.value })}
                    className="w-full p-2 border border-[var(--border)] rounded-lg bg-[var(--bg-muted)]/50 text-[var(--text-primary)] outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>

              {(editUserData.role === 'Agent' || editUserData.role === 'Builder') && (
                <div className="space-y-2 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-blue-600 uppercase">RERA Registration</label>
                    <input
                      type="text"
                      value={editUserData.reraNumber}
                      onChange={(e) => setEditUserData({ ...editUserData, reraNumber: e.target.value })}
                      placeholder="e.g. MAHARERA/A51800029381"
                      className="w-full p-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded text-xs outline-none"
                    />
                  </div>
                  {editUserData.role === 'Builder' && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold text-purple-600 uppercase">Company Name</label>
                      <input
                        type="text"
                        value={editUserData.companyName}
                        onChange={(e) => setEditUserData({ ...editUserData, companyName: e.target.value })}
                        placeholder="Company name..."
                        className="w-full p-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded text-xs outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="edit-verify"
                  checked={editUserData.isVerified}
                  onChange={(e) => setEditUserData({ ...editUserData, isVerified: e.target.checked })}
                  className="rounded border-[var(--border)] text-brand focus:ring-brand accent-brand cursor-pointer"
                />
                <label htmlFor="edit-verify" className="text-xs font-semibold text-[var(--text-secondary)] select-none cursor-pointer">
                  Mark profile as KYC verified
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="flex-1 py-1.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg font-bold shadow-2xs cursor-pointer transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 07. DELETE CONFIRMATION MODAL ─── */}
      {showDeleteModal && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) setShowDeleteModal(false); }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Delete User Account?
                </h3>
                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-[var(--bg-muted)]/50 rounded-xl border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-1">
              <p>
                Permanently removing <strong className="text-[var(--text-primary)]">{userToDelete?.name}</strong> ({userToDelete?.email}).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteExecution}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={12} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 08. REJECTION REASON MODAL ─── */}
      {showRejectModal && rejectingUser && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget && !isSubmittingReject) setShowRejectModal(false); }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-rose-500" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Reject Verification Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Specify reason for declining verification for <span className="font-bold text-[var(--text-primary)]">{rejectingUser.name}</span>.
            </p>

            <div className="space-y-1.5">
              {[
                'Document verification incomplete or mismatch',
                'Invalid or expired RERA registration certificate',
                'Identity proof could not be authenticated',
                'Duplicate professional profile'
              ].map((r, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    rejectReason === r
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 font-semibold'
                      : 'bg-[var(--bg-muted)]/40 border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReasonRadio"
                    checked={rejectReason === r}
                    onChange={() => setRejectReason(r)}
                    className="accent-rose-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReject}
                onClick={confirmRejectionSubmit}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {isSubmittingReject ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <XCircle size={13} />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 09. IN-APP TOAST NOTIFICATION ─── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl border backdrop-blur-md text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40 shadow-emerald-950/30'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-100 border-rose-500/40 shadow-rose-950/30'
              : 'bg-slate-900/90 text-slate-100 border-slate-700 shadow-slate-950/30'
          }`}>
            {toast.type === 'success' && <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={15} className="text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info size={15} className="text-blue-400 shrink-0" />}
            
            <span className="leading-snug">{toast.message}</span>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
