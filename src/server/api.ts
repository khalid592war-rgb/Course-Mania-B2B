import express, { Request, Response, NextFunction } from 'express';
import { db } from './database';
import { telegramEngine } from './telegramEngine';
import { UserRole } from './types';

export const apiRouter = express.Router();

apiRouter.use(express.json());

// Simulated Session State (default to super_admin, allows seamless switching in UI)
let currentSession: {
  role: UserRole;
  resellerId?: string;
  name: string;
} = {
  role: 'super_admin',
  name: 'Platform Super Admin',
};

// Auth / Role middleware
function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (currentSession.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super Admin privileges required' });
  }
  next();
}

// Session Endpoints
apiRouter.get('/auth/me', (req, res) => {
  res.json(currentSession);
});

apiRouter.post('/auth/switch-role', (req, res) => {
  const { role, resellerId } = req.body;
  if (role === 'super_admin') {
    currentSession = { role: 'super_admin', name: 'Platform Super Admin' };
  } else if (role === 'reseller') {
    const reseller = db.getResellerById(resellerId || 'reseller-1');
    if (!reseller) return res.status(404).json({ error: 'Reseller not found' });
    currentSession = {
      role: 'reseller',
      resellerId: reseller.id,
      name: reseller.name,
    };
  } else {
    currentSession = { role: 'customer', name: 'Telegram Customer' };
  }
  res.json({ success: true, session: currentSession });
});

// Stats Endpoints
apiRouter.get('/stats/super-admin', requireSuperAdmin, (req, res) => {
  const stats = db.getSuperAdminStats();
  res.json(stats);
});

