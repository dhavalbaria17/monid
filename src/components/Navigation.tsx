import React from 'react';
import { useShop } from '../context/ShopContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Settings,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  badgeColor?: 'amber' | 'teal' | 'rose';
}

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, products, customers, sales, getCustomerBalance } = useShop();

  // Count low stock items to show warning badge on stock tab
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  // Unlinked bills count or pending credit customers
  const unlinkedCreditBillsCount = sales.filter(
    (s) => (s.paymentMode === 'ઉધાર' || s.isCredit) && !s.customerId
  ).length;

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'મુખ્ય પૃષ્ઠ', icon: LayoutDashboard },
    { id: 'billing', label: 'નવું વેચાણ (બિલ)', icon: ShoppingCart },
    {
      id: 'products',
      label: 'સ્ટોક અને વસ્તુઓ',
      icon: Boxes,
      badgeCount: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'amber',
    },
    {
      id: 'customer_credit',
      label: 'ઉધાર ખાતું',
      icon: BookOpen,
      badgeCount: unlinkedCreditBillsCount > 0 ? unlinkedCreditBillsCount : undefined,
      badgeColor: 'amber',
    },
    { id: 'price_control', label: 'ભાવ વધઘટ', icon: TrendingUp },
    { id: 'cash_ledger', label: 'આવક-જાવક હિસાબ', icon: Receipt },
    { id: 'profit_loss', label: 'નફો-નુકસાન અહેવાલ', icon: FileSpreadsheet },
    { id: 'backup_settings', label: 'બેકઅપ / સેટિંગ્સ', icon: Settings },
  ];

  return (
    <nav className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold shadow-xs ring-1 ring-teal-200'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-teal-700' : 'text-stone-500'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800"
                    title={
                      tab.id === 'products'
                        ? `${tab.badgeCount} પ્રોડક્ટ્સમાં સ્ટોક ઓછો છે`
                        : `${tab.badgeCount} અનલિંક બાકી બિલો છે`
                    }
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>{tab.badgeCount}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
