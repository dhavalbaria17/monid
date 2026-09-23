export type UnitType = 'કિ.ગ્રા.' | 'ગ્રામ' | 'નંગ' | 'પેકેટ' | 'લીટર' | 'બોક્સ' | 'મીટર';

export interface Product {
  id: string;
  name: string;
  category: string;
  barcode?: string;
  purchasePrice: number; // ખરીદ કિંમત ₹
  sellingPrice: number;  // વેચાણ કિંમત ₹
  stock: number;         // ઉપલબ્ધ જથ્થો
  unit: UnitType;
  minStockAlert: number; // લઘુત્તમ સ્ટોક ચેતવણી
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  unit: UnitType;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  total: number;
}

export type PaymentMode = 'રોકડ' | 'UPI/ઓનલાઇન' | 'ઉધાર';

export type CreditStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  openingBalance?: number; // શરૂઆતની જૂની બાકી રકમ
}

export interface CreditPayment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string; // ISO date
  paymentMode: 'રોકડ' | 'UPI/ઓનલાઇન' | 'બેંક ટ્રાન્સફર';
  note?: string;
  receiptNumber: string;
  settledBillIds?: string[];
}

export interface CreditManualEntry {
  id: string;
  customerId: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT'; // DEBIT = ઉધાર આપ્યું, CREDIT = છૂટ/ડિસ્કાઉન્ટ
  date: string;
  note: string;
}

export interface Sale {
  id: string;
  billNumber: string;
  date: string; // ISO date
  customerName?: string;
  customerPhone?: string;
  customerId?: string; // Linked Customer ID
  items: CartItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  totalCost: number; // For accurate profit calculation
  profit: number;    // grandTotal - totalCost
  paymentMode: PaymentMode;
  notes?: string;
  // Credit status fields
  isCredit?: boolean;
  creditStatus?: CreditStatus;
  paidAmount?: number; // Amount paid so far for this bill
}

export type TransactionType = 'આવક' | 'જાવક';

export interface CashTransaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  paymentMode: 'રોકડ' | 'UPI/બેંક';
  saleId?: string;
}

export interface PriceChangeLog {
  id: string;
  productId: string;
  productName: string;
  oldSellingPrice: number;
  newSellingPrice: number;
  oldPurchasePrice: number;
  newPurchasePrice: number;
  date: string;
  note?: string;
}

export interface ShopProfile {
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  tagline: string;
  billFooter: string;
  gstNumber?: string;
}
