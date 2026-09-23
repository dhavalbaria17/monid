import React, { useState, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import {
  Download,
  Upload,
  HardDrive,
  FileSpreadsheet,
  Store,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  ShieldCheck,
} from 'lucide-react';
import { exportToJSON, exportToCSV, getTodayDateString } from '../utils/formatters';

export const BackupSettings: React.FC = () => {
  const {
    products,
    categories,
    sales,
    transactions,
    priceLogs,
    shopProfile,
    customers,
    creditPayments,
    creditManualEntries,
    getCustomerBalance,
    updateShopProfile,
    restoreAllData,
    resetToDemoData,
    isOnline,
  } = useShop();

  const [profileForm, setProfileForm] = useState(shopProfile);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);
  const [backupRestoreMsg, setBackupRestoreMsg] = useState<string | null>(null);
  const [backupRestoreError, setBackupRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Profile Save
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopProfile(profileForm);
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 3000);
  };

  // 1. Download full JSON Backup
  const handleDownloadBackup = () => {
    const backupPayload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      shopProfile,
      products,
      categories,
      sales,
      transactions,
      priceLogs,
      customers,
      creditPayments,
      creditManualEntries,
    };
    const filename = `દુકાન_બેકઅપ_${shopProfile.shopName.replace(/\s+/g, '_')}_${getTodayDateString()}.json`;
    exportToJSON(filename, backupPayload);

    setBackupRestoreMsg('બેકઅપ ફાઈલ સફળતાપૂર્વક ડાઉનલોડ થઈ ગઈ છે!');
    setTimeout(() => setBackupRestoreMsg(null), 4000);
  };

  // 2. Upload and Restore Backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupRestoreError(null);
    setBackupRestoreMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.products || !Array.isArray(parsed.products)) {
          throw new Error('અમાન્ય બેકઅપ ફાઇલ ફોર્મેટ');
        }

        const success = restoreAllData(parsed);
        if (success) {
          if (parsed.shopProfile) setProfileForm(parsed.shopProfile);
          setBackupRestoreMsg('ડેટા સફળતાપૂર્વક પાછો લવાયો (Restored)!');
        } else {
          setBackupRestoreError('ડેટા રીસ્ટોર કરવામાં ક્ષતિ આવી.');
        }
      } catch (err: any) {
        setBackupRestoreError('બેકઅપ ફાઈલ વાંચવામાં ભૂલ: કૃપા કરીને સાચી .json ફાઈલ પસંદ કરો.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 3. Export Sales CSV
  const handleExportSalesCSV = () => {
    const headers = ['બિલ નં', 'તારીખ', 'ગ્રાહક', 'મોબાઈલ', 'વસ્તુઓ સંખ્યા', 'સબટોટલ (₹)', 'વળતર (₹)', 'કુલ રકમ (₹)', 'નફો (₹)', 'ચૂકવણી'];
    const rows = sales.map((s) => [
      s.billNumber,
      s.date,
      s.customerName || 'સામાન્ય ગ્રાહક',
      s.customerPhone || '-',
      s.items.length,
      s.subtotal,
      s.discount,
      s.grandTotal,
      s.profit,
      s.paymentMode,
    ]);
    exportToCSV(`દુકાન_વેચાણ_રિપોર્ટ_${getTodayDateString()}.csv`, [headers, ...rows]);
  };

  // 4. Export Products CSV
  const handleExportProductsCSV = () => {
    const headers = ['નામ', 'કેટેગરી', 'ખરીદ કિંમત (₹)', 'વેચાણ કિંમત (₹)', 'સ્ટોક જથ્થો', 'એકમ', 'લઘુત્તમ ચેતવણી'];
    const rows = products.map((p) => [
      p.name,
      p.category,
      p.purchasePrice,
      p.sellingPrice,
      p.stock,
      p.unit,
      p.minStockAlert,
    ]);
    exportToCSV(`દુકાન_સ્ટોક_યાદી_${getTodayDateString()}.csv`, [headers, ...rows]);
  };

  // 5. Export Customer Credit (ઉધાર ખાતાવહી) CSV
  const handleExportCreditCSV = () => {
    const headers = ['ગ્રાહકનું નામ', 'મોબાઈલ નંબર', 'સરનામું', 'પ્રારંભિક બાકી (₹)', 'હાલની કુલ બાકી રકમ (₹)', 'નોંધણી તારીખ', 'નોંધ'];
    const rows = customers.map((c) => [
      c.name,
      c.phone || '-',
      c.address || '-',
      c.openingBalance || 0,
      getCustomerBalance(c.id),
      c.createdAt.split('T')[0],
      c.notes || '-',
    ]);
    exportToCSV(`દુકાન_ઉધાર_ખાતાવહી_${getTodayDateString()}.csv`, [headers, ...rows]);
  };

  // 6. Reset Demo Data
  const handleResetDemo = () => {
    if (
      confirm(
        'ચેતવણી: શું તમે હાલનો ડેટા ભૂંસીને મૂળ નમૂનાનો ડેમો ડેટા ફરી લાવવા માંગો છો?'
      )
    ) {
      resetToDemoData();
      alert('ડેમો ડેટા સફળતાપૂર્વક લોડ થઈ ગયો છે.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">
          ડેટા બેકઅપ, રિપોર્ટ્સ અને દુકાન સેટિંગ્સ
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          તમારો ડેટા સુરક્ષિત સાચવો, કમ્પ્યુટર કે ફોનમાં સેવ કરો અને દુકાનની વિગતો બદલો.
        </p>
      </div>

      {/* Offline Guarantee Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
              <span>૧૦૦% ઓફલાઇન સપોર્ટ (Offline Ready)</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                {isOnline ? 'ઇન્ટરનેટ જોડાયેલ છે' : 'ઓફલાઇન મોડમાં કાર્યરત'}
              </span>
            </h3>
            <p className="text-xs text-teal-800 mt-1 leading-relaxed">
              આ એપ ચલાવવા માટે ઇન્ટરનેટ હોવું જરૂરી નથી. તમારો સંપૂર્ણ હિસાબ, પ્રોડક્ટ્સ, બિલો અને ખર્ચા તમારા ડિવાઇસની મેમરીમાં (Local Storage) સુરક્ષિત સંગ્રહિત થાય છે.
            </p>
          </div>
        </div>

        <div className="text-xs text-teal-900 font-semibold bg-white/80 px-3 py-1.5 rounded-xl border border-teal-200 whitespace-nowrap">
          {products.length} પ્રોડક્ટ્સ · {sales.length} બિલો સાચવેલ
        </div>
      </div>

      {/* Notification Messages */}
      {backupRestoreMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{backupRestoreMsg}</span>
        </div>
      )}

      {backupRestoreError && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{backupRestoreError}</span>
        </div>
      )}

      {/* Grid: Backup / Restore & Excel Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: JSON Backup & Restore */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">ડેટા બેકઅપ અને રીસ્ટોર</h3>
              <p className="text-xs text-stone-500">
                સંપૂર્ણ દુકાનનો ડેટા એક ક્લિકમાં સાચવો અથવા પાછો લાવો
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {/* Download Button */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <h4 className="text-xs font-bold text-stone-900 mb-1">
                ૧. બેકઅપ ફાઈલ ડાઉનલોડ કરો
              </h4>
              <p className="text-xs text-stone-500 mb-3">
                તમારા બધા સ્ટોક, બિલો, ભાવ ફેરફાર અને ખર્ચાની સલામત કોપી `.json` ફાઇલમાં ડાઉનલોડ કરો.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>સંપૂર્ણ ડેટા બેકઅપ ડાઉનલોડ કરો</span>
              </button>
            </div>

            {/* Restore File */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <h4 className="text-xs font-bold text-stone-900 mb-1">
                ૨. જૂના બેકઅપમાંથી ડેટા પાછો લાવો (Restore)
              </h4>
              <p className="text-xs text-stone-500 mb-3">
                અગાઉ ડાઉનલોડ કરેલ બેકઅપ ફાઇલ પસંદ કરીને ડેટા ફરી રીસ્ટોર કરો.
              </p>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                id="restore-file-input"
              />
              <label
                htmlFor="restore-file-input"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-stone-600" />
                <span>બેકઅપ ફાઇલ પસંદ કરો (.json)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: Excel / CSV Reports */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">એક્સેલ / CSV રિપોર્ટ્સ</h3>
              <p className="text-xs text-stone-500">
                માઇક્રોસોફ્ટ એક્સેલ અથવા ગૂગલ શીટ્સમાં ખોલી શકાય તેવી ફાઇલો
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-stone-900">પ્રોડક્ટ્સ અને સ્ટોક યાદી</h4>
                <p className="text-[11px] text-stone-500">બધી વસ્તુઓ, કિંમત અને જથ્થો</p>
              </div>
              <button
                onClick={handleExportProductsCSV}
                className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-stone-900">તમામ વેચાણ બિલોની યાદી</h4>
                <p className="text-[11px] text-stone-500">ગ્રાહક, તારીખ, રકમ અને નફો</p>
              </div>
              <button
                onClick={handleExportSalesCSV}
                className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-stone-900">ઉધાર ખાતાવહી (Customer Credit)</h4>
                <p className="text-[11px] text-stone-500">ગ્રાહકોની યાદી અને બાકી હિસાબ</p>
              </div>
              <button
                onClick={handleExportCreditCSV}
                className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            {/* Reset Demo Data */}
            <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200 flex items-center justify-between mt-4">
              <div>
                <h4 className="text-xs font-bold text-rose-950">નમૂનાનો ડેમો ડેટા ફરી લાવો</h4>
                <p className="text-[11px] text-rose-700">ટેસ્ટિંગ માટે મૂળ ડેટા રીસેટ કરો</p>
              </div>
              <button
                onClick={handleResetDemo}
                className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>રીસેટ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Profile Settings Form */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-200">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">દુકાનની પ્રોફાઈલ અને બિલ સેટિંગ્સ</h3>
            <p className="text-xs text-stone-500">
              અહીં લખેલી વિગતો ગ્રાહકને અપાતા બિલમાં અને રિપોર્ટમાં છપાશે.
            </p>
          </div>
        </div>

        {profileSavedMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>દુકાનની પ્રોફાઈલ સફળતાપૂર્વક સાચવવામાં આવી!</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                દુકાનનું નામ *
              </label>
              <input
                type="text"
                required
                value={profileForm.shopName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, shopName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                વેપારી / માલિકનું નામ *
              </label>
              <input
                type="text"
                required
                value={profileForm.ownerName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, ownerName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                સંપર્ક મોબાઈલ નંબર *
              </label>
              <input
                type="text"
                required
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                GSTIN / લાઇસન્સ નંબર (વૈકલ્પિક)
              </label>
              <input
                type="text"
                value={profileForm.gstNumber || ''}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, gstNumber: e.target.value })
                }
                placeholder="દા.ત. 24AAAAA0000A1Z5"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              દુકાનનું સરનામું *
            </label>
            <input
              type="text"
              required
              value={profileForm.address}
              onChange={(e) =>
                setProfileForm({ ...profileForm, address: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ટૅગલાઇન / સ્લોગન
              </label>
              <input
                type="text"
                value={profileForm.tagline}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, tagline: e.target.value })
                }
                placeholder="દા.ત. શુદ્ધતા અને વિશ્વાસનું પ્રતીક"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                બિલ નીચે છાપવા માટે સંદેશ (Footer Message)
              </label>
              <input
                type="text"
                value={profileForm.billFooter}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, billFooter: e.target.value })
                }
                placeholder="દા.ત. પધારવા બદલ આભાર! ફરી પધારશો."
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              પ્રોફાઈલ સેવ કરો
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
