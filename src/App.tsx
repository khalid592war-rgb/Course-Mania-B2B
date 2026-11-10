import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ResellerDashboard } from './components/ResellerDashboard';
import { TelegramSimulator } from './components/TelegramSimulator';
import { SetupGuide } from './components/SetupGuide';
import {
  UserRole,
  TelegramBot,
  ResellerAccount,
  Course,
  Order,
  LedgerEntry,
  AuditLog,
  PlatformSettings,
} from './server/types';

export function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('super_admin');
  const [currentResellerId, setCurrentResellerId] = useState<string>('reseller-1');
  const [activeView, setActiveView] = useState<'admin' | 'reseller' | 'bot_client' | 'guide'>('admin');

  // Server Data
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [resellers, setResellers] = useState<ResellerAccount[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  // Stats
  const [superAdminStats, setSuperAdminStats] = useState<any>(null);
  const [resellerStats, setResellerStats] = useState<any>(null);

  // Selected bot in simulator
  const [selectedBotId, setSelectedBotId] = useState<string>('bot-owner');

  const [loading, setLoading] = useState(true);

  // Fetch all core data
  const loadData = async () => {
    try {
      const [
        coursesRes,
        botsRes,
        resellersRes,
        ordersRes,
        ledgerRes,
        settingsRes,
        statsRes,
      ] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/bots'),
        fetch('/api/resellers'),
        fetch('/api/orders'),
        fetch('/api/ledger'),
        fetch('/api/settings'),
        currentRole === 'super_admin' ? fetch('/api/stats/super-admin') : Promise.resolve(null),
      ]);

      const [
        coursesData,
        botsData,
        resellersData,
        ordersData,
        ledgerData,
        settingsData,
        statsData,
      ] = await Promise.all([
        coursesRes.json(),
        botsRes.json(),
        resellersRes.json(),
        ordersRes.json(),
        ledgerRes.json(),
        settingsRes.json(),
        statsRes && statsRes.ok ? statsRes.json() : null,
      ]);

      setCourses(coursesData || []);
      setBots(botsData || []);
      setResellers(resellersData || []);
      setOrders(ordersData || []);
      setLedger(ledgerData || []);
      setSettings(settingsData);
      setSuperAdminStats(statsData);

      // Load reseller stats if current role is reseller or available
      if (currentResellerId) {
        const rStatsRes = await fetch(`/api/stats/reseller/${currentResellerId}`);
        if (rStatsRes.ok) {
          const rData = await rStatsRes.json();
          setResellerStats(rData);
        }
      }

      // Fetch audit logs if admin
      if (currentRole === 'super_admin') {
        try {
          const auditRes = await fetch('/api/audit-logs');
          if (auditRes.ok) {
            const auditData = await auditRes.json();
            setAuditLogs(auditData || []);
          }
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole, currentResellerId]);

  const handleSwitchRole = async (role: UserRole, resellerId?: string) => {
    setCurrentRole(role);
    if (resellerId) setCurrentResellerId(resellerId);

    try {
      await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, resellerId }),
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar
        currentRole={currentRole}
        currentResellerId={currentResellerId}
        onSwitchRole={handleSwitchRole}
        activeView={activeView}
        onSelectView={setActiveView}
        stats={
          superAdminStats
            ? {
                grossSales: superAdminStats.grossSales,
                totalOutstanding: superAdminStats.totalOutstandingBalanceAcrossResellers,
                pendingCount: superAdminStats.pendingOrdersCount,
              }
            : undefined
        }
      />

      <main className="flex-1 pb-16">
        {activeView === 'admin' && (
          <SuperAdminDashboard
            stats={superAdminStats}
            courses={courses}
            bots={bots}
            resellers={resellers}
            orders={orders}
            ledger={ledger}
            auditLogs={auditLogs}
            settings={
              settings || {
                platformName: 'Course Mania',
                currency: 'BDT',
                currencySymbol: '৳',
                ownerSupportTelegram: '@CourseManiaSupport',
                ownerSupportPhone: '+8801700112233',
                autoFulfillOnVerification: true,
                manualPaymentInstructions: {
                  bkash: { number: '01711223344', type: 'Merchant', note: '' },
                  nagad: { number: '01811223344', type: 'Merchant', note: '' },
                  rocket: { number: '019112233445', type: 'Personal', note: '' },
                  bank: { bankName: '', accountName: '', accountNumber: '', branch: '' },
                },
              }
            }
            onRefresh={loadData}
          />
        )}

        {activeView === 'reseller' && (
          <ResellerDashboard
            resellerStats={resellerStats}
            bot={bots.find((b) => b.resellerId === currentResellerId)}
            orders={orders.filter((o) => o.resellerId === currentResellerId)}
            courses={courses}
            onRefresh={loadData}
          />
        )}

        {activeView === 'bot_client' && settings && (
          <TelegramSimulator
            bots={bots}
            selectedBotId={selectedBotId}
            onSelectBot={setSelectedBotId}
            settings={settings}
            onOrderCreatedOrUpdated={loadData}
          />
        )}

        {activeView === 'guide' && <SetupGuide />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <p>Course Mania • Centralized Multi-Tenant Telegram Course Selling & Reseller Management Platform</p>
      </footer>
    </div>
  );
}

export default App;
