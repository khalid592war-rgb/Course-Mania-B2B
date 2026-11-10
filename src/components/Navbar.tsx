import React from 'react';
import {
  ShieldAlert,
  Bot,
  UserCheck,
  Smartphone,
  BookOpen,
  DollarSign,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { UserRole } from '../server/types';

interface NavbarProps {
  currentRole: UserRole;
  currentResellerId?: string;
  onSwitchRole: (role: UserRole, resellerId?: string) => void;
  activeView: 'admin' | 'reseller' | 'bot_client' | 'guide';
  onSelectView: (view: 'admin' | 'reseller' | 'bot_client' | 'guide') => void;
  stats?: {
    grossSales: number;
    totalOutstanding: number;
    pendingCount: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentResellerId,
  onSwitchRole,
  activeView,
  onSelectView,
  stats,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Banner Notice for Mobile/Android Users */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 px-4 py-1.5 text-xs text-white text-center font-medium flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
        <span>
          <strong>Course Mania Multi-Bot Platform</strong> — সেন্ট্রাল ব্যাকএন্ড, ৫০/৫০ ফাইন্যান্সিয়াল লেজার ও মাল্টি-টেলেন্ট বট ইঞ্জিন
        </span>
        <button
          onClick={() => onSelectView('guide')}
          className="underline hover:text-emerald-100 font-semibold cursor-pointer ml-2"
        >
          📱 অ্যান্ড্রয়েড মোবাইল ও সার্ভার সেটআপ গাইড
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-inner">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Course Mania
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Multi-Bot Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Centralized Telegram Course Selling & Reseller Management</p>
            </div>
          </div>

          {/* View Switcher Tabs */}
          <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => {
                onSwitchRole('super_admin');
                onSelectView('admin');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Super Admin</span>
              {stats && stats.pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-900 text-[10px] font-bold rounded-full">
                  {stats.pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onSwitchRole('reseller', currentResellerId || 'reseller-1');
                onSelectView('reseller');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'reseller'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span>Reseller Dashboard</span>
            </button>

            <button
              onClick={() => onSelectView('bot_client')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'bot_client'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Smartphone className="w-4 h-4 text-sky-300" />
              <span>Telegram Bot App</span>
            </button>

            <button
              onClick={() => onSelectView('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'guide'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-purple-300" />
              <span className="hidden md:inline">Setup Guide & Docs</span>
            </button>
          </nav>

          {/* Quick Reseller Switcher (When on Reseller View) */}
          {activeView === 'reseller' && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Reseller:</span>
              <select
                value={currentResellerId || 'reseller-1'}
                onChange={(e) => onSwitchRole('reseller', e.target.value)}
                className="bg-slate-900 text-white border border-slate-700 rounded px-2 py-0.5 text-xs font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="reseller-1">Ariful Islam (TechZone BD)</option>
                <option value="reseller-2">Tanvir Hossain (SkillHub)</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
