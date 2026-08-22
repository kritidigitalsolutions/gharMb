import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  MoreVertical,
  Activity,
  Trash2,
  Lock,
  Eye,
  KeyRound,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  UserMinus,
  Sparkles,
  Edit,
  X,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Clock,
  Building2,
  Briefcase,
  MapPin,
  Award,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Download,
  Image as ImageIcon
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [realProperties, setRealProperties] = useState([]);
  const [realEnquiries, setRealEnquiries] = useState({ sent: { property: [], developer: [] }, received: { property: [], developer: [] } });
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDrawerTab, setUserDrawerTab] = useState('Overview');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const isMockMode = !localStorage.getItem('adminToken') || localStorage.getItem('adminToken') === 'mock_admin_token_2026';

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
      default: return uiRole.toLowerCase();
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (isMockMode) {
        loadMockData();
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        const mappedUsers = (data.data.users || []).map(u => ({
          ...u,
          id: u._id,
          role: mapApiToUiRole(u.role),
          status: u.status || 'Active',
          date: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown'
        }));
        setUsers(mappedUsers);
      } else {
        setError(data.message || 'Failed to fetch users.');
      }
    } catch (err) {
      console.error('Error fetching users, falling back to mock:', err);
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockData = () => {
    const saved = localStorage.getItem('gharmb_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.some(u => u.date && u.date.includes('Jun 2026'))) {
          localStorage.removeItem('gharmb_users');
        } else {
          setUsers(parsed);
          return;
        }
      } catch (err) {}
    }
    const defaultMock = [
      { id: 'USR-8902', name: 'Alok Mishra', email: 'alok.mishra@gmail.com', phone: '+91 98765 43210', role: 'Buyer', status: 'Active', isVerified: true, listings: 0, date: '28 Jul 2026', createdAt: '2026-07-28T10:00:00Z' },
      { id: 'USR-3120', name: 'Simran Jeet', email: 'simran.jeet@outlook.com', phone: '+91 99887 76655', role: 'Seller', status: 'Active', isVerified: false, listings: 3, date: '29 Jul 2026', createdAt: '2026-07-29T10:00:00Z' },
      { id: 'USR-4811', name: 'Vikram Developers', email: 'info@vikramdev.com', phone: '+91 88776 65544', role: 'Builder', status: 'Active', isVerified: true, builderVerificationStatus: 'approved', listings: 14, date: '20 Jul 2026', createdAt: '2026-07-20T10:00:00Z' },
      { id: 'USR-0922', name: 'Deepak Estates', email: 'deepak.estates@gmail.com', phone: '+91 77665 54433', role: 'Agent', status: 'Active', isVerified: false, agentVerificationStatus: 'pending', reraNumber: 'UPRERA-AGT-8821', cityOfOperation: 'Noida', experience: '3-5 yrs', listings: 8, date: '15 Jul 2026', createdAt: '2026-07-15T10:00:00Z' },
      { id: 'USR-7731', name: 'Sanjay Aggarwal', email: 'sanjay.ag@gmail.com', phone: '+91 98112 23344', role: 'Buyer', status: 'Active', isVerified: true, listings: 0, date: '25 Jul 2026', createdAt: '2026-07-25T10:00:00Z' }
    ];
    setUsers(defaultMock);
    localStorage.setItem('gharmb_users', JSON.stringify(defaultMock));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (isMockMode && users.length > 0) {
      localStorage.setItem('gharmb_users', JSON.stringify(users));
    }
  }, [users, isMockMode]);

  useEffect(() => {
    if (!selectedUser || isMockMode) return;

    const fetchDrawerData = async () => {
      setIsDrawerLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        if (userDrawerTab === 'Listings') {
          const response = await fetch(`http://localhost:5001/api/admin/properties?owner=${selectedUser.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (response.ok && data.status === 'success') {
            setRealProperties(data.data.properties || []);
          }
        } else if (userDrawerTab === 'Enquiries') {
          const response = await fetch(`http://localhost:5001/api/admin/users/${selectedUser.id}/enquiries`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (response.ok && data.status === 'success') {
            setRealEnquiries(data.data || { sent: { property: [], developer: [] }, received: { property: [], developer: [] } });
          }
        }
      } catch (err) {
        console.error('Error fetching drawer details:', err);
      } finally {
        setIsDrawerLoading(false);
      }
    };

    fetchDrawerData();
  }, [selectedUser, userDrawerTab, isMockMode]);

  // Modals & form states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Buyer',
    status: 'Active',
    isVerified: false
  });
  const [editUserData, setEditUserData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: 'Buyer',
    status: 'Active',
    isVerified: false,
    agentVerificationStatus: 'unverified',
    builderVerificationStatus: 'unverified'
  });

  // Verify Agent Action Handler
  const handleVerifyAgent = async (userId, targetStatus, rejectionReason = '') => {
    if (isMockMode) {
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          const updated = {
            ...u,
            isVerified: targetStatus === 'approved',
            agentVerificationStatus: targetStatus,
            agentRejectionReason: targetStatus === 'rejected' ? rejectionReason : undefined
          };
          if (selectedUser && selectedUser.id === userId) setSelectedUser(updated);
          return updated;
        }
        return u;
      });
      setUsers(updatedUsers);
      triggerToast(`Agent verification status updated to ${targetStatus}`);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}/verify-agent`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agentVerificationStatus: targetStatus,
          agentRejectionReason: rejectionReason
        })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        triggerToast(`Agent status updated to ${targetStatus}!`);
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(prev => ({
            ...prev,
            isVerified: targetStatus === 'approved',
            agentVerificationStatus: targetStatus,
            agentRejectionReason: targetStatus === 'rejected' ? rejectionReason : undefined
          }));
        }
        await fetchUsers();
      } else {
        triggerToast(data.message || 'Failed to update agent verification.', 'error');
      }
    } catch (err) {
      console.error('Error verifying agent:', err);
      triggerToast('Network connection error.', 'error');
    }
  };

  // Verify Developer Action Handler
  const handleVerifyDeveloper = async (userId, targetStatus, rejectionReason = '') => {
    if (isMockMode) {
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          const updated = {
            ...u,
            isVerified: targetStatus === 'approved',
            builderVerificationStatus: targetStatus,
            builderRejectionReason: targetStatus === 'rejected' ? rejectionReason : undefined
          };
          if (selectedUser && selectedUser.id === userId) setSelectedUser(updated);
          return updated;
        }
        return u;
      });
      setUsers(updatedUsers);
      triggerToast(`Developer status updated to ${targetStatus}`);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}/verify-developer`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          builderVerificationStatus: targetStatus,
          builderRejectionReason: rejectionReason
        })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        triggerToast(`Developer status updated to ${targetStatus}!`);
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(prev => ({
            ...prev,
            isVerified: targetStatus === 'approved',
            builderVerificationStatus: targetStatus,
            builderRejectionReason: targetStatus === 'rejected' ? rejectionReason : undefined
          }));
        }
        await fetchUsers();
      } else {
        triggerToast(data.message || 'Failed to update developer verification.', 'error');
      }
    } catch (err) {
      console.error('Error verifying developer:', err);
      triggerToast('Network connection error.', 'error');
    }
  };

  // Toggle KYC / Verification for any user
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
      if (isMockMode) {
        const updatedUsers = users.map(user => user.id === u.id ? { ...user, isVerified: newVerified } : user);
        setUsers(updatedUsers);
        if (selectedUser && selectedUser.id === u.id) setSelectedUser({ ...selectedUser, isVerified: newVerified });
        triggerToast(`KYC status updated to ${newVerified ? 'Verified' : 'Unverified'}`);
        return;
      }
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:5001/api/admin/users/${u.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isVerified: newVerified })
        });
        if (response.ok) {
          triggerToast(`KYC status updated!`);
          if (selectedUser && selectedUser.id === u.id) {
            setSelectedUser(prev => ({ ...prev, isVerified: newVerified }));
          }
          await fetchUsers();
        }
      } catch (err) {
        console.error('Error toggling KYC verification:', err);
      }
    }
  };
  
  // Sorting & Pagination States
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState([]);

  // Handle row sorting
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);

    const sortedUsers = [...users].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (typeof aVal === 'string') {
        return isAsc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      } else {
        return isAsc ? bVal - aVal : aVal - bVal;
      }
    });
    setUsers(sortedUsers);
  };

  // Toggle single row checkbox
  const toggleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Select/Unselect All
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u.id));
    }
  };

  // Bulk actions trigger
  const triggerBulkBlock = async () => {
    if (isMockMode) {
      const updatedUsers = users.map(u => selectedIds.includes(u.id) ? { ...u, status: 'Blocked' } : u);
      setUsers(updatedUsers);
      setSelectedIds([]);
      alert('Selected accounts have been suspended successfully.');
    } else {
      try {
        const token = localStorage.getItem('adminToken');
        await Promise.all(selectedIds.map(async (id) => {
          await fetch(`http://localhost:5001/api/admin/users/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'Blocked' })
          });
        }));
        setSelectedIds([]);
        alert('Selected accounts suspended successfully.');
        await fetchUsers();
      } catch (err) {
        console.error('Error in bulk block:', err);
        alert('Some accounts could not be updated.');
      }
    }
  };

  const triggerBulkDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete the selected accounts?');
    if (!confirmDelete) return;

    if (isMockMode) {
      const updatedUsers = users.filter(u => !selectedIds.includes(u.id));
      setUsers(updatedUsers);
      setSelectedIds([]);
      alert('Selected accounts deleted from the directory.');
    } else {
      try {
        const token = localStorage.getItem('adminToken');
        await Promise.all(selectedIds.map(async (id) => {
          await fetch(`http://localhost:5001/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }));
        setSelectedIds([]);
        alert('Selected accounts deleted successfully.');
        await fetchUsers();
      } catch (err) {
        console.error('Error in bulk delete:', err);
        alert('Some accounts could not be deleted.');
      }
    }
  };

  // Toggle user status (Block / Unblock)
  const toggleUserStatus = async (id) => {
    const userToToggle = users.find(u => u.id === id);
    if (!userToToggle) return;
    const newStatus = userToToggle.status === 'Active' ? 'Blocked' : 'Active';

    if (isMockMode) {
      const updatedUsers = users.map(u => {
        if (u.id === id) {
          const updated = { ...u, status: newStatus };
          if (selectedUser && selectedUser.id === id) {
            setSelectedUser(updated);
          }
          return updated;
        }
        return u;
      });
      setUsers(updatedUsers);
    } else {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:5001/api/admin/users/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus
          })
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
          if (selectedUser && selectedUser.id === id) {
            setSelectedUser({ ...selectedUser, status: newStatus });
          }
          await fetchUsers();
        } else {
          alert(data.message || 'Failed to toggle account status.');
        }
      } catch (err) {
        console.error('Error toggling status:', err);
        alert('Network connection error.');
      }
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.phone) {
      alert('Please fill in Name, Email, and Phone fields.');
      return;
    }

    if (isMockMode) {
      const newId = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
      const userRecord = {
        id: newId,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        isVerified: newUser.isVerified,
        listings: 0,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      setUsers([userRecord, ...users]);
      setIsAddUserModalOpen(false);
      setNewUser({
        name: '',
        email: '',
        phone: '',
        role: 'Buyer',
        status: 'Active',
        isVerified: false
      });
    } else {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:5001/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            status: newUser.status,
            isVerified: newUser.isVerified
          })
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
          setIsAddUserModalOpen(false);
          setNewUser({
            name: '',
            email: '',
            phone: '',
            role: 'Buyer',
            status: 'Active',
            isVerified: false
          });
          await fetchUsers();
        } else {
          alert(data.message || 'Failed to create user profile.');
        }
      } catch (err) {
        console.error('Error creating user:', err);
        alert('Network connection error.');
      }
    }
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editUserData.name || !editUserData.email || !editUserData.phone) {
      alert('Please fill in Name, Email, and Phone fields.');
      return;
    }

    if (isMockMode) {
      setUsers(users.map(u => u.id === editUserData.id ? { ...u, ...editUserData } : u));
      if (selectedUser && selectedUser.id === editUserData.id) {
        setSelectedUser({ ...selectedUser, ...editUserData });
      }
      setIsEditUserModalOpen(false);
      triggerToast('User details updated successfully!');
    } else {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:5001/api/admin/users/${editUserData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: editUserData.name,
            email: editUserData.email,
            phone: editUserData.phone,
            role: editUserData.role,
            status: editUserData.status,
            isVerified: editUserData.isVerified,
            agentVerificationStatus: editUserData.role === 'Agent' ? editUserData.agentVerificationStatus : undefined,
            builderVerificationStatus: editUserData.role === 'Builder' ? editUserData.builderVerificationStatus : undefined,
          })
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
          setIsEditUserModalOpen(false);
          triggerToast('User details updated successfully!');
          if (selectedUser && selectedUser.id === editUserData.id) {
            setSelectedUser({
              ...selectedUser,
              name: editUserData.name,
              email: editUserData.email,
              phone: editUserData.phone,
              role: editUserData.role,
              status: editUserData.status,
              isVerified: editUserData.isVerified,
              agentVerificationStatus: editUserData.agentVerificationStatus,
              builderVerificationStatus: editUserData.builderVerificationStatus,
            });
          }
          await fetchUsers();
        } else {
          alert(data.message || 'Failed to update user.');
        }
      } catch (err) {
        console.error('Error updating user:', err);
        alert('Network connection error.');
      }
    }
  };

  const openEditUserModal = (user) => {
    const isApproved = user.isVerified || user.agentVerificationStatus === 'approved' || user.builderVerificationStatus === 'approved';
    setEditUserData({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      isVerified: isApproved,
      agentVerificationStatus: user.agentVerificationStatus || (isApproved ? 'approved' : 'unverified'),
      builderVerificationStatus: user.builderVerificationStatus || (isApproved ? 'approved' : 'unverified'),
    });
    setIsEditUserModalOpen(true);
  };

  const deleteUser = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to permanently delete this user account?');
    if (!confirmDelete) return;

    if (isMockMode) {
      setUsers(users.filter(u => u.id !== id));
      setSelectedUser(null);
    } else {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:5001/api/admin/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
          setSelectedUser(null);
          await fetchUsers();
        } else {
          alert(data.message || 'Failed to delete user.');
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Network connection error.');
      }
    }
  };

  // Filters
  const filteredUsers = users.filter(u => {
    const name = u.name || '';
    const email = u.email || '';
    const id = u.id || u._id || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'All' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Paginated records
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const userProperties = (() => {
    if (!selectedUser) return [];
    const saved = localStorage.getItem('gharmb_properties');
    let list = [];
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch (err) {}
    }
    const filtered = list.filter(p => p.owner && p.owner.toLowerCase().includes(selectedUser.name.toLowerCase()));
    if (filtered.length > 0) return filtered;
    
    if (selectedUser.role !== 'Buyer') {
      return [
        { id: 'PROP-9821', title: 'Godrej Woods Sector 43', location: 'Noida, Sector 43', price: '₹2.45 Cr', photoUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=100&q=80', status: 'Pending' },
        { id: 'PROP-4920', title: 'Premium 3 BHK Builder Floor', location: 'DLF Phase 2, Gurugram', price: '₹1.85 Cr', photoUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=100&q=80', status: 'Approved' }
      ].slice(0, selectedUser.listings || 1);
    }
    return [];
  })();

  const userLeads = (() => {
    if (!selectedUser) return [];
    const saved = localStorage.getItem('gharmb_leads');
    let list = [];
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch (err) {}
    }
    const filtered = list.filter(l => l.client && l.client.toLowerCase().includes(selectedUser.name.toLowerCase()));
    if (filtered.length > 0) return filtered;

    return [
      { id: 'LED-3210', property: 'Godrej Woods Phase 2', type: 'WhatsApp', date: '16 Jun 2026', status: 'Pending' },
      { id: 'LED-4921', property: 'DLF Skycourt Penthouse', type: 'Call Request', date: '16 Jun 2026', status: 'Contacted' }
    ].slice(0, selectedUser.role === 'Buyer' ? 2 : 1);
  })();

  const listingsList = isMockMode ? userProperties : (realProperties || []).map(p => ({
    id: p._id,
    title: p.title || 'Untitled Property',
    location: `${p.locality || ''}, ${p.city || ''}`,
    price: p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : 'N/A',
    photoUrl: p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=100&q=80',
    status: p.approvalStatus ? p.approvalStatus.charAt(0).toUpperCase() + p.approvalStatus.slice(1) : 'Pending'
  }));

  const enquiriesList = (() => {
    if (isMockMode) return userLeads;
    const list = [];
    const sentProps = realEnquiries?.sent?.property || [];
    const sentDevs = realEnquiries?.sent?.developer || [];
    const recProps = realEnquiries?.received?.property || [];
    const recDevs = realEnquiries?.received?.developer || [];

    sentProps.forEach(enq => {
      list.push({
        id: enq._id,
        property: enq.property ? enq.property.title : 'Deleted Property',
        type: 'Property Enquiry',
        date: enq.createdAt ? new Date(enq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        status: enq.status ? enq.status.charAt(0).toUpperCase() + enq.status.slice(1) : 'Pending'
      });
    });

    sentDevs.forEach(enq => {
      list.push({
        id: enq._id,
        property: enq.developer ? (enq.developer.companyName || enq.developer.name) : 'Developer Contact',
        type: 'Developer Enquiry',
        date: enq.createdAt ? new Date(enq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        status: enq.status ? enq.status.charAt(0).toUpperCase() + enq.status.slice(1) : 'Pending'
      });
    });

    recProps.forEach(enq => {
      list.push({
        id: enq._id,
        property: enq.property ? enq.property.title : 'Deleted Property',
        type: `Received (From: ${enq.client ? enq.client.name : 'Unknown'})`,
        date: enq.createdAt ? new Date(enq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        status: enq.status ? enq.status.charAt(0).toUpperCase() + enq.status.slice(1) : 'Pending'
      });
    });

    recDevs.forEach(enq => {
      list.push({
        id: enq._id,
        property: 'Developer Enquiry',
        type: `Received (From: ${enq.client ? enq.client.name : 'Unknown'})`,
        date: enq.createdAt ? new Date(enq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        status: enq.status ? enq.status.charAt(0).toUpperCase() + enq.status.slice(1) : 'Pending'
      });
    });

    return list;
  })();

  const newRegistrationsCount = users.filter(u => {
    const dateToCheck = u.createdAt ? new Date(u.createdAt) : (u.date ? new Date(u.date) : null);
    if (!dateToCheck) return false;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return dateToCheck >= sevenDaysAgo;
  }).length;

  // Helper to determine verification badge details
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
      label: u.isVerified ? 'Verified' : 'Unverified',
      status: u.isVerified ? 'approved' : 'unverified'
    };
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6 overflow-hidden relative">
      
      {/* Stats cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">Total Users</span>
            <h4 className="text-lg font-bold text-[var(--text-primary)]">{users.length}</h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">New Registrations</span>
            <h4 className="text-lg font-bold text-[var(--text-primary)]">
              {newRegistrationsCount} {newRegistrationsCount === 1 ? 'User' : 'Users'}
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck size={18} />
          </div>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">Suspended</span>
            <h4 className="text-lg font-bold text-[var(--text-primary)]">
              {users.filter(u => u.status === 'Blocked').length}
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
            <UserX size={18} />
          </div>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-[var(--text-muted)] block uppercase">Verified Profiles</span>
            <h4 className="text-lg font-bold text-[var(--text-primary)]">
              {users.filter(u => u.isVerified || u.agentVerificationStatus === 'approved' || u.builderVerificationStatus === 'approved').length}
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
        </div>
      </div>

      {/* Main Datatable */}
      <div className="flex-1 min-h-0 p-4 md:p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
          
          {/* Search bar */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute top-2.5 left-3.5 text-[var(--text-muted)]" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or user ID..."
              className="w-full pl-9 pr-4 py-2 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
            />
          </div>

          {/* Role Filters & Add Action */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[var(--bg-muted)] p-1 rounded-xl border border-[var(--border)]">
              {['All', 'Buyer', 'Seller', 'Agent', 'Builder'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedRole === role
                      ? 'bg-brand text-white shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(true)}
              className="py-2 px-3 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus size={14} /> Add User
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold">Loading registered accounts...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[var(--border)] rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-muted)] mx-auto">
              <UserMinus size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[var(--text-primary)]">No matching user records found</h4>
              <p className="text-[10px] text-[var(--text-muted)]">Try modifying search criteria or adjusting role filters.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block flex-1 overflow-auto relative border border-[var(--border)]/40 rounded-xl min-h-[200px]">
              <table className="w-full text-left border-collapse min-w-[1050px]">
                <thead>
                  <tr className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredUsers.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 cursor-pointer hover:text-[var(--text-subtle)]" onClick={() => handleSort('id')}>
                      <span className="flex items-center gap-1">User ID <ArrowUpDown size={10} /></span>
                    </th>
                    <th className="py-3 px-4 cursor-pointer hover:text-[var(--text-subtle)]" onClick={() => handleSort('name')}>
                      <span className="flex items-center gap-1">User name <ArrowUpDown size={10} /></span>
                    </th>
                    <th className="py-3 px-4">Contact Detail</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">KYC / Verification Status</th>
                    <th className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-subtle)]" onClick={() => handleSort('listings')}>
                      <span className="flex items-center gap-1 justify-center">Listings <ArrowUpDown size={10} /></span>
                    </th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-muted)] text-xs">
                  {paginatedUsers.map((u) => {
                    const vState = getVerificationState(u);
                    return (
                      <tr key={u.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(u.id)}
                            onChange={() => toggleSelectRow(u.id)}
                            className="rounded border-slate-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-bold text-[var(--text-subtle)] font-mono">
                          <div className="flex items-center gap-1 group">
                            <span 
                              onClick={() => {
                                navigator.clipboard.writeText(u.id);
                                triggerToast('Copied ID to clipboard!');
                              }}
                              className="cursor-pointer hover:text-brand px-1.5 py-0.5 bg-[var(--bg-muted)] hover:bg-[var(--border)] rounded transition-colors flex items-center gap-1 select-all"
                              title="Click to copy ID"
                            >
                              {u.id.length > 12 ? `${u.id.substring(0, 8)}...${u.id.substring(u.id.length - 4)}` : u.id}
                              <Copy size={10} className="text-[var(--text-muted)] hover:text-brand opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[var(--text-primary)]">{u.name}</div>
                          {u.companyName && (
                            <div className="text-[10px] text-[var(--text-muted)] font-semibold flex items-center gap-1">
                              <Building2 size={10} /> {u.companyName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-[var(--text-subtle)] font-semibold">{u.email}</p>
                          <p className="text-[9px] text-[var(--text-muted)]">{u.phone}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-extrabold ${
                            u.role === 'Builder' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/10 dark:text-purple-400' :
                            u.role === 'Agent' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' :
                            u.role === 'Seller' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400' : 'bg-orange-50 text-brand'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {/* Verification Badge */}
                            {vState.isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                                <ShieldCheck size={11} /> {vState.label}
                              </span>
                            ) : vState.isPending ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg animate-pulse">
                                <Clock size={11} /> Pending Review
                              </span>
                            ) : vState.isRejected ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg">
                                <ShieldAlert size={11} /> Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-lg">
                                <ShieldAlert size={11} /> Unverified
                              </span>
                            )}

                            {/* Direct Verification Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => toggleKycVerification(u)}
                              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                vState.isApproved ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                              title={vState.isApproved ? 'Click to Revoke Verification' : 'Click to Verify & Approve Profile'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  vState.isApproved ? 'translate-x-3' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[var(--text-subtle)]">{u.listings}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                            u.status === 'Active' ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1 items-center">
                            {/* Quick Approve button if pending */}
                            {vState.isPending && (
                              <button
                                type="button"
                                onClick={() => u.role === 'Agent' ? handleVerifyAgent(u.id, 'approved') : handleVerifyDeveloper(u.id, 'approved')}
                                className="p-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors"
                                title="Approve Verification Application"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditUserModal(u)}
                              className="p-1.5 hover:bg-[var(--bg-muted)] rounded-lg text-[var(--text-subtle)] hover:text-[var(--text-primary)]"
                              title="Edit user details"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => { setSelectedUser(u); setUserDrawerTab(u.role === 'Agent' || u.role === 'Builder' ? 'Documents' : 'Overview'); }}
                              className="p-1.5 hover:bg-[var(--bg-muted)] rounded-lg text-[var(--text-subtle)] hover:text-[var(--text-primary)]"
                              title="Inspect profile & verification documents"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleUserStatus(u.id)}
                              className={`p-1.5 rounded-lg border ${
                                u.status === 'Active'
                                  ? 'border-red-500/20 text-red-600 hover:bg-red-500/10'
                                  : 'border-green-500/20 text-green-600 hover:bg-green-500/10'
                              }`}
                              title={u.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                            >
                              {u.status === 'Active' ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden flex-1 overflow-y-auto space-y-3 min-h-[200px] pr-1">
              {paginatedUsers.map((u) => {
                const vState = getVerificationState(u);
                return (
                  <div 
                    key={u.id} 
                    className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-brand/40 rounded-xl shadow-xs space-y-3 transition-colors relative text-left"
                  >
                    {/* Header: Checkbox, ID, Role & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(u.id)}
                          onChange={() => toggleSelectRow(u.id)}
                          className="rounded border-slate-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                        />
                        <div className="flex items-center gap-1 group">
                          <span 
                            onClick={() => {
                              navigator.clipboard.writeText(u.id);
                              triggerToast('Copied ID to clipboard!');
                            }}
                            className="font-mono text-[10px] bg-[var(--bg-muted)] text-[var(--text-subtle)] px-2 py-0.5 rounded cursor-pointer hover:bg-[var(--border)] transition-colors flex items-center gap-1 select-all"
                            title="Click to copy User ID"
                          >
                            {u.id.length > 12 ? `${u.id.substring(0, 6)}...${u.id.substring(u.id.length - 4)}` : u.id}
                            <Copy size={8} className="text-[var(--text-muted)] hover:text-brand" />
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide uppercase ${
                          u.role === 'Builder' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/10 dark:text-purple-400' :
                          u.role === 'Agent' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' :
                          u.role === 'Seller' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400' : 
                          'bg-orange-50 text-brand dark:bg-orange-950/10'
                        }`}>
                          {u.role}
                        </span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                          u.status === 'Active' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-700 dark:text-red-400'
                        }`}>
                          {u.status}
                        </span>
                      </div>
                    </div>

                    {/* Body: Name & Verification */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-sm text-[var(--text-primary)]">{u.name}</h5>
                        {u.companyName && (
                          <p className="text-[10px] text-[var(--text-muted)] font-semibold">{u.companyName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {vState.isApproved ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                            <ShieldCheck size={11} /> {vState.label}
                          </span>
                        ) : vState.isPending ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md animate-pulse">
                            <Clock size={11} /> Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded-md">
                            <ShieldAlert size={11} /> Unverified
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleKycVerification(u)}
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                            vState.isApproved ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${vState.isApproved ? 'translate-x-3' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Details Grid: Contact, Listings */}
                    <div className="grid grid-cols-1 gap-2 text-xs border-t border-[var(--border)]/40 pt-2 text-[var(--text-subtle)]">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Contact Details</p>
                        <p className="font-semibold break-all text-[11px]">{u.email}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-medium">{u.phone}</p>
                      </div>
                      <div className="flex justify-between items-center bg-[var(--bg-muted)]/50 p-2 rounded-lg border border-[var(--border)]/30 mt-1">
                        <span className="text-[10px] text-[var(--text-subtle)] font-semibold">Total Listings Uploaded</span>
                        <span className="font-bold text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-md">{u.listings} listings</span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex justify-end gap-1.5 border-t border-[var(--border)]/40 pt-2 mt-1">
                      {vState.isPending && (
                        <button
                          type="button"
                          onClick={() => u.role === 'Agent' ? handleVerifyAgent(u.id, 'approved') : handleVerifyDeveloper(u.id, 'approved')}
                          className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Check size={12} /> Approve
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditUserModal(u)}
                        className="flex-1 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-subtle)] hover:text-[var(--text-primary)] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedUser(u); setUserDrawerTab(u.role === 'Agent' || u.role === 'Builder' ? 'Documents' : 'Overview'); }}
                        className="flex-1 py-1.5 bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-subtle)] hover:text-[var(--text-primary)] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(u.id)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border ${
                          u.status === 'Active'
                            ? 'border-red-500/20 text-red-600 bg-red-500/5 hover:bg-red-500/10'
                            : 'border-green-500/20 text-green-600 bg-green-500/5 hover:bg-green-500/10'
                        }`}
                      >
                        {u.status === 'Active' ? (
                          <>
                            <UserX size={12} />
                            <span>Suspend</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={12} />
                            <span>Activate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination Footer controls */}
        {filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-[var(--border)] text-xs shrink-0">
            <span className="text-[var(--text-subtle)] font-semibold">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} profiles
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--bg-muted)] disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl font-bold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-[var(--border)] rounded-xl hover:bg-[var(--bg-muted)] disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed user inspector drawer */}
      {selectedUser && (() => {
        const vState = getVerificationState(selectedUser);
        const isAgentOrBuilder = selectedUser.role === 'Agent' || selectedUser.role === 'Builder';
        const drawerTabs = isAgentOrBuilder 
          ? ['Overview', 'Documents', 'Listings', 'Enquiries']
          : ['Overview', 'Listings', 'Enquiries'];

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-lg w-full shadow-2xl border border-[var(--border)] p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-subtle)] transition-colors cursor-pointer"
              >
                <XCircle size={18} />
              </button>

              {/* User Header */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-brand-light dark:bg-brand/10 flex items-center justify-center font-bold text-lg text-brand">
                  {selectedUser.name ? selectedUser.name.charAt(0) : 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{selectedUser.name}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{selectedUser.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedUser.id);
                      triggerToast('Copied ID to clipboard!');
                    }}
                    className="text-[9px] font-bold bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-subtle)] px-2 py-0.5 rounded-md cursor-pointer transition-colors flex items-center gap-1 select-all"
                    title="Click to copy User ID"
                  >
                    ID: {selectedUser.id}
                    <Copy size={8} className="text-[var(--text-muted)]" />
                  </span>
                  <span className="text-[9px] font-bold bg-orange-50 dark:bg-orange-500/10 text-brand dark:text-brand-light px-2 py-0.5 rounded-md">
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Verification Control Banner */}
              <div className="p-3.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      vState.isApproved ? 'bg-emerald-500/10 text-emerald-600' :
                      vState.isPending ? 'bg-amber-500/10 text-amber-600 animate-pulse' :
                      vState.isRejected ? 'bg-red-500/10 text-red-600' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {vState.isApproved ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Verification Status</p>
                      <p className={`text-xs font-extrabold truncate ${
                        vState.isApproved ? 'text-emerald-600' :
                        vState.isPending ? 'text-amber-600' :
                        vState.isRejected ? 'text-red-600' : 'text-[var(--text-muted)]'
                      }`}>
                        {vState.label}
                      </p>
                    </div>
                  </div>

                  {/* Direct Toggle Switch in Drawer */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleKycVerification(selectedUser)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        vState.isApproved ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      title={vState.isApproved ? 'Revoke Verification' : 'Verify & Approve'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          vState.isApproved ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Quick Approve / Reject Buttons for Agent & Builder */}
                {isAgentOrBuilder && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)]/50">
                    <button
                      type="button"
                      onClick={() => selectedUser.role === 'Agent' ? handleVerifyAgent(selectedUser.id, 'approved') : handleVerifyDeveloper(selectedUser.id, 'approved')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        vState.isApproved 
                          ? 'bg-emerald-600/10 text-emerald-600 border border-emerald-500/20' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10'
                      }`}
                    >
                      <Check size={14} /> {vState.isApproved ? 'Approved ✓' : 'Approve & Verify'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const reason = window.prompt('Enter rejection reason (optional):');
                        if (reason !== null) {
                          if (selectedUser.role === 'Agent') handleVerifyAgent(selectedUser.id, 'rejected', reason);
                          else handleVerifyDeveloper(selectedUser.id, 'rejected', reason);
                        }
                      }}
                      className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}

                {/* Rejection Reason Notice if any */}
                {(selectedUser.agentRejectionReason || selectedUser.builderRejectionReason) && (
                  <div className="p-2 bg-red-500/5 border border-red-500/20 rounded-xl text-[10px] text-red-600">
                    <span className="font-bold">Rejection reason: </span>
                    {selectedUser.agentRejectionReason || selectedUser.builderRejectionReason}
                  </div>
                )}
              </div>

              {/* Tab Selector bar */}
              <div className="flex border-b border-[var(--border)] text-xs gap-4">
                {drawerTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setUserDrawerTab(tab)}
                    className={`pb-2 font-bold relative transition-all cursor-pointer ${
                      userDrawerTab === tab ? 'text-brand' : 'text-[var(--text-muted)] hover:text-[var(--text-subtle)]'
                    }`}
                  >
                    {tab === 'Documents' ? (selectedUser.role === 'Agent' ? 'RERA Documents' : 'Company Docs') : tab}
                    {userDrawerTab === tab && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></span>
                    )}
                  </button>
                ))}
              </div>

              {/* Conditional Panels */}
              {isDrawerLoading ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-semibold">Loading details...</span>
                </div>
              ) : (
                <>
                  {userDrawerTab === 'Overview' && (
                    <div className="space-y-3 p-4 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl">
                      <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                        <span className="text-[var(--text-muted)] font-medium">Registered Date</span>
                        <span className="font-semibold text-[var(--text-subtle)]">{selectedUser.date}</span>
                      </div>
                      <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                        <span className="text-[var(--text-muted)] font-medium">Phone number</span>
                        <span className="font-semibold text-[var(--text-subtle)]">{selectedUser.phone}</span>
                      </div>
                      {selectedUser.cityOfOperation && (
                        <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                          <span className="text-[var(--text-muted)] font-medium">City of Operation</span>
                          <span className="font-semibold text-[var(--text-subtle)]">{selectedUser.cityOfOperation}</span>
                        </div>
                      )}
                      {selectedUser.reraNumber && (
                        <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                          <span className="text-[var(--text-muted)] font-medium">RERA Registration</span>
                          <span className="font-semibold font-mono text-[var(--text-subtle)]">{selectedUser.reraNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs border-b border-[var(--border)]/50 pb-2">
                        <span className="text-[var(--text-muted)] font-medium">Verified KYC license</span>
                        <span className="font-semibold text-[var(--text-subtle)]">{vState.isApproved ? 'Yes (Verified)' : 'No (Unverified)'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-muted)] font-medium">Active Listings</span>
                        <span className="font-bold text-[var(--text-subtle)]">{selectedUser.listings} listings</span>
                      </div>
                    </div>
                  )}

                  {/* Documents & Verification Details Tab */}
                  {(userDrawerTab === 'Documents' || userDrawerTab === 'RERA Documents' || userDrawerTab === 'Company Docs') && (
                    <div className="space-y-4">
                      {/* Agent RERA Details */}
                      {selectedUser.role === 'Agent' && (
                        <div className="space-y-3">
                          <div className="p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl space-y-2">
                            <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              <Award size={14} className="text-brand" /> Agent Credentials
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">RERA Number</span>
                                <span className="font-bold font-mono text-[var(--text-primary)] break-all">{selectedUser.reraNumber || 'Not submitted'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Experience</span>
                                <span className="font-semibold text-[var(--text-primary)]">{selectedUser.experience || 'Not specified'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">City of Operation</span>
                                <span className="font-semibold text-[var(--text-primary)]">{selectedUser.cityOfOperation || 'Not provided'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Status</span>
                                <span className={`font-bold capitalize ${vState.isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {selectedUser.agentVerificationStatus || 'unverified'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-[var(--text-primary)]">Submitted Verification Documents</h4>
                            
                            {/* RERA Certificate */}
                            <div className="p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                                  <FileText size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">RERA Certificate</p>
                                  <p className="text-[10px] text-[var(--text-muted)] truncate">Official Agent License Document</p>
                                </div>
                              </div>
                              {selectedUser.verificationDocs?.reraCertificate ? (
                                <a
                                  href={selectedUser.verificationDocs.reraCertificate}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-brand text-white hover:bg-brand-dark rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 shadow-sm"
                                >
                                  <ExternalLink size={12} /> View File
                                </a>
                              ) : (
                                <span className="text-[10px] font-semibold text-[var(--text-muted)] italic">Not uploaded</span>
                              )}
                            </div>

                            {/* Aadhaar Card */}
                            <div className="p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                                  <FileText size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">Aadhaar Card / ID Proof</p>
                                  <p className="text-[10px] text-[var(--text-muted)] truncate">Government ID Document</p>
                                </div>
                              </div>
                              {selectedUser.verificationDocs?.aadhaarCard ? (
                                <a
                                  href={selectedUser.verificationDocs.aadhaarCard}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-brand text-white hover:bg-brand-dark rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 shadow-sm"
                                >
                                  <ExternalLink size={12} /> View File
                                </a>
                              ) : (
                                <span className="text-[10px] font-semibold text-[var(--text-muted)] italic">Not uploaded</span>
                              )}
                            </div>

                            {/* Profile Photo */}
                            <div className="p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 overflow-hidden">
                                  {selectedUser.verificationDocs?.profilePhoto || selectedUser.profilePicture ? (
                                    <img 
                                      src={selectedUser.verificationDocs?.profilePhoto || selectedUser.profilePicture} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <ImageIcon size={18} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">Agent Profile Photo</p>
                                  <p className="text-[10px] text-[var(--text-muted)] truncate">Avatar / Identity Photo</p>
                                </div>
                              </div>
                              {selectedUser.verificationDocs?.profilePhoto || selectedUser.profilePicture ? (
                                <a
                                  href={selectedUser.verificationDocs?.profilePhoto || selectedUser.profilePicture}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-brand text-white hover:bg-brand-dark rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 shadow-sm"
                                >
                                  <ExternalLink size={12} /> View Photo
                                </a>
                              ) : (
                                <span className="text-[10px] font-semibold text-[var(--text-muted)] italic">Not uploaded</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Builder Documents Details */}
                      {selectedUser.role === 'Builder' && (
                        <div className="space-y-3">
                          <div className="p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl space-y-2">
                            <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              <Building2 size={14} className="text-brand" /> Company Profile
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Company Name</span>
                                <span className="font-bold text-[var(--text-primary)]">{selectedUser.companyName || 'Not submitted'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">RERA Number</span>
                                <span className="font-bold font-mono text-[var(--text-primary)] break-all">{selectedUser.reraNumber || 'Not submitted'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">GST Number</span>
                                <span className="font-mono text-[var(--text-primary)]">{selectedUser.gstNumber || 'Not provided'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">Years in Business</span>
                                <span className="font-semibold text-[var(--text-primary)]">{selectedUser.yearsInBusiness || 'Not provided'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-[var(--text-primary)]">Company Verification Documents</h4>
                            
                            {/* RERA Certificate */}
                            <div className="p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                                  <FileText size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">Developer RERA Certificate</p>
                                  <p className="text-[10px] text-[var(--text-muted)] truncate">RERA License</p>
                                </div>
                              </div>
                              {selectedUser.builderDocs?.reraCertificate ? (
                                <a
                                  href={selectedUser.builderDocs.reraCertificate}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-brand text-white hover:bg-brand-dark rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 shadow-sm"
                                >
                                  <ExternalLink size={12} /> View File
                                </a>
                              ) : (
                                <span className="text-[10px] font-semibold text-[var(--text-muted)] italic">Not uploaded</span>
                              )}
                            </div>

                            {/* PAN Card */}
                            <div className="p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                                  <FileText size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">Company PAN Card</p>
                                  <p className="text-[10px] text-[var(--text-muted)] truncate">Tax Identification Document</p>
                                </div>
                              </div>
                              {selectedUser.builderDocs?.panCard ? (
                                <a
                                  href={selectedUser.builderDocs.panCard}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-brand text-white hover:bg-brand-dark rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 shadow-sm"
                                >
                                  <ExternalLink size={12} /> View File
                                </a>
                              ) : (
                                <span className="text-[10px] font-semibold text-[var(--text-muted)] italic">Not uploaded</span>
                              )}
                            </div>

                            {/* Company Logo */}
                            <div className="p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 overflow-hidden">
                                  {selectedUser.builderDocs?.companyLogo || selectedUser.profilePicture ? (
                                    <img 
                                      src={selectedUser.builderDocs?.companyLogo || selectedUser.profilePicture} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <ImageIcon size={18} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">Company Logo</p>
                                  <p className="text-[10px] text-[var(--text-muted)] truncate">Brand Logo Asset</p>
                                </div>
                              </div>
                              {selectedUser.builderDocs?.companyLogo || selectedUser.profilePicture ? (
                                <a
                                  href={selectedUser.builderDocs?.companyLogo || selectedUser.profilePicture}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-brand text-white hover:bg-brand-dark rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 shadow-sm"
                                >
                                  <ExternalLink size={12} /> View Logo
                                </a>
                              ) : (
                                <span className="text-[10px] font-semibold text-[var(--text-muted)] italic">Not uploaded</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {userDrawerTab === 'Listings' && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {listingsList.length === 0 ? (
                        <div className="text-center py-6 text-[var(--text-muted)] font-semibold text-[10px] bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl">
                          {selectedUser.role === 'Buyer' ? 'Buyers cannot upload listings.' : 'No listings uploaded yet.'}
                        </div>
                      ) : (
                        listingsList.map((p) => (
                          <div key={p.id} className="p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl flex gap-3 items-center hover:border-[var(--border)] transition-colors">
                            <img src={p.photoUrl} alt="" className="w-10 h-10 object-cover rounded-xl shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[var(--text-primary)] text-[10px] truncate">{p.title}</p>
                              <p className="text-[9px] text-[var(--text-muted)] truncate">{p.location} • {p.price}</p>
                            </div>
                            <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded-md uppercase shrink-0 ${
                              p.status === 'Approved' ? 'bg-green-500/10 text-green-700' :
                              p.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-700' : 'bg-red-500/10 text-red-700'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {userDrawerTab === 'Enquiries' && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {enquiriesList.length === 0 ? (
                        <div className="text-center py-6 text-[var(--text-muted)] font-semibold text-[10px] bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl">
                          No callback requests logged for this account.
                        </div>
                      ) : (
                        enquiriesList.map((l) => (
                          <div key={l.id} className="p-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-2xl space-y-1.5 hover:border-[var(--border)] transition-colors">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-[var(--text-primary)] text-[10px] truncate">{l.property}</span>
                              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-700 text-[8px] font-extrabold rounded-md uppercase shrink-0">
                                {l.type}
                              </span>
                            </div>
                            <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-semibold">
                              <span>Logged: {l.date}</span>
                              <span className={`${
                                l.status === 'Resolved' || l.status === 'Approved' || l.status === 'Closed' ? 'text-green-600' :
                                l.status === 'Contacted' ? 'text-blue-600' : 'text-yellow-600'
                              } font-extrabold`}>{l.status}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Drawer actions */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                  <Activity size={12} /> Account Operations
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { openEditUserModal(selectedUser); }}
                    className="py-2.5 px-3 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-brand/10"
                  >
                    <Edit size={14} /> Edit details
                  </button>
                  <button
                    type="button"
                    onClick={() => { toggleUserStatus(selectedUser.id); }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedUser.status === 'Active'
                        ? 'border border-red-500/25 hover:bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/10'
                    }`}
                  >
                    {selectedUser.status === 'Active' ? 'Block Account' : 'Activate User'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { alert(`Password reset link generated for ${selectedUser.name}`); }}
                    className="py-2.5 px-3 border border-[var(--border)] hover:bg-[var(--bg-muted)] rounded-xl text-xs font-bold text-[var(--text-subtle)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound size={14} /> Reset Password
                  </button>
                  <button
                    type="button"
                    onClick={() => { deleteUser(selectedUser.id); }}
                    className="py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-4 relative animate-scale-in">
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-subtle)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Add User Profile</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Create a new registered user in the database directory</p>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. rahul@example.com"
                  className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="e.g. +91 99887 76655"
                  className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">System Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-muted)] text-[var(--text-primary)]"
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="Seller">Seller</option>
                    <option value="Agent">Agent</option>
                    <option value="Builder">Builder</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Status</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-muted)] text-[var(--text-primary)]"
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
                  className="rounded border-slate-300 dark:border-slate-700 bg-transparent text-brand focus:ring-brand"
                />
                <label htmlFor="add-verify" className="text-xs font-semibold text-[var(--text-subtle)] select-none">
                  Mark profile as KYC verified (RERA/Identity check)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="flex-1 py-2.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 transition-all"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-4 relative animate-scale-in">
            <button
              type="button"
              onClick={() => setIsEditUserModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-subtle)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Edit User Details</h3>
              <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 flex-wrap">
                Modify properties for user ID: 
                <span 
                  onClick={() => {
                    navigator.clipboard.writeText(editUserData.id);
                    triggerToast('Copied ID to clipboard!');
                  }}
                  className="font-mono bg-[var(--bg-muted)] hover:bg-[var(--border)] text-[var(--text-subtle)] px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-0.5 select-all"
                  title="Click to copy User ID"
                >
                  {editUserData.id}
                  <Copy size={8} />
                </span>
              </p>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  placeholder="e.g. rahul@example.com"
                  className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editUserData.phone}
                  onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                  placeholder="e.g. +91 99887 76655"
                  className="w-full p-2.5 border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-xl text-xs focus:outline-none focus:border-brand/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">System Role</label>
                  <select
                    value={editUserData.role}
                    onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-muted)] text-[var(--text-primary)]"
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="Seller">Seller</option>
                    <option value="Agent">Agent</option>
                    <option value="Builder">Builder</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">Status</label>
                  <select
                    value={editUserData.status}
                    onChange={(e) => setEditUserData({ ...editUserData, status: e.target.value })}
                    className="w-full p-2.5 border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-muted)] text-[var(--text-primary)]"
                  >
                    <option value="Active">Active</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>

              {/* Role-Specific Verification Status Controls */}
              {editUserData.role === 'Agent' && (
                <div className="space-y-1 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <label className="block text-[10px] font-bold text-blue-600 uppercase">Agent RERA Verification</label>
                  <select
                    value={editUserData.agentVerificationStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setEditUserData({
                        ...editUserData,
                        agentVerificationStatus: newStatus,
                        isVerified: newStatus === 'approved'
                      });
                    }}
                    className="w-full p-2 border border-[var(--border)] rounded-lg text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="approved">Approved & Verified (Can post listings)</option>
                    <option value="pending">Pending Review (Under evaluation)</option>
                    <option value="rejected">Rejected</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              )}

              {editUserData.role === 'Builder' && (
                <div className="space-y-1 p-2.5 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                  <label className="block text-[10px] font-bold text-purple-600 uppercase">Developer Company Verification</label>
                  <select
                    value={editUserData.builderVerificationStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setEditUserData({
                        ...editUserData,
                        builderVerificationStatus: newStatus,
                        isVerified: newStatus === 'approved'
                      });
                    }}
                    className="w-full p-2 border border-[var(--border)] rounded-lg text-xs focus:outline-none focus:border-brand/40 bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    <option value="approved">Approved & Verified (Can launch projects)</option>
                    <option value="pending">Pending Review (Under evaluation)</option>
                    <option value="rejected">Rejected</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              )}

              {editUserData.role !== 'Agent' && editUserData.role !== 'Builder' && (
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="edit-verify"
                    checked={editUserData.isVerified}
                    onChange={(e) => setEditUserData({ ...editUserData, isVerified: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-700 bg-transparent text-brand focus:ring-brand cursor-pointer"
                  />
                  <label htmlFor="edit-verify" className="text-xs font-semibold text-[var(--text-subtle)] select-none cursor-pointer">
                    Mark profile as KYC verified
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="flex-1 py-2.5 border border-[var(--border)] hover:bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-55 bg-slate-900 border border-slate-800 text-white py-3.5 px-6 rounded-2xl shadow-2xl flex items-center justify-between gap-6 animate-slide-up max-w-lg w-[calc(100%-2rem)] sm:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-5 h-5 rounded-full bg-brand text-white font-extrabold flex items-center justify-center text-[10px]">
              {selectedIds.length}
            </span>
            <span className="font-semibold text-slate-300">users selected</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={triggerBulkBlock}
              className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Lock size={12} /> Suspend
            </button>
            <button
              type="button"
              onClick={triggerBulkDelete}
              className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 size={12} /> Delete
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="py-1.5 px-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification Popup */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-55 py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up border ${
          toast.type === 'success' 
            ? 'bg-emerald-950 border-emerald-800 text-emerald-300' 
            : 'bg-rose-950 border-rose-800 text-rose-300'
        }`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-pulse'}`} />
          <div className="text-xs">
            <p className="font-extrabold text-white">{toast.type === 'success' ? 'Success' : 'Error'}</p>
            <p className={`text-[10px] ${toast.type === 'success' ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
