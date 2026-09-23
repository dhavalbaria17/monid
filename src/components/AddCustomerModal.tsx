import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Customer } from '../types';
import { X, UserPlus, User, Phone, MapPin, IndianRupee, FileText } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editCustomer?: Customer | null;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  editCustomer,
}) => {
  const { addCustomer, updateCustomer } = useShop();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editCustomer) {
      setName(editCustomer.name);
      setPhone(editCustomer.phone || '');
      setAddress(editCustomer.address || '');
      setOpeningBalance(editCustomer.openingBalance || '');
      setNotes(editCustomer.notes || '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setOpeningBalance('');
      setNotes('');
    }
    setErrorMsg('');
  }, [editCustomer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('કૃપા કરીને ગ્રાહકનું નામ દાખલ કરો.');
      return;
    }

    const openBal = typeof openingBalance === 'number' ? openingBalance : parseFloat(openingBalance) || 0;

    if (editCustomer) {
      updateCustomer(editCustomer.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        openingBalance: openBal,
        notes: notes.trim() || undefined,
      });
    } else {
      addCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        openingBalance: openBal,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                {editCustomer ? 'ગ્રાહકની વિગત સુધારો' : 'નવો ઉધાર ગ્રાહક ઉમેરો'}
              </h3>
              <p className="text-xs text-stone-500">
                ઉધાર ખાતાવહી (લેજર) જાળવવા માટે ગ્રાહકની વિગત
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="text-xs bg-rose-50 text-rose-700 p-2.5 rounded-lg border border-rose-200 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1 mb-1">
              <User className="w-3.5 h-3.5" />
              <span>ગ્રાહકનું નામ *</span>
            </label>
            <input
              type="text"
              placeholder="દા.ત. મહેશભાઈ પટેલ"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMsg('');
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1 mb-1">
              <Phone className="w-3.5 h-3.5" />
              <span>મોબાઈલ નંબર</span>
            </label>
            <input
              type="text"
              placeholder="દા.ત. 98250 12345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>સરનામું (વૈકલ્પિક)</span>
            </label>
            <input
              type="text"
              placeholder="દા.ત. ગામ, સોસાયટી કે વિસ્તાર"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1 mb-1">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>પ્રારંભિક જૂની બાકી રકમ (Opening Balance)</span>
            </label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="₹ 0 (જો જૂની કોઈ બાકી હોય તો)"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
            <span className="text-[11px] text-stone-400 mt-0.5 block">
              જો ખાતું શરૂ કરતા પહેલા ગ્રાહકની કોઈ જૂની બાકી રકમ હોય તો અહી લખો.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>નોંધ / ખાસ વિગત (Notes)</span>
            </label>
            <input
              type="text"
              placeholder="દા.ત. દુકાન નજીક રહે છે, દર મહિને ૧ તારીખે ચૂકવશે"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {editCustomer ? 'વિગતો સાચવો' : 'ગ્રાહક ઉમેરો'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
