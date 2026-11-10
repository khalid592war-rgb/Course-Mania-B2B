import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from './database';

test('shared catalog returns published courses across all bots', () => {
  const courses = db.getCourses({ status: 'published' });
  assert.ok(courses.length >= 5);
  const webDev = courses.find((c) => c.title.includes('Full-Stack'));
  assert.ok(webDev);
  assert.equal(webDev?.salePrice, 2000);
});

test('bot registration validates token format and masks token', () => {
  const bot = db.registerBot({
    name: 'Test Affiliate Bot',
    username: '@TestAffiliateBot',
    token: '1234567890:AAHTestBotTokenSecretKey123',
    isPrimaryOwnerBot: false,
    resellerId: null,
  });

  assert.equal(bot.username, 'TestAffiliateBot');
  assert.equal(bot.status, 'active');
  assert.match(bot.tokenMasked, /^123456\.\.\.y123$/);
  assert.notEqual(bot.tokenEncrypted, '1234567890:AAHTestBotTokenSecretKey123');
});

test('submitting duplicate payment TrxID is rejected', () => {
  const uniqueTrx = `BKS_DUP_${Date.now()}_${Math.random()}`;

  const order1 = db.createCustomerOrder({
    botId: 'bot-owner',
    customerTelegramId: 111222,
    customerName: 'Rahim Tester',
    courseId: 'course-1',
  });

  db.submitPayment({
    orderId: order1.id,
    paymentMethod: 'bkash',
    trxId: uniqueTrx,
    senderNumber: '01700000000',
  });

  const order2 = db.createCustomerOrder({
    botId: 'bot-owner',
    customerTelegramId: 333444,
    customerName: 'Karim Tester',
    courseId: 'course-2',
  });

  assert.throws(
    () => {
      db.submitPayment({
        orderId: order2.id,
        paymentMethod: 'bkash',
        trxId: uniqueTrx, // duplicate!
        senderNumber: '01800000000',
      });
    },
    /already been submitted/
  );
});

test('payment verification triggers 50/50 owner share accrual and updates reseller balance', () => {
  // Reseller 1 initial state
  const resellerBefore = db.getResellerById('reseller-1')!;
  const oldBalance = resellerBefore.outstandingBalance;

  // Create order on reseller-1 bot
  const order = db.createCustomerOrder({
    botId: 'bot-reseller-1',
    customerTelegramId: 888777,
    customerName: 'Test Student',
    courseId: 'course-4', // salePrice = ৳1000 => ownerShare = ৳500
  });

  db.submitPayment({
    orderId: order.id,
    paymentMethod: 'bkash',
    trxId: `BKS_ACCRUAL_${Date.now()}`,
    senderNumber: '01711112222',
  });

  // Verify payment
  const verified = db.verifyCustomerPayment(order.id, 'Super Admin');
  assert.equal(verified.status, 'fulfilled');
  assert.ok(verified.fulfillmentDetails?.inviteLink);

  const resellerAfter = db.getResellerById('reseller-1')!;
  assert.equal(resellerAfter.outstandingBalance, oldBalance + 500);

  // Check ledger entry exists
  const ledger = db.getLedger({ resellerId: 'reseller-1' });
  const entry = ledger.find((l) => l.orderId === order.id);
  assert.ok(entry);
  assert.equal(entry?.type, 'SALE_ACCRUAL');
  assert.equal(entry?.ownerShareDelta, 500);
});

test('Super Admin recording reseller payment reduces outstanding balance and adds ledger entry', () => {
  const resellerBefore = db.getResellerById('reseller-1')!;
  const balanceBefore = resellerBefore.outstandingBalance;

  const paymentRecord = db.recordResellerPayment({
    resellerId: 'reseller-1',
    amount: 500,
    paymentMethod: 'bkash',
    trxId: `BKS_SETTLE_${Date.now()}`,
    notes: 'Partial settlement test',
  });

  assert.equal(paymentRecord.amount, 500);

  const resellerAfter = db.getResellerById('reseller-1')!;
  assert.equal(resellerAfter.outstandingBalance, balanceBefore - 500);

  const ledger = db.getLedger({ resellerId: 'reseller-1' });
  const payEntry = ledger.find((l) => l.type === 'RESELLER_PAYMENT' && l.reference.includes(paymentRecord.trxId));
  assert.ok(payEntry);
  assert.equal(payEntry?.resellerPaymentDelta, 500);
});
