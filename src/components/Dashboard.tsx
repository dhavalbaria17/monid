import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import {
  TrendingUp,
  Receipt,
  ShoppingCart,
  Boxes,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Wallet,
  Sparkles,
  BookOpen,
  Link as LinkIcon,
} from 'lucide-react';
import { formatCurrency, formatShortDate, getTodayDateString } from '../utils/formatters';
import { LowStockNotificationPanel } from './LowStockNotificationPanel';

export const Dashboard: React.FC = () => {
  const {
    sales,
    transactions,
    customers,
    getCustomerBalance,
    setActiveTab,
    setCurrentBillForPrint,
  } = useShop();

  const todayStr = getTodayDateString();

  // 1. Calculate Today's Metrics
  const todaySales = sales.filter((s) => s.date.startsWith(todayStr));
  const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
  const todayProfitTotal = todaySales.reduce((sum, s) => sum + s.profit, 0);

  const todayExpenses = transactions.filter(
    (t) => t.type === 'જાવક' && t.date === todayStr
  );
  const todayExpensesTotal = todayExpenses.reduce((sum, t) => sum + t.amount, 0);

  const todayOtherIncome = transactions.filter(
    (t) => t.type === 'આવક' && t.date === todayStr && !t.saleId
  );
  const todayOtherIncomeTotal = todayOtherIncome.reduce((sum, t) => sum + t.amount, 0);

  // Net Cash Flow for Today
  const todayNetCash = todaySalesTotal + todayOtherIncomeTotal - todayExpensesTotal;

  // Total Credit Outstanding across all customers
  const totalOutstandingCredit = useMemo(() => {
    return customers.reduce((sum, c) => sum + getCustomerBalance(c.id), 0);
  }, [customers, getCustomerBalance]);

  const unlinkedCreditBills = useMemo(() => {
    return sales.filter((s) => (s.paymentMode === 'ઉધાર' || s.isCredit) && !s.customerId);
  }, [sales]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner / Overview Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            દૈનિક દુકાન સારાંશ (આજનો હિસાબ)
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            આજના વ્યવહારો, આવક-જાવક અને સ્ટોકની તાજી સ્થિતિ એક જ નજરે.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('billing')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>નવું બિલ બનાવો</span>
          </button>
          <button
            onClick={() => setActiveTab('cash_ledger')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-stone-500" />
            <span>ખર્ચ નોંધો</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">આજનું કુલ વેચાણ</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-stone-900 font-mono tabular-nums">
              {formatCurrency(todaySalesTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500">
              <span className="font-semibold text-teal-700">{todaySales.length} બિલો</span>
              <span>બનાવ્યા</span>
            </div>
          </div>
        </div>

        {/* Today's Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">આજનો અંદાજિત નફો</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {formatCurrency(todayProfitTotal)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-stone-500">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {todaySalesTotal > 0
                  ? `${((todayProfitTotal / todaySalesTotal) * 100).toFixed(1)}% નફા માર્જિન`
                  : '૦% માર્જિન'}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">આજનો કુલ ખર્ચ</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums">
              {formatCurrency(todayExpensesTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500">
              <span>{todayExpenses.length} ખર્ચની એન્ટ્રી</span>
            </div>
          </div>
        </div>

        {/* Net Cash In Hand Today */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">આજની ચોખ્ખી રોકડ આવક</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                todayNetCash >= 0 ? 'text-stone-900' : 'text-rose-600'
              }`}
            >
              {formatCurrency(todayNetCash)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500">
              <span>(વેચાણ - આજના ખર્ચા)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Notification Center */}
      <LowStockNotificationPanel />

      {/* Quick Access Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveTab('billing')}
          className="p-4 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-left transition-all hover:border-teal-300 shadow-xs cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-stone-900">નવું વેચાણ (POS)</h4>
          <p className="text-[11px] text-stone-500 mt-0.5">ગ્રાહકને બિલ બનાવી આપો</p>
        </button>

        <button
          onClick={() => setActiveTab('customer_credit')}
          className="p-4 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-left transition-all hover:border-amber-300 shadow-xs cursor-pointer group relative"
        >
          {unlinkedCreditBills.length > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500 ring-4 ring-amber-100" />
          )}
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-stone-900">ઉધાર ખાતું</h4>
            <span className="text-[11px] font-bold text-rose-600 font-mono">
              {formatCurrency(totalOutstandingCredit)}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {unlinkedCreditBills.length > 0
              ? `${unlinkedCreditBills.length} અનલિંક બાકી બિલો`
              : 'ગ્રાહક બાકી હિસાબ'}
          </p>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className="p-4 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-left transition-all hover:border-teal-300 shadow-xs cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Boxes className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-stone-900">સ્ટોક અને વસ્તુઓ</h4>
          <p className="text-[11px] text-stone-500 mt-0.5">જથ્થો અને કેટેગરી</p>
        </button>

        <button
          onClick={() => setActiveTab('price_control')}
          className="p-4 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-left transition-all hover:border-teal-300 shadow-xs cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-stone-900">ભાવ વધઘટ</h4>
          <p className="text-[11px] text-stone-500 mt-0.5">કિંમત બદલો અને નફો વધારો</p>
        </button>

        <button
          onClick={() => setActiveTab('profit_loss')}
          className="p-4 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-left transition-all hover:border-teal-300 shadow-xs cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-stone-900">નફો-નુકસાન</h4>
          <p className="text-[11px] text-stone-500 mt-0.5">માસિક કમાણી અહેવાલ</p>
        </button>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">તાજેતરના વેચાણ બિલો</h3>
            <p className="text-xs text-stone-500 mt-0.5">છેલ્લા બનેલા બિલો અને ચૂકવણી સ્થિતિ</p>
          </div>
          <button
            onClick={() => setActiveTab('billing')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
          >
            <span>+ નવું બિલ</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
              <tr>
                <th className="py-3 px-4">બિલ નં</th>
                <th className="py-3 px-4">તારીખ / સમય</th>
                <th className="py-3 px-4">ગ્રાહક</th>
                <th className="py-3 px-4 text-center">વસ્તુઓ</th>
                <th className="py-3 px-4 text-right">કુલ રકમ</th>
                <th className="py-3 px-4 text-right">નફો</th>
                <th className="py-3 px-4 text-center">ચૂકવણી</th>
                <th className="py-3 px-4 text-center">બિલ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sales.slice(0, 7).map((sale) => (
                <tr key={sale.id} className="hover:bg-stone-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-stone-900">{sale.billNumber}</td>
                  <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                    {formatShortDate(sale.date)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-stone-900">
                      {sale.customerName || 'સામાન્ય ગ્રાહક'}
                    </div>
                    {sale.customerPhone && (
                      <div className="text-[11px] text-stone-400 font-mono">
                        {sale.customerPhone}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums text-stone-600">
                    {sale.items.length} વસ્તુ
                  </td>
                  <td className="py-3 px-4 text-right font-bold font-mono text-stone-900 tabular-nums">
                    {formatCurrency(sale.grandTotal)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold font-mono text-emerald-700 tabular-nums">
                    +{formatCurrency(sale.profit)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        if (sale.paymentMode === 'ઉધાર') {
                          setActiveTab('customer_credit');
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                        sale.paymentMode === 'રોકડ'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sale.paymentMode === 'UPI/ઓનલાઇન'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : sale.customerId
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold cursor-pointer hover:bg-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold cursor-pointer hover:bg-rose-100'
                      }`}
                    >
                      {sale.paymentMode === 'ઉધાર' && !sale.customerId && (
                        <LinkIcon className="w-2.5 h-2.5" />
                      )}
                      <span>
                        {sale.paymentMode === 'ઉધાર'
                          ? sale.customerId
                            ? 'ઉધાર (લિંક)'
                            : 'ઉધાર (અનલિંક)'
                          : sale.paymentMode}
                      </span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setCurrentBillForPrint(sale)}
                      className="p-1.5 text-stone-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                      title="બિલ જુઓ અને પ્રિન્ટ કરો"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
