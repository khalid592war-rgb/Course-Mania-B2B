import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Bot,
  Users,
  BookOpen,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Check,
  X,
  CreditCard,
  Send,
  Sliders,
  ExternalLink,
  Lock,
} from 'lucide-react';
import {
  Course,
  TelegramBot,
  ResellerAccount,
  Order,
  LedgerEntry,
  AuditLog,
  PlatformSettings,
} from '../server/types';
import { ModalAddCourse } from './ModalAddCourse';
import { ModalAddBot } from './ModalAddBot';
import { ModalRecordPayment } from './ModalRecordPayment';

interface SuperAdminDashboardProps {
  stats: any;
  courses: Course[];
  bots: TelegramBot[];
  resellers: ResellerAccount[];
  orders: Order[];
  ledger: LedgerEntry[];
  auditLogs: AuditLog[];
  settings: PlatformSettings;
  onRefresh: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  stats,
  courses,
  bots,
  resellers,
  orders,
  ledger,
  auditLogs,
  settings,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'courses' | 'bots' | 'orders' | 'ledger' | 'reports' | 'settings'
  >('overview');

  // Modals
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [isAddBotOpen, setIsAddBotOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedResellerForPayment, setSelectedResellerForPayment] = useState<string | undefined>();

  // Order Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Credit Limit Edit Inline
  const [editingCreditResellerId, setEditingCreditResellerId] = useState<string | null>(null);
  const [newCreditLimitInput, setNewCreditLimitInput] = useState('');

