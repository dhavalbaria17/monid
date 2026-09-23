import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Customer } from '../types';
import {
  X,
  CreditCard,
  CheckCircle2,
  Calendar,
  FileText,
  Wallet,
  IndianRupee,
} from 'lucide-react';
import { formatCurrency, getTodayDateString } from '../utils/formatters';

interface ReceivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onPaymentSuccess?: (receiptNum: string) => void;
}

export const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onPaymentSuccess,
}) => {
  const { getCustomerBalance, recordCreditPayment } = useShop();

  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<'રોકડ' | 'UPI/ઓનલાઇન' | 'બેંક ટ્રાન્સફર'>('રોકડ');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>('');
  const [addToCashLedger, setAddToCashLedger] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen || !customer) return null;

  const currentBalance = getCustomerBalance(customer.id);

  const handleSetFullAmount = () => {
    setAmount(currentBalance);
    setErrorMsg('');
  };

  const handleSetQuickAmount = (val: number) => {
    setAmount(val);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      setErrorMsg('કૃપા કરીને માન્ય જમા રકમ દાખલ કરો.');
      return;
    }

    const newPayment = recordCreditPayment({
      customerId: customer.id,
      amount: numAmount,
      date: new Date(date).toISOString(),
      paymentMode,
      note: note.trim() || undefined,
      addToCashLedger,
    });

    if (onPaymentSuccess) {
      onPaymentSuccess(newPayment.receiptNumber);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              ₹
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">ઉધાર રકમ જમા લો (Payment)</h3>
              <p className="text-xs text-stone-500">{customer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Banner */}
        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-medium block">હાલની કુલ બાકી રકમ</span>
            <span className="text-xl font-bold font-mono text-rose-600">
              {formatCurrency(currentBalance)}
            </span>
          </div>
          {currentBalance > 0 && (
            <button
              type="button"
              onClick={handleSetFullAmount}
              className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold px-2.5 py-1 rounded-lg border border-teal-200 transition-colors cursor-pointer"
            >
              પૂરેપૂરું ચૂકતે
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="text-xs bg-rose-50 text-rose-700 p-2.5 rounded-lg border border-rose-200 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              જમા કરવાની રકમ (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-400">
                ₹
              </span>
              <input
                type="number"
                step="1"
                min="1"
                value={amount}
                placeholder="0"
                onChange={(e) => {
                  setAmount(e.target.value === '' ? '' : parseFloat(e.target.value));
                  setErrorMsg('');
                }}
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-lg font-bold font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[500, 1000, 2000, 5000].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => handleSetQuickAmount(quick)}
                  className="text-xs px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-mono transition-colors cursor-pointer"
                >
                  +₹{quick}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              ચૂકવણી પદ્ધતિ (Payment Mode)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['રોકડ', 'UPI/ઓનલાઇન', 'બેંક ટ્રાન્સફર'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    paymentMode === mode
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>તારીખ</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>નોંધ (Remark)</span>
              </label>
              <input
                type="text"
                placeholder="દા.ત. PhonePe થી જમા"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Add to Cash Ledger Checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="addToCashLedger"
              checked={addToCashLedger}
              onChange={(e) => setAddToCashLedger(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
            />
            <label htmlFor="addToCashLedger" className="text-xs text-stone-600 cursor-pointer">
              દૈનિક <strong>આવક-જાવક હિસાબ</strong> માં પણ 'ઉધાર વસૂલાત' તરીકે આપોઆપ જમા કરો
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              જમા નોંધો (રસીદ બનાવો)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
