import React, { useState } from 'react';
import { X, Bot, Shield, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { ResellerAccount } from '../server/types';

interface ModalAddBotProps {
  isOpen: boolean;
  onClose: () => void;
  resellers: ResellerAccount[];
  onBotAdded: () => void;
}

export const ModalAddBot: React.FC<ModalAddBotProps> = ({
  isOpen,
  onClose,
  resellers,
  onBotAdded,
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [isNewReseller, setIsNewReseller] = useState(false);
  const [selectedResellerId, setSelectedResellerId] = useState(resellers[0]?.id || '');

  // New reseller fields
  const [resellerName, setResellerName] = useState('');
  const [resellerPhone, setResellerPhone] = useState('');
  const [resellerEmail, setResellerEmail] = useState('');
  const [creditLimit, setCreditLimit] = useState('5000');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanToken = token.trim();
    if (!cleanToken || !cleanToken.includes(':')) {
      setError('টোকেনটি সঠিক নয়। BotFather থেকে প্রাপ্ত টোকেন কপি করে দিন (যেমন: 123456789:ABCdefGhIjk...)');
      return;
    }

    setLoading(true);
    try {
      let finalResellerId = selectedResellerId;

      // 1. Create reseller if requested
      if (isNewReseller) {
        if (!resellerName.trim() || !resellerPhone.trim()) {
          throw new Error('রিসেলারের নাম ও মোবাইল নম্বর পূরণ করুন।');
        }
        const rRes = await fetch('/api/resellers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: resellerName.trim(),
            phone: resellerPhone.trim(),
            email: resellerEmail.trim() || `${username.toLowerCase()}@reseller.local`,
            creditLimit: parseFloat(creditLimit) || 5000,
            notes: 'Created during bot onboarding',
          }),
        });
        const newR = await rRes.json();
        if (!rRes.ok) throw new Error(newR.error || 'রিসেলার তৈরি করা যায়নি।');
        finalResellerId = newR.id;
      }

      // 2. Register Bot
      const bRes = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.replace('@', '').trim(),
          token: cleanToken,
          isPrimaryOwnerBot: false,
          resellerId: finalResellerId || null,
        }),
      });

      const newBot = await bRes.json();
      if (!bRes.ok) throw new Error(newBot.error || 'বট রেজিস্টার করা যায়নি।');

      onBotAdded();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">নতুন টেলিগ্রাম বট অনবোর্ডিং</h3>
              <p className="text-xs text-slate-400">Connect a new BotFather Token for Course Mania</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-sky-950/40 border border-sky-800/40 p-3 rounded-xl text-xs text-sky-300 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
            <div>
              <strong>বট টোকেন পাওয়ার নিয়ম:</strong> রিসেলার টেলিগ্রামে @BotFather এ গিয়ে /newbot কমান্ড দিয়ে বট তৈরি করবেন। এরপর প্রাপ্ত API Token টি গোপনভাবে এডমিনকে পাঠাবেন। টোকেনটি ডাটাবেজে এনক্রিপ্ট হয়ে সংরক্ষিত থাকে।
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                বটের নাম (Bot Name)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: TechZone Course Bot"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ইউজারনেম (Bot Username)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="যেমন: TechZoneCourseBot"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>টেলিগ্রাম বট এপিআই টোকেন (Bot API Token)</span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Encrypted at rest
              </span>
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="যেমন: 7182938491:AAHkd928374hdwu9283..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-300">রিসেলার ওনারশিপ</label>
              <button
                type="button"
                onClick={() => setIsNewReseller(!isNewReseller)}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium underline cursor-pointer"
              >
                {isNewReseller ? 'মজুদ রিসেলার থেকে বাছুন' : '+ নতুন রিসেলার প্রোফাইল তৈরি'}
              </button>
            </div>

            {!isNewReseller ? (
              <div>
                <select
                  value={selectedResellerId}
                  onChange={(e) => setSelectedResellerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {resellers.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.phone})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">রিসেলারের পুরো নাম</label>
                  <input
                    type="text"
                    required={isNewReseller}
                    value={resellerName}
                    onChange={(e) => setResellerName(e.target.value)}
                    placeholder="যেমন: আরিফুল ইসলাম"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">মোবাইল নম্বর</label>
                    <input
                      type="text"
                      required={isNewReseller}
                      value={resellerPhone}
                      onChange={(e) => setResellerPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">ক্রেডিট লিমিট (৳ BDT)</label>
                    <input
                      type="number"
                      required={isNewReseller}
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      placeholder="5000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
              className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>যাচাই হচ্ছে...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>বট ভ্যালিডেট ও একটিভ করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
