import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

const UserManagement = () => {
  const initialUsers = [
    { id: 'USR-8902', name: 'Alok Mishra', email: 'alok.mishra@gmail.com', phone: '+91 98765 43210', role: 'Buyer', status: 'Active', isVerified: true, listings: 0, date: '10 Jun 2026' },
    { id: 'USR-3120', name: 'Simran Jeet', email: 'simran.jeet@outlook.com', phone: '+91 99887 76655', role: 'Seller', status: 'Active', isVerified: false, listings: 3, date: '12 Jun 2026' },
    { id: 'USR-4811', name: 'Vikram Developers', email: 'info@vikramdev.com', phone: '+91 88776 65544', role: 'Builder', status: 'Active', isVerified: true, listings: 14, date: '08 Jun 2026' },
    { id: 'USR-0922', name: 'Deepak Estates', email: 'deepak.estates@gmail.com', phone: '+91 77665 54433', role: 'Agent', status: 'Blocked', isVerified: false, listings: 8, date: '05 Jun 2026' },
    { id: 'USR-7731', name: 'Sanjay Aggarwal', email: 'sanjay.ag@gmail.com', phone: '+91 98112 23344', role: 'Buyer', status: 'Active', isVerified: true, listings: 0, date: '15 Jun 2026' }
  ];

  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Sorting & Pagination States
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

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
  const triggerBulkBlock = () => {
    setUsers(users.map(u => selectedIds.includes(u.id) ? { ...u, status: 'Blocked' } : u));
    setSelectedIds([]);
    alert('Selected accounts have been suspended successfully.');
  };

  const triggerBulkDelete = () => {
    setUsers(users.filter(u => !selectedIds.includes(u.id)));
    setSelectedIds([]);
    alert('Selected accounts deleted from the directory.');
  };

  // Toggle user status (Block / Unblock)
  const toggleUserStatus = (id) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const newStatus = u.status === 'Active' ? 'Blocked' : 'Active';
        if (selectedUser && selectedUser.id === id) {
          setSelectedUser({ ...selectedUser, status: newStatus });
        }
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const deleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
    setSelectedUser(null);
  };

  // Filters
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'All' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Paginated records
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 relative">
      
      {/* Stats cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-slate-400 block uppercase">Total Users</span>
            <h4 className="text-lg font-bold text-slate-800">{users.length + 840}</h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-slate-400 block uppercase">New Registrations</span>
            <h4 className="text-lg font-bold text-slate-800">18 Users</h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck size={18} />
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-slate-400 block uppercase">Suspended</span>
            <h4 className="text-lg font-bold text-slate-800">
              {users.filter(u => u.status === 'Blocked').length + 12}
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <UserX size={18} />
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-semibold text-slate-400 block uppercase">Verified Profiles</span>
            <h4 className="text-lg font-bold text-slate-800">
              {users.filter(u => u.isVerified).length + 420}
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
        </div>
      </div>

      {/* Main Datatable */}
      <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute top-2.5 left-3.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search user profile name, email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:border-brand/40"
            />
          </div>

          {/* Role filters buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['All', 'Buyer', 'Seller', 'Agent', 'Builder'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => { setSelectedRole(role); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedRole === role
                    ? 'bg-brand text-white shadow-md shadow-brand/10'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Table */}
        {filteredUsers.length === 0 ? (
          /* Custom Empty state illustration */
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto">
              <UserMinus size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">No matching user records found</h4>
              <p className="text-[10px] text-slate-400">Try modifying search criteria or adjusting role filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto relative min-h-[250px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredUsers.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-600" onClick={() => handleSort('id')}>
                    <span className="flex items-center gap-1">User ID <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-slate-600" onClick={() => handleSort('name')}>
                    <span className="flex items-center gap-1">User name <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="py-3 px-4">Contact Detail</th>
                  <th className="py-3 px-4">Account Type</th>
                  <th className="py-3 px-4">KYC Status</th>
                  <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-600" onClick={() => handleSort('listings')}>
                    <span className="flex items-center gap-1 justify-center">Listings <ArrowUpDown size={10} /></span>
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(u.id)}
                        onChange={() => toggleSelectRow(u.id)}
                        className="rounded border-slate-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-500">{u.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{u.name}</td>
                    <td className="py-3 px-4">
                      <p className="text-slate-700 font-semibold">{u.email}</p>
                      <p className="text-[9px] text-slate-400">{u.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-extrabold ${
                        u.role === 'Builder' ? 'bg-purple-50 text-purple-700' :
                        u.role === 'Agent' ? 'bg-blue-50 text-blue-700' :
                        u.role === 'Seller' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-brand'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-lg">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-lg">
                          <ShieldAlert size={12} /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{u.listings}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        u.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800"
                          title="Inspect profile details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u.id)}
                          className={`p-1.5 rounded-lg border ${
                            u.status === 'Active'
                              ? 'border-red-100 text-red-600 hover:bg-red-50'
                              : 'border-green-100 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {u.status === 'Active' ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer controls */}
        {filteredUsers.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-semibold">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} profiles
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl font-bold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white py-3.5 px-6 rounded-2xl shadow-2xl flex items-center gap-6 z-50 border border-slate-800 animate-slide-up">
          <span className="text-xs font-bold">{selectedIds.length} profiles selected</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={triggerBulkBlock}
              className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 shadow-md shadow-red-600/10 cursor-pointer"
            >
              <UserX size={12} /> Suspend Accounts
            </button>
            <button
              type="button"
              onClick={triggerBulkDelete}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} /> Delete Profiles
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="py-1.5 px-3 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Detailed user inspector drawer */}
      {selectedUser && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-6 relative">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <XCircle size={18} />
              </button>

              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center font-bold text-lg text-brand">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-400">{selectedUser.email}</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                    ID: {selectedUser.id}
                  </span>
                  <span className="text-[9px] font-bold bg-orange-50 text-brand px-2 py-0.5 rounded-md">
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Specs parameters lists */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex justify-between text-xs border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-medium">Registered Date</span>
                  <span className="font-semibold text-slate-700">{selectedUser.date}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-medium">Phone number</span>
                  <span className="font-semibold text-slate-700">{selectedUser.phone}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 font-medium">Verified RERA license</span>
                  <span className="font-semibold text-slate-700">{selectedUser.isVerified ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Active Listings</span>
                  <span className="font-bold text-slate-700">{selectedUser.listings} listings</span>
                </div>
              </div>

              {/* Drawer actions */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Activity size={12} /> Account Operations
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { alert(`Reset password reference sent to ${selectedUser.name}`); setSelectedUser(null); }}
                    className="py-2.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound size={14} /> Reset Password
                  </button>
                  <button
                    type="button"
                    onClick={() => { toggleUserStatus(selectedUser.id); setSelectedUser(null); }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedUser.status === 'Active'
                        ? 'border border-red-200 hover:bg-red-50 text-red-600'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/10'
                    }`}
                  >
                    {selectedUser.status === 'Active' ? 'Block Account' : 'Activate User'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { deleteUser(selectedUser.id); }}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} /> Permanently Delete Profile
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;