apiRouter.get('/stats/reseller/:resellerId', (req, res) => {
  const { resellerId } = req.params;
  // Strict tenant isolation: reseller can only inspect their own stats
  if (currentSession.role === 'reseller' && currentSession.resellerId !== resellerId) {
    return res.status(403).json({ error: 'Access denied: Tenant isolation enforced' });
  }
  try {
    const stats = db.getResellerStats(resellerId);
    res.json(stats);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// Courses Endpoints (Shared Catalog)
apiRouter.get('/courses', (req, res) => {
  const { category, search, status } = req.query;
  const courses = db.getCourses({
    category: category as string,
    search: search as string,
    status: status as string,
  });
  res.json(courses);
});

apiRouter.get('/courses/:id', (req, res) => {
  const course = db.getCourseById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

apiRouter.post('/courses', requireSuperAdmin, (req, res) => {
  try {
    const course = db.addCourse(req.body);
    res.status(201).json(course);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/courses/:id', requireSuperAdmin, (req, res) => {
  try {
    const course = db.updateCourse(req.params.id, req.body);
    res.json(course);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/courses/:id/archive', requireSuperAdmin, (req, res) => {
  try {
    const course = db.archiveCourse(req.params.id);
    res.json(course);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/courses/:id/restore', requireSuperAdmin, (req, res) => {
  try {
    const course = db.restoreCourse(req.params.id);
    res.json(course);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Bots Endpoints
apiRouter.get('/bots', (req, res) => {
  let bots = db.getBots();
  // Tenant isolation for resellers: only see their assigned bot
  if (currentSession.role === 'reseller' && currentSession.resellerId) {
    bots = bots.filter((b) => b.resellerId === currentSession.resellerId);
  }
  res.json(bots);
});

apiRouter.post('/bots', requireSuperAdmin, (req, res) => {
  try {
    const bot = db.registerBot(req.body);
    res.status(201).json(bot);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/bots/:id/status', requireSuperAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const bot = db.toggleBotStatus(req.params.id, status);
    res.json(bot);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Resellers Endpoints
apiRouter.get('/resellers', (req, res) => {
  if (currentSession.role === 'reseller' && currentSession.resellerId) {
    const single = db.getResellerById(currentSession.resellerId);
    return res.json(single ? [single] : []);
  }
  res.json(db.getResellers());
});

apiRouter.post('/resellers', requireSuperAdmin, (req, res) => {
  try {
    const reseller = db.createReseller(req.body);
    res.status(201).json(reseller);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/resellers/:id/credit-limit', requireSuperAdmin, (req, res) => {
  try {
    const { creditLimit, notes } = req.body;
    const updated = db.updateCreditLimit(req.params.id, Number(creditLimit), notes);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Record payment from reseller (Super Admin ONLY)
apiRouter.post('/resellers/:id/record-payment', requireSuperAdmin, (req, res) => {
  try {
    const { amount, paymentMethod, trxId, notes } = req.body;
    const record = db.recordResellerPayment({
      resellerId: req.params.id,
      amount: Number(amount),
      paymentMethod,
      trxId,
      notes,
      recordedBy: currentSession.name,
    });
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Orders Endpoints
apiRouter.get('/orders', (req, res) => {
  const { status, search, botId } = req.query;
  const filter: any = {
    status: status as string,
    search: search as string,
    botId: botId as string,
  };

  // Strict tenant isolation: resellers only see their own orders
  if (currentSession.role === 'reseller' && currentSession.resellerId) {
    filter.resellerId = currentSession.resellerId;
  }

  const orders = db.getOrders(filter);
  res.json(orders);
});

apiRouter.get('/orders/:id', (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

apiRouter.post('/orders/create', (req, res) => {
  try {
    const order = db.createCustomerOrder(req.body);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/orders/submit-payment', (req, res) => {
  try {
    const order = db.submitPayment(req.body);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/orders/:id/verify', requireSuperAdmin, (req, res) => {
  try {
    const order = db.verifyCustomerPayment(req.params.id, currentSession.name);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/orders/:id/fulfill', requireSuperAdmin, (req, res) => {
  try {
    const { customPayload } = req.body;
    const order = db.fulfillOrder(req.params.id, customPayload);
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/orders/:id/reject', requireSuperAdmin, (req, res) => {
  try {
    const { reason } = req.body;
    const order = db.rejectPayment(req.params.id, reason || 'Transaction not found in merchant statement');
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/orders/:id/refund', requireSuperAdmin, (req, res) => {
  try {
    const { reason } = req.body;
    const order = db.refundOrder(req.params.id, reason || 'Refund issued by admin');
    res.json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Financial Ledger Endpoints
apiRouter.get('/ledger', (req, res) => {
  let filter: any;
  if (currentSession.role === 'reseller' && currentSession.resellerId) {
    filter = { resellerId: currentSession.resellerId };
  }
  const entries = db.getLedger(filter);
  res.json(entries);
});

apiRouter.get('/reseller-payments', (req, res) => {
  let filter: any;
  if (currentSession.role === 'reseller' && currentSession.resellerId) {
    filter = { resellerId: currentSession.resellerId };
  }
  const payments = db.getResellerPayments(filter);
  res.json(payments);
});

// Telegram Bot Simulator & Webhook Endpoints
apiRouter.post('/telegram/interact', (req, res) => {
  const { botId, chatId, fromName, fromUsername, text, callbackData, lang } = req.body;
  const reply = telegramEngine.handleIncoming({
    botId,
    chatId: chatId || 12345678,
    fromName: fromName || 'Telegram User',
    fromUsername,
    text,
    callbackData,
    lang,
  });
  res.json(reply);
});

// Real Telegram Webhook Receiver
apiRouter.post('/telegram/webhook/:botId', (req, res) => {
  const { botId } = req.params;
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];

  const bot = db.getBotById(botId);
  if (!bot) {
    return res.status(404).json({ error: 'Bot not configured' });
  }

  // Verify secret token if present
  if (secretHeader && secretHeader !== bot.webhookSecret) {
    return res.status(401).json({ error: 'Invalid webhook secret token' });
  }

  // Update ping
  bot.lastWebhookPing = new Date().toISOString();

  // Process standard Telegram Update object
  const update = req.body;
  if (update?.message) {
    const msg = update.message;
    telegramEngine.handleIncoming({
      botId,
      chatId: msg.chat.id,
      fromName: msg.from.first_name || 'User',
      fromUsername: msg.from.username,
      text: msg.text,
    });
  } else if (update?.callback_query) {
    const cb = update.callback_query;
    telegramEngine.handleIncoming({
      botId,
      chatId: cb.message?.chat?.id || cb.from.id,
      fromName: cb.from.first_name || 'User',
      fromUsername: cb.from.username,
      callbackData: cb.data,
    });
  }

  res.status(200).json({ ok: true });
});

// CSV Reports Export
apiRouter.get('/reports/export-csv', (req, res) => {
  const type = req.query.type as string; // 'orders' | 'ledger' | 'resellers'

  if (type === 'resellers') {
    if (currentSession.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin only' });
    }
    const resellers = db.getResellers();
    let csv = 'ID,Name,Phone,Email,BotUsername,CreditLimit,AccruedOwnerShare,VerifiedPayments,OutstandingBalance,AvailableCredit,Status\n';
    resellers.forEach((r) => {
      csv += `"${r.id}","${r.name}","${r.phone}","${r.email}","${r.botUsername}",${r.creditLimit},${r.accruedOwnerShare},${r.verifiedResellerPayments},${r.outstandingBalance},${r.availableCredit},"${r.status}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="resellers_report.csv"');
    return res.send(csv);
  }

  if (type === 'ledger') {
    const entries = db.getLedger(currentSession.role === 'reseller' ? { resellerId: currentSession.resellerId } : undefined);
    let csv = 'ID,Date,Reseller,BotID,Type,GrossAmount,OwnerShareDelta,ResellerPaymentDelta,BalanceAfter,Reference,Notes,RecordedBy\n';
    entries.forEach((l) => {
      csv += `"${l.id}","${l.createdAt}","${l.resellerName}","${l.botId}","${l.type}",${l.grossAmount},${l.ownerShareDelta},${l.resellerPaymentDelta},${l.balanceAfter},"${l.reference}","${l.notes}","${l.recordedBy}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="financial_ledger.csv"');
    return res.send(csv);
  }

  // Default: Orders export
  const orders = db.getOrders(currentSession.role === 'reseller' ? { resellerId: currentSession.resellerId } : undefined);
  let csv = 'OrderNumber,Date,Course,Customer,Phone,Price,OwnerShare50,ResellerShare50,Status,PaymentMethod,TrxID,ResellerName\n';
  orders.forEach((o) => {
    csv += `"${o.orderNumber}","${o.createdAt}","${o.courseTitle}","${o.customerName}","${o.customerPhone || ''}",${o.salePrice},${o.ownerShare},${o.resellerShare},"${o.status}","${o.paymentMethod || ''}","${o.paymentTrxId || ''}","${o.resellerName || 'Owner Direct'}"\n`;
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="orders_report.csv"');
  return res.send(csv);
});

// Platform Settings & Audit Logs
apiRouter.get('/settings', (req, res) => {
  res.json(db.getSettings());
});

apiRouter.put('/settings', requireSuperAdmin, (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/audit-logs', requireSuperAdmin, (req, res) => {
  res.json(db.getAuditLogs());
});
