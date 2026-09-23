import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { Product, UnitType } from '../types';
import { CategoryManagerModal } from './CategoryManagerModal';
import {
  Search,
  Plus,
  Boxes,
  AlertTriangle,
  Edit2,
  Trash2,
  PlusCircle,
  MinusCircle,
  Download,
  X,
  Check,
  Tag,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, exportToCSV } from '../utils/formatters';

const UNITS: UnitType[] = [
  'કિ.ગ્રા.',
  'ગ્રામ',
  'નંગ',
  'પેકેટ',
  'લીટર',
  'બોક્સ',
  'મીટર',
];

export const ProductsStock: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, adjustStock, addCategory } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('બધા વિભાગો');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('નવો માલ આવ્યો');

  // Inline category creation in Add/Edit modals
  const [showInlineCatAdd, setShowInlineCatAdd] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');

  // New product form state
  const [formData, setFormData] = useState({
    name: '',
    category: categories[0] || 'અનાજ અને કઠોળ',
    barcode: '',
    purchasePrice: 100,
    sellingPrice: 120,
    stock: 20,
    unit: 'કિ.ગ્રા.' as UnitType,
    minStockAlert: 5,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories[0] || 'અનાજ અને કઠોળ',
      barcode: '',
      purchasePrice: 100,
      sellingPrice: 120,
      stock: 20,
      unit: 'કિ.ગ્રા.',
      minStockAlert: 5,
    });
    setShowInlineCatAdd(false);
    setInlineCatName('');
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory =
        selectedCategory === 'બધા વિભાગો' || prod.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        (prod.barcode && prod.barcode.toLowerCase().includes(q));
      const matchesLowStock = !onlyLowStock || prod.stock <= prod.minStockAlert;
      return matchesCategory && matchesSearch && matchesLowStock;
    });
  }, [products, selectedCategory, searchQuery, onlyLowStock]);

  // Handle Add Product Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addProduct({
      name: formData.name.trim(),
      category: formData.category,
      barcode: formData.barcode.trim() || undefined,
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      stock: Number(formData.stock),
      unit: formData.unit,
      minStockAlert: Number(formData.minStockAlert),
    });

    setIsAddModalOpen(false);
    resetForm();
  };

  // Handle Edit Product Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name.trim()) return;

    updateProduct(editingProduct.id, {
      name: editingProduct.name.trim(),
      category: editingProduct.category,
      barcode: editingProduct.barcode ? editingProduct.barcode.trim() : undefined,
      purchasePrice: Number(editingProduct.purchasePrice),
      sellingPrice: Number(editingProduct.sellingPrice),
      stock: Number(editingProduct.stock),
      unit: editingProduct.unit,
      minStockAlert: Number(editingProduct.minStockAlert),
    });

    setEditingProduct(null);
  };

  // Handle Stock Adjust
  const handleStockAdjustSubmit = (isAddition: boolean) => {
    if (!stockAdjustProduct) return;
    const finalDelta = isAddition ? Math.abs(stockDelta) : -Math.abs(stockDelta);
    adjustStock(stockAdjustProduct.id, finalDelta, adjustReason);
    setStockAdjustProduct(null);
    setStockDelta(10);
    setAdjustReason('નવો માલ આવ્યો');
  };

  // Export Stock CSV
  const handleExportStockCSV = () => {
    const headers = [
      'પ્રોડક્ટનું નામ',
      'કેટેગરી',
      'બારકોડ',
      'ખરીદ કિંમત (₹)',
      'વેચાણ કિંમત (₹)',
      'હાલનો સ્ટોક',
      'એકમ',
      'લઘુત્તમ સ્ટોક ચેતવણી',
    ];

    const rows = products.map((p) => [
      p.name,
      p.category,
      p.barcode || '-',
      p.purchasePrice,
      p.sellingPrice,
      p.stock,
      p.unit,
      p.minStockAlert,
    ]);

    exportToCSV(`દુકાન_સ્ટોક_રિપોર્ટ_${new Date().toISOString().split('T')[0]}.csv`, [
      headers,
      ...rows,
    ]);
  };

  const totalStockItemsCount = products.reduce((sum, p) => sum + p.stock, 0);
  const totalStockWorth = products.reduce(
    (sum, p) => sum + p.purchasePrice * p.stock,
    0
  );
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            પ્રોડક્ટ અને સ્ટોક સંચાલન
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-500">
            <span>કુલ {products.length} પ્રોડક્ટ્સ</span>
            <span>·</span>
            <span>કુલ જથ્થો: {totalStockItemsCount} એકમ</span>
            <span>·</span>
            <span>
              સ્ટોક મૂલ્ય: <strong className="text-stone-900 font-mono">{formatCurrency(totalStockWorth)}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-teal-700" />
            <span>કેટેગરી સંચાલન ({categories.length})</span>
          </button>

          <button
            onClick={handleExportStockCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>CSV ડાઉનલોડ</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>નવી પ્રોડક્ટ ઉમેરો</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="પ્રોડક્ટનું નામ અથવા બારકોડ શોધો..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {['બધા વિભાગો', ...categories].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center">
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                onlyLowStock
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-stone-50 text-stone-600 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>ઓછો સ્ટોક ({lowStockCount})</span>
            </button>
          </div>
        </div>

        {/* Category Horizontal Pills Filter Bar */}
        <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('બધા વિભાગો')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              selectedCategory === 'બધા વિભાગો'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <span>બધા વિભાગો</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'બધા વિભાગો' ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-600'
              }`}
            >
              {products.length}
            </span>
          </button>

          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 text-teal-700 hover:bg-teal-50 border border-dashed border-teal-300 cursor-pointer shrink-0 ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>કેટેગરી ઉમેરો</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
              <tr>
                <th className="py-3 px-4">વસ્તુનું નામ</th>
                <th className="py-3 px-4">કેટેગરી</th>
                <th className="py-3 px-4 text-right">ખરીદ ભાવ</th>
                <th className="py-3 px-4 text-right">વેચાણ ભાવ</th>
                <th className="py-3 px-4 text-center">સ્ટોક જથ્થો</th>
                <th className="py-3 px-4 text-center">સ્થિતિ</th>
                <th className="py-3 px-4 text-center">સ્ટોક સુધારો</th>
                <th className="py-3 px-4 text-right">ક્રિયા</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.map((prod) => {
                const isLow = prod.stock <= prod.minStockAlert;
                const isZero = prod.stock <= 0;

                return (
                  <tr
                    key={prod.id}
                    className={`hover:bg-stone-50/70 transition-colors ${
                      isLow ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{prod.name}</div>
                      {prod.barcode && (
                        <div className="text-[11px] text-stone-400 font-mono">
                          કોડ: {prod.barcode}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedCategory(prod.category)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 hover:bg-teal-50 hover:text-teal-800 transition-colors cursor-pointer border border-stone-200/80"
                        title="આ કેટેગરી ફિલ્ટર કરો"
                      >
                        <Tag className="w-3 h-3 text-stone-400" />
                        <span>{prod.category}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-stone-600 tabular-nums">
                      ₹{prod.purchasePrice}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 tabular-nums">
                      ₹{prod.sellingPrice}
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono tabular-nums">
                      <span
                        className={
                          isZero
                            ? 'text-rose-600'
                            : isLow
                            ? 'text-amber-700'
                            : 'text-stone-900'
                        }
                      >
                        {prod.stock} {prod.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          isZero
                            ? 'bg-rose-100 text-rose-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isZero ? 'સ્ટોક ખાલી' : isLow ? 'ઓછો સ્ટોક' : 'પર્યાપ્ત'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setStockAdjustProduct(prod);
                          setStockDelta(10);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-teal-50 hover:text-teal-700 text-stone-700 transition-colors cursor-pointer"
                        title="સ્ટોક વધારવો કે ઘટાડવો"
                      >
                        ± સ્ટોક એન્ટ્રી
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingProduct(prod)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title="સુધારો કરો"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`શું તમે "${prod.name}" ડિલીટ કરવા માંગો છો?`)) {
                              deleteProduct(prod.id);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="કાઢી નાખો"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    <Boxes className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">કોઈ પ્રોડક્ટ મળી નથી</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="text-base font-bold text-stone-900">નવી પ્રોડક્ટ ઉમેરો</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  પ્રોડક્ટનું નામ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="દા.ત. તૂવેર દાળ દેશી પ્રીમિયમ"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      કેટેગરી / વિભાગ
                    </label>
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  {/* Inline quick category add */}
                  {showInlineCatAdd ? (
                    <div className="mt-1.5 flex gap-1 items-center">
                      <input
                        type="text"
                        placeholder="નવી કેટેગરી..."
                        value={inlineCatName}
                        onChange={(e) => setInlineCatName(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs border border-teal-500 rounded-lg focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = inlineCatName.trim();
                          if (trimmed) {
                            addCategory(trimmed);
                            setFormData((prev) => ({ ...prev, category: trimmed }));
                            setInlineCatName('');
                            setShowInlineCatAdd(false);
                          }
                        }}
                        className="px-2 py-1 bg-teal-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        ઉમેરો
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInlineCatAdd(false)}
                        className="px-2 py-1 bg-stone-200 text-stone-700 rounded-lg text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowInlineCatAdd(true)}
                      className="mt-1 text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ નવી કેટેગરી ઉમેરો</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    એકમ / યુનિટ
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value as UnitType })
                    }
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ખરીદ કિંમત (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    વેચાણ કિંમત (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    શરૂઆતનો સ્ટોક જથ્થો
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ઓછા સ્ટોકની ચેતવણી (મર્યાદા)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockAlert}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minStockAlert: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  બારકોડ અથવા પ્રોડક્ટ કોડ (વૈકલ્પિક)
                </label>
                <input
                  type="text"
                  placeholder="દા.ત. 8901001"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>પ્રોડક્ટ ઉમેરો</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="text-base font-bold text-stone-900">પ્રોડક્ટમાં ફેરફાર કરો</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  પ્રોડક્ટનું નામ *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      કેટેગરી
                    </label>
                  </div>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  {/* Inline quick category add in edit modal */}
                  {showInlineCatAdd ? (
                    <div className="mt-1.5 flex gap-1 items-center">
                      <input
                        type="text"
                        placeholder="નવી કેટેગરી..."
                        value={inlineCatName}
                        onChange={(e) => setInlineCatName(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs border border-teal-500 rounded-lg focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = inlineCatName.trim();
                          if (trimmed) {
                            addCategory(trimmed);
                            setEditingProduct({ ...editingProduct, category: trimmed });
                            setInlineCatName('');
                            setShowInlineCatAdd(false);
                          }
                        }}
                        className="px-2 py-1 bg-teal-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        ઉમેરો
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInlineCatAdd(false)}
                        className="px-2 py-1 bg-stone-200 text-stone-700 rounded-lg text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowInlineCatAdd(true)}
                      className="mt-1 text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ નવી કેટેગરી ઉમેરો</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    એકમ / યુનિટ
                  </label>
                  <select
                    value={editingProduct.unit}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        unit: e.target.value as UnitType,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ખરીદ કિંમત (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingProduct.purchasePrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        purchasePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    વેચાણ કિંમત (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingProduct.sellingPrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        sellingPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    હાલનો સ્ટોક
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ઓછા સ્ટોકની ચેતવણી
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingProduct.minStockAlert}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        minStockAlert: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>સાચવો</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-stone-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
              <h3 className="text-base font-bold text-stone-900">સ્ટોક વધઘટ એન્ટ્રી</h3>
              <button
                onClick={() => setStockAdjustProduct(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-stone-600 mb-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div>વસ્તુ: <strong className="text-stone-900">{stockAdjustProduct.name}</strong></div>
              <div>હાલનો જથ્થો: <strong className="text-teal-700">{stockAdjustProduct.stock} {stockAdjustProduct.unit}</strong></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  જથ્થો ({stockAdjustProduct.unit})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={stockDelta}
                  onChange={(e) => setStockDelta(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  કારણ / વિગત
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="નવો માલ આવ્યો (ખરીદી)">નવો માલ આવ્યો (ખરીદી)</option>
                  <option value="ગ્રાહક પરત (Return)">ગ્રાહક પરત (Return)</option>
                  <option value="બગાડ અથવા નુકસાન">બગાડ અથવા નુકસાન (Damage)</option>
                  <option value="ઘર વપરાશ / સેમ્પલ">ઘર વપરાશ / સેમ્પલ</option>
                  <option value="સ્ટોક ગણતરી સુધારો">સ્ટોક ગણતરી સુધારો (Audit)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleStockAdjustSubmit(false)}
                  className="py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>સ્ટોક ઘટાડો (-)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStockAdjustSubmit(true)}
                  className="py-2 px-3 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>સ્ટોક ઉમેરો (+)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />
    </div>
  );
};
