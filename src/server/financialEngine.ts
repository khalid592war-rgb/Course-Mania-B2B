/**
 * Course Mania - 50/50 Multi-Tenant Financial & Ledger Engine
 * Implements exact decimal arithmetic for currency (BDT ৳) and paise/cents.
 */

export interface FinancialSummary {
  grossSales: number;
  successfulSalesCount: number;
  accruedOwnerShare: number;
  accruedResellerShare: number;
  verifiedResellerPayments: number;
  approvedAdjustments: number;
  outstandingBalance: number;
  creditLimit: number;
  availableCredit: number;
  isCreditExhausted: boolean;
}

export type LedgerEntryType =
  | 'SALE_ACCRUAL'        // Customer payment confirmed -> 50% owner share accrued
  | 'SALE_REFUND'         // Order refunded -> reverses 50% owner share
  | 'RESELLER_PAYMENT'    // Super Admin records offline payment from reseller -> reduces balance
  | 'ADMIN_ADJUSTMENT'    // Super Admin manual credit/debit adjustment
  | 'CREDIT_LIMIT_CHANGE'; // Audit of limit modifications

export interface LedgerEntry {
  id: string;
  resellerId: string;
  botId: string;
  orderId?: string;
  type: LedgerEntryType;
  grossAmount: number;     // e.g. ৳1000 order price
  ownerShareDelta: number; // +৳500 on sale, -৳500 on refund, 0 on payment
  resellerPaymentDelta: number; // +৳500 when reseller pays owner
  adjustmentDelta: number; // credits/debits
  balanceAfter: number;
  reference: string;
  notes: string;
  recordedBy: string;
  createdAt: string;
}

/**
 * Rounds to 2 decimal places to prevent floating-point discrepancies.
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates the 50/50 split for an applicable sale price.
 */
export function calculate5050Split(salePrice: number): { ownerShare: number; resellerShare: number } {
  if (salePrice < 0) {
    throw new Error('Sale price cannot be negative');
  }
  const cleanPrice = roundCurrency(salePrice);
  const ownerShare = roundCurrency(cleanPrice * 0.5);
  const resellerShare = roundCurrency(cleanPrice - ownerShare);
  return { ownerShare, resellerShare };
}

/**
 * Calculates current outstanding balance and available credit for a reseller.
 * Formula:
 * outstanding_balance = accrued_owner_share - verified_reseller_payments - approved_adjustments
 * available_credit = max(0, credit_limit - outstanding_balance)
 */
export function calculateResellerCreditStatus(params: {
  creditLimit: number;
  accruedOwnerShare: number;
  verifiedResellerPayments: number;
  approvedAdjustments?: number;
}): {
  outstandingBalance: number;
  availableCredit: number;
  isCreditExhausted: boolean;
  canAcceptOrder: (expectedSalePrice: number) => boolean;
} {
  const limit = roundCurrency(params.creditLimit);
  const accrued = roundCurrency(params.accruedOwnerShare);
  const paid = roundCurrency(params.verifiedResellerPayments);
  const adj = roundCurrency(params.approvedAdjustments || 0);

  // Outstanding balance payable to owner
  const outstandingBalance = roundCurrency(accrued - paid - adj);
  // Available credit remaining before reaching limit
  const availableCredit = roundCurrency(Math.max(0, limit - outstandingBalance));
  const isCreditExhausted = outstandingBalance >= limit;

  return {
    outstandingBalance,
    availableCredit,
    isCreditExhausted,
    canAcceptOrder: (expectedSalePrice: number) => {
      const { ownerShare } = calculate5050Split(expectedSalePrice);
      // Order is acceptable if adding the new owner share doesn't exceed the credit limit
      return (outstandingBalance + ownerShare) <= limit;
    },
  };
}

/**
 * Validates whether an order can be fulfilled without exceeding the reseller's credit limit.
 */
export function checkOrderCreditEligibility(
  salePrice: number,
  currentCreditLimit: number,
  currentOutstandingBalance: number
): {
  allowed: boolean;
  requiredOwnerShare: number;
  newBalanceIfApproved: number;
  remainingCreditIfApproved: number;
  reason?: string;
} {
  const { ownerShare } = calculate5050Split(salePrice);
  const newBalance = roundCurrency(currentOutstandingBalance + ownerShare);
  const allowed = newBalance <= currentCreditLimit;
  const remaining = roundCurrency(Math.max(0, currentCreditLimit - newBalance));

  return {
    allowed,
    requiredOwnerShare: ownerShare,
    newBalanceIfApproved: newBalance,
    remainingCreditIfApproved: remaining,
    reason: allowed
      ? undefined
      : `Reseller credit limit reached. Required ৳${ownerShare}, available credit is ৳${roundCurrency(Math.max(0, currentCreditLimit - currentOutstandingBalance))}.`,
  };
}
