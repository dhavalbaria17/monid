import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Search,
  CheckCircle2,
  History,
  Sliders,
  DollarSign,
  Edit3,
  X,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatGujaratiDate } from '../utils/formatters';

export const PriceDashboard: React.FC = () => {
  const { products, categories, updateSinglePrice, bulkUpdatePrices, priceLogs } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('બધા વિભાગો');
  const [sortBy, setSortBy] = useState<'margin_desc' | 'margin_asc' | 'price_desc' | 'name'>('margin_desc');

  // Bulk adjustment states
  const [bulkCategory, setBulkCategory] = useState('બધા વિભાગો');
  const [bulkTarget, setBulkTarget] = useState<'selling' | 'purchase' | 'both'>('selling');
  const [bulkMode, setBulkMode] = useState<'percentage' | 'fixed'>('percentage');
  const [bulkAction, setBulkAction] = useState<'increase' | 'decrease'>('increase');
  const [bulkAmount, setBulkAmount] = useState<number>(5);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Single edit modal state
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [editSelling, setEditSelling] = useState<number>(0);
  const [editPurchase, setEditPurchase] = useState<number>(0);
  const [editNote, setEditNote] = useState('');

  // Calculated product margins
  const analyzedProducts = useMemo(() => {
    return products.map((prod) => {
      const marginRs = prod.sellingPrice - prod.purchasePrice;
      const marginPercent =
        prod.sellingPrice > 0 ? (marginRs / prod.sellingPrice) * 100 : 0;
      return {
        ...prod,
        marginRs,
        marginPercent,
      };
    });
  }, [products]);

  // Overall Metrics
  const avgMarginPercent = useMemo(() => {
    if (analyzedProducts.length === 0) return 0;
    const total = analyzedProducts.reduce((sum, p) => sum + p.marginPercent, 0);
    return (total / analyzedProducts.length).toFixed(1);
  }, [analyzedProducts]);

  const sortedByMargin = useMemo(() => {
    return [...analyzedProducts].sort((a, b) => b.marginPercent - a.marginPercent);
  }, [analyzedProducts]);

  const highestMarginProduct = sortedByMargin[0];
  const lowestMarginProduct = sortedByMargin[sortedByMargin.length - 1];

  // Filtered & Sorted list
  const filteredProducts = useMemo(() => {
    let list = analyzedProducts.filter((p) => {
      const matchCat = selectedCategory === 'બધા વિભાગો' || p.category === selectedCategory;
      const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCat && matchSearch;
    });

    if (sortBy === 'margin_desc') {
      list.sort((a, b) => b.marginPercent - a.marginPercent);
    } else if (sortBy === 'margin_asc') {
      list.sort((a, b) => a.marginPercent - b.marginPercent);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [analyzedProducts, selectedCategory, searchQuery, sortBy]);

  // Bulk Adjustment Handler
  const handleApplyBulk = () => {
    const finalValue = bulkAction === 'increase' ? Math.abs(bulkAmount) : -Math.abs(bulkAmount);
    const affected = bulkUpdatePrices({
      category: bulkCategory,
      target: bulkTarget,
      type: bulkMode,
      value: finalValue,
    });

    setBulkSuccessMsg(
      `સફળતા! ${affected} પ્રોડક્ટ્સના ભાવમાં ${bulkAction === 'increase' ? 'વધારો' : 'ઘટાડો'} થયો (${bulkAmount}${bulkMode === 'percentage' ? '%' : '₹'}).`
    );
    setTimeout(() => setBulkSuccessMsg(''), 5000);
  };

  // Open single edit modal
  const openSingleEdit = (prod: Product) => {
    setEditingProd(prod);
    setEditSelling(prod.sellingPrice);
    setEditPurchase(prod.purchasePrice);
    setEditNote('');
  };

  // Save single edit
  const handleSaveSingleEdit = () => {
    if (!editingProd) return;
    updateSinglePrice(editingProd.id, editSelling, editPurchase, editNote);
    setEditingProd(null);
  };

  // Quick delta helper
  const handleQuickDelta = (prod: Product, deltaSelling: number) => {
    const newPrice = Math.max(1, prod.sellingPrice + deltaSelling);
    updateSinglePrice(
      prod.id,
      newPrice,
      prod.purchasePrice,
      `ત્વરિત ભાવ ફેરફાર (${deltaSelling > 0 ? '+' : ''}${deltaSelling}₹)`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            પ્રોડક્ટ ભાવ નિયંત્રણ અને વધઘટ ડેશબોર્ડ
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            ખરીદ-વેચાણ કિંમત બદલો, નફાનું માર્જિન ચકાસો અને જથ્થાબંધ ભાવ વધારો/ઘટાડો કરો.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
            સરેરાશ નફા દર: {avgMarginPercent}%
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Average Margin */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">દુકાનનો સરેરાશ નફો</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-teal-700 font-mono tabular-nums">
              {avgMarginPercent}%
            </div>
            <p className="text-xs text-stone-500 mt-1">બધી વસ્તુઓ પર સરેરાશ ગ્રોસ માર્જિન</p>
          </div>
        </div>

        {/* Highest Margin Item */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">સૌથી વધુ નફો આપતી વસ્તુ</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-stone-900 truncate">
              {highestMarginProduct?.name || '-'}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-stone-600">
              <span className="font-bold text-emerald-700 font-mono">
                {highestMarginProduct?.marginPercent.toFixed(1)}% નફો
              </span>
              <span>·</span>
              <span className="font-mono">
                (+₹{highestMarginProduct?.marginRs}/{highestMarginProduct?.unit})
              </span>
            </div>
          </div>
        </div>

        {/* Lowest Margin Item */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">સૌથી ઓછો નફો ધરાવતી વસ્તુ</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-stone-900 truncate">
              {lowestMarginProduct?.name || '-'}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-stone-600">
              <span className="font-bold text-amber-700 font-mono">
                {lowestMarginProduct?.marginPercent.toFixed(1)}% નફો
              </span>
              <span>·</span>
              <span className="font-mono">
                (+₹{lowestMarginProduct?.marginRs}/{lowestMarginProduct?.unit})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Price Adjustment Card */}
      <div className="bg-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-stone-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              જથ્થાબંધ ભાવ વધારો / ઘટાડો (Bulk Price Tool)
            </h3>
            <p className="text-xs text-stone-400">
              કોઈપણ કેટેગરી અથવા તમામ વસ્તુઓ પર એકસાથે ટકાવારી કે ફિક્સ રકમ મુજબ ભાવ બદલો.
            </p>
          </div>
        </div>

        {bulkSuccessMsg && (
          <div className="mb-4 p-3 rounded-xl bg-teal-900/60 border border-teal-500 text-teal-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
            <span>{bulkSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. Category */}
          <div>
            <label className="block text-stone-300 font-medium mb-1">૧. કયા વિભાગ પર?</label>
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              {['બધા વિભાગો', ...categories].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Target price */}
          <div>
            <label className="block text-stone-300 font-medium mb-1">૨. કયો ભાવ બદલવો?</label>
            <select
              value={bulkTarget}
              onChange={(e) => setBulkTarget(e.target.value as any)}
              className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              <option value="selling">માત્ર વેચાણ ભાવ (Selling)</option>
              <option value="purchase">માત્ર ખરીદ ભાવ (Purchase)</option>
              <option value="both">બંને ભાવ (ખરીદ અને વેચાણ)</option>
            </select>
          </div>

          {/* 3. Action Increase/Decrease */}
          <div>
            <label className="block text-stone-300 font-medium mb-1">૩. વધારો કે ઘટાડો?</label>
            <div className="grid grid-cols-2 gap-1 bg-stone-800 p-1 rounded-xl border border-stone-700">
              <button
                type="button"
                onClick={() => setBulkAction('increase')}
                className={`py-1.5 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                  bulkAction === 'increase'
                    ? 'bg-emerald-600 text-white'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                + વધારો
              </button>
              <button
                type="button"
                onClick={() => setBulkAction('decrease')}
                className={`py-1.5 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                  bulkAction === 'decrease'
                    ? 'bg-rose-600 text-white'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                - ઘટાડો
              </button>
            </div>
          </div>

          {/* 4. Type & Amount */}
          <div>
            <label className="block text-stone-300 font-medium mb-1">
              ૪. રકમ ({bulkMode === 'percentage' ? '%' : '₹'})
            </label>
            <div className="flex gap-1">
              <input
                type="number"
                min="0.1"
                step="any"
                value={bulkAmount}
                onChange={(e) => setBulkAmount(Math.max(0.1, parseFloat(e.target.value) || 0))}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
              <button
                type="button"
                onClick={() =>
                  setBulkMode(bulkMode === 'percentage' ? 'fixed' : 'percentage')
                }
                className="px-2.5 bg-stone-700 hover:bg-stone-600 rounded-xl text-white font-bold cursor-pointer"
                title="ટકાવારી અથવા ફિક્સ રૂપિયા પસંદ કરો"
              >
                {bulkMode === 'percentage' ? '%' : '₹'}
              </button>
            </div>
          </div>

          {/* 5. Submit button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleApplyBulk}
              className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-stone-950 font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>લાગુ કરો</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Table of Products */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                પ્રોડક્ટ કિંમત અને નફા દર ટેબલ
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                કોઈપણ પ્રોડક્ટની સામે ભાવ સીધો બદલો અથવા માર્જિન જુઓ
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="નામ શોધો..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {['બધા વિભાગો', ...categories].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="margin_desc">વધુ નફો (%)</option>
                <option value="margin_asc">ઓછો નફો (%)</option>
                <option value="price_desc">વધુ વેચાણ ભાવ</option>
                <option value="name">નામ મુજબ (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
              <tr>
                <th className="py-3 px-4">પ્રોડક્ટનું નામ</th>
                <th className="py-3 px-4">વિભાગ</th>
                <th className="py-3 px-4 text-right">ખરીદ કિંમત (₹)</th>
                <th className="py-3 px-4 text-right">વેચાણ કિંમત (₹)</th>
                <th className="py-3 px-4 text-right">નફો (₹) પ્રતિ એકમ</th>
                <th className="py-3 px-4 text-center">નફા ટકાવારી (%)</th>
                <th className="py-3 px-4 text-center">ઝડપી ભાવ ફેરફાર</th>
                <th className="py-3 px-4 text-center">ક્રિયા</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.map((prod) => {
                const marginColor =
                  prod.marginPercent >= 20
                    ? 'text-emerald-700 bg-emerald-50'
                    : prod.marginPercent >= 10
                    ? 'text-teal-700 bg-teal-50'
                    : 'text-amber-700 bg-amber-50';

                return (
                  <tr key={prod.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-stone-900">{prod.name}</td>
                    <td className="py-3 px-4 text-stone-500 text-xs">{prod.category}</td>
                    <td className="py-3 px-4 text-right font-mono text-stone-600 tabular-nums">
                      ₹{prod.purchasePrice}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 tabular-nums">
                      ₹{prod.sellingPrice}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                      +₹{prod.marginRs}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${marginColor}`}
                      >
                        {prod.marginPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleQuickDelta(prod, -5)}
                          className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold font-mono border border-rose-200 cursor-pointer"
                          title="વેચાણ ભાવમાં ₹૫ ઘટાડો"
                        >
                          -₹૫
                        </button>
                        <button
                          onClick={() => handleQuickDelta(prod, 5)}
                          className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold font-mono border border-emerald-200 cursor-pointer"
                          title="વેચાણ ભાવમાં ₹૫ વધારો"
                        >
                          +₹૫
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openSingleEdit(prod)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-teal-50 text-stone-700 hover:text-teal-700 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>ભાવ બદલો</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Change Log History */}
      {priceLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-stone-600" />
            <h3 className="text-sm font-bold text-stone-900">
              તાજેતરના ભાવ ફેરફારનો ઇતિહાસ (Price Change Logs)
            </h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {priceLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="text-xs p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <div>
                  <span className="font-bold text-stone-900">{log.productName}</span>
                  <span className="text-stone-500 ml-2">({log.note || 'ભાવ ફેરફાર'})</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-stone-700">
                  <span>
                    વેચાણ: ₹{log.oldSellingPrice} ➔ <strong className="text-teal-700">₹{log.newSellingPrice}</strong>
                  </span>
                  <span>·</span>
                  <span className="text-stone-400">
                    {formatGujaratiDate(log.date).split(',')[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Single Product Price Modal */}
      {editingProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-stone-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
              <h3 className="text-base font-bold text-stone-900">ભાવ સુધારો</h3>
              <button
                onClick={() => setEditingProd(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-stone-600 mb-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div>વસ્તુ: <strong className="text-stone-900">{editingProd.name}</strong></div>
              <div>એકમ: <span className="font-semibold">{editingProd.unit}</span></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ખરીદ કિંમત (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editPurchase}
                  onChange={(e) => setEditPurchase(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  નવી વેચાણ કિંમત (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={editSelling}
                  onChange={(e) => setEditSelling(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                />
              </div>

              {/* Profit Preview */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-teal-900">
                  <span>નવો નફો:</span>
                  <span className="font-bold font-mono">
                    ₹{editSelling - editPurchase} પ્રતિ {editingProd.unit}
                  </span>
                </div>
                <div className="flex justify-between text-teal-800">
                  <span>નવો નફા દર:</span>
                  <span className="font-bold font-mono">
                    {editSelling > 0
                      ? (((editSelling - editPurchase) / editSelling) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  કારણ / નોંધ (વૈકલ્પિક)
                </label>
                <input
                  type="text"
                  placeholder="દા.ત. હોલસેલ માર્કેટમાં ભાવ વધ્યો"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProd(null)}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="button"
                  onClick={handleSaveSingleEdit}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer shadow-xs"
                >
                  સાચવો
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
