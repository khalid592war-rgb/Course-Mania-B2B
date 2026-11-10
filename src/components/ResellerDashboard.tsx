import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Bot,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Search,
  Lock,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { ResellerAccount, TelegramBot, Order, Course } from '../server/types';

interface ResellerDashboardProps {
  resellerStats: any;
  bot: TelegramBot | undefined;
  orders: Order[];
  courses: Course[];
  onRefresh: () => void;
}

export const ResellerDashboard: React.FC<ResellerDashboardProps> = ({
  resellerStats,
  bot,
  orders,
  courses,
  onRefresh,
}) => {
  const reseller: ResellerAccount | undefined = resellerStats?.reseller;
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (!reseller) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-slate-400">রিসেলার তথ্য লোড করা যায়নি।</p>
      </div>
    );
  }

  const creditLimit = reseller.creditLimit || 5000;
  const outstandingBalance = reseller.outstandingBalance || 0;
  const availableCredit = reseller.availableCredit || 0;
  const percentUsed = Math.min(100, Math.round((outstandingBalance / creditLimit) * 100));

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.courseTitle.toLowerCase().includes(q) ||
        (o.paymentTrxId && o.paymentTrxId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Bot Info */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {reseller.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Verified Reseller
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            আপনার নিজস্ব টেলিগ্রাম বট ও ৫০% কমিশন হিসাব পোর্টাল • কঠোর ডাটা সিকিউরিটি ও আইসোলেশন
          </p>
        </div>

        {bot && (
          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{bot.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <a
                href={`https://t.me/${bot.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-400 font-mono flex items-center gap-1 hover:underline"
              >
                <span>@{bot.username}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Credit Limit Alert if high */}
      {percentUsed >= 80 && (
        <div className="bg-gradient-to-r from-amber-950/90 to-slate-900 border border-amber-800 rounded-2xl p-4 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="text-amber-300 font-bold text-sm block mb-1">
              সতর্কবার্তা: আপনার ক্রেডিট লিমিটের {percentUsed}% ব্যবহৃত হয়েছে!
            </strong>
            <p className="text-slate-300">
              বকেয়া টাকা ৳{outstandingBalance}। ক্রেডিট লিমিট পূর্ণ হয়ে গেলে আপনার বটে নতুন কোর্স অর্ডার সাময়িকভাবে স্থগিত হতে পারে।
              প্ল্যাটফর্ম ওনারকে অফলাইনে টাকা পরিশোধ করে TrxID পাঠালে ওনার তাৎক্ষণিকভাবে আপনার ক্রেডিট লিমিট সচল করে দেবেন।
            </p>
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Reseller Accrued 50% Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>আপনার অর্জিত ৫০% লাভ</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ৳{resellerStats?.resellerAccruedShare?.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">কোর্স বিক্রির ৫০% আপনার নিট লাভ</p>
        </div>

        {/* Total Gross Sales Through Bot */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>আপনার বটের মোট বিক্রি</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ৳{resellerStats?.grossSales?.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            মোট সফল সেলস: <strong className="text-sky-300">{resellerStats?.successfulOrdersCount || 0}টি</strong>
          </p>
        </div>

        {/* Outstanding Balance Payable to Owner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>মালিককে প্রদেয় বকেয়া</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ৳{outstandingBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">মালিকের ৫০% অংশীদারিত্ব</p>
        </div>

        {/* Remaining Available Credit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>অবশিষ্ট ক্রেডিট লিমিট</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono">
            ৳{availableCredit.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            নির্ধারিত মোট সীমা: ৳{creditLimit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Credit Limit Usage Progress Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <strong className="text-white text-sm block">ক্রেডিট লিমিট ব্যবহার ট্র্যাকার</strong>
            <span className="text-slate-400">
              বকেয়া: ৳{outstandingBalance} / সীমা: ৳{creditLimit}
            </span>
          </div>
          <span className="font-mono font-bold text-white text-sm bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
            {percentUsed}% ব্যবহৃত
          </span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              percentUsed >= 90 ? 'bg-red-500' : percentUsed > 70 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentUsed}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>৳০ (শুরু)</span>
          <span className="text-emerald-400 font-semibold">
            আরো বিক্রি করা যাবে: ৳{availableCredit * 2} টাকার কোর্স
          </span>
          <span>সর্বোচ্চ সীমা ৳{creditLimit}</span>
        </div>
      </div>

      {/* Orders Table for this Reseller */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">আপনার বটের কাস্টমার অর্ডার তালিকা</h3>
            <p className="text-xs text-slate-400">শুধুমাত্র আপনার টেলিগ্রাম বট থেকে আসা অর্ডারের তথ্য</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="অর্ডার বা TrxID সার্চ..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            >
              <option value="all">সব অর্ডার ({orders.length})</option>
              <option value="fulfilled">সফল / এক্সেস ডেলিভার্ড</option>
              <option value="payment_pending_verification">ভেরিফিকেশন বাকি</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">অর্ডার #</th>
                <th className="px-4 py-3">কোর্স ও শিক্ষার্থী</th>
                <th className="px-4 py-3 text-right">মূল্য</th>
                <th className="px-4 py-3 text-right">আপনার ৫০% লাভ</th>
                <th className="px-4 py-3">পেমেন্ট মেথড ও TrxID</th>
                <th className="px-4 py-3">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-xs">
                    কোনো অর্ডার পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-white">
                      {o.orderNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {o.createdAt.slice(0, 16).replace('T', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <strong className="text-white block truncate max-w-[220px]">{o.courseTitle}</strong>
                      <span className="text-slate-400 text-[11px]">{o.customerName}</span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-white font-bold">
                      ৳{o.salePrice}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-emerald-400 font-bold">
                      +৳{o.resellerShare}
                    </td>

                    <td className="px-4 py-3.5">
                      {o.paymentTrxId ? (
                        <div>
                          <span className="font-mono font-bold text-amber-300 uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {o.paymentTrxId}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {o.paymentMethod?.toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">পেমেন্ট বাকি</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          o.status === 'fulfilled'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : o.status === 'payment_pending_verification'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {o.status === 'fulfilled'
                          ? '✅ Fulfilled'
                          : o.status === 'payment_pending_verification'
                          ? '⏳ Verification Pending'
                          : o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
