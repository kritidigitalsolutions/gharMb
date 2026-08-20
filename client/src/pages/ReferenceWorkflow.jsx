import React, { useState, useEffect } from 'react';
import {
  Users, Gift, Award, CheckCircle2, XCircle, Clock,
  Search, Filter, Plus, ArrowRight, IndianRupee,
  Share2, ShieldCheck, UserCheck, ExternalLink, Calendar,
  Copy, Check, Trash2, X, Send, Eye
} from 'lucide-react';

const ReferenceWorkflow = () => {
  const [references, setReferences] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRef, setSelectedRef] = useState(null);
  const [payoutModal, setPayoutModal] = useState(null);
  const [payoutRefId, setPayoutRefId] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const initialReferences = [
    {
      id: 'REF-7712',
      referrerName: 'Rajesh Malhotra',
      referrerPhone: '+91 88990 01122',
      referrerRole: 'Existing Buyer (Ambassador)',
      referralCode: 'RAJESH-GHAR-26',
      refereeName: 'Vikram Joshi (Colleague)',
      refereePhone: '+91 99112 23344',
      refereeEmail: 'v.joshi@techpulse.io',
      linkedDealType: 'Property Purchase',
      linkedProperty: 'PROP-9821 (Godrej Woods Sector 43)',
      dealValue: '₹2.45 Cr',
      rewardAmount: 50000,
      rewardType: 'Cashback Payout (0.25% Deal Bonus)',
      payoutStatus: 'Eligible for Payout', // Pending Audit, Deal In Progress, Eligible for Payout, Paid, Rejected
      payoutDate: '20 Jun 2026',
      bankDetails: 'HDFC Bank • A/C ...9901 • IFSC HDFC0001234',
      upiId: 'rajesh.malhotra@okaxis',
      notes: 'Referee completed token booking on 15 Jun. Eligible for ₹50,000 ambassador reward.'
    },
    {
      id: 'REF-8840',
      referrerName: 'Sandeep Sharma',
      referrerPhone: '+91 98123 45678',
      referrerRole: 'Certified Channel Partner',
      referralCode: 'SANDEEP-CP-99',
      refereeName: 'Dr. Alok Verma',
      refereePhone: '+91 98123 45678',
      refereeEmail: 'dralok.verma@aiims.edu',
      linkedDealType: 'Builder Floor Purchase',
      linkedProperty: 'PROP-4920 (DLF Phase 2 Floor)',
      dealValue: '₹1.85 Cr',
      rewardAmount: 92500,
      rewardType: 'Channel Partner Brokerage (0.50%)',
      payoutStatus: 'Paid',
      payoutDate: '16 Jun 2026',
      bankDetails: 'ICICI Bank • A/C ...4567 • IFSC ICIC0000102',
      upiId: 'sandeep.realty@icici',
      notes: 'Payout processed via NEFT. UTR #ICICINFT20260616-99012.'
    },
    {
      id: 'REF-9921',
      referrerName: 'Pooja Mehta',
      referrerPhone: '+91 98200 88771',
      referrerRole: 'User Referral',
      referralCode: 'POOJA-REF-14',
      refereeName: 'Sunita Reddy',
      refereePhone: '+91 98450 99881',
      refereeEmail: 'sunita.reddy@yahoo.com',
      linkedDealType: 'Home Interior Service',
      linkedProperty: 'SRV-INT-204 (Full Modular Interior)',
      dealValue: '₹14.50 Lakhs',
      rewardAmount: 15000,
      rewardType: 'Interior Service Referral Bonus',
      payoutStatus: 'Deal In Progress',
      payoutDate: 'Pending Work Completion',
      bankDetails: 'Axis Bank • A/C ...8877',
      upiId: 'poojamehta@okhdfcbank',
      notes: 'Interior 3D model approved. Payout triggers on 50% milestone payment.'
    },
    {
      id: 'REF-1102',
      referrerName: 'Ankit Verma',
      referrerPhone: '+91 98765 00112',
      referrerRole: 'App User',
      referralCode: 'ANKIT-MB-02',
      refereeName: 'Rohit Bansal',
      refereePhone: '+91 98100 22334',
      refereeEmail: 'rohit@bansalcorp.com',
      linkedDealType: 'Commercial Space Inquiry',
      linkedProperty: 'PROP-7730 (DLF Cyber City Office)',
      dealValue: '₹14.50 Cr',
      rewardAmount: 100000,
      rewardType: 'High-Value Commercial Bonus',
      payoutStatus: 'Pending Audit',
      payoutDate: 'Under Scrutiny',
      bankDetails: 'SBI A/C ...0011',
      upiId: 'ankit.verma@upi',
      notes: 'Initial client contact established. Verification of genuine referral in progress.'
    }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('gharmb_references_master');
    if (saved) {
      setReferences(JSON.parse(saved));
    } else {
      setReferences(initialReferences);
      localStorage.setItem('gharmb_references_master', JSON.stringify(initialReferences));
    }
  }, []);

  const saveReferences = (updated) => {
    setReferences(updated);
    localStorage.setItem('gharmb_references_master', JSON.stringify(updated));
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmPayout = () => {
    if (!payoutModal || !payoutRefId) {
      alert('Please enter the bank UTR or Payment Reference ID.');
      return;
    }
    const updated = references.map(r => r.id === payoutModal.id ? {
      ...r,
      payoutStatus: 'Paid',
      payoutDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      notes: `${r.notes} | Payout settled with Ref: ${payoutRefId}`
    } : r);

    saveReferences(updated);
    if (selectedRef?.id === payoutModal.id) {
      setSelectedRef({ ...selectedRef, payoutStatus: 'Paid' });
    }
    setPayoutModal(null);
    setPayoutRefId('');
    alert(`Referral reward of ₹${payoutModal.rewardAmount.toLocaleString()} marked as Paid to ${payoutModal.referrerName}.`);
  };

  const handleUpdateStatus = (id, newStatus) => {
    const updated = references.map(r => r.id === id ? { ...r, payoutStatus: newStatus } : r);
    saveReferences(updated);
    if (selectedRef?.id === id) {
      setSelectedRef({ ...selectedRef, payoutStatus: newStatus });
    }
  };

  const filteredRefs = references.filter(r => {
    const matchesStatus = statusFilter === 'All' || r.payoutStatus === statusFilter;
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referrerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.refereeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referralCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.linkedProperty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalRewardsPaid = references
    .filter(r => r.payoutStatus === 'Paid')
    .reduce((sum, r) => sum + r.rewardAmount, 0);

  const totalEligible = references
    .filter(r => r.payoutStatus === 'Eligible for Payout')
    .reduce((sum, r) => sum + r.rewardAmount, 0);

  return (
    <div className="space-y-6">
      
      {/* ─── HEADER METRICS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Total Referral Payouts</span>
            <h3 className="text-xl font-black text-emerald-600">₹{(totalRewardsPaid / 1000).toLocaleString()} K</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Disbursed to advocates</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Award size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Eligible for Payout</span>
            <h3 className="text-xl font-black text-brand">₹{(totalEligible / 1000).toLocaleString()} K</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Ready for bank transfer</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center font-bold">
            <Gift size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Active Deals in Funnel</span>
            <h3 className="text-xl font-black text-blue-600">{references.filter(r => r.payoutStatus === 'Deal In Progress').length} Deals</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Token / Survey in progress</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Registered Referrals</span>
            <h3 className="text-xl font-black text-[var(--text-primary)]">{references.length} Referrals</h3>
            <p className="text-[10px] text-[var(--text-subtle)]">Ambassador network</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
        </div>

      </div>

      {/* ─── MAIN REFERENCES TABLE ─── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden p-6 space-y-5">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-black text-[var(--text-primary)]">Reference & Referral Reward Workflow</h2>
            <p className="text-xs text-[var(--text-muted)]">Track referrer advocates, referee conversions, and approve reward commission payouts</p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search referrer, code, referee..."
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
              <option value="Eligible for Payout">Eligible for Payout</option>
              <option value="Paid">Paid & Settled</option>
              <option value="Deal In Progress">Deal In Progress</option>
              <option value="Pending Audit">Pending Audit</option>
            </select>
          </div>
        </div>

        {/* References Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[9px] font-black uppercase tracking-wider bg-[var(--bg-muted)]/60">
                <th className="py-3.5 px-4 rounded-l-xl">Ref ID</th>
                <th className="py-3.5 px-4">Referrer (Advocate)</th>
                <th className="py-3.5 px-4">Referral Code</th>
                <th className="py-3.5 px-4">Referee (Referred Client)</th>
                <th className="py-3.5 px-4">Linked Property / Deal</th>
                <th className="py-3.5 px-4">Reward Amount</th>
                <th className="py-3.5 px-4">Payout Status</th>
                <th className="py-3.5 px-4 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-muted)] text-xs font-semibold">
              {filteredRefs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--text-muted)] font-semibold">
                    No reference records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredRefs.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--bg-muted)]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand">{r.id}</td>
                    
                    {/* Referrer */}
                    <td className="py-3.5 px-4">
                      <p className="font-black text-[var(--text-primary)]">{r.referrerName}</p>
                      <span className="text-[9px] font-bold text-[var(--text-muted)]">{r.referrerRole}</span>
                    </td>

                    {/* Referral Code */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleCopyCode(r.referralCode)}
                        className="flex items-center gap-1 font-mono text-[10px] font-bold bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] px-2 py-1 rounded-lg border border-[var(--border)] text-[var(--text-primary)] cursor-pointer"
                        title="Click to copy code"
                      >
                        {copiedCode === r.referralCode ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="text-slate-400" />}
                        {r.referralCode}
                      </button>
                    </td>

                    {/* Referee */}
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-[var(--text-primary)]">{r.refereeName}</p>
                      <p className="text-[10px] font-mono text-[var(--text-muted)]">{r.refereePhone}</p>
                    </td>

                    {/* Linked Deal */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[var(--text-primary)] truncate max-w-[180px]">{r.linkedProperty}</p>
                      <span className="text-[9px] font-black text-emerald-600">Deal: {r.dealValue}</span>
                    </td>

                    {/* Reward */}
                    <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                      ₹{r.rewardAmount.toLocaleString()}
                    </td>

                    {/* Payout Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${
                        r.payoutStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        r.payoutStatus === 'Eligible for Payout' ? 'bg-brand-light text-brand border border-brand/20 animate-pulse' :
                        r.payoutStatus === 'Deal In Progress' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                        'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {r.payoutStatus === 'Paid' && <CheckCircle2 size={9} />}
                        {r.payoutStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRef(r)}
                        className="px-2.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-[10px] font-extrabold transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ─── MODAL: PAYOUT AUTHORIZATION ─── */}
      {payoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-3xl max-w-md w-full shadow-2xl border border-[var(--border)] p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[9px] font-black text-brand uppercase">Reward Settlement</span>
                <h3 className="text-sm font-black text-[var(--text-primary)]">Settle Referral Payout</h3>
              </div>
              <button onClick={() => setPayoutModal(null)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 bg-[var(--bg-muted)] rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Beneficiary:</span>
                <span className="font-black text-[var(--text-primary)]">{payoutModal.referrerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Payout Amount:</span>
                <span className="font-black text-emerald-600 text-sm">₹{payoutModal.rewardAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Bank Details:</span>
                <span className="font-mono text-[10px] text-[var(--text-subtle)] text-right">{payoutModal.bankDetails}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">UPI ID:</span>
                <span className="font-mono font-bold text-brand">{payoutModal.upiId}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Bank UTR / Payment Reference ID</label>
              <input
                type="text"
                placeholder="e.g. UTR-HDFC-20260620-889911"
                value={payoutRefId}
                onChange={(e) => setPayoutRefId(e.target.value)}
                className="w-full p-2.5 bg-[var(--bg-muted)] text-xs font-bold text-[var(--text-primary)] rounded-xl border border-[var(--border)] focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmPayout}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Confirm Reward Payout
              </button>
              <button
                type="button"
                onClick={() => setPayoutModal(null)}
                className="py-2.5 px-4 bg-[var(--bg-muted)] rounded-xl text-xs font-bold text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DRAWER: INSPECT REFERRAL ─── */}
      {selectedRef && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] h-full max-w-lg w-full shadow-2xl border-l border-[var(--border)] p-6 overflow-y-auto flex flex-col justify-between space-y-6">
            <div className="space-y-5 text-left">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-brand bg-brand-light px-2 py-0.5 rounded">
                      {selectedRef.id}
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 uppercase">
                      {selectedRef.payoutStatus}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[var(--text-primary)] mt-1">Referrer: {selectedRef.referrerName}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">Code: {selectedRef.referralCode}</p>
                </div>
                <button onClick={() => setSelectedRef(null)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={16} />
                </button>
              </div>

              {/* Reward Financials */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                  <span className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase block">Referral Reward Commission</span>
                  <span className="text-base font-black text-emerald-600 block mt-0.5">₹{selectedRef.rewardAmount.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-[var(--bg-muted)] rounded-xl">
                  <span className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase block">Total Linked Deal Value</span>
                  <span className="text-sm font-black text-[var(--text-primary)] block mt-0.5">{selectedRef.dealValue}</span>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 bg-[var(--bg-muted)] rounded-2xl space-y-2.5 text-xs font-semibold">
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Referee (Referred Client):</span>
                  <span className="font-black text-[var(--text-primary)]">{selectedRef.refereeName}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Referee Contact:</span>
                  <span className="font-mono text-[var(--text-subtle)]">{selectedRef.refereePhone}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Linked Property / Service:</span>
                  <span className="text-brand font-bold">{selectedRef.linkedProperty}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-muted)] pb-1.5">
                  <span className="text-[var(--text-muted)]">Bank Account:</span>
                  <span className="font-mono text-[10px] text-[var(--text-primary)]">{selectedRef.bankDetails}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">UPI ID:</span>
                  <span className="font-mono text-brand">{selectedRef.upiId}</span>
                </div>
              </div>

              {/* Referral Audit Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">Referral Audit Log</label>
                <p className="text-xs p-3 bg-[var(--bg-muted)] text-[var(--text-subtle)] rounded-xl italic border-l-2 border-brand">
                  "{selectedRef.notes}"
                </p>
              </div>

            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[var(--border)] space-y-2">
              {selectedRef.payoutStatus !== 'Paid' && (
                <button
                  type="button"
                  onClick={() => setPayoutModal(selectedRef)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Award size={14} /> Authorize & Settle Reward Payout
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReferenceWorkflow;
