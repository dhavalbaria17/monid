import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Sale,
  CashTransaction,
  PriceChangeLog,
  ShopProfile,
  Customer,
  CreditPayment,
  CreditManualEntry,
  CreditStatus,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_SHOP_PROFILE,
  DEFAULT_PRODUCT_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_CREDIT_PAYMENTS,
  INITIAL_CREDIT_MANUAL_ENTRIES,
  getInitialSales,
  getInitialExpenses,
} from '../data/initialData';

interface BulkPriceUpdateOptions {
  category: string;
  target: 'selling' | 'purchase' | 'both';
  type: 'percentage' | 'fixed';
  value: number; // positive for increase, negative for decrease
}

export interface CustomerStats {
  openingBalance: number;
  totalPurchased: number;
  totalPaid: number;
  balance: number;
  billsCount: number;
  unpaidBillsCount: number;
  lastTxDate: string | null;
}

interface ShopContextType {
  products: Product[];
  categories: string[];
  sales: Sale[];
  transactions: CashTransaction[];
  priceLogs: PriceChangeLog[];
  shopProfile: ShopProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOnline: boolean;
  currentBillForPrint: Sale | null;
  setCurrentBillForPrint: (bill: Sale | null) => void;
  // Product & Stock methods
  addProduct: (productData: Omit<Product, 'id' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number, reason?: string) => void;
  // Category management
  addCategory: (name: string) => boolean;
  updateCategory: (oldName: string, newName: string) => boolean;
  deleteCategory: (name: string) => boolean;
  // Price Management methods
  updateSinglePrice: (
    id: string,
    newSellingPrice: number,
    newPurchasePrice: number,
    note?: string
  ) => void;
  bulkUpdatePrices: (options: BulkPriceUpdateOptions) => number;
  // Sales & POS methods
  createSale: (
    saleData: Omit<Sale, 'id' | 'billNumber' | 'date'>
  ) => Sale;
  deleteSale: (id: string) => void;
  // Ledger / Cash Transaction methods
  addTransaction: (tx: Omit<CashTransaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  // Customer Credit (ઉધાર ખાતું) methods
  customers: Customer[];
  creditPayments: CreditPayment[];
  creditManualEntries: CreditManualEntry[];
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => boolean;
  linkBillToCustomer: (
    billId: string,
    customerId: string,
    customerName?: string,
    customerPhone?: string
  ) => boolean;
  unlinkBillFromCustomer: (billId: string) => boolean;
  markBillPaymentStatus: (billId: string, status: CreditStatus, paidAmount?: number) => void;
  recordCreditPayment: (paymentData: {
    customerId: string;
    amount: number;
    date?: string;
    paymentMode: 'રોકડ' | 'UPI/ઓનલાઇન' | 'બેંક ટ્રાન્સફર';
    note?: string;
    addToCashLedger?: boolean;
  }) => CreditPayment;
  addCreditManualEntry: (entryData: Omit<CreditManualEntry, 'id'>) => CreditManualEntry;
  deleteCreditPayment: (id: string) => void;
  deleteCreditManualEntry: (id: string) => void;
  getCustomerBalance: (customerId: string) => number;
  getCustomerStats: (customerId: string) => CustomerStats;
  // Settings & Backup
  updateShopProfile: (profile: ShopProfile) => void;
  restoreAllData: (data: {
    products?: Product[];
    categories?: string[];
    sales?: Sale[];
    transactions?: CashTransaction[];
    priceLogs?: PriceChangeLog[];
    shopProfile?: ShopProfile;
    customers?: Customer[];
    creditPayments?: CreditPayment[];
    creditManualEntries?: CreditManualEntry[];
  }) => boolean;
  resetToDemoData: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'dukan_products_v2',
  CATEGORIES: 'dukan_categories_v2',
  SALES: 'dukan_sales_v2',
  TRANSACTIONS: 'dukan_transactions_v2',
  PRICE_LOGS: 'dukan_pricelogs_v2',
  PROFILE: 'dukan_profile_v2',
  CUSTOMERS: 'dukan_customers_v2',
  CREDIT_PAYMENTS: 'dukan_credit_payments_v2',
  CREDIT_MANUAL_ENTRIES: 'dukan_credit_manual_entries_v2',
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [currentBillForPrint, setCurrentBillForPrint] = useState<Sale | null>(null);

  // Dynamic Product Categories
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with DEFAULT_PRODUCT_CATEGORIES to ensure defaults exist
          return Array.from(new Set([...parsed, ...DEFAULT_PRODUCT_CATEGORIES]));
        }
      }
    } catch (e) {
      console.error('Error loading categories from storage:', e);
    }
    return DEFAULT_PRODUCT_CATEGORIES;
  });

  // Load from localStorage or defaults
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading products from storage:', e);
    }
    return INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading sales from storage:', e);
    }
    return getInitialSales();
  });

  const [transactions, setTransactions] = useState<CashTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading transactions from storage:', e);
    }
    return getInitialExpenses();
  });

  const [priceLogs, setPriceLogs] = useState<PriceChangeLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRICE_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading price logs:', e);
    }
    return [];
  });

  const [shopProfile, setShopProfile] = useState<ShopProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading shop profile:', e);
    }
    return INITIAL_SHOP_PROFILE;
  });

  // Customer Credit (ઉધાર ખાતું) States
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading customers from storage:', e);
    }
    return INITIAL_CUSTOMERS;
  });

  const [creditPayments, setCreditPayments] = useState<CreditPayment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREDIT_PAYMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading credit payments from storage:', e);
    }
    return INITIAL_CREDIT_PAYMENTS;
  });

  const [creditManualEntries, setCreditManualEntries] = useState<CreditManualEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREDIT_MANUAL_ENTRIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading credit manual entries from storage:', e);
    }
    return INITIAL_CREDIT_MANUAL_ENTRIES;
  });

  // Offline / Online listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed saving categories to localStorage', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Failed saving products to localStorage', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (e) {
      console.error('Failed saving sales to localStorage', e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed saving transactions to localStorage', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRICE_LOGS, JSON.stringify(priceLogs));
    } catch (e) {
      console.error('Failed saving priceLogs to localStorage', e);
    }
  }, [priceLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(shopProfile));
    } catch (e) {
      console.error('Failed saving profile to localStorage', e);
    }
  }, [shopProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed saving customers to localStorage', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CREDIT_PAYMENTS, JSON.stringify(creditPayments));
    } catch (e) {
      console.error('Failed saving credit payments to localStorage', e);
    }
  }, [creditPayments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CREDIT_MANUAL_ENTRIES, JSON.stringify(creditManualEntries));
    } catch (e) {
      console.error('Failed saving credit manual entries to localStorage', e);
    }
  }, [creditManualEntries]);

  // Methods
  const addProduct = (productData: Omit<Product, 'id' | 'updatedAt'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const adjustStock = (id: string, delta: number, _reason?: string) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStock = Math.max(0, item.stock + delta);
          return {
            ...item,
            stock: newStock,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  };

  const addCategory = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (categories.includes(trimmed)) return false;
    setCategories((prev) => [...prev, trimmed]);
    return true;
  };

  const updateCategory = (oldName: string, newName: string): boolean => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return false;
    setCategories((prev) => prev.map((c) => (c === oldName ? trimmed : c)));
    // Also update all products that belong to this category
    setProducts((prev) =>
      prev.map((p) => (p.category === oldName ? { ...p, category: trimmed } : p))
    );
    return true;
  };

  const deleteCategory = (categoryName: string): boolean => {
    if (categories.length <= 1) return false;
    const fallbackCategory = categories.find((c) => c !== categoryName) || 'અન્ય ઘરગથ્થુ';
    setCategories((prev) => prev.filter((c) => c !== categoryName));
    // Reassign products of deleted category to fallback
    setProducts((prev) =>
      prev.map((p) => (p.category === categoryName ? { ...p, category: fallbackCategory } : p))
    );
    return true;
  };

  const updateSinglePrice = (
    id: string,
    newSellingPrice: number,
    newPurchasePrice: number,
    note?: string
  ) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const logEntry: PriceChangeLog = {
      id: `plog-${Date.now()}`,
      productId: id,
      productName: product.name,
      oldSellingPrice: product.sellingPrice,
      newSellingPrice,
      oldPurchasePrice: product.purchasePrice,
      newPurchasePrice,
      date: new Date().toISOString(),
      note: note || 'ભાવ સુધારો',
    };

    setPriceLogs((prev) => [logEntry, ...prev]);
    updateProduct(id, {
      sellingPrice: newSellingPrice,
      purchasePrice: newPurchasePrice,
    });
  };

  const bulkUpdatePrices = (options: BulkPriceUpdateOptions): number => {
    let affectedCount = 0;
    const now = new Date().toISOString();
    const newLogs: PriceChangeLog[] = [];

    setProducts((prev) =>
      prev.map((prod) => {
        if (options.category !== 'બધા વિભાગો' && prod.category !== options.category) {
          return prod;
        }

        affectedCount++;
        let newSelling = prod.sellingPrice;
        let newPurchase = prod.purchasePrice;

        if (options.target === 'selling' || options.target === 'both') {
          if (options.type === 'percentage') {
            newSelling = Math.max(1, Math.round(prod.sellingPrice * (1 + options.value / 100)));
          } else {
            newSelling = Math.max(1, Math.round(prod.sellingPrice + options.value));
          }
        }

        if (options.target === 'purchase' || options.target === 'both') {
          if (options.type === 'percentage') {
            newPurchase = Math.max(1, Math.round(prod.purchasePrice * (1 + options.value / 100)));
          } else {
            newPurchase = Math.max(1, Math.round(prod.purchasePrice + options.value));
          }
        }

        newLogs.push({
          id: `plog-${Date.now()}-${Math.random()}`,
          productId: prod.id,
          productName: prod.name,
          oldSellingPrice: prod.sellingPrice,
          newSellingPrice: newSelling,
          oldPurchasePrice: prod.purchasePrice,
          newPurchasePrice: newPurchase,
          date: now,
          note: `જથ્થાબંધ ફેરફાર: ${options.category} (${options.value > 0 ? '+' : ''}${options.value}${options.type === 'percentage' ? '%' : '₹'})`,
        });

        return {
          ...prod,
          sellingPrice: newSelling,
          purchasePrice: newPurchase,
          updatedAt: now,
        };
      })
    );

    if (newLogs.length > 0) {
      setPriceLogs((prev) => [...newLogs, ...prev]);
    }

    return affectedCount;
  };

  const createSale = (saleData: Omit<Sale, 'id' | 'billNumber' | 'date'>): Sale => {
    const saleDate = new Date().toISOString();
    const nextBillNum = `બિલ-${sales.length + 101}`;

    let finalCustomerId = saleData.customerId;
    if (!finalCustomerId && saleData.customerName && saleData.paymentMode === 'ઉધાર') {
      const match = customers.find(
        (c) => c.name.trim().toLowerCase() === saleData.customerName!.trim().toLowerCase()
      );
      if (match) {
        finalCustomerId = match.id;
      } else {
        // Auto register new customer
        const autoCust: Customer = {
          id: `cust-${Date.now()}`,
          name: saleData.customerName.trim(),
          phone: saleData.customerPhone?.trim() || '',
          createdAt: saleDate,
          openingBalance: 0,
        };
        setCustomers((prev) => [autoCust, ...prev]);
        finalCustomerId = autoCust.id;
      }
    }

    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      billNumber: nextBillNum,
      date: saleDate,
      customerId: finalCustomerId,
      isCredit: saleData.paymentMode === 'ઉધાર',
      creditStatus: saleData.paymentMode === 'ઉધાર' ? 'UNPAID' : undefined,
      paidAmount: 0,
    };

    // 1. Deduct stock for each sold item
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = saleData.items.find((item) => item.productId === prod.id);
        if (soldItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - soldItem.quantity),
            updatedAt: saleDate,
          };
        }
        return prod;
      })
    );

    // 2. Append to sales list
    setSales((prev) => [newSale, ...prev]);

    // 3. Automatically add to Cash Ledger as Income (if cash or UPI)
    if (newSale.paymentMode !== 'ઉધાર') {
      const newTx: CashTransaction = {
        id: `tx-${Date.now()}`,
        type: 'આવક',
        category: 'રોકડ વેચાણ',
        amount: newSale.grandTotal,
        date: saleDate.split('T')[0],
        description: `${newSale.billNumber} - ${newSale.customerName || 'ગ્રાહક'} (વેચાણ)`,
        paymentMode: newSale.paymentMode === 'રોકડ' ? 'રોકડ' : 'UPI/બેંક',
        saleId: newSale.id,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }

    return newSale;
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
    // Also remove associated transaction if any
    setTransactions((prev) => prev.filter((t) => t.saleId !== id));
  };

  const addTransaction = (tx: Omit<CashTransaction, 'id'>) => {
    const newTx: CashTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Customer Credit (ઉધાર ખાતું) Management Methods
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
      openingBalance: customerData.openingBalance || 0,
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteCustomer = (id: string): boolean => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    // Unlink bills from this customer
    setSales((prev) =>
      prev.map((s) => (s.customerId === id ? { ...s, customerId: undefined } : s))
    );
    return true;
  };

  const linkBillToCustomer = (
    billId: string,
    customerId: string,
    customerName?: string,
    customerPhone?: string
  ): boolean => {
    const targetCustomer = customers.find((c) => c.id === customerId);
    if (!targetCustomer) return false;

    setSales((prev) =>
      prev.map((sale) => {
        if (sale.id === billId) {
          return {
            ...sale,
            customerId,
            customerName: customerName || targetCustomer.name,
            customerPhone: customerPhone || targetCustomer.phone,
            paymentMode: 'ઉધાર',
            isCredit: true,
            creditStatus: sale.creditStatus || 'UNPAID',
            paidAmount: sale.paidAmount || 0,
          };
        }
        return sale;
      })
    );
    return true;
  };

  const unlinkBillFromCustomer = (billId: string): boolean => {
    setSales((prev) =>
      prev.map((sale) => {
        if (sale.id === billId) {
          return {
            ...sale,
            customerId: undefined,
          };
        }
        return sale;
      })
    );
    return true;
  };

  const markBillPaymentStatus = (billId: string, status: CreditStatus, paidAmount?: number) => {
    setSales((prev) =>
      prev.map((sale) => {
        if (sale.id === billId) {
          const finalPaid =
            paidAmount !== undefined
              ? paidAmount
              : status === 'PAID'
              ? sale.grandTotal
              : status === 'UNPAID'
              ? 0
              : sale.paidAmount || 0;
          return {
            ...sale,
            creditStatus: status,
            paidAmount: finalPaid,
          };
        }
        return sale;
      })
    );
  };

  const recordCreditPayment = (paymentData: {
    customerId: string;
    amount: number;
    date?: string;
    paymentMode: 'રોકડ' | 'UPI/ઓનલાઇન' | 'બેંક ટ્રાન્સફર';
    note?: string;
    addToCashLedger?: boolean;
  }): CreditPayment => {
    const cust = customers.find((c) => c.id === paymentData.customerId);
    const custName = cust ? cust.name : 'ગ્રાહક';
    const date = paymentData.date || new Date().toISOString();
    const receiptNum = `રસીદ-${creditPayments.length + 101}`;

    // Allocate payment to customer's unpaid bills
    const customerBills = sales
      .filter(
        (s) =>
          (s.customerId === paymentData.customerId ||
            (!s.customerId && s.customerName && cust && s.customerName.trim().toLowerCase() === cust.name.trim().toLowerCase())) &&
          (s.paymentMode === 'ઉધાર' || s.isCredit)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remainingPayment = paymentData.amount;
    const settledIds: string[] = [];
    const updatedBillsMap = new Map<string, { creditStatus: CreditStatus; paidAmount: number }>();

    for (const bill of customerBills) {
      if (remainingPayment <= 0) break;
      const currentPaid = bill.paidAmount || 0;
      const due = Math.max(0, bill.grandTotal - currentPaid);
      if (due > 0) {
        if (remainingPayment >= due) {
          remainingPayment -= due;
          updatedBillsMap.set(bill.id, {
            creditStatus: 'PAID',
            paidAmount: bill.grandTotal,
          });
          settledIds.push(bill.id);
        } else {
          updatedBillsMap.set(bill.id, {
            creditStatus: 'PARTIAL',
            paidAmount: currentPaid + remainingPayment,
          });
          remainingPayment = 0;
          settledIds.push(bill.id);
        }
      }
    }

    if (updatedBillsMap.size > 0) {
      setSales((prev) =>
        prev.map((s) => {
          const update = updatedBillsMap.get(s.id);
          if (update) {
            return {
              ...s,
              creditStatus: update.creditStatus,
              paidAmount: update.paidAmount,
              customerId: paymentData.customerId,
            };
          }
          return s;
        })
      );
    }

    const newPayment: CreditPayment = {
      id: `cpay-${Date.now()}`,
      customerId: paymentData.customerId,
      customerName: custName,
      amount: paymentData.amount,
      date,
      paymentMode: paymentData.paymentMode,
      note: paymentData.note,
      receiptNumber: receiptNum,
      settledBillIds: settledIds.length > 0 ? settledIds : undefined,
    };

    setCreditPayments((prev) => [newPayment, ...prev]);

    // Add to daily Cash Ledger as income if requested (default true)
    if (paymentData.addToCashLedger !== false) {
      const cashTx: CashTransaction = {
        id: `tx-${Date.now()}-cpay`,
        type: 'આવક',
        category: 'ઉધાર વસૂલાત',
        amount: paymentData.amount,
        date: date.split('T')[0],
        description: `${custName} પાસેથી ઉધાર જમા (${paymentData.note || 'વસૂલાત'}) - ${receiptNum}`,
        paymentMode: paymentData.paymentMode === 'રોકડ' ? 'રોકડ' : 'UPI/બેંક',
      };
      setTransactions((prev) => [cashTx, ...prev]);
    }

    return newPayment;
  };

  const addCreditManualEntry = (entryData: Omit<CreditManualEntry, 'id'>): CreditManualEntry => {
    const newEntry: CreditManualEntry = {
      ...entryData,
      id: `cme-${Date.now()}`,
    };
    setCreditManualEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const deleteCreditPayment = (id: string) => {
    setCreditPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const deleteCreditManualEntry = (id: string) => {
    setCreditManualEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const getCustomerBalance = (customerId: string): number => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return 0;
    const opening = cust.openingBalance || 0;

    const linkedSales = sales.filter(
      (s) =>
        (s.customerId === customerId ||
          (!s.customerId && s.customerName && s.customerName.trim().toLowerCase() === cust.name.trim().toLowerCase())) &&
        (s.paymentMode === 'ઉધાર' || s.isCredit)
    );
    const totalBillDebits = linkedSales.reduce((sum, s) => sum + s.grandTotal, 0);

    const manualEntries = creditManualEntries.filter((e) => e.customerId === customerId);
    const manualDebits = manualEntries
      .filter((e) => e.type === 'DEBIT')
      .reduce((sum, e) => sum + e.amount, 0);
    const manualCredits = manualEntries
      .filter((e) => e.type === 'CREDIT')
      .reduce((sum, e) => sum + e.amount, 0);

    const payments = creditPayments
      .filter((p) => p.customerId === customerId)
      .reduce((sum, p) => sum + p.amount, 0);

    const totalDebit = opening + totalBillDebits + manualDebits;
    const totalCredit = payments + manualCredits;

    return Math.max(0, totalDebit - totalCredit);
  };

  const getCustomerStats = (customerId: string): CustomerStats => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) {
      return {
        openingBalance: 0,
        totalPurchased: 0,
        totalPaid: 0,
        balance: 0,
        billsCount: 0,
        unpaidBillsCount: 0,
        lastTxDate: null,
      };
    }

    const opening = cust.openingBalance || 0;
    const linkedSales = sales.filter(
      (s) =>
        (s.customerId === customerId ||
          (!s.customerId && s.customerName && s.customerName.trim().toLowerCase() === cust.name.trim().toLowerCase())) &&
        (s.paymentMode === 'ઉધાર' || s.isCredit)
    );
    const totalPurchased = linkedSales.reduce((sum, s) => sum + s.grandTotal, 0);

    const payments = creditPayments.filter((p) => p.customerId === customerId);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const unpaidBills = linkedSales.filter((s) => s.creditStatus !== 'PAID');

    // Find latest transaction date among sales, payments, manual entries
    const dates: string[] = [cust.createdAt];
    linkedSales.forEach((s) => dates.push(s.date));
    payments.forEach((p) => dates.push(p.date));
    creditManualEntries.filter((e) => e.customerId === customerId).forEach((e) => dates.push(e.date));
    dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return {
      openingBalance: opening,
      totalPurchased,
      totalPaid,
      balance: getCustomerBalance(customerId),
      billsCount: linkedSales.length,
      unpaidBillsCount: unpaidBills.length,
      lastTxDate: dates[0] || null,
    };
  };

  const updateShopProfile = (profile: ShopProfile) => {
    setShopProfile(profile);
  };

  const restoreAllData = (data: {
    products?: Product[];
    categories?: string[];
    sales?: Sale[];
    transactions?: CashTransaction[];
    priceLogs?: PriceChangeLog[];
    shopProfile?: ShopProfile;
    customers?: Customer[];
    creditPayments?: CreditPayment[];
    creditManualEntries?: CreditManualEntry[];
  }): boolean => {
    try {
      if (data.products && Array.isArray(data.products)) setProducts(data.products);
      if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
      if (data.sales && Array.isArray(data.sales)) setSales(data.sales);
      if (data.transactions && Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (data.priceLogs && Array.isArray(data.priceLogs)) setPriceLogs(data.priceLogs);
      if (data.shopProfile && data.shopProfile.shopName) setShopProfile(data.shopProfile);
      if (data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
      if (data.creditPayments && Array.isArray(data.creditPayments)) setCreditPayments(data.creditPayments);
      if (data.creditManualEntries && Array.isArray(data.creditManualEntries)) setCreditManualEntries(data.creditManualEntries);
      return true;
    } catch (e) {
      console.error('Failed to restore data', e);
      return false;
    }
  };

  const resetToDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(DEFAULT_PRODUCT_CATEGORIES);
    setSales(getInitialSales());
    setTransactions(getInitialExpenses());
    setPriceLogs([]);
    setShopProfile(INITIAL_SHOP_PROFILE);
    setCustomers(INITIAL_CUSTOMERS);
    setCreditPayments(INITIAL_CREDIT_PAYMENTS);
    setCreditManualEntries(INITIAL_CREDIT_MANUAL_ENTRIES);
    localStorage.clear();
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        categories,
        sales,
        transactions,
        priceLogs,
        shopProfile,
        activeTab,
        setActiveTab,
        isOnline,
        currentBillForPrint,
        setCurrentBillForPrint,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addCategory,
        updateCategory,
        deleteCategory,
        updateSinglePrice,
        bulkUpdatePrices,
        createSale,
        deleteSale,
        addTransaction,
        deleteTransaction,
        updateShopProfile,
        restoreAllData,
        resetToDemoData,
        customers,
        creditPayments,
        creditManualEntries,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        linkBillToCustomer,
        unlinkBillFromCustomer,
        markBillPaymentStatus,
        recordCreditPayment,
        addCreditManualEntry,
        deleteCreditPayment,
        deleteCreditManualEntry,
        getCustomerBalance,
        getCustomerStats,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = (): ShopContextType => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
