import React from 'react';
import { useShop } from '../context/ShopContext';
import { Printer, X, Share2, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatGujaratiDate } from '../utils/formatters';

export const PrintBillModal: React.FC = () => {
  const { currentBillForPrint, setCurrentBillForPrint, shopProfile } = useShop();

  if (!currentBillForPrint) return null;

  const bill = currentBillForPrint;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    let text = `*${shopProfile.shopName}*\n`;
    text += `${shopProfile.address}\n`;
    text += `ફોન: ${shopProfile.phone}\n`;
    text += `--------------------------\n`;
    text += `બિલ નં: ${bill.billNumber}\n`;
    text += `તારીખ: ${formatGujaratiDate(bill.date)}\n`;
    if (bill.customerName) text += `ગ્રાહક: ${bill.customerName}\n`;
    text += `--------------------------\n`;
    bill.items.forEach((item, index) => {
      text += `${index + 1}. ${item.productName} (${item.quantity} ${item.unit}) = ₹${item.total}\n`;
    });
    text += `--------------------------\n`;
    text += `સબટોટલ: ₹${bill.subtotal}\n`;
    if (bill.discount > 0) text += `વળતર/ડિસ્કાઉન્ટ: -₹${bill.discount}\n`;
    text += `*કુલ રકમ: ₹${bill.grandTotal}*\n`;
    text += `ચૂકવણી: ${bill.paymentMode}\n`;
    text += `--------------------------\n`;
    text += `${shopProfile.billFooter}\n`;

    const encoded = encodeURIComponent(text);
    const phoneParam = bill.customerPhone ? `phone=91${bill.customerPhone.replace(/\D/g, '')}&` : '';
    window.open(`https://api.whatsapp.com/send?${phoneParam}text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs no-print-bg">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in duration-150">
        {/* Header Modal Bar */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-stone-50 border-b border-stone-200">
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            <span>વેચાણ સફળ! બિલ તૈયાર છે</span>
          </div>
          <button
            onClick={() => setCurrentBillForPrint(null)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Bill Area */}
        <div className="flex-1 overflow-y-auto p-6" id="printable-bill">
          <div className="border border-stone-300 rounded-xl p-5 bg-white text-stone-900 shadow-xs">
            {/* Shop Header */}
            <div className="text-center pb-3 border-b border-dashed border-stone-300">
              <h2 className="text-xl font-bold tracking-tight text-stone-900">
                {shopProfile.shopName}
              </h2>
              {shopProfile.tagline && (
                <p className="text-xs text-stone-600 mt-0.5">{shopProfile.tagline}</p>
              )}
              <p className="text-xs text-stone-600 mt-1">{shopProfile.address}</p>
              <p className="text-xs text-stone-600 font-medium">મોબાઈલ: {shopProfile.phone}</p>
              {shopProfile.gstNumber && (
                <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                  GSTIN: {shopProfile.gstNumber}
                </p>
              )}
            </div>

            {/* Bill Details */}
            <div className="grid grid-cols-2 text-xs py-3 border-b border-stone-200 gap-1 text-stone-700">
              <div>
                <span className="text-stone-500">બિલ નં: </span>
                <span className="font-bold text-stone-900">{bill.billNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-500">તારીખ: </span>
                <span className="font-medium">{formatGujaratiDate(bill.date).split(',')[0]}</span>
              </div>
              {bill.customerName && (
                <div>
                  <span className="text-stone-500">ગ્રાહક: </span>
                  <span className="font-semibold text-stone-900">{bill.customerName}</span>
                </div>
              )}
              {bill.customerPhone && (
                <div className="text-right">
                  <span className="text-stone-500">મોબાઈલ: </span>
                  <span>{bill.customerPhone}</span>
                </div>
              )}
              <div className="col-span-2 text-stone-600 pt-1">
                <span>ચૂકવણી પદ્ધતિ: </span>
                <span className="font-semibold text-teal-800">{bill.paymentMode}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-stone-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-300 text-stone-600 font-semibold text-left">
                    <th className="py-1.5 w-8">ક્રમ</th>
                    <th className="py-1.5">વસ્તુનું નામ</th>
                    <th className="py-1.5 text-center">જથ્થો</th>
                    <th className="py-1.5 text-right">ભાવ</th>
                    <th className="py-1.5 text-right">કુલ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bill.items.map((item, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1.5 text-stone-400 font-mono">{idx + 1}</td>
                      <td className="py-1.5 font-medium text-stone-900">
                        {item.productName}
                      </td>
                      <td className="py-1.5 text-center whitespace-nowrap tabular-nums">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-1.5 text-right font-mono text-stone-600 tabular-nums">
                        ₹{item.sellingPrice}
                      </td>
                      <td className="py-1.5 text-right font-semibold font-mono text-stone-900 tabular-nums">
                        ₹{item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Totals */}
            <div className="pt-3 space-y-1.5 text-xs text-stone-700">
              <div className="flex justify-between">
                <span>કુલ રકમ (Subtotal):</span>
                <span className="font-mono tabular-nums">{formatCurrency(bill.subtotal)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>વળતર (Discount):</span>
                  <span className="font-mono tabular-nums">- {formatCurrency(bill.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-stone-300 text-stone-900">
                <span>કુલ ચૂકવવાપાત્ર રકમ:</span>
                <span className="font-mono text-teal-800 tabular-nums">
                  {formatCurrency(bill.grandTotal)}
                </span>
              </div>
            </div>

            {/* Footer Message */}
            <div className="mt-5 pt-3 border-t border-dashed border-stone-300 text-center">
              <p className="text-xs font-medium text-stone-700">
                {shopProfile.billFooter}
              </p>
              <p className="text-[10px] text-stone-400 mt-1">
                આ કોમ્પ્યુટર નિર્મિત બિલ છે. સહીની જરૂર નથી.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden on Print) */}
        <div className="no-print p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setCurrentBillForPrint(null)}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            બંધ કરો
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>વોટ્સએપ શેર</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>બિલ પ્રિન્ટ કરો</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
