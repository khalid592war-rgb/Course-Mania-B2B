import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { ResellerAccount, PaymentMethod } from '../server/types';

interface ModalRecordPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  resellers: ResellerAccount[];
  selectedResellerId?: string;
  onRecordSuccess: () => void;
}

export const ModalRecordPayment: React.FC<ModalRecordPaymentProps> = ({
  isOpen,
  onClose,
  resellers,
  selectedResellerId,
  onRecordSuccess,
}) => {
  const [resellerId, setResellerId] = useState(selectedResellerId || (resellers[0]?.id || ''));
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'cash'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentReseller = resellers.find((r) => r.id === resellerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numAmount = parseFloat(amount);

    if (!resellerId) {
      setError('দয়া করে রিসেলার নির্বাচন করুন।');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('সঠিক টাকার পরিমাণ দিন (যেমন: ৳৫০০)।');
      return;
    }
    if (!trxId.trim()) {
      setError('ট্রানজেকশন আইডি (TrxID) বা ব্যাংক রেফারেন্স নম্বর দিন।');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/resellers/${resellerId}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          paymentMethod,
          trxId: trxId.trim(),
          notes: notes.trim() || 'Offline payment verified by owner',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'পেমেন্ট রেকর্ড করতে সমস্যা হয়েছে।');
      }

      onRecordSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">রিসেলারের প্রাপ্ত টাকা রেকর্ড করুন</h3>
              <p className="text-xs text-slate-400">Record Verified Offline Payment from Reseller</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              রিসেলার অ্যাকাউন্ট সিলেক্ট করুন
            </label>
            <select
              value={resellerId}
              onChange={(e) => setResellerId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {resellers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (বকেয়া: ৳{r.outstandingBalance} | লিমিট: ৳{r.creditLimit})
                </option>
              ))}
            </select>
          </div>

          {currentReseller && (
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block">বর্তমান মোট বকেয়া (Outstanding):</span>
                <span className="text-base font-bold text-amber-400">৳{currentReseller.outstandingBalance}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">অবশিষ্ট ক্রেডিট লিমিট (Available):</span>
                <span className="text-base font-bold text-emerald-400">৳{currentReseller.availableCredit}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                প্রাপ্ত টাকার পরিমাণ (৳ BDT)
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="যেমন: 1000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                পেমেন্ট মাধ্যম (Method)
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="bkash">bKash (বিকাশ)</option>
                <option value="nagad">Nagad (নগদ)</option>
                <option value="rocket">Rocket (রকেট)</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash in Hand</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ট্রানজেকশন আইডি (TrxID) / ব্যাংক রেফারেন্স
            </label>
            <input
              type="text"
              required
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="যেমন: BKS88991122"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              নোট বা বিবরণ (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: জানুয়ারি মাসের কোর্স বিক্রির অংশবিশেষ বা হ্যান্ড টু হ্যান্ড ক্যাশ..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-indigo-950/40 border border-indigo-800/40 p-3 rounded-xl text-xs text-indigo-300">
            💡 <strong>অটোমেটিক ব্যালেন্স আপডেট:</strong> এই পেমেন্ট রেকর্ড করার সাথে সাথে রিসেলারের বকেয়া কমে যাবে, অবশিষ্ট ক্রেডিট লিমিট বৃদ্ধি পাবে এবং অপরিবর্তনীয় ফাইন্যান্সিয়াল লেজারে অডিট ট্রেইল হিসেবে সংরক্ষিত হবে।
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>রেকর্ড হচ্ছে...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>পেমেন্ট নিশ্চিত ও লেজার আপডেট করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
