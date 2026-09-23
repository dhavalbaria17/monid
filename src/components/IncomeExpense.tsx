import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { CashTransaction, TransactionType } from '../types';
import {
  Receipt,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Calendar,
  Filter,
  Download,
  X,
  Check,
} from 'lucide-react';
import {
  formatCurrency,
  formatGujaratiDate,
  getTodayDateString,
  exportToCSV,
} from '../utils/formatters';

const EXPENSE_CATEGORIES = [
  'દુકાન ભાડું',
  'લાઇટ બિલ',
  'દુકાન ખર્ચ / ચા-નાસ્તો',
  'માલસામાન ખરીદી/ટ્રાન્સપોર્ટ',
  'કર્મચારી પગાર / મજૂરી',
  'રિપેરિંગ / મેન્ટેનન્સ',
  'અન્ય ખર્ચ',
];

const INCOME_CATEGORIES = [
  'રોકડ વેચાણ',
  'ઉધાર વસૂલાત',
  'કમિશન / વ્યાજ',
  'અન્ય આવક',
];

export const IncomeExpense: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction } = useShop();

  const [filterType, setFilterType] = useState<'બધા' | 'આવક' | 'જાવક'>('બધા');
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'month' | 'all'>('today');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [txType, setTxType] = useState<TransactionType>('જાવક');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[2]);
  const [amount, setAmount] = useState<number>(100);
  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState<'રોકડ' | 'UPI/બેંક'>('રોકડ');

  const todayStr = getTodayDateString();
  const currentMonthPrefix = todayStr.substring(0, 7); // e.g. "2026-09"

  // Filtered transactions
  const filteredList = useMemo(() => {
    return transactions.filter((t) => {
      // Type filter
      if (filterType !== 'બધા' && t.type !== filterType) return false;

      // Period filter
      if (filterPeriod === 'today') {
        return t.date === todayStr;
      } else if (filterPeriod === 'month') {
        return t.date.startsWith(currentMonthPrefix);
      }
      return true;
    });
  }, [transactions, filterType, filterPeriod, todayStr, currentMonthPrefix]);

  // Summary Metrics for Today
  const todayTransactions = transactions.filter((t) => t.date === todayStr);
  const todayIncome = todayTransactions
    .filter((t) => t.type === 'આવક')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayExpense = todayTransactions
    .filter((t) => t.type === 'જાવક')
    .reduce((sum, t) => sum + t.amount, 0);
  const todayNet = todayIncome - todayExpense;

  // Month Metrics
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonthPrefix));
  const monthIncome = monthTransactions
    .filter((t) => t.type === 'આવક')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = monthTransactions
    .filter((t) => t.type === 'જાવક')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthNet = monthIncome - monthExpense;

  // Submit new transaction
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    addTransaction({
      type: txType,
      category,
      amount: Number(amount),
      date,
      description: description.trim() || category,
      paymentMode,
    });

    setIsModalOpen(false);
    setDescription('');
    setAmount(100);
  };

  // Switch type inside modal
  const handleTypeChange = (newType: TransactionType) => {
    setTxType(newType);
    if (newType === 'આવક') {
      setCategory(INCOME_CATEGORIES[1]); // e.g. ઉધાર વસૂલાત
    } else {
      setCategory(EXPENSE_CATEGORIES[2]); // e.g. ચા-નાસ્તો
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['તારીખ', 'પ્રકાર', 'કેટેગરી', 'વિગત', 'રકમ (₹)', 'ચૂકવણી'];
    const rows = filteredList.map((t) => [
      t.date,
      t.type,
      t.category,
      t.description,
      t.amount,
      t.paymentMode,
    ]);
    exportToCSV(`દુકાન_આવક_જાવક_${todayStr}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            દૈનિક આવક-જાવક હિસાબ (રોકડ મેળ)
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            રોકડ વેચાણ, ખર્ચા, ઉધાર વસૂલાત અને ગલ્લાના પૈસાની દૈનિક નોંધ.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>CSV ડાઉનલોડ</span>
          </button>

          <button
            onClick={() => {
              handleTypeChange('જાવક');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>નવી એન્ટ્રી (આવક/ખર્ચ)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Income */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">આજની કુલ આવક</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {formatCurrency(todayIncome)}
            </div>
            <p className="text-xs text-stone-500 mt-1">વેચાણ + વસૂલાત આવક</p>
          </div>
        </div>

        {/* Today's Expense */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">આજનો કુલ ખર્ચ</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums">
              {formatCurrency(todayExpense)}
            </div>
            <p className="text-xs text-stone-500 mt-1">ભાડું, લાઈટબિલ, ચા-નાસ્તો વગેરે</p>
          </div>
        </div>

        {/* Today's Net Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">આજની ચોખ્ખી બચત</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                todayNet >= 0 ? 'text-teal-700' : 'text-rose-600'
              }`}
            >
              {formatCurrency(todayNet)}
            </div>
            <p className="text-xs text-stone-500 mt-1">આજના ગલ્લાની ચોખ્ખી રોકડ</p>
          </div>
        </div>

        {/* Month Net Balance */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">આ મહિનાની કુલ બચત</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                monthNet >= 0 ? 'text-stone-900' : 'text-rose-600'
              }`}
            >
              {formatCurrency(monthNet)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
              <span className="text-emerald-700 font-mono">+{formatCurrency(monthIncome)}</span>
              <span>/</span>
              <span className="text-rose-700 font-mono">-{formatCurrency(monthExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterPeriod('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterPeriod === 'today'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            આજે
          </button>
          <button
            onClick={() => setFilterPeriod('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterPeriod === 'month'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            આ મહિને
          </button>
          <button
            onClick={() => setFilterPeriod('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterPeriod === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            બધા વ્યવહારો
          </button>
        </div>

        {/* Type Selector */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('બધા')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'બધા'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            બધા ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('આવક')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'આવક'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            માત્ર આવક (+)
          </button>
          <button
            onClick={() => setFilterType('જાવક')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'જાવક'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            માત્ર ખર્ચ (-)
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
              <tr>
                <th className="py-3 px-4">તારીખ</th>
                <th className="py-3 px-4">પ્રકાર</th>
                <th className="py-3 px-4">શ્રેણી / કેટેગરી</th>
                <th className="py-3 px-4">વિગત</th>
                <th className="py-3 px-4">ચૂકવણી</th>
                <th className="py-3 px-4 text-right">રકમ</th>
                <th className="py-3 px-4 text-center">ક્રિયા</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredList.map((tx) => {
                const isIncome = tx.type === 'આવક';

                return (
                  <tr key={tx.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-stone-600 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-900">{tx.category}</td>
                    <td className="py-3 px-4 text-stone-600">{tx.description || '-'}</td>
                    <td className="py-3 px-4 text-stone-500 text-xs">{tx.paymentMode}</td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-base tabular-nums">
                      <span className={isIncome ? 'text-emerald-700' : 'text-rose-700'}>
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`શું તમે આ નોંધણી કાઢી નાખવા માંગો છો?`)) {
                            deleteTransaction(tx.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="કાઢી નાખો"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="text-sm font-medium">આ સમયગાળામાં કોઈ હિસાબ નોંધાયો નથી</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-stone-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="text-base font-bold text-stone-900">
                નવી એન્ટ્રી ઉમેરો ({txType})
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleTypeChange('આવક')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    txType === 'આવક'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  + આવક (Income)
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('જાવક')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    txType === 'જાવક'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  - ખર્ચ (Expense)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  શ્રેણી / કેટેગરી
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {(txType === 'આવક' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    રકમ (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    તારીખ
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ચૂકવણી પદ્ધતિ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('રોકડ')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                      paymentMode === 'રોકડ'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    રોકડ (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI/બેંક')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                      paymentMode === 'UPI/બેંક'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    UPI / ઓનલાઇન બેંક
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  વિગત / નોંધ
                </label>
                <input
                  type="text"
                  placeholder="દા.ત. સ્ટેશનથી ટેમ્પો ભાડું, ચા-નાસ્તો..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 ${
                    txType === 'આવક' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>નોંધ સાચવો</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