  // Handle Order Verification
  const handleVerifyOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/verify`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Failed to verify');
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Order Reject
  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt('পেমেন্ট বাতিলের কারণ লিখুন (Reason for rejection):', 'Invalid TrxID or payment not received');
    if (!reason) return;
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Order Refund
  const handleRefundOrder = async (orderId: string) => {
    const reason = prompt('রিফান্ডের কারণ লিখুন (Reason for refund):', 'Customer requested cancellation');
    if (!reason) return;
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Bot status toggle
  const handleToggleBot = async (botId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await fetch(`/api/bots/${botId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Handle update credit limit
  const handleSaveCreditLimit = async (resellerId: string) => {
    const limit = parseFloat(newCreditLimitInput);
    if (isNaN(limit) || limit < 0) return;
    try {
      await fetch(`/api/resellers/${resellerId}/credit-limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditLimit: limit }),
      });
      setEditingCreditResellerId(null);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Super Admin Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Master Control
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            সেন্ট্রাল কোর্স ক্যাটালগ, মাল্টি-বট ম্যানেজমেন্ট, ৫০/৫০ ফাইন্যান্সিয়াল ব্যালেন্স ও অর্ডার ভেরিফিকেশন
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRecordPaymentOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>রিসেলারের টাকা রেকর্ড করুন</span>
          </button>

          <button
            onClick={() => {
              setCourseToEdit(null);
              setIsAddCourseOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কোর্স</span>
          </button>

          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Gross Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>সর্বমোট মোট বিক্রি (Gross Sales)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">৳{stats?.grossSales?.toLocaleString() || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            মোট সফল অর্ডার: <strong className="text-sky-300">{stats?.totalOrders || 0}টি</strong>
          </p>
        </div>

        {/* Owner Accrued 50% Share */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>মালিকের অর্জিত ৫০% প্রাপ্যতা</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-400">৳{stats?.totalOwnerAccrued?.toLocaleString() || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">৫০% একাউন্টিং শেয়ার রিসিভেবল</p>
        </div>

        {/* Total Verified Payments Received */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>রিসেলার থেকে প্রাপ্ত মোট টাকা</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ৳{stats?.totalVerifiedPaymentsFromResellers?.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">মালিকের একাউন্টে ভেরিফাইড জমা</p>
        </div>

        {/* Outstanding Balance Payable by Resellers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>রিসেলারদের কাছে মোট বকেয়া</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">
            ৳{stats?.totalOutstandingBalanceAcrossResellers?.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            পেন্ডিং ভেরিফিকেশন: <strong className="text-amber-300">{stats?.pendingOrdersCount || 0}টি</strong>
          </p>
        </div>
      </div>

      {/* Secondary Dashboard Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-800 pb-2">
        {[
          { id: 'overview', label: '📊 ওভারভিউ ও ফাইন্যান্স', count: null },
          { id: 'orders', label: '📦 অর্ডার ও পেমেন্ট ভেরিফিকেশন', count: stats?.pendingOrdersCount },
          { id: 'courses', label: '📚 কোর্স ক্যাটালগ', count: courses.length },
          { id: 'bots', label: '🤖 টেলিগ্রাম বট ও রিসেলার', count: bots.length },
          { id: 'ledger', label: '📜 ফাইন্যান্সিয়াল লেজার', count: ledger.length },
          { id: 'reports', label: '📥 রিপোর্ট ও CSV এক্সপোর্ট', count: null },
          { id: 'settings', label: '⚙️ সেটিংস ও অডিট লগ', count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  tab.id === 'orders' && stats?.pendingOrdersCount > 0
                    ? 'bg-amber-400 text-slate-900 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: OVERVIEW & FINANCIALS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 50/50 Revenue Model Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>৫০/৫০ ব্যবসায়িক মডেল ও রিসেলার ক্রেডিট লিমিট মেকানিজম</span>
                </h3>
                <p className="text-xs text-slate-400">
                  কোর্সের ৫০% টাকা মালিকের প্রাপ্য এবং ৫০% রিসেলারের লভ্যাংশ হিসেবে একাউন্ট হয়
                </p>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-semibold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
                Formula: Available Credit = Credit Limit - Outstanding Balance
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resellers.map((r) => {
                const percentUsed = Math.min(100, Math.round((r.outstandingBalance / (r.creditLimit || 1)) * 100));
                return (
                  <div key={r.id} className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-white">{r.name}</h4>
                        <p className="text-xs text-slate-400">
                          বট: @{r.botUsername} • মোবাইল: {r.phone}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedResellerForPayment(r.id);
                          setIsRecordPaymentOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        টাকা জমা দিন
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-lg text-xs text-center">
                      <div>
                        <span className="text-slate-400 block text-[10px]">মোট ক্রেডিট লিমিট</span>
                        <strong className="text-white text-xs font-mono">৳{r.creditLimit}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">বর্তমান বকেয়া</span>
                        <strong className="text-amber-400 text-xs font-mono">৳{r.outstandingBalance}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">অবশিষ্ট ক্রেডিট</span>
                        <strong className="text-emerald-400 text-xs font-mono">৳{r.availableCredit}</strong>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>ক্রেডিট লিমিট ব্যবহার</span>
                        <span className={percentUsed > 80 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {percentUsed}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            percentUsed >= 95 ? 'bg-red-500' : percentUsed > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Pending Verifications Notice */}
          {stats?.pendingOrdersCount > 0 && (
            <div className="bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {stats.pendingOrdersCount}টি কাস্টমার পেমেন্ট ভেরিফিকেশন পেন্ডিং আছে!
                  </h4>
                  <p className="text-xs text-slate-300">
                    শিক্ষার্থীরা বিকাশ/নগদে টাকা পাঠিয়ে TrxID সাবমিট করেছেন। যাচাই করে দ্রুত কোর্স এক্সেস দিন।
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setOrderStatusFilter('payment_pending_verification');
                  setActiveTab('orders');
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                পেন্ডিং অর্ডার দেখুন
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: ORDERS & PAYMENT VERIFICATION */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-800 bg-slate-850 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="অর্ডার নম্বর, নাম, বা TrxID সার্চ করুন..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">সব স্ট্যাটাস ({orders.length})</option>
                <option value="payment_pending_verification">ভেরিফিকেশন পেন্ডিং</option>
                <option value="paid_pending_fulfillment">ক্রেডিট হোল্ড (Pending Fulfillment)</option>
                <option value="fulfilled">সফল / এক্সেস ডেলিভার্ড</option>
                <option value="refunded">রিফান্ডেড</option>
                <option value="cancelled">বাতিল</option>
              </select>
            </div>

            <span className="text-xs text-slate-400">
              মোট রেজাল্ট: <strong>{filteredOrders.length}টি অর্ডার</strong>
            </span>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">অর্ডার #</th>
                  <th className="px-4 py-3">কোর্স ও কাস্টমার</th>
                  <th className="px-4 py-3">বট / রিসেলার</th>
                  <th className="px-4 py-3 text-right">মূল্য (৫০/৫০ শেয়ার)</th>
                  <th className="px-4 py-3">পেমেন্ট TrxID ও মেথড</th>
                  <th className="px-4 py-3">স্ট্যাটাস</th>
                  <th className="px-4 py-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
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
                        <strong className="text-white block truncate max-w-[200px]">{o.courseTitle}</strong>
                        <span className="text-slate-400 text-[11px]">
                          {o.customerName} {o.customerPhone && `• ${o.customerPhone}`}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-sky-400 font-semibold block">@{o.botUsername}</span>
                        <span className="text-slate-400 text-[10px]">
                          {o.resellerName ? `রিসেলার: ${o.resellerName}` : '👑 ওনার প্রাইমারি বট'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono">
                        <strong className="text-white text-sm block">৳{o.salePrice}</strong>
                        <span className="text-[10px] text-slate-400">
                          মালিক: ৳{o.ownerShare} | রিসেলার: ৳{o.resellerShare}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {o.paymentTrxId ? (
                          <div>
                            <span className="font-mono font-bold text-amber-300 uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              {o.paymentTrxId}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {o.paymentMethod?.toUpperCase()} {o.paymentSenderNumber && `• From: ${o.paymentSenderNumber}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">এখনও দেননি</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            o.status === 'fulfilled'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : o.status === 'paid'
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                              : o.status === 'payment_pending_verification'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                              : o.status === 'paid_pending_fulfillment'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : o.status === 'refunded'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {o.status === 'fulfilled'
                            ? '✅ Fulfilled'
                            : o.status === 'paid'
                            ? '🟢 Paid'
                            : o.status === 'payment_pending_verification'
                            ? '⏳ Verification Pending'
                            : o.status === 'paid_pending_fulfillment'
                            ? '⚠️ Credit Limit Held'
                            : o.status === 'refunded'
                            ? '↩️ Refunded'
                            : o.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {o.status === 'payment_pending_verification' || o.status === 'paid_pending_fulfillment' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerifyOrder(o.id)}
                              disabled={actionLoading === o.id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>ভেরিফাই ও এক্সেস দিন</span>
                            </button>
                            <button
                              onClick={() => handleRejectOrder(o.id)}
                              disabled={actionLoading === o.id}
                              className="p-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition cursor-pointer"
                              title="বাতিল করুন"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : o.status === 'fulfilled' ? (
                          <button
                            onClick={() => handleRefundOrder(o.id)}
                            className="text-[11px] text-slate-400 hover:text-rose-400 underline cursor-pointer"
                          >
                            রিফান্ড
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: COURSES CATALOG */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">সেন্ট্রাল কোর্স ক্যাটালগ (Shared Course Catalog)</h3>
              <p className="text-xs text-slate-400">
                এখানে কোর্স যোগ বা এডিট করলে তা সকল যুক্ত টেলিগ্রাম বটে স্বয়ংক্রিয়ভাবে আপডেট হয়ে যাবে
              </p>
            </div>
            <button
              onClick={() => {
                setCourseToEdit(null);
                setIsAddCourseOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন কোর্স যুক্ত করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="relative h-44 overflow-hidden bg-slate-800">
                    <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs border border-slate-700">
                      {c.category}
                    </span>
                    <span
                      className={`absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'published'
                          ? 'bg-emerald-500 text-slate-950 font-extrabold'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {c.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-sm text-white line-clamp-1">{c.titleBn || c.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{c.descriptionBn || c.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">বিক্রয় মূল্য:</span>
                        <div className="flex items-baseline gap-1.5">
                          <strong className="text-emerald-400 font-bold text-base">
                            ৳{c.isSaleActive ? c.salePrice : c.regularPrice}
                          </strong>
                          {c.isSaleActive && (
                            <span className="text-slate-500 line-through text-[11px]">৳{c.regularPrice}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">মোট শিক্ষার্থী:</span>
                        <span className="text-white font-bold">{c.totalEnrolled} জন</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-800/80 mt-2">
                  <button
                    onClick={() => {
                      setCourseToEdit(c);
                      setIsAddCourseOpen(true);
                    }}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer text-center"
                  >
                    এডিট করুন
                  </button>
                  <a
                    href={c.deliveryPayload}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-lg transition"
                    title="ডেলিভারি লিঙ্ক চেক করুন"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: CONNECTED BOTS & RESELLERS */}
      {activeTab === 'bots' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">কানেক্টেড টেলিগ্রাম বটসমূহ (Multi-Bot Engine)</h3>
              <p className="text-xs text-slate-400">
                একই ডাটাবেজে একাধিক টেলিগ্রাম বট পরিচালনা ও রিসেলারদের জন্য ক্রেডিট লিমিট নির্ধারণ
              </p>
            </div>
            <button
              onClick={() => setIsAddBotOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Bot className="w-4 h-4" />
              <span>নতুন বট যুক্ত করুন (BotFather Token)</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">বটের নাম ও ইউজারনেম</th>
                  <th className="px-4 py-3">ধরন / রিসেলার</th>
                  <th className="px-4 py-3">API Token (Encrypted)</th>
                  <th className="px-4 py-3">ওয়েবহুক স্ট্যাটাস</th>
                  <th className="px-4 py-3 text-right">বিক্রি সংখ্যা</th>
                  <th className="px-4 py-3 text-right">স্ট্যাটাস ও অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {bots.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5">
                      <strong className="text-white text-sm block">{b.name}</strong>
                      <span className="text-sky-400 font-mono text-[11px]">@{b.username}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      {b.isPrimaryOwnerBot ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          👑 Owner Primary Bot
                        </span>
                      ) : (
                        <div>
                          <strong className="text-white block text-xs">{b.resellerName}</strong>
                          <span className="text-slate-400 text-[10px]">অ্যাসাইনড রিসেলার</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-400 text-xs">
                      <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span>{b.tokenMasked}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-emerald-300 font-medium text-xs">Active Webhook</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[180px]">
                        {b.webhookUrl}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono">
                      <strong className="text-white text-xs block">{b.totalOrdersCount} অর্ডার</strong>
                      <span className="text-emerald-400 font-bold">৳{b.totalGrossSales.toLocaleString()}</span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleBot(b.id, b.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          b.status === 'active'
                            ? 'bg-slate-800 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border border-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {b.status === 'active' ? 'বট সাময়িক বন্ধ' : 'সক্রিয় করুন'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reseller Credit Limits Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="text-sm font-bold text-white mb-3">রিসেলার ক্রেডিট লিমিট ও ব্যালেন্স কন্ট্রোল</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resellers.map((r) => (
                <div key={r.id} className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-white text-sm">{r.name}</h5>
                      <span className="text-xs text-slate-400">
                        {r.phone} • {r.email}
                      </span>
                    </div>

                    {editingCreditResellerId === r.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={newCreditLimitInput}
                          onChange={(e) => setNewCreditLimitInput(e.target.value)}
                          className="w-24 bg-slate-900 border border-slate-600 text-white rounded-lg px-2 py-1 text-xs"
                        />
                        <button
                          onClick={() => handleSaveCreditLimit(r.id)}
                          className="p-1.5 bg-emerald-600 text-white rounded-lg text-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCreditResellerId(null)}
                          className="p-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCreditResellerId(r.id);
                          setNewCreditLimitInput(String(r.creditLimit));
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer"
                      >
                        লিমিট পরিবর্তন (Edit Limit)
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2.5 rounded-lg font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">ক্রেডিট লিমিট:</span>
                      <strong className="text-white">৳{r.creditLimit}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">বর্তমান বকেয়া:</span>
                      <strong className="text-amber-400">৳{r.outstandingBalance}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">অবশিষ্ট ক্রেডিট:</span>
                      <strong className="text-emerald-400">৳{r.availableCredit}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: FINANCIAL LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">অপরিবর্তনীয় ফাইন্যান্সিয়াল লেজার (Immutable Ledger)</h3>
              <p className="text-xs text-slate-400">
                প্রতিটি বিক্রির ৫০% প্রাপ্যতা, রিসেলারের জমা দেওয়া টাকা এবং ব্যালেন্স ট্র্যাকিং
              </p>
            </div>
            <a
              href="/api/reports/export-csv?type=ledger"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>CSV ডাউনলোড</span>
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">তারিখ ও সময়</th>
                  <th className="px-4 py-3">ইভেন্ট টাইপ</th>
                  <th className="px-4 py-3">রিসেলার</th>
                  <th className="px-4 py-3 text-right">বিক্রি মূল্য</th>
                  <th className="px-4 py-3 text-right">মালিকের প্রাপ্য (+/-)</th>
                  <th className="px-4 py-3 text-right">রিসেলার পরিশোধ</th>
                  <th className="px-4 py-3 text-right">নতুন বকেয়া</th>
                  <th className="px-4 py-3">রেফারেন্স ও বিবরণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {ledger.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-slate-400">{l.createdAt.slice(0, 16).replace('T', ' ')}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.type === 'SALE_ACCRUAL'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : l.type === 'RESELLER_PAYMENT'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : l.type === 'SALE_REFUND'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {l.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans text-white">{l.resellerName}</td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {l.grossAmount ? `৳${l.grossAmount}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-400">
                      {l.ownerShareDelta > 0 ? `+৳${l.ownerShareDelta}` : l.ownerShareDelta < 0 ? `-৳${Math.abs(l.ownerShareDelta)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                      {l.resellerPaymentDelta > 0 ? `-৳${l.resellerPaymentDelta}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-400">
                      ৳{l.balanceAfter}
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-400">
                      <strong>{l.reference}</strong>
                      <span className="block text-[10px] text-slate-500">{l.notes}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: REPORTS & CSV EXPORT */}
      {activeTab === 'reports' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">ফাইন্যান্সিয়াল ও সেলস রিপোর্ট ডাউনলোড</h3>
            <p className="text-xs text-slate-400">
              অডিট ও হিসাবরক্ষণের জন্য যেকোনো রিপোর্ট ১-ক্লিকে CSV স্প্রেডশিটে ডাউনলোড করুন
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">সকল কাস্টমার অর্ডার রিপোর্ট</h4>
                <p className="text-xs text-slate-400 mt-1">
                  অর্ডার আইডি, তারিখ, কোর্স, শিক্ষার্থী, TrxID, প্রদেয় মূল্য ও ৫০% শেয়ার
                </p>
              </div>
              <a
                href="/api/reports/export-csv?type=orders"
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold text-center transition cursor-pointer"
              >
                Orders CSV ডাউনলোড
              </a>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">ফাইন্যান্সিয়াল লেজার অডিট ফাইল</h4>
                <p className="text-xs text-slate-400 mt-1">
                  সকল ৫০% শেয়ার যোগ, রিফান্ড ও রিসেলারের টাকা পরিশোধের পূর্ণাঙ্গ অডিট হিস্ট্রি
                </p>
              </div>
              <a
                href="/api/reports/export-csv?type=ledger"
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold text-center transition cursor-pointer"
              >
                Ledger CSV ডাউনলোড
              </a>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">রিসেলার অ্যাকাউন্ট স্টেটমেন্ট</h4>
                <p className="text-xs text-slate-400 mt-1">
                  রিসেলারদের ক্রেডিট লিমিট, সর্বমোট বিক্রি, পরিশোধিত টাকা ও বকেয়া হিসাব
                </p>
              </div>
              <a
                href="/api/reports/export-csv?type=resellers"
                className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold text-center transition cursor-pointer"
              >
                Resellers CSV ডাউনলোড
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: SETTINGS & AUDIT LOGS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manual Payment Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <span>পেমেন্ট গেটওয়ে ও ম্যানুয়াল একাউন্ট নম্বর</span>
            </h4>
            <p className="text-xs text-slate-400">টেলিগ্রাম বটে কাস্টমারদের কাছে প্রদর্শিত বিকাশ ও নগদ নম্বরসমূহ</p>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block font-semibold">bKash (বিকাশ) {settings.manualPaymentInstructions.bkash.type}:</span>
                <span className="font-mono text-white text-sm font-bold">{settings.manualPaymentInstructions.bkash.number}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{settings.manualPaymentInstructions.bkash.note}</p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block font-semibold">Nagad (নগদ) {settings.manualPaymentInstructions.nagad.type}:</span>
                <span className="font-mono text-white text-sm font-bold">{settings.manualPaymentInstructions.nagad.number}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{settings.manualPaymentInstructions.nagad.note}</p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block font-semibold">Rocket (রকেট):</span>
                <span className="font-mono text-white text-sm font-bold">{settings.manualPaymentInstructions.rocket.number}</span>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>সিস্টেম সিকিউরিটি ও অডিট লগ (Audit Logs)</span>
              </h4>
              <p className="text-xs text-slate-400 mb-4">সব এডমিন অ্যাক্টিভিটি অপরিবর্তনীয়ভাবে সংরক্ষিত</p>

              <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
                {auditLogs.slice(0, 10).map((a) => (
                  <div key={a.id} className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono font-bold text-indigo-400">{a.action}</span>
                      <span className="text-slate-500">{a.createdAt.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <p className="text-slate-300 text-xs">{a.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isAddCourseOpen && (
        <ModalAddCourse
          isOpen={isAddCourseOpen}
          onClose={() => setIsAddCourseOpen(false)}
          courseToEdit={courseToEdit}
          onCourseSaved={onRefresh}
        />
      )}

      {isAddBotOpen && (
        <ModalAddBot
          isOpen={isAddBotOpen}
          onClose={() => setIsAddBotOpen(false)}
          resellers={resellers}
          onBotAdded={onRefresh}
        />
      )}

      {isRecordPaymentOpen && (
        <ModalRecordPayment
          isOpen={isRecordPaymentOpen}
          onClose={() => {
            setIsRecordPaymentOpen(false);
            setSelectedResellerForPayment(undefined);
          }}
          resellers={resellers}
          selectedResellerId={selectedResellerForPayment}
          onRecordSuccess={onRefresh}
        />
      )}
    </div>
  );
};
