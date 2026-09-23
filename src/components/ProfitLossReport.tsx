import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Download,
  Calendar,
  PieChart,
  ShoppingBag,
  Award,
} from 'lucide-react';
import {
  formatCurrency,
  GUJARATI_MONTHS,
  exportToCSV,
} from '../utils/formatters';

export const ProfitLossReport: React.FC = () => {
  const { sales, transactions, shopProfile } = useShop();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12

  // Month string format: "YYYY-MM"
  const targetMonthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // 1. Sales in selected month
  const monthSales = useMemo(() => {
    return sales.filter((s) => s.date.startsWith(targetMonthPrefix));
  }, [sales, targetMonthPrefix]);

  // 2. Expenses in selected month
  const monthExpenses = useMemo(() => {
    return transactions.filter(
      (t) => t.type === 'જાવક' && t.date.startsWith(targetMonthPrefix)
    );
  }, [transactions, targetMonthPrefix]);

  // Financial calculations
  const totalSalesRevenue = useMemo(() => {
    return monthSales.reduce((sum, s) => sum + s.grandTotal, 0);
  }, [monthSales]);

  const totalCostOfGoods = useMemo(() => {
    return monthSales.reduce((sum, s) => sum + s.totalCost, 0);
  }, [monthSales]);

  const grossProfit = totalSalesRevenue - totalCostOfGoods;

  const totalExpenses = useMemo(() => {
    return monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  }, [monthExpenses]);

  const netProfit = grossProfit - totalExpenses;
  const isNetProfitPositive = netProfit >= 0;

  const grossMarginPercent =
    totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(1) : '0';
  const netMarginPercent =
    totalSalesRevenue > 0 ? ((netProfit / totalSalesRevenue) * 100).toFixed(1) : '0';

  // Expense breakdown by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach((exp) => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [monthExpenses]);

  // Top selling products in this month
  const topProducts = useMemo(() => {
    const map: Record<
      string,
      { name: string; unit: string; qty: number; revenue: number; profit: number }
    > = {};

    monthSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.productName,
            unit: item.unit,
            qty: 0,
            revenue: 0,
            profit: 0,
          };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].revenue += item.total;
        map[item.productId].profit +=
          (item.sellingPrice - item.purchasePrice) * item.quantity;
      });
    });

    return Object.values(map).sort((a, b) => b.profit - a.profit);
  }, [monthSales]);

  // Daily breakdown
  const dailyBreakdown = useMemo(() => {
    const dayMap: Record<
      string,
      { date: string; sales: number; cogs: number; profit: number; expense: number }
    > = {};

    monthSales.forEach((s) => {
      const dateKey = s.date.split('T')[0];
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          date: dateKey,
          sales: 0,
          cogs: 0,
          profit: 0,
          expense: 0,
        };
      }
      dayMap[dateKey].sales += s.grandTotal;
      dayMap[dateKey].cogs += s.totalCost;
      dayMap[dateKey].profit += s.profit;
    });

    monthExpenses.forEach((e) => {
      const dateKey = e.date;
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          date: dateKey,
          sales: 0,
          cogs: 0,
          profit: 0,
          expense: 0,
        };
      }
      dayMap[dateKey].expense += e.amount;
    });

    return Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [monthSales, monthExpenses]);

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const monthName = GUJARATI_MONTHS[selectedMonth - 1];
    const headers = ['તારીખ', 'વેચાણ આવક (₹)', 'પડતર કિંમત (₹)', 'ગ્રોસ નફો (₹)', 'ખર્ચ (₹)', 'ચોખ્ખો નફો (₹)'];
    const rows = dailyBreakdown.map((d) => [
      d.date,
      d.sales,
      d.cogs,
      d.profit,
      d.expense,
      d.profit - d.expense,
    ]);

    exportToCSV(`નફો_નુકસાન_અહેવાલ_${monthName}_${selectedYear}.csv`, [
      [`દુકાન: ${shopProfile.shopName} - માસિક નફા-નુકસાન અહેવાલ (${monthName} ${selectedYear})`],
      ['કુલ વેચાણ:', totalSalesRevenue],
      ['માલની પડતર કિંમત:', totalCostOfGoods],
      ['કુલ ગ્રોસ નફો:', grossProfit],
      ['દુકાન ખર્ચા:', totalExpenses],
      ['ચોખ્ખો નફો / નુકસાન:', netProfit],
      [''],
      headers,
      ...rows,
    ]);
  };

  const selectedMonthName = GUJARATI_MONTHS[selectedMonth - 1];

  return (
    <div className="space-y-6">
      {/* Top Banner and Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            માસિક નફા-નુકસાન અહેવાલ (P&L Report)
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {selectedMonthName} {selectedYear} નો વ્યાપાર હિસાબ, ખર્ચા અને ચોખ્ખી કમાણી.
          </p>
        </div>

        {/* Month / Year Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
            <Calendar className="w-4 h-4 text-stone-500 ml-1.5" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs sm:text-sm font-semibold text-stone-900 border-none focus:outline-none pr-1"
            >
              {GUJARATI_MONTHS.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs sm:text-sm font-semibold text-stone-900 border-none focus:outline-none pr-1"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>અહેવાલ પ્રિન્ટ</span>
          </button>
        </div>
      </div>

      {/* Main P&L KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">૧. કુલ વેચાણ આવક</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-stone-900 font-mono tabular-nums">
              {formatCurrency(totalSalesRevenue)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-stone-500">
              <span>{monthSales.length} બિલો દ્વારા વેચાણ</span>
            </div>
          </div>
        </div>

        {/* 2. Cost of Goods Sold (COGS) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">૨. માલની ખરીદ પડતર (COGS)</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <span className="text-xs font-bold font-mono">₹</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-stone-700 font-mono tabular-nums">
              {formatCurrency(totalCostOfGoods)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-stone-500">
              <span>વેચેલા માલની હોલસેલ કિંમત</span>
            </div>
          </div>
        </div>

        {/* 3. Operating Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">૩. દુકાનના કુલ ખર્ચા</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-stone-500">
              <span>ભાડું, બિલ, મજૂરી, અન્ય</span>
            </div>
          </div>
        </div>

        {/* 4. NET PROFIT OR LOSS */}
        <div
          className={`p-5 rounded-2xl border shadow-xs ${
            isNetProfitPositive
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-rose-50/70 border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold ${
                isNetProfitPositive ? 'text-emerald-900' : 'text-rose-900'
              }`}
            >
              ૪. ચોખ્ખો નફો / નુકસાન
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isNetProfitPositive
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'bg-rose-200 text-rose-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                isNetProfitPositive ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {isNetProfitPositive ? '+' : ''}
              {formatCurrency(netProfit)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-stone-700">
              <span className={isNetProfitPositive ? 'text-emerald-800' : 'text-rose-800'}>
                {netMarginPercent}% ચોખ્ખો નફા દર
              </span>
              <span>(ગ્રોસ: {grossMarginPercent}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Revenue Breakdown Bar */}
      {totalSalesRevenue > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-teal-600" />
              <span>વેચાણ આવકની વહેંચણી (Revenue Breakdown)</span>
            </h3>
            <span className="text-xs text-stone-500 font-mono">
              ૧૦૦% = {formatCurrency(totalSalesRevenue)}
            </span>
          </div>

          {/* Stacked Bar */}
          <div className="w-full h-5 bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{
                width: `${Math.min(
                  100,
                  (totalCostOfGoods / totalSalesRevenue) * 100
                )}%`,
              }}
              className="bg-stone-500 h-full transition-all"
              title={`માલની પડતર: ${formatCurrency(totalCostOfGoods)}`}
            />
            <div
              style={{
                width: `${Math.min(
                  100,
                  (totalExpenses / totalSalesRevenue) * 100
                )}%`,
              }}
              className="bg-rose-500 h-full transition-all"
              title={`દુકાન ખર્ચા: ${formatCurrency(totalExpenses)}`}
            />
            {netProfit > 0 && (
              <div
                style={{
                  width: `${Math.min(
                    100,
                    (netProfit / totalSalesRevenue) * 100
                  )}%`,
                }}
                className="bg-emerald-500 h-full transition-all"
                title={`ચોખ્ખો નફો: ${formatCurrency(netProfit)}`}
              />
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs pt-1 text-stone-600 gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-stone-500" />
              <span>
                માલની પડતર: <strong>{formatCurrency(totalCostOfGoods)}</strong> (
                {((totalCostOfGoods / totalSalesRevenue) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span>
                દુકાન ખર્ચા: <strong>{formatCurrency(totalExpenses)}</strong> (
                {((totalExpenses / totalSalesRevenue) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-emerald-800 font-bold">
                ચોખ્ખો નફો: {formatCurrency(netProfit)} ({netMarginPercent}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Top Profit Products & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Profit Products */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>સૌથી વધુ નફો આપતી પ્રોડક્ટ્સ ({selectedMonthName})</span>
            </h3>
            <span className="text-xs text-stone-500">ક્રમ નફા મુજબ</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {topProducts.slice(0, 6).map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-stone-900">{item.name}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    વેચાણ: {item.qty} {item.unit} · કુલ રકમ: ₹{item.revenue}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-700 font-mono text-sm tabular-nums">
                    +{formatCurrency(item.profit)}
                  </div>
                  <div className="text-[10px] text-stone-400">કમાયેલ નફો</div>
                </div>
              </div>
            ))}

            {topProducts.length === 0 && (
              <div className="py-8 text-center text-stone-400 text-xs">
                આ મહિનામાં હજી કોઈ વેચાણ નોંધાયું નથી
              </div>
            )}
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              <span>ખર્ચ વર્ગીકરણ ({selectedMonthName})</span>
            </h3>
            <span className="text-xs font-bold text-rose-700 font-mono">
              કુલ: {formatCurrency(totalExpenses)}
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {expenseByCategory.map(([cat, amt], idx) => (
              <div
                key={idx}
                className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
              >
                <div className="font-semibold text-stone-900">{cat}</div>
                <div className="text-right">
                  <div className="font-bold text-rose-700 font-mono text-sm tabular-nums">
                    {formatCurrency(amt)}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {totalExpenses > 0
                      ? `${((amt / totalExpenses) * 100).toFixed(1)}%`
                      : '0%'}
                  </div>
                </div>
              </div>
            ))}

            {expenseByCategory.length === 0 && (
              <div className="py-8 text-center text-stone-400 text-xs">
                આ મહિનામાં કોઈ ખર્ચ નોંધાયો નથી
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Ledger Breakdown Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              દૈનિક નફા-નુકસાન હિસાબ તાળો
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              રોજિંદા વેચાણ, માલ પડતર, ખર્ચા અને તે દિવસનો ચોખ્ખો નફો
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
              <tr>
                <th className="py-3 px-4">તારીખ</th>
                <th className="py-3 px-4 text-right">વેચાણ આવક (₹)</th>
                <th className="py-3 px-4 text-right">માલ પડતર (₹)</th>
                <th className="py-3 px-4 text-right">ગ્રોસ નફો (₹)</th>
                <th className="py-3 px-4 text-right">દુકાન ખર્ચ (₹)</th>
                <th className="py-3 px-4 text-right">ચોખ્ખો નફો/નુકસાન (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {dailyBreakdown.map((row) => {
                const dayNet = row.profit - row.expense;

                return (
                  <tr key={row.date} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-stone-900 whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-stone-900 tabular-nums">
                      {formatCurrency(row.sales)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-stone-500 tabular-nums">
                      {formatCurrency(row.cogs)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-teal-800 tabular-nums">
                      +{formatCurrency(row.profit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-700 tabular-nums">
                      {row.expense > 0 ? `-${formatCurrency(row.expense)}` : '₹ 0'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-base tabular-nums">
                      <span className={dayNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {dayNet >= 0 ? '+' : ''}
                        {formatCurrency(dayNet)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {dailyBreakdown.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    આ મહિના માટે કોઈ વ્યવહાર મળ્યો નથી
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
