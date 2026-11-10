export type UserRole = 'super_admin' | 'reseller' | 'customer';

export interface TelegramBot {
  id: string;
  name: string;
  username: string;
  tokenMasked: string;
  tokenEncrypted: string;
  isPrimaryOwnerBot: boolean;
  resellerId: string | null; // null for owner bot
  resellerName?: string;
  status: 'active' | 'suspended' | 'inactive';
  webhookUrl: string;
  webhookSecret: string;
  lastWebhookPing: string;
  totalOrdersCount: number;
  totalGrossSales: number;
  createdAt: string;
}

export interface ResellerAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  assignedBotId: string;
  botUsername: string;
  creditLimit: number; // e.g. ৳5,000
  accruedOwnerShare: number; // sum of 50% owner shares
  verifiedResellerPayments: number; // sum of money paid to owner
  approvedAdjustments: number;
  outstandingBalance: number; // accruedOwnerShare - verifiedResellerPayments - approvedAdjustments
  availableCredit: number; // max(0, creditLimit - outstandingBalance)
  status: 'active' | 'suspended';
  notes?: string;
  createdAt: string;
}

export type CourseCategory =
  | 'Web Development'
  | 'Graphic Design'
  | 'Digital Marketing'
  | 'AI & Data Science'
  | 'Spoken English & IELTS'
  | 'Video Editing & Animation'
  | 'Mobile App Development';

export type DeliveryMethod =
  | 'telegram_channel'
  | 'access_link'
  | 'drive_folder'
  | 'manual';

export interface Course {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  category: CourseCategory;
  regularPrice: number; // in BDT ৳
  salePrice: number;    // in BDT ৳
  isSaleActive: boolean;
  thumbnailUrl: string;
  status: 'published' | 'draft' | 'archived';
  deliveryMethod: DeliveryMethod;
  deliveryPayload: string; // e.g. private invite link: https://t.me/+AbCdEfGh123
  features: string[];
  totalEnrolled: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'created'
  | 'awaiting_payment'
  | 'payment_submitted'
  | 'payment_pending_verification'
  | 'paid'
  | 'paid_pending_fulfillment'
  | 'fulfilled'
  | 'cancelled'
  | 'refunded'
  | 'delivery_failed';

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'bank_transfer' | 'card_sandbox';

export interface Order {
  id: string;
  orderNumber: string; // e.g. "CM-78219"
  botId: string;
  botUsername: string;
  resellerId: string | null; // null if ordered via owner bot
  resellerName?: string;
  customerTelegramId: number | string;
  customerName: string;
  customerUsername?: string;
  customerPhone?: string;
  courseId: string;
  courseTitle: string;
  unitPrice: number;
  salePrice: number;
  ownerShare: number;   // 50%
  resellerShare: number; // 50%
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentTrxId?: string;
  paymentSenderNumber?: string;
  paymentScreenshotNote?: string;
  paymentSubmittedAt?: string;
  paymentVerifiedAt?: string;
  verifiedBy?: string;
  fulfillmentDetails?: {
    method: DeliveryMethod;
    inviteLink?: string;
    instructions: string;
    deliveredAt: string;
  };
  rejectionReason?: string;
  refundReason?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type LedgerEntryType =
  | 'SALE_ACCRUAL'
  | 'SALE_REFUND'
  | 'RESELLER_PAYMENT'
  | 'ADMIN_ADJUSTMENT'
  | 'CREDIT_LIMIT_CHANGE';

export interface LedgerEntry {
  id: string;
  resellerId: string;
  resellerName: string;
  botId: string;
  orderId?: string;
  orderNumber?: string;
  type: LedgerEntryType;
  grossAmount: number;
  ownerShareDelta: number;
  resellerPaymentDelta: number;
  adjustmentDelta: number;
  balanceAfter: number;
  reference: string;
  notes: string;
  recordedBy: string;
  createdAt: string;
}

export interface ResellerPaymentRecord {
  id: string;
  resellerId: string;
  resellerName: string;
  amount: number;
  paymentMethod: PaymentMethod | 'cash';
  trxId: string;
  notes: string;
  recordedBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  entityType: 'course' | 'bot' | 'reseller' | 'order' | 'ledger' | 'settings';
  entityId: string;
  details: string;
  createdAt: string;
}

export interface PlatformSettings {
  platformName: string;
  currency: string;
  currencySymbol: string;
  ownerSupportTelegram: string;
  ownerSupportPhone: string;
  autoFulfillOnVerification: boolean;
  manualPaymentInstructions: {
    bkash: { number: string; type: 'Personal' | 'Merchant'; note: string };
    nagad: { number: string; type: 'Personal' | 'Merchant'; note: string };
    rocket: { number: string; type: 'Personal'; note: string };
    bank: { bankName: string; accountName: string; accountNumber: string; branch: string };
  };
}
