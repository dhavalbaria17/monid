import React, { useState, useMemo, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { Customer, Sale, CreditPayment } from '../types';
import {
  X,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Printer,
  Share2,
  Receipt,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Link as LinkIcon,
  MessageCircle,
} from 'lucide-react';
import { formatCurrency, formatShortDate } from '../utils/formatters';
import { ReceivePaymentModal } from './ReceivePaymentModal';
import { LinkUnpaidBillsModal } from './LinkUnpaidBillsModal';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEditCustomer?: (customer: Customer) => void;
}

interface LedgerRow {
  id: string;
  date: string;
  type: 'OPENING' | 'BILL' | 'PAYMENT' | 'MANUAL_DEBIT' | 'MANUAL_CREDIT';
  label: string;
  reference: string;
  description: string;
  debit: number; // ઉધાર (વધે)
  credit: number; // જમા (ઘટે)
  runningBalance: number;
  saleObj?: Sale;
  paymentObj?: CreditPayment;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEditCustomer,
}) => {
  const {
    sales,
    creditPayments,
    creditManualEntries,
    shopProfile,
    getCustomerBalance,
    getCustomerStats,
    setCurrentBillForPrint,
  } = useShop();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'bills' | 'payments'>('all');

  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !customer) return null;

  const currentBalance = getCustomerBalance(customer.id);
  const stats = getCustomerStats(customer.id);

  // Compile full ledger chronological transactions
  const ledgerRows = useMemo(() => {
    const rows: Array<Omit<LedgerRow, 'runningBalance'>> = [];

    // 1. Opening Balance
    if (customer.openingBalance && customer.openingBalance > 0) {
      rows.push({
        id: `opening-${customer.id}`,
        date: customer.createdAt,
        type: 'OPENING',
        label: 'પ્રારંભિક બાકી',
        reference: '-',
        description: 'ખાતું શરૂ કરતી વખતની બાકી રકમ',
        debit: customer.openingBalance,
        credit: 0,
      });
    }

    // 2. Linked Bills or Bills matching Customer Name
    const customerBills = sales.filter(
      (s) =>
        (s.customerId === customer.id ||
          (!s.customerId && s.customerName && s.customerName.trim().toLowerCase() === customer.name.trim().toLowerCase())) &&
        (s.paymentMode === 'ઉધાર' || s.isCredit)
    );

    customerBills.forEach((b) => {
      rows.push({
        id: `bill-${b.id}`,
        date: b.date,
        type: 'BILL',
        label: 'ઉધાર ખરીદી (બિલ)',
        reference: b.billNumber,
        description: `${b.items.length} વસ્તુઓ: ${b.items.map((i) => i.productName).slice(0, 2).join(', ')}${b.items.length > 2 ? '...' : ''}`,
        debit: b.grandTotal,
        credit: 0,
        saleObj: b,
      });
    });

    // 3. Payments
    const custPayments = creditPayments.filter((p) => p.customerId === customer.id);
    custPayments.forEach((p) => {
      rows.push({
        id: `pay-${p.id}`,
        date: p.date,
        type: 'PAYMENT',
        label: `જમા રસીદ (${p.paymentMode})`,
        reference: p.receiptNumber || 'રસીદ',
        description: p.note || 'ઉધાર ખાતામાં જમા રકમ',
        debit: 0,
        credit: p.amount,
        paymentObj: p,
      });
    });

    // 4. Manual Entries
    const manualEntries = creditManualEntries.filter((e) => e.customerId === customer.id);
    manualEntries.forEach((e) => {
      rows.push({
        id: `me-${e.id}`,
        date: e.date,
        type: e.type === 'DEBIT' ? 'MANUAL_DEBIT' : 'MANUAL_CREDIT',
        label: e.type === 'DEBIT' ? 'અન્ય ઉધાર' : 'અન્ય જમા',
        reference: '-',
        description: e.note || 'અન્ય નોંધ',
        debit: e.type === 'DEBIT' ? e.amount : 0,
        credit: e.type === 'CREDIT' ? e.amount : 0,
      });
    });

    // Sort ascending by date for chronological ledger calculation
    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate Running Balance
    let balance = 0;
    const finalRows: LedgerRow[] = rows.map((r) => {
      balance = balance + r.debit - r.credit;
      return {
        ...r,
        runningBalance: balance,
      };
    });

    // Return in reverse (newest first) for UI viewing
    return finalRows.reverse();
  }, [customer, sales, creditPayments, creditManualEntries]);

  const filteredRows = useMemo(() => {
    if (activeSubTab === 'bills') {
      return ledgerRows.filter((r) => r.type === 'BILL' || r.type === 'OPENING' || r.type === 'MANUAL_DEBIT');
    }
    if (activeSubTab === 'payments') {
      return ledgerRows.filter((r) => r.type === 'PAYMENT' || r.type === 'MANUAL_CREDIT');
    }
    return ledgerRows;
  }, [ledgerRows, activeSubTab]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsAppReminder = () => {
    if (!customer.phone) {
      alert('ગ્રાહકનો મોબાઇલ નંબર નોંધાયેલ નથી.');
      return;
    }

    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const message = `નમસ્તે શ્રી ${customer.name}જી,\n` +
      `આપનું ${shopProfile.shopName || 'અમારી દુકાન'} ખાતે ઉધાર ખાતાનું બાકી બેલેન્સ ₹${currentBalance} છે.\n` +
      `કૃપા કરીને સગવડતા મુજબ ચૂકવણી કરવા વિનંતી.\n` +
      `સંપર્ક: ${shopProfile.phone || ''}\n` +
      `આભાર!`;

    const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] shadow-2xl flex flex-col border border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-start justify-between bg-stone-50/80 rounded-t-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white font-bold flex items-center justify-center text-lg shadow-xs">
              {customer.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-stone-900">{customer.name}</h3>
                {onEditCustomer && (
                  <button
                    onClick={() => onEditCustomer(customer)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold px-2 py-0.5 rounded bg-teal-50 border border-teal-200 cursor-pointer"
                  >
                    સુધારો
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                {customer.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    {customer.phone}
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {customer.address}
                  </span>
                )}
                <span className="flex items-center gap-1 text-stone-400">
                  <Calendar className="w-3.5 h-3.5" />
                  નોંધણી: {formatShortDate(customer.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {customer.phone && (
              <button
                onClick={handleSendWhatsAppReminder}
                title="WhatsApp પર ઉધાર રીમાઇન્ડર મોકલો"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>વોટ્સએપ રીમાઇન્ડર</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              title="ખાતાવહી પ્રિન્ટ કરો"
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action & Stats Ribbon */}
        <div className="p-4 bg-stone-100/70 border-b border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Balance Due Card */}
          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-semibold text-stone-500 block">કુલ બાકી રકમ (Due)</span>
            <div className={`text-lg font-bold font-mono mt-0.5 ${currentBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {formatCurrency(currentBalance)}
            </div>
          </div>

          {/* Total Purchased */}
          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-semibold text-stone-500 block">કુલ ખરીદી / ઉધાર</span>
            <div className="text-lg font-bold font-mono text-stone-800 mt-0.5">
              {formatCurrency(stats.totalPurchased + stats.openingBalance)}
            </div>
          </div>

          {/* Total Paid */}
          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-semibold text-stone-500 block">કુલ ચૂકવેલ રકમ (જમા)</span>
            <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
              {formatCurrency(stats.totalPaid)}
            </div>
          </div>

          {/* Unpaid Bills */}
          <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-semibold text-stone-500 block">બાકી બિલોની સંખ્યા</span>
            <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
              {stats.unpaidBillsCount} / {stats.billsCount} બિલ
            </div>
          </div>
        </div>

        {/* Button Controls */}
        <div className="p-3 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
          {/* Filter Subtabs */}
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              સંપૂર્ણ ખાતાવહી ({ledgerRows.length})
            </button>
            <button
              onClick={() => setActiveSubTab('bills')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'bills'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ઉધાર બિલો
            </button>
            <button
              onClick={() => setActiveSubTab('payments')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'payments'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              જમા રસીદો
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5 text-stone-500" />
              <span>બિલ લિંક કરો</span>
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>જમા રકમ લો (Payment)</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="flex-1 overflow-y-auto p-4" ref={printRef}>
          <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                  <th className="p-3">તારીખ</th>
                  <th className="p-3">વિગત / પ્રકાર</th>
                  <th className="p-3">સંદર્ભ / બિલ નં</th>
                  <th className="p-3 text-right text-amber-900">ઉધાર (+)</th>
                  <th className="p-3 text-right text-emerald-800">જમા (-)</th>
                  <th className="p-3 text-right">બાકી બેલેન્સ</th>
                  <th className="p-3 text-center">ક્રિયા</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">
                      આ ગ્રાહકના ખાતામાં કોઈ વ્યવહાર નોંધાયેલ નથી.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const isDebit = row.debit > 0;
                    return (
                      <tr key={row.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="p-3 text-stone-600 whitespace-nowrap">
                          {formatShortDate(row.date)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {isDebit ? (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            )}
                            <span className="font-semibold text-stone-800">{row.label}</span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">{row.description}</div>
                        </td>
                        <td className="p-3 font-mono font-medium text-stone-700 whitespace-nowrap">
                          {row.reference}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                          {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                          {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-stone-900 whitespace-nowrap">
                          {formatCurrency(row.runningBalance)}
                        </td>
                        <td className="p-3 text-center">
                          {row.saleObj && (
                            <button
                              onClick={() => setCurrentBillForPrint(row.saleObj!)}
                              title="બિલ જુઓ"
                              className="p-1 rounded-lg text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center rounded-b-2xl">
          <div className="text-xs text-stone-500">
            ગ્રાહક ખાતાવહી હિસાબ • {shopProfile.shopName}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
          >
            બંધ કરો
          </button>
        </div>
      </div>

      {/* Child Modal: Receive Payment */}
      {isPaymentModalOpen && (
        <ReceivePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          customer={customer}
        />
      )}

      {/* Child Modal: Link Bills */}
      {isLinkModalOpen && (
        <LinkUnpaidBillsModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          preselectedCustomerId={customer.id}
        />
      )}
    </div>
  );
};
