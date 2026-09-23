import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Product, CartItem, PaymentMode } from '../types';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  CreditCard,
  User,
  Phone,
  FileText,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const BillingPOS: React.FC = () => {
  const { products, categories, customers, getCustomerBalance, createSale, setCurrentBillForPrint } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('બધા વિભાગો');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('રોકડ');
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const customerInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerInputRef.current && !customerInputRef.current.contains(e.target as Node)) {
        setShowCustomerSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter existing customers for autocomplete
  const matchingCustomers = useMemo(() => {
    if (!customerName.trim()) return customers.slice(0, 5);
    const q = customerName.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    ).slice(0, 5);
  }, [customers, customerName]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory =
        selectedCategory === 'બધા વિભાગો' || prod.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        (prod.barcode && prod.barcode.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product: Product) => {
    setErrorMessage('');
    const existingIndex = cart.findIndex((item) => item.productId === product.id);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > product.stock) {
        setErrorMessage(`સ્ટોકમાં માત્ર ${product.stock} ${product.unit} ઉપલબ્ધ છે!`);
        return;
      }
      setCart((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.sellingPrice,
              }
            : item
        )
      );
    } else {
      if (product.stock <= 0) {
        setErrorMessage(`${product.name} નો સ્ટોક ખાલી છે!`);
        return;
      }
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        quantity: 1,
        total: product.sellingPrice,
      };
      setCart((prev) => [...prev, newItem]);
    }
  };

  const updateQuantity = (productId: string, newQty: number) => {
    setErrorMessage('');
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product && newQty > product.stock) {
      setErrorMessage(`સ્ટોકમાં માત્ર ${product.stock} ${product.unit} ઉપલબ્ધ છે!`);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQty,
              total: Math.round(newQty * item.sellingPrice),
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomerId(undefined);
    setShowCustomerSuggestions(false);
    setDiscount(0);
    setNotes('');
    setErrorMessage('');
  };

  // Totals calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const totalCost = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0);
  }, [cart]);

  const grandTotal = Math.max(0, subtotal - discount);
  const estimatedProfit = Math.max(0, grandTotal - totalCost);

  // Submit sale handler
  const handleCompleteSale = () => {
    if (cart.length === 0) {
      setErrorMessage('કૃપા કરીને બિલમાં ઓછામાં ઓછી એક વસ્તુ ઉમેરો.');
      return;
    }

    if (paymentMode === 'ઉધાર' && !customerName.trim()) {
      setErrorMessage('ઉધાર વેચાણ માટે ગ્રાહકનું નામ દાખલ કરવું અથવા પસંદ કરવું ફરજિયાત છે.');
      return;
    }

    const newSale = createSale({
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerId: selectedCustomerId,
      items: cart,
      subtotal,
      discount,
      grandTotal,
      totalCost,
      profit: estimatedProfit,
      paymentMode,
      notes: notes.trim() || undefined,
    });

    // Open print bill modal immediately
    setCurrentBillForPrint(newSale);
    clearCart();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Product Selection & Catalog (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search and Category Filters */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="પ્રોડક્ટનું નામ અથવા બારકોડ શોધો..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          {/* Category Horizontal Scroller */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['બધા વિભાગો', ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredProducts.map((product) => {
            const inCart = cart.find((i) => i.productId === product.id);
            const isOutOfStock = product.stock <= 0;

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between select-none ${
                  isOutOfStock
                    ? 'bg-stone-100 border-stone-200 opacity-60 cursor-not-allowed'
                    : inCart
                    ? 'bg-teal-50/70 border-teal-300 shadow-xs cursor-pointer hover:border-teal-400'
                    : 'bg-white border-stone-200 shadow-xs cursor-pointer hover:border-teal-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[11px] text-stone-400 font-medium">
                      {product.category}
                    </span>
                    {inCart && (
                      <span className="text-[11px] font-bold bg-teal-600 text-white rounded-full px-1.5 py-0.2">
                        {inCart.quantity} {product.unit}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                    {product.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-stone-900 font-mono tabular-nums">
                      ₹{product.sellingPrice}
                    </div>
                    <div className="text-[10px] text-stone-500">પ્રતિ {product.unit}</div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[11px] font-medium ${
                        isOutOfStock
                          ? 'text-rose-600 font-bold'
                          : product.stock <= product.minStockAlert
                          ? 'text-amber-600 font-bold'
                          : 'text-stone-500'
                      }`}
                    >
                      {isOutOfStock ? 'સ્ટોક ખાલી' : `સ્ટોક: ${product.stock}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-stone-500 bg-white rounded-2xl border border-stone-200">
              <AlertCircle className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-medium">કોઈ પ્રોડક્ટ મળી નથી</p>
              <p className="text-xs text-stone-400 mt-1">
                શોધ શબ્દ બદલો અથવા નવી પ્રોડક્ટ ઉમેરો
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Active Bill / Cart (5 Cols) */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col h-full sticky top-20">
          {/* Cart Header */}
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">હાલનું બિલ (કાર્ટ)</h3>
                <p className="text-[11px] text-stone-500">{cart.length} વસ્તુઓ પસંદ કરેલ</p>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-stone-500 hover:text-rose-600 font-medium transition-colors cursor-pointer"
              >
                ખાલી કરો
              </button>
            )}
          </div>

          {/* Error Banner if any */}
          {errorMessage && (
            <div className="p-2.5 mx-4 mt-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[300px]">
            {cart.map((item) => (
              <div
                key={item.productId}
                className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 truncate">
                    {item.productName}
                  </h4>
                  <div className="text-[11px] text-stone-500 font-mono tabular-nums">
                    ₹{item.sellingPrice} × {item.quantity} {item.unit}
                  </div>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded-md bg-white border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    step="any"
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.productId, parseFloat(e.target.value) || 0)
                    }
                    className="w-12 text-center text-xs font-bold font-mono border border-stone-300 rounded-md py-0.5 bg-white"
                  />
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded-md bg-white border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1 text-stone-400 hover:text-rose-600 ml-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[60px]">
                  <div className="text-xs font-bold text-stone-900 font-mono tabular-nums">
                    ₹{item.total}
                  </div>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-10 text-center text-stone-400">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                <p className="text-xs font-medium">બિલ બનાવવા ડાબી બાજુથી વસ્તુઓ ઉમેરો</p>
              </div>
            )}
          </div>

          {/* Customer & Payment Inputs */}
          <div className="p-4 bg-stone-50/70 border-t border-stone-200 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative" ref={customerInputRef}>
                <label className="text-[11px] font-semibold text-stone-600 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>ગ્રાહકનું નામ {paymentMode === 'ઉધાર' && <span className="text-rose-500">*</span>}</span>
                  </span>
                  {selectedCustomerId && (
                    <span className="text-[10px] text-teal-700 font-bold">લિંક થયેલ</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder={paymentMode === 'ઉધાર' ? 'નામ (ફરજિયાત)' : 'નામ (વૈકલ્પિક)'}
                  value={customerName}
                  onFocus={() => setShowCustomerSuggestions(true)}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setSelectedCustomerId(undefined);
                    setShowCustomerSuggestions(true);
                  }}
                  className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                    paymentMode === 'ઉધાર' && !customerName.trim()
                      ? 'border-amber-400 focus:ring-amber-500 bg-amber-50/30'
                      : 'border-stone-300 focus:ring-teal-500'
                  }`}
                />

                {/* Autocomplete Customer Suggestions */}
                {showCustomerSuggestions && matchingCustomers.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-stone-100">
                    <div className="p-1.5 text-[10px] font-semibold text-stone-400 bg-stone-50">
                      નોંધાયેલ ગ્રાહકો પસંદ કરો:
                    </div>
                    {matchingCustomers.map((cust) => {
                      const balance = getCustomerBalance(cust.id);
                      return (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => {
                            setCustomerName(cust.name);
                            setCustomerPhone(cust.phone || '');
                            setSelectedCustomerId(cust.id);
                            setShowCustomerSuggestions(false);
                          }}
                          className="w-full text-left p-2 hover:bg-teal-50 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-semibold text-stone-800">{cust.name}</div>
                            {cust.phone && <div className="text-[10px] text-stone-500">{cust.phone}</div>}
                          </div>
                          {balance > 0 ? (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                              બાકી: {formatCurrency(balance)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              ચૂકતે
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-600 flex items-center gap-1 mb-1">
                  <Phone className="w-3 h-3" />
                  <span>મોબાઈલ નંબર</span>
                </label>
                <input
                  type="text"
                  placeholder="ફોન (વૈકલ્પિક)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  <span>ચૂકવણી પદ્ધતિ</span>
                </label>
                {paymentMode === 'ઉધાર' && (
                  <span className="text-[10px] text-amber-700 bg-amber-100 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>ગ્રાહકના ઉધાર ખાતામાં જશે</span>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['રોકડ', 'UPI/ઓનલાઇન', 'ઉધાર'] as PaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      paymentMode === mode
                        ? mode === 'ઉધાર'
                          ? 'bg-amber-700 text-white shadow-xs ring-1 ring-amber-700'
                          : 'bg-teal-700 text-white shadow-xs ring-1 ring-teal-700'
                        : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount / Notes */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-stone-600 mb-1 block">
                  વળતર / ડિસ્કાઉન્ટ (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discount === 0 ? '' : discount}
                  placeholder="₹ 0"
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-600 flex items-center gap-1 mb-1">
                  <FileText className="w-3 h-3" />
                  <span>નોંધ (વૈકલ્પિક)</span>
                </label>
                <input
                  type="text"
                  placeholder="નોંધ લખો..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Bill Total & Submit Button */}
          <div className="p-4 bg-white border-t border-stone-200 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>સબટોટલ:</span>
                <span className="font-mono tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>વળતર:</span>
                  <span className="font-mono tabular-nums">- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-stone-900 pt-1.5 border-t border-stone-200">
                <span>કુલ રકમ:</span>
                <span className="font-mono text-teal-800 text-lg tabular-nums">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                cart.length === 0
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white active:scale-[0.99]'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>બિલ પૂર્ણ કરો અને પ્રિન્ટ આપો</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
