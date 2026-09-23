import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { Sale, Customer } from '../types';
import {
  X,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  UserCheck,
  Receipt,
  Eye,
  Calendar,
  Phone,
  Unlink,
} from 'lucide-react';
import { formatCurrency, formatShortDate } from '../utils/formatters';

interface LinkUnpaidBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerId?: string;
}

export const LinkUnpaidBillsModal: React.FC<LinkUnpaidBillsModalProps> = ({
  isOpen,
  onClose,
  preselectedCustomerId,
}) => {
  const {
    sales,
    customers,
    linkBillToCustomer,
    unlinkBillFromCustomer,
    addCustomer,
    setCurrentBillForPrint,
  } = useShop();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unlinked' | 'linked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Linking modal state for a specific bill
  const [linkingBill, setLinkingBill] = useState<Sale | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomerId || '');
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [linkSuccessMessage, setLinkSuccessMessage] = useState<string | null>(null);

  // Filter bills that are credit or unpaid
  const unpaidBills = useMemo(() => {
    return sales.filter(
      (s) => (s.paymentMode === 'ઉધાર' || s.isCredit || s.creditStatus !== 'PAID')
    );
  }, [sales]);

  const filteredBills = useMemo(() => {
    return unpaidBills.filter((bill) => {
      // Status filter
      if (activeFilter === 'unlinked' && bill.customerId) return false;
      if (activeFilter === 'linked' && !bill.customerId) return false;
      if (preselectedCustomerId && bill.customerId !== preselectedCustomerId && activeFilter === 'linked') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesBillNum = bill.billNumber.toLowerCase().includes(q);
        const matchesCustName = (bill.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (bill.customerPhone || '').includes(q);
        const matchesItems = bill.items.some((i) => i.productName.toLowerCase().includes(q));
        if (!matchesBillNum && !matchesCustName && !matchesPhone && !matchesItems) return false;
      }

      return true;
    });
  }, [unpaidBills, activeFilter, searchQuery, preselectedCustomerId]);

  const unlinkedCount = useMemo(() => {
    return unpaidBills.filter((b) => !b.customerId).length;
  }, [unpaidBills]);

  if (!isOpen) return null;

  const handleOpenLinkModal = (bill: Sale) => {
    setLinkingBill(bill);
    // If bill already has a customerName matching an existing customer, pre-select
    if (bill.customerId) {
      setSelectedCustomerId(bill.customerId);
    } else if (bill.customerName) {
      const match = customers.find(
        (c) => c.name.toLowerCase().trim() === bill.customerName!.toLowerCase().trim()
      );
      if (match) {
        setSelectedCustomerId(match.id);
      } else {
        setSelectedCustomerId('');
        setNewCustName(bill.customerName || '');
        setNewCustPhone(bill.customerPhone || '');
      }
    } else {
      setSelectedCustomerId('');
      setNewCustName('');
      setNewCustPhone('');
    }
    setIsCreatingNewCustomer(false);
  };

  const handleConfirmLink = () => {
    if (!linkingBill) return;

    let targetCustId = selectedCustomerId;

    if (isCreatingNewCustomer) {
      if (!newCustName.trim()) {
        alert('કૃપા કરીને ગ્રાહકનું નામ દાખલ કરો.');
        return;
      }
      const newCust = addCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        address: newCustAddress.trim() || undefined,
        openingBalance: 0,
      });
      targetCustId = newCust.id;
    }

    if (!targetCustId) {
      alert('કૃપા કરીને લિંક કરવા માટે કોઈ ગ્રાહક પસંદ કરો.');
      return;
    }

    const success = linkBillToCustomer(linkingBill.id, targetCustId);
    if (success) {
      const custObj = customers.find((c) => c.id === targetCustId) || { name: newCustName };
      setLinkSuccessMessage(`${linkingBill.billNumber} સફળતાપૂર્વક "${custObj.name}" ના ખાતા સાથે જોડાઈ ગયું!`);
      setTimeout(() => setLinkSuccessMessage(null), 3000);
      setLinkingBill(null);
    }
  };

  const handleUnlink = (billId: string, billNum: string) => {
    if (window.confirm(`શું તમે ${billNum} ને ગ્રાહક ખાતામાંથી અનલિંક (છૂટું) કરવા માંગો છો?`)) {
      unlinkBillFromCustomer(billId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col border border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                બાકી બિલો અને ગ્રાહક લિંકિંગ હબ
              </h3>
              <p className="text-xs text-stone-500">
                અનપેઇડ બિલોને યોગ્ય ગ્રાહકના ઉધાર ખાતા સાથે જોડો જેથી હિસાબ ચોક્કસ રહે.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {linkSuccessMessage && (
          <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-2.5 border-b border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{linkSuccessMessage}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-stone-200 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              બધા બાકી બિલો ({unpaidBills.length})
            </button>
            <button
              onClick={() => setActiveFilter('unlinked')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'unlinked'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 hover:bg-amber-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>અનલિંક બિલો ({unlinkedCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter('linked')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'linked'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              લિંક થયેલ બિલો ({unpaidBills.length - unlinkedCount})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="બિલ નં, ગ્રાહક કે વસ્તુ શોધો..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Bill List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredBills.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <Receipt className="w-12 h-12 mx-auto mb-2 text-stone-300" />
              <p className="text-sm font-semibold text-stone-700">કોઈ બાકી બિલ મળ્યા નથી</p>
              <p className="text-xs text-stone-400 mt-1">
                બધા બિલો ચૂકવાઈ ગયેલ છે અથવા શોધ પરિણામ ખાલી છે.
              </p>
            </div>
          ) : (
            filteredBills.map((bill) => {
              const linkedCustomer = customers.find((c) => c.id === bill.customerId);
              const paidAmount = bill.paidAmount || 0;
              const dueAmount = Math.max(0, bill.grandTotal - paidAmount);
              const isUnlinked = !bill.customerId;

              return (
                <div
                  key={bill.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isUnlinked
                      ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                      : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
                  }`}
                >
                  {/* Bill Details */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm font-mono">
                        {bill.billNumber}
                      </span>
                      <span className="text-xs text-stone-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatShortDate(bill.date)}
                      </span>
                      {isUnlinked ? (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>ખાતું લિંક નથી</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          <span>લિંક થયેલ: {linkedCustomer?.name || bill.customerName}</span>
                        </span>
                      )}
                    </div>

                    {/* Customer info preview */}
                    <div className="text-xs text-stone-600 flex flex-wrap items-center gap-2">
                      <span>બિલ પર નામ: <strong>{bill.customerName || 'અજ્ઞાત ગ્રાહક'}</strong></span>
                      {bill.customerPhone && (
                        <span className="flex items-center gap-0.5 text-stone-500 font-mono text-[11px]">
                          <Phone className="w-3 h-3" />
                          {bill.customerPhone}
                        </span>
                      )}
                    </div>

                    {/* Items snippet */}
                    <div className="text-[11px] text-stone-500 truncate max-w-md">
                      વસ્તુઓ: {bill.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                    </div>
                  </div>

                  {/* Right Column: Amounts & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200">
                    <div className="text-right">
                      <div className="text-base font-bold text-stone-900 font-mono">
                        {formatCurrency(bill.grandTotal)}
                      </div>
                      {paidAmount > 0 && (
                        <div className="text-[11px] text-stone-500">
                          જમા: {formatCurrency(paidAmount)} | બાકી:{' '}
                          <span className="font-bold text-rose-600 font-mono">
                            {formatCurrency(dueAmount)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentBillForPrint(bill)}
                        title="બિલ જુઓ / પ્રિન્ટ"
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {isUnlinked ? (
                        <button
                          onClick={() => handleOpenLinkModal(bill)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>ગ્રાહક લિંક કરો</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenLinkModal(bill)}
                            className="text-xs text-teal-700 hover:text-teal-900 font-semibold px-2 py-1 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          >
                            બદલો
                          </button>
                          <button
                            onClick={() => handleUnlink(bill.id, bill.billNumber)}
                            title="અનલિંક કરો"
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center rounded-b-2xl text-xs text-stone-500">
          <div>
            કુલ બાકી બિલો:{' '}
            <strong className="text-stone-800 font-mono">{unpaidBills.length}</strong> | અનલિંક:{' '}
            <strong className="text-amber-700 font-mono">{unlinkedCount}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold transition-colors cursor-pointer"
          >
            બંધ કરો
          </button>
        </div>
      </div>

      {/* Sub-modal: Link Specific Bill to Customer */}
      {linkingBill && (
        <div className="fixed inset-0 z-60 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h4 className="font-bold text-stone-900 text-base">
                  {linkingBill.billNumber} ને ગ્રાહક સાથે જોડો
                </h4>
                <p className="text-xs text-stone-500">
                  બિલ રકમ: <span className="font-bold font-mono text-stone-800">{formatCurrency(linkingBill.grandTotal)}</span>
                </p>
              </div>
              <button
                onClick={() => setLinkingBill(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle: Select Existing vs Create New */}
            <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIsCreatingNewCustomer(false)}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  !isCreatingNewCustomer
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                હાલના ગ્રાહકોમાંથી પસંદ કરો
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewCustomer(true);
                  if (!newCustName && linkingBill.customerName) {
                    setNewCustName(linkingBill.customerName);
                  }
                  if (!newCustPhone && linkingBill.customerPhone) {
                    setNewCustPhone(linkingBill.customerPhone);
                  }
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  isCreatingNewCustomer
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ નવો ગ્રાહક ઉમેરો</span>
              </button>
            </div>

            {/* Mode 1: Select from existing */}
            {!isCreatingNewCustomer ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-700 block">
                  ગ્રાહક પસંદ કરો:
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="">-- ગ્રાહક પસંદ કરો --</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} {cust.phone ? `(${cust.phone})` : ''}
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-xs text-amber-600">
                    હજુ સુધી કોઈ ગ્રાહક ઉમેરેલ નથી. કૃપા કરીને "+ નવો ગ્રાહક ઉમેરો" પસંદ કરો.
                  </p>
                )}
              </div>
            ) : (
              /* Mode 2: Create new customer inline */
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    ગ્રાહકનું નામ *
                  </label>
                  <input
                    type="text"
                    value={newCustName}
                    placeholder="દા.ત. રમેશભાઈ પટેલ"
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    મોબાઈલ નંબર
                  </label>
                  <input
                    type="text"
                    value={newCustPhone}
                    placeholder="દા.ત. 98765 43210"
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    સરનામું (વૈકલ્પિક)
                  </label>
                  <input
                    type="text"
                    value={newCustAddress}
                    placeholder="દા.ત. પટેલ વાસ, સ્ટેશન રોડ"
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setLinkingBill(null)}
                className="flex-1 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
              >
                રદ કરો
              </button>
              <button
                type="button"
                onClick={handleConfirmLink}
                className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                લિંક સાચવો
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
