/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { BillingPOS } from './components/BillingPOS';
import { ProductsStock } from './components/ProductsStock';
import { PriceDashboard } from './components/PriceDashboard';
import { IncomeExpense } from './components/IncomeExpense';
import { ProfitLossReport } from './components/ProfitLossReport';
import { BackupSettings } from './components/BackupSettings';
import { CustomerCredit } from './components/CustomerCredit';
import { PrintBillModal } from './components/PrintBillModal';
import { DownloadCloud, Wifi, WifiOff } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, isOnline } = useShop();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => console.log('SW registration error:', err));
      });
    }

    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900 font-sans">
      {/* Offline Alert Strip if Offline */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            તમે ઓફલાઇન મોડમાં છો. ચિંતા કરશો નહીં, તમામ હિસાબ અને બિલિંગ કોઈપણ ખલેલ વગર સામાન્ય રીતે કામ કરી રહ્યા છે.
          </span>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallPrompt && (
        <div className="bg-teal-900 text-white px-4 py-2.5 flex items-center justify-between text-xs shadow-md no-print">
          <div className="flex items-center gap-2">
            <DownloadCloud className="w-4 h-4 text-teal-300" />
            <span>દુકાન વ્યવસ્થાપક એપ તમારા મોબાઈલ કે કોમ્પ્યુટરમાં ઇન્સ્ટોલ કરો</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallApp}
              className="bg-teal-500 hover:bg-teal-400 text-stone-950 font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
            >
              ઇન્સ્ટોલ કરો
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="text-stone-300 hover:text-white px-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header />

      {/* Main Tabs Navigation */}
      <div className="no-print">
        <Navigation />
      </div>

      {/* Main Dynamic View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'billing' && <BillingPOS />}
        {activeTab === 'products' && <ProductsStock />}
        {activeTab === 'customer_credit' && <CustomerCredit />}
        {activeTab === 'price_control' && <PriceDashboard />}
        {activeTab === 'cash_ledger' && <IncomeExpense />}
        {activeTab === 'profit_loss' && <ProfitLossReport />}
        {activeTab === 'backup_settings' && <BackupSettings />}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-stone-200 mt-auto py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">દુકાન વ્યવસ્થાપક</span>
            <span>·</span>
            <span>ગુજરાતી દૈનિક વ્યાપાર હિસાબ</span>
          </div>
          <div className="flex items-center gap-3 text-stone-500">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isOnline ? 'ઓનલાઇન' : 'ઓફલાઇન સક્રિય'}
            </span>
            <span>·</span>
            <span>૧૦૦% સલામત સ્થાનિક ડેટા</span>
          </div>
        </div>
      </footer>

      {/* Bill Printing & Share Modal */}
      <PrintBillModal />
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <AppContent />
    </ShopProvider>
  );
}
