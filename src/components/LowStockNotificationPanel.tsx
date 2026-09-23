import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import {
  AlertTriangle,
  AlertOctagon,
  Boxes,
  PlusCircle,
  Share2,
  Copy,
  Printer,
  Edit2,
  Check,
  X,
  Search,
  CheckCircle2,
  BellRing,
  Clock,
  Layers,
} from 'lucide-react';
import { formatGujaratiDate, getTodayDateString } from '../utils/formatters';

export const LowStockNotificationPanel: React.FC = () => {
  const { products, updateProduct, adjustStock, shopProfile, setActiveTab } = useShop();

  const [filterMode, setFilterMode] = useState<'all' | 'zero' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [restockModalItem, setRestockModalItem] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(10);
  const [editingThresholdItem, setEditingThresholdItem] = useState<string | null>(null);
  const [newThresholdValue, setNewThresholdValue] = useState<number>(5);
  const [orderedItems, setOrderedItems] = useState<Record<string, boolean>>({});
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // 1. Identify low stock items
  const flaggedItems = useMemo(() => {
    return products
      .filter((p) => p.stock <= p.minStockAlert)
      .map((p) => {
        const isZero = p.stock <= 0;
        const deficit = Math.max(0, p.minStockAlert - p.stock);
        const percentLeft =
          p.minStockAlert > 0
            ? Math.max(0, Math.min(100, Math.round((p.stock / p.minStockAlert) * 100)))
            : 0;

        return {
          ...p,
          isZero,
          deficit,
          percentLeft,
        };
      })
      .sort((a, b) => {
        // Zero stock first, then lowest stock
        if (a.isZero && !b.isZero) return -1;
        if (!a.isZero && b.isZero) return 1;
        return a.stock - b.stock;
      });
  }, [products]);

  // Zero stock & low stock counts
  const zeroStockCount = flaggedItems.filter((i) => i.isZero).length;
  const belowThresholdCount = flaggedItems.filter((i) => !i.isZero).length;

  // Filtered view
  const visibleItems = useMemo(() => {
    return flaggedItems.filter((item) => {
      if (filterMode === 'zero' && !item.isZero) return false;
      if (filterMode === 'low' && item.isZero) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.barcode && item.barcode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [flaggedItems, filterMode, searchQuery]);

  // Handle Quick Restock Submission
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem || restockQuantity <= 0) return;

    adjustStock(
      restockModalItem.id,
      Number(restockQuantity),
      'લઘુત્તમ સ્ટોક એલર્ટમાંથી ત્વરિત સ્ટોક ઉમેરો'
    );

    // If marked as ordered, clear ordered tag
    if (orderedItems[restockModalItem.id]) {
      setOrderedItems((prev) => {
        const copy = { ...prev };
        delete copy[restockModalItem.id];
        return copy;
      });
    }

    setRestockModalItem(null);
    setRestockQuantity(10);
  };

  // Handle Threshold Update
  const handleSaveThreshold = (productId: string) => {
    if (newThresholdValue >= 0) {
      updateProduct(productId, { minStockAlert: Number(newThresholdValue) });
      setEditingThresholdItem(null);
    }
  };

  // Toggle "Ordered / Pending" state
  const toggleOrderedStatus = (productId: string) => {
    setOrderedItems((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Generate Wholesale Supplier Order text
  const generateOrderText = () => {
    const today = formatGujaratiDate(getTodayDateString()).split(',')[0];
    let text = `*${shopProfile.shopName} - માલસામાન ઓર્ડર યાદી*\n`;
    text += `તારીખ: ${today}\n`;
    text += `સંપર્ક: ${shopProfile.phone}\n`;
    text += `------------------------------------\n`;
    text += `નીચેની વસ્તુઓનો સ્ટોક લઘુત્તમ મર્યાદાથી ઓછો છે, તાત્કાલિક મોકલી આપવા વિનંતી:\n\n`;

    flaggedItems.forEach((item, index) => {
      const suggestQty = Math.max(item.minStockAlert * 2, 10);
      text += `${index + 1}. *${item.name}* (${item.category})\n`;
      text += `   - હાલનો સ્ટોક: ${item.stock} ${item.unit} ${item.isZero ? '⚠️ (સ્ટોક ખાલી)' : ''}\n`;
      text += `   - લઘુત્તમ મર્યાદા: ${item.minStockAlert} ${item.unit}\n`;
      text += `   - જરૂરી ઓર્ડર જથ્થો: આશરે ${suggestQty} ${item.unit}\n\n`;
    });

    text += `------------------------------------\n`;
    text += `કૃપા કરીને માલ વહેલી તકે પહોંચાડી બિલ આપશો.\n`;
    return text;
  };

  // WhatsApp Order Share
  const handleShareWhatsAppOrder = () => {
    const text = generateOrderText();
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Copy order text
  const handleCopyOrder = () => {
    const text = generateOrderText();
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  if (flaggedItems.length === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>સ્ટોક સ્થિતિ ઉત્તમ છે!</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                  કોઈ ઓછો સ્ટોક નથી
                </span>
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                તમામ {products.length} પ્રોડક્ટ્સનો જથ્થો પૂરતા પ્રમાણમાં ઉપલબ્ધ છે અને લઘુત્તમ મર્યાદાથી વધુ છે.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('products')}
            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            સ્ટોક યાદી જુઓ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-amber-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Alert Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border-b border-amber-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs relative">
              <BellRing className="w-5 h-5 animate-bounce" />
              {zeroStockCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs"
                  title={`${zeroStockCount} પ્રોડક્ટ્સનો સ્ટોક સંપૂર્ણ ખાલી છે!`}
                >
                  !
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 tracking-tight">
                  ઓછો સ્ટોક નોટિફિકેશન એલર્ટ (Low-Stock Alert)
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {flaggedItems.length} વસ્તુઓ એલર્ટ પર
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                નીચે દર્શાવેલ વસ્તુઓનો સ્ટોક તેમની નક્કી કરેલ લઘુત્તમ મર્યાદા (Threshold) કરતાં ઓછો છે. ગ્રાહક પરત ન જાય તે માટે નવો માલ મંગાવો.
              </p>
            </div>
          </div>

          {/* Quick Supplier Order Generator Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyOrder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
              title="ઓર્ડર યાદી કોપી કરો"
            >
              <Copy className="w-3.5 h-3.5 text-stone-500" />
              <span>{copiedSuccess ? 'કોપી થઈ ગયું!' : 'યાદી કોપી'}</span>
            </button>

            <button
              onClick={handleShareWhatsAppOrder}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="સપ્લાયરને વોટ્સએપ પર ઓર્ડર યાદી મોકલો"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>સપ્લાયર ઓર્ડર (વોટ્સએપ)</span>
            </button>
          </div>
        </div>

        {/* Filter Pills and Summary Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-amber-200/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              બધી ચેતવણીઓ ({flaggedItems.length})
            </button>

            <button
              onClick={() => setFilterMode('zero')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                filterMode === 'zero'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>સ્ટોક ખાલી ({zeroStockCount})</span>
            </button>

            <button
              onClick={() => setFilterMode('low')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                filterMode === 'low'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>મર્યાદાથી ઓછો ({belowThresholdCount})</span>
            </button>
          </div>

          {/* Search within alerts */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="ચેતવણીમાં શોધો..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Flagged Items Cards Grid */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {visibleItems.map((item) => {
            const isEditingThisThreshold = editingThresholdItem === item.id;
            const isMarkedOrdered = !!orderedItems[item.id];

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  item.isZero
                    ? 'bg-rose-50/40 border-rose-300 hover:border-rose-400'
                    : 'bg-amber-50/30 border-amber-200 hover:border-amber-300'
                } ${isMarkedOrdered ? 'opacity-80 ring-1 ring-teal-300' : ''}`}
              >
                <div>
                  {/* Top tags & status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-medium text-stone-500">
                      {item.category}
                    </span>

                    <div className="flex items-center gap-1">
                      {item.isZero ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertOctagon className="w-3 h-3 text-rose-600" />
                          <span>સ્ટોક ખાલી (0)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>ઓછો સ્ટોક</span>
                        </span>
                      )}

                      {isMarkedOrdered && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                          <Clock className="w-3 h-3 text-teal-600" />
                          <span>ઓર્ડર કરેલ</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Title */}
                  <h4 className="text-sm font-bold text-stone-900 line-clamp-1">
                    {item.name}
                  </h4>
                  {item.barcode && (
                    <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                      કોડ: {item.barcode}
                    </div>
                  )}

                  {/* Stock Level Progress Bar */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">હાલનો જથ્થો:</span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          item.isZero ? 'text-rose-700' : 'text-amber-800'
                        }`}
                      >
                        {item.stock} {item.unit}
                      </span>
                    </div>

                    <div className="w-full bg-stone-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.isZero
                            ? 'bg-rose-500 w-0'
                            : item.percentLeft <= 30
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.isZero ? 3 : Math.min(100, item.percentLeft)}%` }}
                      />
                    </div>

                    {/* Pre-set Threshold Row with Quick-Edit */}
                    <div className="flex items-center justify-between text-[11px] pt-1 text-stone-500">
                      <span>ચેતવણી મર્યાદા (Threshold):</span>

                      {isEditingThisThreshold ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={newThresholdValue}
                            onChange={(e) =>
                              setNewThresholdValue(Math.max(1, parseInt(e.target.value) || 1))
                            }
                            className="w-12 px-1 py-0.5 text-center text-xs font-mono font-bold border border-teal-500 rounded bg-white"
                          />
                          <button
                            onClick={() => handleSaveThreshold(item.id)}
                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                            title="સાચવો"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingThresholdItem(null)}
                            className="p-1 text-stone-400 hover:bg-stone-200 rounded"
                            title="રદ કરો"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingThresholdItem(item.id);
                            setNewThresholdValue(item.minStockAlert);
                          }}
                          className="inline-flex items-center gap-1 font-mono font-semibold text-stone-700 hover:text-teal-700 hover:underline cursor-pointer"
                          title="આ વસ્તુની લઘુત્તમ સ્ટોક મર્યાદા બદલો"
                        >
                          <span>
                            {item.minStockAlert} {item.unit}
                          </span>
                          <Edit2 className="w-2.5 h-2.5 text-stone-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleOrderedStatus(item.id)}
                    className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                      isMarkedOrdered
                        ? 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                        : 'text-stone-500 hover:text-stone-800 border-dashed border-stone-300 hover:border-stone-400'
                    }`}
                    title={
                      isMarkedOrdered
                        ? 'ઓર્ડર નોંધાયેલ છે, ક્લિક કરીને સ્ટેટસ હટાવો'
                        : 'સપ્લાયરને ઓર્ડર અપાઈ ગયો હોય તો અહીં ક્લિક કરો'
                    }
                  >
                    {isMarkedOrdered ? '✓ ઓર્ડર આપી દીધો' : '+ ઓર્ડર નોંધો'}
                  </button>

                  <button
                    onClick={() => {
                      setRestockModalItem(item);
                      setRestockQuantity(Math.max(item.minStockAlert * 2, 10));
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>સ્ટોક ઉમેરો</span>
                  </button>
                </div>
              </div>
            );
          })}

          {visibleItems.length === 0 && (
            <div className="col-span-full py-8 text-center text-stone-500 bg-stone-50 rounded-xl">
              <Boxes className="w-6 h-6 text-stone-400 mx-auto mb-1" />
              <p className="text-xs font-semibold">આ ફિલ્ટરમાં કોઈ વસ્તુ નથી</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Restock Modal */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-stone-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-stone-900">
                  સ્ટોક જથ્થો ઉમેરો (Restock)
                </h3>
              </div>
              <button
                onClick={() => setRestockModalItem(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-stone-600 mb-4 bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
              <div>
                વસ્તુ: <strong className="text-stone-900">{restockModalItem.name}</strong>
              </div>
              <div>
                હાલનો સ્ટોક:{' '}
                <strong
                  className={
                    restockModalItem.stock <= 0 ? 'text-rose-700' : 'text-amber-700'
                  }
                >
                  {restockModalItem.stock} {restockModalItem.unit}
                </strong>
              </div>
              <div>
                લઘુત્તમ મર્યાદા: <span>{restockModalItem.minStockAlert} {restockModalItem.unit}</span>
              </div>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ઉમેરવા માટે નવો જથ્થો ({restockModalItem.unit}) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                />
              </div>

              {/* Quick suggestion buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-stone-500 text-[11px]">ઝડપી વિકલ્પો:</span>
                {[5, 10, 25, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRestockQuantity(num)}
                    className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-[11px] cursor-pointer"
                  >
                    +{num}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>સ્ટોકમાં ઉમેરો</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
