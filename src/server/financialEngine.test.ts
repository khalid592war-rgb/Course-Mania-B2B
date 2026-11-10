import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculate5050Split,
  calculateResellerCreditStatus,
  checkOrderCreditEligibility,
  roundCurrency,
} from './financialEngine';

test('calculate5050Split handles standard integer amounts (৳200)', () => {
  const split = calculate5050Split(200);
  assert.equal(split.ownerShare, 100);
  assert.equal(split.resellerShare, 100);
  assert.equal(roundCurrency(split.ownerShare + split.resellerShare), 200);
});

test('calculate5050Split handles fractional paisa amounts cleanly (৳199)', () => {
  const split = calculate5050Split(199);
  assert.equal(split.ownerShare, 99.5);
  assert.equal(split.resellerShare, 99.5);
  assert.equal(roundCurrency(split.ownerShare + split.resellerShare), 199);
});

test('calculate5050Split rejects negative values', () => {
  assert.throws(() => calculate5050Split(-10), /Sale price cannot be negative/);
});

test('calculateResellerCreditStatus calculates outstanding balance and available credit accurately', () => {
  // Scenario from requirements:
  // Reseller credit limit = ৳1,000
  // Gross sales = ৳2,000 (Owner accrued = ৳1,000)
  // Payments made = ৳0
  const status = calculateResellerCreditStatus({
    creditLimit: 1000,
    accruedOwnerShare: 1000,
    verifiedResellerPayments: 0,
  });

  assert.equal(status.outstandingBalance, 1000);
  assert.equal(status.availableCredit, 0);
  assert.equal(status.isCreditExhausted, true);
  assert.equal(status.canAcceptOrder(200), false);
});

test('credit status restores when Super Admin records verified reseller payment', () => {
  // Limit = ৳1,000, Accrued = ৳1,000, Paid = ৳500
  const status = calculateResellerCreditStatus({
    creditLimit: 1000,
    accruedOwnerShare: 1000,
    verifiedResellerPayments: 500,
  });

  assert.equal(status.outstandingBalance, 500);
  assert.equal(status.availableCredit, 500);
  assert.equal(status.isCreditExhausted, false);
  // An order of ৳200 requires ৳100 owner share; 500 + 100 <= 1000 => true
  assert.equal(status.canAcceptOrder(200), true);
  // An order of ৳1,200 requires ৳600 owner share; 500 + 600 > 1000 => false
  assert.equal(status.canAcceptOrder(1200), false);
});

test('checkOrderCreditEligibility blocks order when limit exceeded and provides clear explanation', () => {
  const eligibility = checkOrderCreditEligibility(
    500,  // Order price -> ৳250 owner share
    1000, // Credit limit
    800   // Current outstanding balance
  );

  assert.equal(eligibility.allowed, false);
  assert.equal(eligibility.requiredOwnerShare, 250);
  assert.equal(eligibility.newBalanceIfApproved, 1050);
  assert.match(eligibility.reason || '', /Reseller credit limit reached/);
});

test('checkOrderCreditEligibility permits order when within limit', () => {
  const eligibility = checkOrderCreditEligibility(
    400,  // Order price -> ৳200 owner share
    1000, // Credit limit
    700   // Current outstanding balance
  );

  assert.equal(eligibility.allowed, true);
  assert.equal(eligibility.requiredOwnerShare, 200);
  assert.equal(eligibility.newBalanceIfApproved, 900);
  assert.equal(eligibility.remainingCreditIfApproved, 100);
});
