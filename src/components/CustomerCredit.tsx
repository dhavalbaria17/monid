import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { Customer, Sale, CreditPayment } from '../types';
import {
  Users,
  Search,
  UserPlus,
  Link as LinkIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Receipt,
  MessageCircle,
  Filter,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatShortDate } from '../utils/formatters';
import { AddCustomerModal } from './AddCustomerModal';
import { ReceivePaymentModal } from './ReceivePaymentModal';
import { CustomerLedgerModal } from './CustomerLedgerModal';
import { LinkUnpaidBillsModal } from './LinkUnpaidBillsModal';

export const CustomerCredit: React.FC = () => {
  const {
    customers,
    sales,
    creditPayments,
    shopProfile,
    getCustomerBalance,
    getCustomerStats,
    deleteCustomer,
  } = useShop();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [sortBy, setSortBy] = useState<'due-desc' | 'name-asc' | 'recent'>('due-desc');
  const [mainView, setMainView] = useState<'customers' | 'recent-activity'>('customers');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Unlinked bills count
  const unlinkedBills = useMemo(() => {
    return sales.filter(
      (s) => (s.paymentMode === 'ઉધાર' || s.isCredit) && !s.customerId
    );
  }, [sales]);

  // Overall Statistics
  const overallStats = useMemo(() => {
    let totalMarketDue = 0;
    let customersWithDues = 0;

    customers.forEach((c) => {
      const bal = getCustomerBalance(c.id);
      totalMarketDue += bal;
      if (bal > 0) customersWithDues++;
    });

    // Total collections (all credit payments)
    const totalCollected = creditPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalMarketDue,
      customersWithDues,
      totalCustomers: customers.length,
      totalCollected,
      unlinkedCount: unlinkedBills.length,
    };
  }, [customers, creditPayments, unlinkedBills, getCustomerBalance]);

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const balance = getCustomerBalance(c.id);

        if (statusFilter === 'pending' && balance <= 0) return false;
        if (statusFilter === 'settled' && balance > 0) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = c.name.toLowerCase().includes(q);
          const matchesPhone = (c.phone || '').includes(q);
          const matchesAddress = (c.address || '').toLowerCase().includes(q);
          if (!matchesName && !matchesPhone && !matchesAddress) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'due-desc') {
          return getCustomerBalance(b.id) - getCustomerBalance(a.id);
        }
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name, 'gu');
        }
        if (sortBy === 'recent') {
          const statsA = getCustomerStats(a.id);
          const statsB = getCustomerStats(b.id);
          const timeA = statsA.lastTxDate ? new Date(statsA.lastTxDate).getTime() : 0;
          const timeB = statsB.lastTxDate ? new Date(statsB.lastTxDate).getTime() : 0;
          return timeB - timeA;
        }
        return 0;
      });
  }, [customers, searchQuery, statusFilter, sortBy, getCustomerBalance, getCustomerStats]);

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsAddModalOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    const balance = getCustomerBalance(customer.id);
    if (balance > 0) {
      if (
        !window.confirm(
          `ધ્યાન આપો: ${customer.name} પાસે હજુ ₹${balance} બાકી છે! શું તમે ખરેખર આ ગ્રાહકને કાઢી નાખવા માંગો છો?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`શું તમે ${customer.name} ને યાદીમાંથી કાઢી નાખવા માંગો છો?`)) {
        return;
      }
    }
    deleteCustomer(customer.id);
    if (ledgerCustomer?.id === customer.id) {
      setLedgerCustomer(null);
    }
  };

  const handleSendWhatsAppReminder = (customer: Customer) => {
    if (!customer.phone) {
      alert('ગ્રાહકનો મોબાઇલ નંબર નોંધાયેલ નથી.');
      return;
    }
    const bal = getCustomerBalance(customer.id);
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message =
      `નમસ્તે શ્રી ${customer.name}જી,\n` +
      `આપનું ${shopProfile.shopName || 'અમારી દુકાન'} ખાતે ઉધાર ખાતાનું બાકી બેલેન્સ ₹${bal} છે.\n` +
      `કૃપા કરીને સગવડતા મુજબ ચૂકવણી કરવા વિનંતી.\n` +
      `સંપર્ક: ${shopProfile.phone || ''}\n` +
      `આભાર!`;

    const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">ઉધાર ખાતાવહી (Customer Credit)</h1>
              <p className="text-xs text-stone-500">
                ગ્રાહકોના બાકી હિસાબો, ઉધાર બિલો લિંકિંગ અને જમા વસૂલાતનું સરળ સંચાલન
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Link Unpaid Bills Button with Badge */}
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              overallStats.unlinkedCount > 0
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300'
            }`}
          >
            <LinkIcon className="w-4 h-4 text-amber-700" />
            <span>બાકી બિલો લિંક કરો</span>
            {overallStats.unlinkedCount > 0 && (
              <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {overallStats.unlinkedCount} અનલિંક
              </span>
            )}
          </button>

          {/* Add Customer Button */}
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ નવો ગ્રાહક ઉમેરો</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Market Due */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">બજારમાં કુલ બાકી રકમ</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-2">
            {formatCurrency(overallStats.totalMarketDue)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {overallStats.customersWithDues} ગ્રાહકો પાસે બાકી
          </div>
        </div>

        {/* Total Registered Customers */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">કુલ ઉધાર ગ્રાહકો</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-800 mt-2">
            {overallStats.totalCustomers} ગ્રાહક
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {overallStats.totalCustomers - overallStats.customersWithDues} ગ્રાહકોનો હિસાબ ચૂકતે
          </div>
        </div>

        {/* Total Collections Received */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">કુલ વસૂલાત (જમા થયેલ)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            {formatCurrency(overallStats.totalCollected)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {creditPayments.length} જમા રસીદો નોંધાયેલ
          </div>
        </div>

        {/* Unlinked Bills Notification Card */}
        <div
          onClick={() => setIsLinkModalOpen(true)}
          className={`p-5 rounded-2xl border shadow-xs transition-all cursor-pointer ${
            overallStats.unlinkedCount > 0
              ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600">અનલિંક બાકી બિલો</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                overallStats.unlinkedCount > 0
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-stone-100 text-stone-500'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-mono mt-2 ${
              overallStats.unlinkedCount > 0 ? 'text-amber-800' : 'text-stone-800'
            }`}
          >
            {overallStats.unlinkedCount} બિલ
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
            <span>{overallStats.unlinkedCount > 0 ? 'ગ્રાહક લિંક કરવા ક્લિક કરો' : 'બધા બિલો લિંક થયેલ છે'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          </div>
        </div>
      </div>

      {/* Main Content Tabs (Customer Directory vs Recent Activity) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Navigation & Filters Bar */}
        <div className="p-4 border-b border-stone-200 flex flex-col md:flex-row gap-3 items-center justify-between bg-stone-50/70">
          {/* View Toggle */}
          <div className="flex bg-stone-200/80 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setMainView('customers')}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mainView === 'customers'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ગ્રાહક યાદી ({filteredCustomers.length})
            </button>
            <button
              onClick={() => setMainView('recent-activity')}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mainView === 'recent-activity'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              તાજેતરના જમા વ્યવહારો ({creditPayments.length})
            </button>
          </div>

          {/* Search and Sub-filters (when in customers view) */}
          {mainView === 'customers' && (
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="ગ્રાહકનું નામ કે મોબાઈલ શોધો..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-stone-700 cursor-pointer"
              >
                <option value="all">બધા ગ્રાહકો</option>
                <option value="pending">ફક્ત બાકી રકમ વાળા</option>
                <option value="settled">ચૂકતે થયેલ ખાતા</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-stone-700 cursor-pointer"
              >
                <option value="due-desc">સૌથી વધુ બાકી પહેલા</option>
                <option value="name-asc">નામ (A-Z)</option>
                <option value="recent">તાજેતરના વ્યવહાર</option>
              </select>
            </div>
          )}
        </div>

        {/* View 1: Customer Directory Cards */}
        {mainView === 'customers' && (
          <div className="p-4">
            {filteredCustomers.length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <Users className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                <p className="text-base font-semibold text-stone-700">કોઈ ગ્રાહક મળ્યા નથી</p>
                <p className="text-xs text-stone-400 mt-1">
                  શોધ પરિણામ તપાસો અથવા "+ નવો ગ્રાહક ઉમેરો" પર ક્લિક કરીને નવું ખાતું ખોલો.
                </p>
                <button
                  onClick={() => {
                    setEditingCustomer(null);
                    setIsAddModalOpen(true);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>નવો ગ્રાહક ઉમેરો</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCustomers.map((cust) => {
                  const balance = getCustomerBalance(cust.id);
                  const stats = getCustomerStats(cust.id);
                  const hasDue = balance > 0;

                  return (
                    <div
                      key={cust.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        hasDue
                          ? 'bg-white border-stone-200 hover:border-amber-300 hover:shadow-md'
                          : 'bg-stone-50/50 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {/* Customer Info Header */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm ${
                                hasDue
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {cust.name.slice(0, 1)}
                            </div>
                            <div>
                              <h3 className="font-bold text-stone-900 text-sm">{cust.name}</h3>
                              <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                                {cust.phone && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Phone className="w-3 h-3 text-stone-400" />
                                    {cust.phone}
                                  </span>
                                )}
                                {cust.address && (
                                  <span className="truncate max-w-[120px]">{cust.address}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Due Amount Badge */}
                          <div className="text-right">
                            <span className="text-[10px] font-semibold text-stone-400 block">બાકી લેણી</span>
                            <div
                              className={`text-base font-bold font-mono ${
                                hasDue ? 'text-rose-600' : 'text-emerald-700'
                              }`}
                            >
                              {formatCurrency(balance)}
                            </div>
                          </div>
                        </div>

                        {/* Customer Stats Row */}
                        <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-3 gap-1 text-[11px] text-stone-500">
                          <div>
                            <span className="text-stone-400 block text-[10px]">કુલ ખરીદી</span>
                            <span className="font-mono font-semibold text-stone-700">
                              {formatCurrency(stats.totalPurchased + stats.openingBalance)}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">ચૂકવેલ રકમ</span>
                            <span className="font-mono font-semibold text-emerald-700">
                              {formatCurrency(stats.totalPaid)}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">બાકી બિલો</span>
                            <span className="font-mono font-semibold text-amber-700">
                              {stats.unpaidBillsCount} બિલ
                            </span>
                          </div>
                        </div>

                        {cust.notes && (
                          <p className="mt-2 text-[11px] text-stone-500 italic truncate">
                            "{cust.notes}"
                          </p>
                        )}
                      </div>

                      {/* Action Buttons Row */}
                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          {cust.phone && hasDue && (
                            <button
                              onClick={() => handleSendWhatsAppReminder(cust)}
                              title="WhatsApp રીમાઇન્ડર"
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(cust)}
                            title="વિગત સુધારો"
                            className="text-[11px] text-stone-500 hover:text-stone-800 px-2 py-1 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          >
                            એડિટ
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setLedgerCustomer(cust)}
                            className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-xl border border-teal-200 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>ખાતાવહી</span>
                          </button>

                          {hasDue && (
                            <button
                              onClick={() => setPaymentCustomer(cust)}
                              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>જમા લો</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View 2: Recent Credit Payments & Activity */}
        {mainView === 'recent-activity' && (
          <div className="p-4">
            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                    <th className="p-3">તારીખ</th>
                    <th className="p-3">રસીદ નં</th>
                    <th className="p-3">ગ્રાહકનું નામ</th>
                    <th className="p-3">ચૂકવણી પદ્ધતિ</th>
                    <th className="p-3">નોંધ</th>
                    <th className="p-3 text-right">જમા રકમ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {creditPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400">
                        હજુ સુધી કોઈ જમા રસીદ નોંધાયેલ નથી.
                      </td>
                    </tr>
                  ) : (
                    creditPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3 text-stone-600 whitespace-nowrap">
                          {formatShortDate(pay.date)}
                        </td>
                        <td className="p-3 font-mono font-medium text-stone-800 whitespace-nowrap">
                          {pay.receiptNumber || pay.id}
                        </td>
                        <td className="p-3 font-semibold text-stone-900">
                          {pay.customerName}
                        </td>
                        <td className="p-3 text-stone-600">
                          <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px] font-medium">
                            {pay.paymentMode}
                          </span>
                        </td>
                        <td className="p-3 text-stone-500">
                          {pay.note || '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          +{formatCurrency(pay.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddCustomerModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingCustomer(null);
          }}
          editCustomer={editingCustomer}
        />
      )}

      {ledgerCustomer && (
        <CustomerLedgerModal
          isOpen={!!ledgerCustomer}
          onClose={() => setLedgerCustomer(null)}
          customer={ledgerCustomer}
          onEditCustomer={handleOpenEdit}
        />
      )}

      {paymentCustomer && (
        <ReceivePaymentModal
          isOpen={!!paymentCustomer}
          onClose={() => setPaymentCustomer(null)}
          customer={paymentCustomer}
        />
      )}

      {isLinkModalOpen && (
        <LinkUnpaidBillsModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
        />
      )}
    </div>
  );
};
