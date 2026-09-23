import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Boxes,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (category: string) => void;
}

const PRESET_SUGGESTIONS = [
  'નાસ્તો અને ફરસાણ (Snacks)',
  'સ્ટેશનરી અને ચોપડા (Stationery)',
  'ડેરી અને દૂધ (Dairy)',
  'બેકરી અને બ્રેડ (Bakery)',
  'ઠંડા પીણાં અને શરબત (Beverages)',
  'સુકો મેવો (Dry Fruits)',
  'પૂજા સામગ્રી (Pooja Samagri)',
  'ફળ અને શાકભાજી (Fruits & Veg)',
  'ઇલેક્ટ્રોનિક્સ અને બેટરી (Electronics)',
  'પ્લાસ્ટિક અને પેકિંગ (Packaging)',
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  const { products, categories, addCategory, updateCategory, deleteCategory } = useShop();

  const [newCatName, setNewCatName] = useState('');
  const [editingOldName, setEditingOldName] = useState<string | null>(null);
  const [editingNewName, setEditingNewName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Compute category statistics
  const categoryStats = categories.map((cat) => {
    const prods = products.filter((p) => p.category === cat);
    const count = prods.length;
    const totalStock = prods.reduce((sum, p) => sum + p.stock, 0);
    const totalWorth = prods.reduce((sum, p) => sum + p.purchasePrice * p.stock, 0);
    const lowStockCount = prods.filter((p) => p.stock <= p.minStockAlert).length;

    return {
      name: cat,
      count,
      totalStock,
      totalWorth,
      lowStockCount,
    };
  });

  const handleAddCategory = (nameToAdd?: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    const target = (nameToAdd || newCatName).trim();

    if (!target) {
      setErrorMsg('કૃપા કરીને કેટેગરીનું નામ લખો.');
      return;
    }

    if (categories.includes(target)) {
      setErrorMsg('આ કેટેગરી પહેલેથી જ અસ્તિત્વમાં છે!');
      return;
    }

    const success = addCategory(target);
    if (success) {
      setSuccessMsg(`"${target}" કેટેગરી સફળતાપૂર્વક ઉમેરાઈ ગઈ.`);
      setNewCatName('');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSaveRename = (oldName: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    const target = editingNewName.trim();

    if (!target || target === oldName) {
      setEditingOldName(null);
      return;
    }

    if (categories.includes(target)) {
      setErrorMsg('આ નામની કેટેગરી પહેલેથી છે.');
      return;
    }

    const ok = updateCategory(oldName, target);
    if (ok) {
      setSuccessMsg(`કેટેગરીનું નામ બદલાઈ ગયું: "${target}"`);
      setEditingOldName(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleDelete = (catName: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (categories.length <= 1) {
      setErrorMsg('ઓછામાં ઓછી એક કેટેગરી રાખવી જરૂરી છે.');
      return;
    }

    const count = products.filter((p) => p.category === catName).length;
    let confirmMsg = `શું તમે "${catName}" કેટેગરી કાઢી નાખવા માંગો છો?`;
    if (count > 0) {
      confirmMsg += `\n\nધ્યાન આપો: આ કેટેગરીમાં ${count} પ્રોડક્ટ્સ છે, જે આપમેળે બીજી કેટેગરીમાં ટ્રાન્સફર થઈ જશે.`;
    }

    if (window.confirm(confirmMsg)) {
      deleteCategory(catName);
      setSuccessMsg(`"${catName}" કેટેગરી કાઢી નાખવામાં આવી.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                પ્રોડક્ટ કેટેગરી સંચાલન (Category Manager)
              </h3>
              <p className="text-xs text-stone-500">
                નવી કેટેગરી ઉમેરો, નામ સુધારો અને કેટેગરી મુજબ સ્ટોક મૂલ્ય જુઓ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add Category Form */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <label className="block text-xs font-bold text-stone-800">
              નવી કેટેગરી ઉમેરો (દા.ત. નાસ્તો, સ્ટેશનરી, ડેરી, ઠંડા પીણાં):
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="કેટેગરીનું નામ લખો..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddCategory()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>ઉમેરો</span>
              </button>
            </div>

            {/* Quick Preset Suggestions */}
            <div>
              <div className="text-[11px] font-semibold text-stone-500 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>ઝડપી ભલામણો (ક્લિક કરીને ઉમેરો):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SUGGESTIONS.filter((s) => !categories.includes(s)).slice(0, 6).map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleAddCategory(suggestion)}
                      className="px-2.5 py-1 rounded-lg text-[11px] bg-white hover:bg-teal-50 text-stone-700 hover:text-teal-800 border border-stone-200 hover:border-teal-300 transition-colors cursor-pointer"
                    >
                      + {suggestion}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Current Categories List with Stats */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                હાલની કેટેગરી યાદી ({categories.length})
              </h4>
              <span className="text-[11px] text-stone-400">
                પ્રોડક્ટ્સ / સ્ટોક મૂલ્ય
              </span>
            </div>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
              {categoryStats.map((item) => {
                const isEditing = editingOldName === item.name;

                return (
                  <div
                    key={item.name}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingNewName}
                          onChange={(e) => setEditingNewName(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs sm:text-sm border border-teal-500 rounded-lg focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(item.name)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                          title="સાચવો"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingOldName(null)}
                          className="p-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg cursor-pointer"
                          title="રદ કરો"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-900">
                              {item.name}
                            </span>
                            {item.lowStockCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                {item.lowStockCount} ઓછો સ્ટોક
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                            <span>{item.count} પ્રોડક્ટ્સ</span>
                            <span>·</span>
                            <span>કુલ {item.totalStock} એકમ</span>
                            <span>·</span>
                            <span className="font-mono font-medium text-stone-700">
                              મૂલ્ય: {formatCurrency(item.totalWorth)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {onSelectCategory && (
                          <button
                            onClick={() => {
                              onSelectCategory(item.name);
                              onClose();
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-teal-700 hover:bg-teal-50 rounded-lg border border-teal-200 cursor-pointer"
                          >
                            ફિલ્ટર કરો
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingOldName(item.name);
                            setEditingNewName(item.name);
                          }}
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title="કેટેગરીનું નામ બદલો"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(item.name)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="કેટેગરી કાઢી નાખો"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs sm:text-sm font-semibold rounded-xl cursor-pointer"
          >
            પૂર્ણ (બંધ કરો)
          </button>
        </div>
      </div>
    </div>
  );
};
