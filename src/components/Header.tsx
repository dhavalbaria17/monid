import React from 'react';
import { useShop } from '../context/ShopContext';
import { Store, Wifi, WifiOff, PlusCircle, ShieldCheck, Bell } from 'lucide-react';
import { formatGujaratiDate, getTodayDateString } from '../utils/formatters';

export const Header: React.FC = () => {
  const { shopProfile, isOnline, setActiveTab, products } = useShop();
  const todayFormatted = formatGujaratiDate(getTodayDateString());

  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Shop Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-stone-900 tracking-tight leading-tight">
                  {shopProfile.shopName}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-stone-500">
                  <span>·</span>
                  <span>{shopProfile.ownerName}</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                {todayFormatted}
              </p>
            </div>
          </div>

          {/* Right Action Zone */}
          <div className="flex items-center gap-3">
            {/* Offline / Online Status Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
              }`}
              title={
                isOnline
                  ? 'નેટવર્ક જોડાયેલ છે - ડેટા લોકલ સેવ થાય છે'
                  : 'ઓફલાઇન મોડ - બધો ડેટા તમારા ફોન/કોમ્પ્યુટરમાં સુરક્ષિત સાચવવામાં આવે છે'
              }
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">ઓનલાઇન</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>ઓફલાઇન સક્રિય</span>
                </>
              )}
              <span className="text-[10px] opacity-75 hidden lg:inline">
                (૧૦૦% ઓફલાઇન સપોર્ટ)
              </span>
            </div>

            {/* Offline Safe Indicator */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-stone-500 bg-stone-50 px-2 py-1 rounded-md border border-stone-200">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>ડેટા સુરક્ષિત</span>
            </div>

            {/* Low-Stock Notification Bell */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
                lowStockCount > 0
                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-transparent'
              }`}
              title={
                lowStockCount > 0
                  ? `${lowStockCount} વસ્તુઓનો સ્ટોક લઘુત્તમ મર્યાદાથી ઓછો છે!`
                  : 'સ્ટોક સામાન્ય છે'
              }
            >
              <Bell className="w-4 h-4" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {lowStockCount}
                </span>
              )}
            </button>

            {/* Quick POS Sale Button */}
            <button
              onClick={() => setActiveTab('billing')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>નવું વેચાણ / બિલ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
