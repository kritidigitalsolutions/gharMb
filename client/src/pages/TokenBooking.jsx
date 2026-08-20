import React, { useState, useEffect } from 'react';
import {
  IndianRupee, ShieldCheck, Lock, RotateCcw, CheckCircle2,
  XCircle, Clock, Search, Filter, AlertCircle, Download,
  ExternalLink, Calendar, User, Building, ArrowUpRight,
  Sparkles, FileText, Check, ChevronRight, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TokenBooking = () => {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedToken, setSelectedToken] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'release' | 'refund' | 'extend', token }
  const [actionReason, setActionReason] = useState('');

  const initialTokens = [
    {
      id: 'TKN-9821',
      propertyId: 'PROP-9821',
      propertyTitle: 'Godrej Woods Sector 43, Noida',
      buyerName: 'Vikram & Pooja Malhotra',
      buyerPhone: '+91 98111 22334',
      buyerEmail: 'vikram.malhotra@gmail.com',
      sellerName: 'Godrej Properties Ltd',
      sellerRole: 'Builder',
      tokenAmount: 250000,
      totalAgreedPrice: '₹2.45 Cr',
      bookingDate: '15 Jun 2026',
      expiryDate: '30 Jun 2026 (12 Days Left)',
      escrowBank: 'ICICI Escrow Account #...9821',
      utrRef: 'UTR-ICICI-20260615-882190',
      status: 'Escrow Held', // Escrow Held, Released, Refunded, Disputed, Expired
      legalStatus: 'Agreement to Sell Drafted',
      notes: 'Token locked in GharMB Escrow. Verification and registry slot booked for 26 Jun.'
    },
    {
      id: 'TKN-4920',
      propertyId: 'PROP-4920',
      propertyTitle: 'Premium 3 BHK Builder Floor DLF Phase 2',
      buyerName: 'Dr. Alok Verma',
      buyerPhone: '+91 98123 45678',
      buyerEmail: 'dralok.verma@aiims.edu',
      sellerName: 'Sandeep Sharma',
      sellerRole: 'Agent Resale',
      tokenAmount: 100000,
      totalAgreedPrice: '₹1.85 Cr',
      bookingDate: '10 Jun 2026',
      expiryDate: '25 Jun 2026 (7 Days Left)',
      escrowBank: 'HDFC Escrow Account #...4920',
      utrRef: 'UTR-HDFC-20260610-112233',
      status: 'Released',
      legalStatus: 'Registry Completed & Key Handover Done',
      notes: 'Deal completed. Escrow released to seller on 16 Jun 2026.'
    },
    {
      id: 'TKN-7730',
      propertyId: 'PROP-7730',
      propertyTitle: 'DLF Cyber City Grade-A Commercial Office',
      buyerName: 'TechPulse Solutions Ltd (Rep. Kunal Sen)',
      buyerPhone: '+91 99112 23344',
      buyerEmail: 'kunal@techpulse.io',
      sellerName: 'DLF Commercial Division',
      sellerRole: 'Builder',
      tokenAmount: 1000000,
      totalAgreedPrice: '₹14.50 Cr',
      bookingDate: '12 Jun 2026',
      expiryDate: '27 Jun 2026',
      escrowBank: 'Axis Corporate Escrow #...7730',
      utrRef: 'UTR-AXIS-20260612-990011',
      status: 'Escrow Held',
      legalStatus: 'Corporate Lease Deed Under Audit',
      notes: 'High-value commercial escrow. Fitout lock-in clause under review.'
    },
    {
      id: 'TKN-1082',
      propertyId: 'PROP-1082',
      propertyTitle: 'Vatika City Retail Space Sohna Road',
      buyerName: 'Sunita Reddy',
      buyerPhone: '+91 98450 99881',
      buyerEmail: 'sunita.reddy@yahoo.com',
      sellerName: 'Amit Varma',
      sellerRole: 'Owner Resale',
      tokenAmount: 300000,
      totalAgreedPrice: '₹3.20 Cr',
      bookingDate: '01 Jun 2026',
      expiryDate: '16 Jun 2026',
      escrowBank: 'SBI Escrow Account #...1082',
      utrRef: 'UTR-SBI-20260601-554433',
      status: 'Refunded',
      legalStatus: 'Cancelled within 72hr Cooling Period',
      notes: 'Buyer cancelled due to personal relocation. 100% refund processed via gateway.'
    }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('gharmb_tokens_master');
    if (saved) {
      setTokens(JSON.parse(saved));
    } else {
      setTokens(initialTokens);
      localStorage.setItem('gharmb_tokens_master', JSON.stringify(initialTokens));
    }
  }, []);

  const saveTokens = (updated) => {
    setTokens(updated);
    localStorage.setItem('gharmb_tokens_master', JSON.stringify(updated));
  };

  const handleActionConfirm = () => {
    if (!actionModal) return;
    const { type, token } = actionModal;
    let newStatus = token.status;
    let noteAddition = '';

    if (type === 'release') {
      newStatus = 'Released';
      noteAddition = `Escrow token ₹${token.tokenAmount.toLocaleString()} released to ${token.sellerName}. Reason: ${actionReason || 'Deal finalized'}`;
    } else if (type === 'refund') {
      newStatus = 'Refunded';
      noteAddition = `Token refund of ₹${token.tokenAmount.toLocaleString()} processed back to buyer ${token.buyerName}. Reason: ${actionReason || 'Cancellation approved'}`;
    } else if (type === 'dispute') {
      newStatus = 'Disputed';
      noteAddition = `Dispute raised on token. Escrow payout locked. Note: ${actionReason || 'Under review'}`;
    }

    const updated = tokens.map(t => t.id === token.id ? {
      ...t,
      status: newStatus,
      notes: `${t.notes} | ${noteAddition}`
    } : t);

    saveTokens(updated);
    if (selectedToken?.id === token.id) {
      setSelectedToken({ ...selectedToken, status: newStatus, notes: `${selectedToken.notes} | ${noteAddition}` });
    }
    setActionModal(null);
    setActionReason('');
    alert(`Token ${token.id} updated to status: ${newStatus}`);
  };

  const filteredTokens = tokens.filter(t => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesSearch = 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalHeldInEscrow = tokens
    .filter(t => t.status === 'Escrow Held')
    .reduce((sum, t) => sum + t.tokenAmount, 0);

  const totalReleased = tokens
    .filter(t => t.status === 'Released')
    .reduce((sum, t) => sum + t.tokenAmount, 0);

  return (
    <div className="space-y-6">
      
      {/* ─── HEADER KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Escrow Held Amount</span>
            <h3 className="text-xl font-black text-brand">₹{(totalHeldInEscrow / 100000).toFixed(2)} Lakhs</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Protected in GharMB Escrow</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center font-bold">
            <Lock size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Deals Closed (Released)</span>
            <h3 className="text-xl font-black text-emerald-600">₹{(totalReleased / 100000).toFixed(2)} Lakhs</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Disbursed to builders/owners</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Active Token Bookings</span>
            <h3 className="text-xl font-black text-blue-600">{tokens.filter(t => t.status === 'Escrow Held').length} Active</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Within validity window</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Refunds Processed</span>
            <h3 className="text-xl font-black text-slate-700 dark:text-slate-300">{tokens.filter(t => t.status === 'Refunded').length} Refunded</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">100% Policy Adherence</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-600 flex items-center justify-center font-bold">
            <RotateCcw size={20} />
          </div>
        </div>

      </div>

      {/* ─── MAIN TOKEN BOOKINGS TABLE ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden p-6 space-y-5">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-black text-[var(--text-primary)]">Token & Escrow Booking Transactions</h2>
            <p className="text-xs text-[var(--text-muted)]">Track booking advances, release payments to sellers, and manage refunds</p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search by token ID, buyer, property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-[var(--bg-muted)] text-xs font-bold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Escrow Held">Escrow Held (Active)</option>
              <option value="Released">Released (Closed)</option>
              <option value="Refunded">Refunded</option>
              <option value="Disputed">Disputed</option>
            </select>
          </div>
        </div>

        {/* Tokens Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-black uppercase tracking-wider bg-[var(--bg-muted)]/60">
                <th className="py-3.5 px-4 rounded-l-xl">Token ID</th>
                <th className="py-3.5 px-4">Linked Property</th>
                <th className="py-3.5 px-4">Buyer Details</th>
                <th className="py-3.5 px-4">Seller / Developer</th>
                <th className="py-3.5 px-4">Token Booking Amount</th>
                <th className="py-3.5 px-4">Agreed Property Price</th>
                <th className="py-3.5 px-4">Escrow Status</th>
                <th className="py-3.5 px-4 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-muted)] text-xs font-semibold">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--text-muted)] font-semibold">
                    No token booking records found.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--bg-muted)]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand">{t.id}</td>
                    
                    {/* Linked Property */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="text-[10px] font-black text-brand bg-brand-light dark:bg-brand/20 px-1.5 py-0.5 rounded">
                          {t.propertyId}
                        </span>
                        <p className="font-extrabold text-[var(--text-primary)] truncate max-w-[200px] mt-0.5">{t.propertyTitle}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-black text-[var(--text-primary)]">{t.buyerName}</p>
                      <p className="text-[10px] font-mono text-[var(--text-muted)]">{t.buyerPhone}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-[var(--text-primary)]">{t.sellerName}</p>
                      <span className="text-[9px] font-bold text-[var(--text-muted)]">{t.sellerRole}</span>
                    </td>

                    <td className="py-3.5 px-4 text-sm font-black text-emerald-600">
                      ₹{t.tokenAmount.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-[var(--text-primary)]">
                      {t.totalAgreedPrice}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${
                        t.status === 'Escrow Held' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                        t.status === 'Released' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        t.status === 'Refunded' ? 'bg-slate-500/10 text-slate-600 border border-slate-500/20' :
                        'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        {t.status === 'Escrow Held' && <Lock size={9} />}
                        {t.status === 'Released' && <CheckCircle2 size={9} />}
                        {t.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedToken(t)}
                          className="px-2.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-[10px] font-extrabold transition-all cursor-pointer"
                        >
                          Audit Escrow
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ─── MODAL: ESCROW ACTION TRIGGER (RELEASE / REFUND) ─── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[9px] font-black text-brand uppercase">Escrow Authorization</span>
                <h3 className="text-sm font-black text-[var(--text-primary)]">
                  {actionModal.type === 'release' ? 'Release Token to Seller' : 'Process Buyer Refund'}
                </h3>
              </div>
              <button onClick={() => setActionModal(null)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 bg-[var(--bg-muted)] rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Token ID:</span>
                <span className="font-mono font-bold text-brand">{actionModal.token.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Token Amount:</span>
                <span className="font-black text-emerald-600">₹{actionModal.token.tokenAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Beneficiary:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {actionModal.type === 'release' ? actionModal.token.sellerName : actionModal.token.buyerName}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Reason / Transaction Notes</label>
              <textarea
                rows={2}
                placeholder="Enter authorization notes or bank approval reference..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-muted)] text-xs font-semibold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleActionConfirm}
                className={`flex-1 py-2.5 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
                  actionModal.type === 'release' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                }`}
              >
                {actionModal.type === 'release' ? 'Confirm Payout to Seller' : 'Confirm Refund to Buyer'}
              </button>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="py-2.5 px-4 bg-[var(--bg-muted)] rounded-xl text-xs font-bold text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DRAWER: TOKEN & ESCROW INSPECTION ─── */}
      {selectedToken && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-lg w-full shadow-2xl border-l border-[var(--border)] p-6 overflow-y-auto flex flex-col justify-between space-y-6">
            <div className="space-y-5 text-left">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-brand bg-brand-light px-2 py-0.5 rounded">
                      {selectedToken.id}
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 uppercase">
                      {selectedToken.status}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[var(--text-primary)] mt-1">{selectedToken.propertyTitle}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">UTR: {selectedToken.utrRef}</p>
                </div>
                <button onClick={() => setSelectedToken(null)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={16} />
                </button>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                  <span className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase block">Escrow Token Amount</span>
                  <span className="text-base font-black text-emerald-600 block mt-0.5">₹{selectedToken.tokenAmount.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                  <span className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase block">Total Agreed Sale Price</span>
                  <span className="text-sm font-black text-[var(--text-primary)] block mt-0.5">{selectedToken.totalAgreedPrice}</span>
                </div>
              </div>

              {/* Parties Details */}
              <div className="p-4 bg-[var(--bg-muted)] rounded-2xl space-y-2.5 text-xs font-semibold">
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Buyer Name:</span>
                  <span className="text-[var(--text-primary)] font-bold">{selectedToken.buyerName}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Buyer Contact:</span>
                  <span className="font-mono text-[var(--text-subtle)]">{selectedToken.buyerPhone}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Seller / Builder:</span>
                  <span className="text-[var(--text-primary)] font-bold">{selectedToken.sellerName} ({selectedToken.sellerRole})</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Escrow Bank:</span>
                  <span className="font-mono text-[var(--text-primary)]">{selectedToken.escrowBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Validity:</span>
                  <span className="text-amber-600 font-bold">{selectedToken.expiryDate}</span>
                </div>
              </div>

              {/* Legal & Audit Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Escrow Transaction Audit Log</label>
                <p className="text-xs p-3 bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-xl italic border-l-2 border-brand">
                  "{selectedToken.notes}"
                </p>
              </div>

            </div>

            {/* Actions for active token */}
            <div className="pt-4 border-t border-[var(--border)] space-y-2">
              {selectedToken.status === 'Escrow Held' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: 'release', token: selectedToken })}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 size={14} /> Release to Seller
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: 'refund', token: selectedToken })}
                    className="py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RotateCcw size={14} /> Refund to Buyer
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TokenBooking;
