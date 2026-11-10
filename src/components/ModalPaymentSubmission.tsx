import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { Order, PaymentMethod, PlatformSettings } from '../server/types';

interface ModalPaymentSubmissionProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  settings: PlatformSettings;
  preselectedMethod?: PaymentMethod;
  onSubmitted: (updatedOrder: Order) => void;
}

export const ModalPaymentSubmission: React.FC<ModalPaymentSubmissionProps> = ({
  isOpen,
  onClose,
  order,
  settings,
  preselectedMethod = 'bkash',
  onSubmitted,
}) => {
  const [method, setMethod] = useState<PaymentMethod>(preselectedMethod);
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const currentMethodDetails =
    method === 'bkash'
      ? settings.manualPaymentInstructions.bkash
      : method === 'nagad'
      ? settings.manualPaymentInstructions.nagad
      : settings.manualPaymentInstructions.rocket;

  const copyNumber = () => {
    navigator.clipboard.writeText(currentMethodDetails.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!trxId.trim() || trxId.trim().length < 5) {
      setError('সঠিক ট্রানজেকশন আইডি (TrxID) দিন (কমপক্ষে ৬ অক্ষর)।');
      return;
    }
    if (!senderNumber.trim() || senderNumber.trim().length < 10) {
      setError('যে মোবাইল নম্বর থেকে টাকা পাঠিয়েছেন তা দিন (১১ ডিজিট)।');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders/submit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentMethod: method,
          trxId: trxId.trim().toUpperCase(),
          senderNumber: senderNumber.trim(),
          screenshotNote: note.trim() || 'Submitted via customer portal',
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'পেমেন্ট সাবমিট করতে সমস্যা হয়েছে।');

      onSubmitted(updated);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/60">
          <div>
            <h3 className="text-base font-bold text-white">পেমেন্ট ভেরিফিকেশন ফর্ম</h3>
            <p className="text-xs text-slate-400">অর্ডার নম্বর: #{order.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Course Summary Box */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block">কোর্স:</span>
              <strong className="text-white text-xs block truncate max-w-[220px]">{order.courseTitle}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">প্রদেয় টাকা:</span>
              <span className="text-base font-extrabold text-emerald-400">৳{order.salePrice}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">পেমেন্ট মাধ্যম সিলেক্ট করুন</label>
            <div className="grid grid-cols-3 gap-2">
              {(['bkash', 'nagad', 'rocket'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    method === m
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {m === 'bkash' ? 'bKash (বিকাশ)' : m === 'nagad' ? 'Nagad (নগদ)' : 'Rocket (রকেট)'}
                </button>
              ))}
            </div>
          </div>

          {/* Number to pay */}
          <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-indigo-300 font-medium">
                {method.toUpperCase()} নম্বর ({currentMethodDetails.type}):
              </span>
              <button
                type="button"
                onClick={copyNumber}
                className="text-xs text-indigo-400 hover:text-indigo-200 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
              </button>
            </div>
            <div className="font-mono text-base font-bold text-white tracking-wider select-all">
              {currentMethodDetails.number}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{currentMethodDetails.note}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Mobile No.)
            </label>
            <input
              type="text"
              required
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              placeholder="017xxxxxxxx"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ট্রানজেকশন আইডি (TrxID)
            </label>
            <input
              type="text"
              required
              value={trxId}
              onChange={(e) => setTrxId(e.target.value.toUpperCase())}
              placeholder="যেমন: BKS92837192"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono uppercase"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
                <span>সাবমিট হচ্ছে...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>পেমেন্ট তথ্য সাবমিট করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
