import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  TelegramBot,
  ResellerAccount,
  Course,
  Order,
  OrderStatus,
  LedgerEntry,
  ResellerPaymentRecord,
  AuditLog,
  PlatformSettings,
  PaymentMethod,
} from './types';
import {
  calculate5050Split,
  calculateResellerCreditStatus,
  checkOrderCreditEligibility,
  roundCurrency,
} from './financialEngine';

export interface DatabaseSchema {
  bots: TelegramBot[];
  resellers: ResellerAccount[];
  courses: Course[];
  orders: Order[];
  ledger: LedgerEntry[];
  resellerPayments: ResellerPaymentRecord[];
  auditLogs: AuditLog[];
  settings: PlatformSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'coursemania_db.json');
const ENCRYPTION_SECRET = process.env.BOT_TOKEN_SECRET || 'cm-secret-token-key-2026-bengali-multi-tenant';

export function encryptBotToken(token: string): string {
  try {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 32),
      Buffer.alloc(16, 0)
    );
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch {
    return Buffer.from(token).toString('base64');
  }
}

export function maskToken(token: string): string {
  if (!token || token.length < 12) return '******';
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

const initialSeedData: DatabaseSchema = {
  settings: {
    platformName: 'Course Mania',
    currency: 'BDT',
    currencySymbol: '৳',
    ownerSupportTelegram: '@CourseManiaSupport',
    ownerSupportPhone: '+8801700112233',
    autoFulfillOnVerification: true,
    manualPaymentInstructions: {
      bkash: {
        number: '01711223344',
        type: 'Merchant',
        note: 'bKash Make Payment অপশন ব্যবহার করে ট্রানজেকশন আইডি (TrxID) নিচে দিন।',
      },
      nagad: {
        number: '01811223344',
        type: 'Merchant',
        note: 'Nagad Merchant Payment করুন অথবা Send Money করে রেফারেন্সে অর্ডার নম্বর দিন।',
      },
      rocket: {
        number: '019112233445',
        type: 'Personal',
        note: 'Rocket Send Money করে ট্রানজেকশন কোড সাবমিট করুন।',
      },
      bank: {
        bankName: 'Islami Bank Bangladesh Ltd / City Bank',
        accountName: 'Course Mania Ltd',
        accountNumber: '20501234567890',
        branch: 'Dhanmondi Branch, Dhaka',
      },
    },
  },
  courses: [
    {
      id: 'course-1',
      title: 'Full-Stack Web Development Bootcamp (MERN & Next.js)',
      titleBn: 'কমপ্লিট ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্ট (MERN ও Next.js)',
      description: 'Zero to mastery in modern React, Node.js, Express, Next.js, and PostgreSQL with 10 real production projects and lifetime support.',
      descriptionBn: 'শূন্য থেকে আধুনিক ওয়েব ডেভেলপমেন্ট শিখুন। ১০টি রিয়েল লাইফ প্রজেক্ট, গিটহাব কোড ও লাইফটাইম প্রাইভেট সাপোর্ট ব্যাচ।',
      category: 'Web Development',
      regularPrice: 3500,
      salePrice: 2000,
      isSaleActive: true,
      thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=60',
      status: 'published',
      deliveryMethod: 'telegram_channel',
      deliveryPayload: 'https://t.me/+CM_FullStack_VIP_Batch9283',
      features: ['120+ High Quality Video Lessons', '10 Real-world Projects', 'Private VIP Telegram Group', 'Course Completion Certificate'],
      totalEnrolled: 142,
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'course-2',
      title: 'Mastering AI & Python for Automation',
      titleBn: 'পাইথন ও এআই অটোমেশন মাস্টারক্লাস',
      description: 'Learn Python programming, LLM APIs, web scraping, automation scripts, and build your own autonomous agents.',
      descriptionBn: 'পাইথন প্রোগ্রামিং এবং আধুনিক এআই টুলস ব্যবহার করে ফ্রিল্যান্সিং ও অটোমেশন প্রজেক্ট তৈরির পূর্ণাঙ্গ গাইডলাইন।',
      category: 'AI & Data Science',
      regularPrice: 2800,
      salePrice: 1500,
      isSaleActive: true,
      thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60',
      status: 'published',
      deliveryMethod: 'telegram_channel',
      deliveryPayload: 'https://t.me/+CM_Python_AI_Mastery_VIP',
      features: ['Hands-on Code Repositories', 'Gemini & OpenAI API Integration', 'Weekly Live Q&A', 'Dedicated Discord & TG Channel'],
      totalEnrolled: 89,
      createdAt: '2026-01-15T10:00:00.000Z',
      updatedAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'course-3',
      title: 'Professional Graphic & UI/UX Design with Figma',
      titleBn: 'প্রফেশনাল গ্রাফিক্স ও ফিগমা UI/UX ডিজাইন',
      description: 'Master Photoshop, Illustrator, and Figma. Build client-ready mobile apps, landing pages, and brand identities.',
      descriptionBn: 'ফটোশপ, ইলাস্ট্রেটর ও ফিগমা দিয়ে আন্তর্জাতিক মানের ডিজাইন তৈরি ও মার্কেটপ্লেসে সফল ক্যারিয়ার গড়ার গাইড।',
      category: 'Graphic Design',
      regularPrice: 2500,
      salePrice: 1200,
      isSaleActive: true,
      thumbnailUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=60',
      status: 'published',
      deliveryMethod: 'telegram_channel',
      deliveryPayload: 'https://t.me/+CM_FigmaUIUX_Pro_Batch',
      features: ['50+ Design Templates', 'Portfolio Review by Mentors', 'Figma Component Libraries', 'Client Hunting Strategies'],
      totalEnrolled: 115,
      createdAt: '2026-01-20T10:00:00.000Z',
      updatedAt: '2026-01-20T10:00:00.000Z',
    },
    {
      id: 'course-4',
      title: 'Digital Marketing & Facebook Ads Masterclass',
      titleBn: 'ডিজিটাল মার্কেটিং ও ফেসবুক অ্যাডস স্পেশালিস্ট',
      description: 'High converting Meta Ads, Google Ads, SEO, content marketing, and e-commerce growth strategies.',
      descriptionBn: 'ফেসবুক ও গুগল অ্যাডের গোপন টেকনিক, সেলস ফানেল এবং ই-কমার্স বিজনেসে রকেট সেল বাড়ানোর পরীক্ষিত কৌশল।',
      category: 'Digital Marketing',
      regularPrice: 2200,
      salePrice: 1000,
      isSaleActive: true,
      thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60',
      status: 'published',
      deliveryMethod: 'telegram_channel',
      deliveryPayload: 'https://t.me/+CM_DigitalMarketing_Elite',
      features: ['Ad Account Setup & Ban Protection', 'Ad Copywriting Formulas', 'Live Budget Optimization', 'Case Studies from 10k+ Sales'],
      totalEnrolled: 74,
      createdAt: '2026-01-25T10:00:00.000Z',
      updatedAt: '2026-01-25T10:00:00.000Z',
    },
    {
      id: 'course-5',
      title: 'Complete Video Editing & Motion Graphics (Premiere & After Effects)',
      titleBn: 'ভিডিও এডিটিং ও মোশন গ্রাফিক্স মাস্টারক্লাস',
      description: 'Learn cinematic video editing, YouTube content creation, Premiere Pro workflow, and After Effects visual effects.',
      descriptionBn: 'ইউটিউব, রিলস ও কমার্শিয়াল ভিডিও এডিটিং এর জাদুকরী কৌশল শিখুন অ্যাডোবি প্রিমিয়ার ও আফটার ইফেক্টস দিয়ে।',
      category: 'Video Editing & Animation',
      regularPrice: 3000,
      salePrice: 1600,
      isSaleActive: true,
      thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=60',
      status: 'published',
      deliveryMethod: 'telegram_channel',
      deliveryPayload: 'https://t.me/+CM_VideoEditing_Pro_Batch',
      features: ['100GB+ Sound Effects & LUTS', 'Motion Graphics Presets', 'YouTube Monetization Guide', 'Client Pitching Templates'],
      totalEnrolled: 62,
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z',
    },
  ],
  bots: [
    {
      id: 'bot-owner',
      name: 'Course Mania Official Bot',
      username: 'CourseManiaOfficialBot',
      tokenMasked: '719284...9281',
      tokenEncrypted: encryptBotToken('7192849182:AAH928kduew93821739281'),
      isPrimaryOwnerBot: true,
      resellerId: null,
      status: 'active',
      webhookUrl: 'https://api.coursemania.com/api/telegram/webhook/bot-owner',
      webhookSecret: 'sec_owner_918237',
      lastWebhookPing: '2026-11-10T08:00:00.000Z',
      totalOrdersCount: 18,
      totalGrossSales: 32000,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'bot-reseller-1',
      name: 'TechZone Course Bot',
      username: 'TechZoneCourseBot',
      tokenMasked: '682910...1123',
      tokenEncrypted: encryptBotToken('6829104821:AAGy283u82jdhweu821123'),
      isPrimaryOwnerBot: false,
      resellerId: 'reseller-1',
      resellerName: 'Ariful Islam (TechZone BD)',
      status: 'active',
      webhookUrl: 'https://api.coursemania.com/api/telegram/webhook/bot-reseller-1',
      webhookSecret: 'sec_techzone_482910',
      lastWebhookPing: '2026-11-10T08:05:00.000Z',
      totalOrdersCount: 8,
      totalGrossSales: 13400,
      createdAt: '2026-01-05T00:00:00.000Z',
    },
    {
      id: 'bot-reseller-2',
      name: 'SkillHub Bangla Bot',
      username: 'SkillHubBanglaBot',
      tokenMasked: '592019...4419',
      tokenEncrypted: encryptBotToken('5920198421:AAFx9283uhd928374419'),
      isPrimaryOwnerBot: false,
      resellerId: 'reseller-2',
      resellerName: 'Tanvir Hossain (SkillHub)',
      status: 'active',
      webhookUrl: 'https://api.coursemania.com/api/telegram/webhook/bot-reseller-2',
      webhookSecret: 'sec_skillhub_592019',
      lastWebhookPing: '2026-11-10T07:55:00.000Z',
      totalOrdersCount: 4,
      totalGrossSales: 6200,
      createdAt: '2026-01-12T00:00:00.000Z',
    },
  ],
  resellers: [
    {
      id: 'reseller-1',
      name: 'Ariful Islam (TechZone BD)',
      phone: '+8801712345678',
      email: 'ariful@techzonebd.com',
      assignedBotId: 'bot-reseller-1',
      botUsername: 'TechZoneCourseBot',
      creditLimit: 10000,
      accruedOwnerShare: 6700, // 50% of 13400
      verifiedResellerPayments: 5000,
      approvedAdjustments: 0,
      outstandingBalance: 1700, // 6700 - 5000 = 1700
      availableCredit: 8300,    // 10000 - 1700 = 8300
      status: 'active',
      notes: 'Active reseller from Sylhet. Prompt monthly payer.',
      createdAt: '2026-01-05T00:00:00.000Z',
    },
    {
      id: 'reseller-2',
      name: 'Tanvir Hossain (SkillHub)',
      phone: '+8801819876543',
      email: 'tanvir@skillhub.org',
      assignedBotId: 'bot-reseller-2',
      botUsername: 'SkillHubBanglaBot',
      creditLimit: 5000,
      accruedOwnerShare: 3100, // 50% of 6200
      verifiedResellerPayments: 2000,
      approvedAdjustments: 0,
      outstandingBalance: 1100, // 3100 - 2000 = 1100
      availableCredit: 3900,    // 5000 - 1100 = 3900
      status: 'active',
      notes: 'Digital marketing group admin with 45k TG community.',
      createdAt: '2026-01-12T00:00:00.000Z',
    },
  ],
  orders: [
    {
      id: 'order-101',
      orderNumber: 'CM-1001',
      botId: 'bot-reseller-1',
      botUsername: 'TechZoneCourseBot',
      resellerId: 'reseller-1',
      resellerName: 'Ariful Islam (TechZone BD)',
      customerTelegramId: 98127361,
      customerName: 'Shakil Ahmed',
      customerUsername: 'shakil_dev',
      customerPhone: '01799887766',
      courseId: 'course-1',
      courseTitle: 'Full-Stack Web Development Bootcamp (MERN & Next.js)',
      unitPrice: 3500,
      salePrice: 2000,
      ownerShare: 1000,
      resellerShare: 1000,
      status: 'fulfilled',
      paymentMethod: 'bkash',
      paymentTrxId: 'BKS92837192',
      paymentSenderNumber: '01799887766',
      paymentSubmittedAt: '2026-02-05T14:20:00.000Z',
      paymentVerifiedAt: '2026-02-05T14:25:00.000Z',
      verifiedBy: 'Super Admin',
      fulfillmentDetails: {
        method: 'telegram_channel',
        inviteLink: 'https://t.me/+CM_FullStack_VIP_Batch9283',
        instructions: 'কোর্সের প্রাইভেট চ্যানেলে যুক্ত হয়ে প্রথম পিন করা মেসেজটি চেক করুন।',
        deliveredAt: '2026-02-05T14:25:00.000Z',
      },
      createdAt: '2026-02-05T14:15:00.000Z',
      updatedAt: '2026-02-05T14:25:00.000Z',
    },
    {
      id: 'order-102',
      orderNumber: 'CM-1002',
      botId: 'bot-reseller-2',
      botUsername: 'SkillHubBanglaBot',
      resellerId: 'reseller-2',
      resellerName: 'Tanvir Hossain (SkillHub)',
      customerTelegramId: 55443322,
      customerName: 'Mehedi Hasan',
      customerUsername: 'mehedi_designer',
      customerPhone: '01811223399',
      courseId: 'course-3',
      courseTitle: 'Professional Graphic & UI/UX Design with Figma',
      unitPrice: 2500,
      salePrice: 1200,
      ownerShare: 600,
      resellerShare: 600,
      status: 'fulfilled',
      paymentMethod: 'nagad',
      paymentTrxId: 'NGD88291029',
      paymentSenderNumber: '01811223399',
      paymentSubmittedAt: '2026-02-07T11:00:00.000Z',
      paymentVerifiedAt: '2026-02-07T11:04:00.000Z',
      verifiedBy: 'Super Admin',
      fulfillmentDetails: {
        method: 'telegram_channel',
        inviteLink: 'https://t.me/+CM_FigmaUIUX_Pro_Batch',
        instructions: 'চ্যানেলে জয়েন করে স্বাগতম ভিডিওটি দেখুন।',
        deliveredAt: '2026-02-07T11:04:00.000Z',
      },
      createdAt: '2026-02-07T10:55:00.000Z',
      updatedAt: '2026-02-07T11:04:00.000Z',
    },
    {
      id: 'order-103',
      orderNumber: 'CM-1003',
      botId: 'bot-reseller-1',
      botUsername: 'TechZoneCourseBot',
      resellerId: 'reseller-1',
      resellerName: 'Ariful Islam (TechZone BD)',
      customerTelegramId: 77889900,
      customerName: 'Kamrul Islam',
      customerUsername: 'kamrul_ai',
      customerPhone: '01922334455',
      courseId: 'course-2',
      courseTitle: 'Mastering AI & Python for Automation',
      unitPrice: 2800,
      salePrice: 1500,
      ownerShare: 750,
      resellerShare: 750,
      status: 'payment_pending_verification',
      paymentMethod: 'rocket',
      paymentTrxId: 'RKT44920193',
      paymentSenderNumber: '01922334455',
      paymentSubmittedAt: '2026-11-10T07:45:00.000Z',
      createdAt: '2026-11-10T07:40:00.000Z',
      updatedAt: '2026-11-10T07:45:00.000Z',
    },
  ],
  ledger: [
    {
      id: 'led-1',
      resellerId: 'reseller-1',
      resellerName: 'Ariful Islam (TechZone BD)',
      botId: 'bot-reseller-1',
      orderId: 'order-101',
      orderNumber: 'CM-1001',
      type: 'SALE_ACCRUAL',
      grossAmount: 2000,
      ownerShareDelta: 1000,
      resellerPaymentDelta: 0,
      adjustmentDelta: 0,
      balanceAfter: 6700,
      reference: 'CM-1001 sale verified',
      notes: '50% owner receivable accrued upon course fulfillment',
      recordedBy: 'system',
      createdAt: '2026-02-05T14:25:00.000Z',
    },
    {
      id: 'led-2',
      resellerId: 'reseller-1',
      resellerName: 'Ariful Islam (TechZone BD)',
      botId: 'bot-reseller-1',
      type: 'RESELLER_PAYMENT',
      grossAmount: 5000,
      ownerShareDelta: 0,
      resellerPaymentDelta: 5000,
      adjustmentDelta: 0,
      balanceAfter: 1700,
      reference: 'bKash TrxID BKS88990011',
      notes: 'Reseller Ariful sent ৳5,000 via bKash personal to owner',
      recordedBy: 'Super Admin',
      createdAt: '2026-02-06T18:00:00.000Z',
    },
    {
      id: 'led-3',
      resellerId: 'reseller-2',
      resellerName: 'Tanvir Hossain (SkillHub)',
      botId: 'bot-reseller-2',
      orderId: 'order-102',
      orderNumber: 'CM-1002',
      type: 'SALE_ACCRUAL',
      grossAmount: 1200,
      ownerShareDelta: 600,
      resellerPaymentDelta: 0,
      adjustmentDelta: 0,
      balanceAfter: 3100,
      reference: 'CM-1002 sale verified',
      notes: '50% owner receivable accrued upon course fulfillment',
      recordedBy: 'system',
      createdAt: '2026-02-07T11:04:00.000Z',
    },
    {
      id: 'led-4',
      resellerId: 'reseller-2',
      resellerName: 'Tanvir Hossain (SkillHub)',
      botId: 'bot-reseller-2',
      type: 'RESELLER_PAYMENT',
      grossAmount: 2000,
      ownerShareDelta: 0,
      resellerPaymentDelta: 2000,
      adjustmentDelta: 0,
      balanceAfter: 1100,
      reference: 'Nagad TrxID NGD99001122',
      notes: 'Reseller Tanvir cleared ৳2,000 via Nagad',
      recordedBy: 'Super Admin',
      createdAt: '2026-02-08T09:30:00.000Z',
    },
  ],
  resellerPayments: [
    {
      id: 'rp-1',
      resellerId: 'reseller-1',
      resellerName: 'Ariful Islam (TechZone BD)',
      amount: 5000,
      paymentMethod: 'bkash',
      trxId: 'BKS88990011',
      notes: 'Sylhet meetup and bKash transfer',
      recordedBy: 'Super Admin',
      createdAt: '2026-02-06T18:00:00.000Z',
    },
    {
      id: 'rp-2',
      resellerId: 'reseller-2',
      resellerName: 'Tanvir Hossain (SkillHub)',
      amount: 2000,
      paymentMethod: 'nagad',
      trxId: 'NGD99001122',
      notes: 'Nagad merchant cleared payment',
      recordedBy: 'Super Admin',
      createdAt: '2026-02-08T09:30:00.000Z',
    },
  ],
  auditLogs: [
    {
      id: 'audit-1',
      actorId: 'admin',
      actorRole: 'super_admin',
      action: 'SYSTEM_INIT',
      entityType: 'settings',
      entityId: 'global',
      details: 'Course Mania multi-bot platform initialized with seed data',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'audit-2',
      actorId: 'admin',
      actorRole: 'super_admin',
      action: 'RESELLER_PAYMENT_VERIFIED',
      entityType: 'reseller',
      entityId: 'reseller-1',
      details: 'Recorded ৳5,000 received from Ariful Islam (TechZone BD)',
      createdAt: '2026-02-06T18:00:00.000Z',
    },
  ],
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('Error loading db file, using seed data:', e);
    }
    // Write initial seed
    this.saveData(initialSeedData);
    return JSON.parse(JSON.stringify(initialSeedData));
  }

  private saveData(data: DatabaseSchema) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db file:', e);
    }
  }

  private persist() {
    this.saveData(this.data);
  }

  // --- Audit Logging ---
  public logAudit(actorId: string, actorRole: any, action: string, entityType: any, entityId: string, details: string) {
    const entry: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorId,
      actorRole,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.persist();
    return entry;
  }

  // --- Courses ---
  public getCourses(filter?: { category?: string; status?: string; search?: string }): Course[] {
    let list = this.data.courses;
    if (filter?.status) {
      list = list.filter((c) => c.status === filter.status);
    }
    if (filter?.category && filter.category !== 'all') {
      list = list.filter((c) => c.category === filter.category);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.titleBn.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.descriptionBn.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public getCourseById(id: string): Course | undefined {
    return this.data.courses.find((c) => c.id === id);
  }

  public addCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'totalEnrolled'>): Course {
    const newCourse: Course = {
      ...courseData,
      id: `course-${Date.now()}`,
      regularPrice: roundCurrency(courseData.regularPrice),
      salePrice: roundCurrency(courseData.salePrice),
      totalEnrolled: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.courses.push(newCourse);
    this.logAudit('admin', 'super_admin', 'COURSE_CREATED', 'course', newCourse.id, `Created course: ${newCourse.title}`);
    this.persist();
    return newCourse;
  }

  public updateCourse(id: string, updates: Partial<Course>): Course {
    const index = this.data.courses.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Course not found');
    const existing = this.data.courses[index];
    const updated: Course = {
      ...existing,
      ...updates,
      regularPrice: updates.regularPrice !== undefined ? roundCurrency(updates.regularPrice) : existing.regularPrice,
      salePrice: updates.salePrice !== undefined ? roundCurrency(updates.salePrice) : existing.salePrice,
      updatedAt: new Date().toISOString(),
    };
    this.data.courses[index] = updated;
    this.logAudit('admin', 'super_admin', 'COURSE_UPDATED', 'course', id, `Updated course: ${updated.title}`);
    this.persist();
    return updated;
  }

  public archiveCourse(id: string): Course {
    return this.updateCourse(id, { status: 'archived' });
  }

  public restoreCourse(id: string): Course {
    return this.updateCourse(id, { status: 'published' });
  }

  // --- Bots ---
  public getBots(): TelegramBot[] {
    return this.data.bots;
  }

  public getBotById(id: string): TelegramBot | undefined {
    return this.data.bots.find((b) => b.id === id);
  }

  public registerBot(params: {
    name: string;
    username: string;
    token: string;
    isPrimaryOwnerBot: boolean;
    resellerId: string | null;
  }): TelegramBot {
    const cleanUsername = params.username.replace('@', '').trim();
    const cleanToken = params.token.trim();

    if (!cleanToken.includes(':')) {
      throw new Error('Invalid Telegram Bot Token format. Must follow standard 123456:ABC-DEF...');
    }

    const botId = `bot-${Date.now()}`;
    const secret = `sec_${crypto.randomBytes(8).toString('hex')}`;
    const encrypted = encryptBotToken(cleanToken);
    const masked = maskToken(cleanToken);

    let resellerName: string | undefined;
    if (params.resellerId) {
      const reseller = this.getResellerById(params.resellerId);
      if (reseller) {
        resellerName = reseller.name;
        reseller.assignedBotId = botId;
        reseller.botUsername = cleanUsername;
      }
    }

    const newBot: TelegramBot = {
      id: botId,
      name: params.name,
      username: cleanUsername,
      tokenMasked: masked,
      tokenEncrypted: encrypted,
      isPrimaryOwnerBot: params.isPrimaryOwnerBot,
      resellerId: params.resellerId,
      resellerName,
      status: 'active',
      webhookUrl: `https://api.coursemania.com/api/telegram/webhook/${botId}`,
      webhookSecret: secret,
      lastWebhookPing: new Date().toISOString(),
      totalOrdersCount: 0,
      totalGrossSales: 0,
      createdAt: new Date().toISOString(),
    };

    this.data.bots.push(newBot);
    this.logAudit('admin', 'super_admin', 'BOT_REGISTERED', 'bot', botId, `Registered bot @${cleanUsername}`);
    this.persist();
    return newBot;
  }

  public toggleBotStatus(botId: string, status: 'active' | 'suspended'): TelegramBot {
    const bot = this.getBotById(botId);
    if (!bot) throw new Error('Bot not found');
    bot.status = status;
    this.logAudit('admin', 'super_admin', 'BOT_STATUS_CHANGED', 'bot', botId, `Set bot @${bot.username} to ${status}`);
    this.persist();
    return bot;
  }

  // --- Resellers ---
  public getResellers(): ResellerAccount[] {
    return this.data.resellers;
  }

  public getResellerById(id: string): ResellerAccount | undefined {
    return this.data.resellers.find((r) => r.id === id);
  }

  public createReseller(params: {
    name: string;
    phone: string;
    email: string;
    creditLimit: number;
    notes?: string;
  }): ResellerAccount {
    const id = `reseller-${Date.now()}`;
    const cleanLimit = roundCurrency(params.creditLimit);
    const newReseller: ResellerAccount = {
      id,
      name: params.name,
      phone: params.phone,
      email: params.email,
      assignedBotId: '',
      botUsername: '',
      creditLimit: cleanLimit,
      accruedOwnerShare: 0,
      verifiedResellerPayments: 0,
      approvedAdjustments: 0,
      outstandingBalance: 0,
      availableCredit: cleanLimit,
      status: 'active',
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };
    this.data.resellers.push(newReseller);
    this.logAudit('admin', 'super_admin', 'RESELLER_CREATED', 'reseller', id, `Onboarded reseller: ${params.name} with credit limit ৳${cleanLimit}`);
    this.persist();
    return newReseller;
  }

  public updateCreditLimit(resellerId: string, newLimit: number, notes?: string): ResellerAccount {
    const reseller = this.getResellerById(resellerId);
    if (!reseller) throw new Error('Reseller not found');

    const cleanLimit = roundCurrency(newLimit);
    const oldLimit = reseller.creditLimit;
    reseller.creditLimit = cleanLimit;

    // Recalculate status
    const status = calculateResellerCreditStatus({
      creditLimit: reseller.creditLimit,
      accruedOwnerShare: reseller.accruedOwnerShare,
      verifiedResellerPayments: reseller.verifiedResellerPayments,
      approvedAdjustments: reseller.approvedAdjustments,
    });

    reseller.outstandingBalance = status.outstandingBalance;
    reseller.availableCredit = status.availableCredit;

    // Add ledger entry
    this.data.ledger.unshift({
      id: `led-${Date.now()}`,
      resellerId,
      resellerName: reseller.name,
      botId: reseller.assignedBotId,
      type: 'CREDIT_LIMIT_CHANGE',
      grossAmount: 0,
      ownerShareDelta: 0,
      resellerPaymentDelta: 0,
      adjustmentDelta: 0,
      balanceAfter: reseller.outstandingBalance,
      reference: `Credit limit changed: ৳${oldLimit} -> ৳${cleanLimit}`,
      notes: notes || 'Credit limit updated by Super Admin',
      recordedBy: 'Super Admin',
      createdAt: new Date().toISOString(),
    });

    this.logAudit('admin', 'super_admin', 'CREDIT_LIMIT_UPDATED', 'reseller', resellerId, `Credit limit changed from ৳${oldLimit} to ৳${cleanLimit} for ${reseller.name}`);
    this.persist();
    return reseller;
  }

  public recordResellerPayment(params: {
    resellerId: string;
    amount: number;
    paymentMethod: PaymentMethod | 'cash';
    trxId: string;
    notes: string;
    recordedBy?: string;
  }): ResellerPaymentRecord {
    const reseller = this.getResellerById(params.resellerId);
    if (!reseller) throw new Error('Reseller not found');

    const cleanAmount = roundCurrency(params.amount);
    if (cleanAmount <= 0) throw new Error('Payment amount must be greater than zero');

    // 1. Update reseller running totals
    reseller.verifiedResellerPayments = roundCurrency(reseller.verifiedResellerPayments + cleanAmount);

    const creditStatus = calculateResellerCreditStatus({
      creditLimit: reseller.creditLimit,
      accruedOwnerShare: reseller.accruedOwnerShare,
      verifiedResellerPayments: reseller.verifiedResellerPayments,
      approvedAdjustments: reseller.approvedAdjustments,
    });

    reseller.outstandingBalance = creditStatus.outstandingBalance;
    reseller.availableCredit = creditStatus.availableCredit;

    // 2. Save payment record
    const paymentRecord: ResellerPaymentRecord = {
      id: `rp-${Date.now()}`,
      resellerId: params.resellerId,
      resellerName: reseller.name,
      amount: cleanAmount,
      paymentMethod: params.paymentMethod,
      trxId: params.trxId.trim(),
      notes: params.notes,
      recordedBy: params.recordedBy || 'Super Admin',
      createdAt: new Date().toISOString(),
    };
    this.data.resellerPayments.unshift(paymentRecord);

    // 3. Create immutable ledger entry
    this.data.ledger.unshift({
      id: `led-${Date.now()}`,
      resellerId: reseller.id,
      resellerName: reseller.name,
      botId: reseller.assignedBotId,
      type: 'RESELLER_PAYMENT',
      grossAmount: cleanAmount,
      ownerShareDelta: 0,
      resellerPaymentDelta: cleanAmount,
      adjustmentDelta: 0,
      balanceAfter: reseller.outstandingBalance,
      reference: `${params.paymentMethod.toUpperCase()} TrxID ${params.trxId}`,
      notes: params.notes,
      recordedBy: params.recordedBy || 'Super Admin',
      createdAt: new Date().toISOString(),
    });

    this.logAudit(
      'admin',
      'super_admin',
      'RESELLER_PAYMENT_VERIFIED',
      'ledger',
      paymentRecord.id,
      `Verified ৳${cleanAmount} from ${reseller.name} (${params.paymentMethod} ${params.trxId})`
    );

    this.persist();
    return paymentRecord;
  }

  // --- Orders & Fulfillments ---
  public getOrders(filter?: { resellerId?: string; botId?: string; status?: string; search?: string }): Order[] {
    let list = this.data.orders;
    if (filter?.resellerId) {
      list = list.filter((o) => o.resellerId === filter.resellerId);
    }
    if (filter?.botId) {
      list = list.filter((o) => o.botId === filter.botId);
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter((o) => o.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.courseTitle.toLowerCase().includes(q) ||
          (o.paymentTrxId && o.paymentTrxId.toLowerCase().includes(q))
      );
    }
    return list;
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id);
  }

  public createCustomerOrder(params: {
    botId: string;
    customerTelegramId: number | string;
    customerName: string;
    customerUsername?: string;
    customerPhone?: string;
    courseId: string;
  }): Order {
    const bot = this.getBotById(params.botId);
    if (!bot) throw new Error('Bot not found');
    if (bot.status !== 'active') throw new Error('This Telegram bot is currently suspended or inactive.');

    const course = this.getCourseById(params.courseId);
    if (!course) throw new Error('Course not found');
    if (course.status !== 'published') throw new Error('This course is not currently published for sale.');

    const price = course.isSaleActive ? course.salePrice : course.regularPrice;
    const { ownerShare, resellerShare } = calculate5050Split(price);

    // If order is through reseller, check credit allowance pre-check
    let resellerName: string | undefined;
    if (bot.resellerId) {
      const reseller = this.getResellerById(bot.resellerId);
      if (reseller) {
        resellerName = reseller.name;
        // Check if reseller has completely exhausted credit
        const check = checkOrderCreditEligibility(price, reseller.creditLimit, reseller.outstandingBalance);
        if (!check.allowed) {
          // As per specifications: "Provide a clear message explaining that the reseller's selling allowance has been exhausted."
          throw new Error(`Reseller selling quota temporarily exhausted. Please contact reseller admin or support.`);
        }
      }
    }

    const orderNumber = `CM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderNumber,
      botId: bot.id,
      botUsername: bot.username,
      resellerId: bot.resellerId,
      resellerName,
      customerTelegramId: params.customerTelegramId,
      customerName: params.customerName,
      customerUsername: params.customerUsername,
      customerPhone: params.customerPhone,
      courseId: course.id,
      courseTitle: course.title,
      unitPrice: course.regularPrice,
      salePrice: price,
      ownerShare,
      resellerShare,
      status: 'awaiting_payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.orders.unshift(newOrder);
    this.persist();
    return newOrder;
  }

  public submitPayment(params: {
    orderId: string;
    paymentMethod: PaymentMethod;
    trxId: string;
    senderNumber: string;
    screenshotNote?: string;
  }): Order {
    const order = this.getOrderById(params.orderId);
    if (!order) throw new Error('Order not found');

    const cleanTrx = params.trxId.trim();
    if (!cleanTrx || cleanTrx.length < 5) {
      throw new Error('Please enter a valid Transaction ID (at least 6 characters).');
    }

    // Check duplicate TrxID within active orders
    const duplicate = this.data.orders.find(
      (o) => o.id !== order.id && o.paymentTrxId && o.paymentTrxId.toUpperCase() === cleanTrx.toUpperCase()
    );
    if (duplicate) {
      throw new Error(`This Transaction ID (${cleanTrx}) has already been submitted for order ${duplicate.orderNumber}. Duplicate submissions are rejected.`);
    }

    order.paymentMethod = params.paymentMethod;
    order.paymentTrxId = cleanTrx.toUpperCase();
    order.paymentSenderNumber = params.senderNumber.trim();
    order.paymentScreenshotNote = params.screenshotNote;
    order.paymentSubmittedAt = new Date().toISOString();
    order.status = 'payment_pending_verification';
    order.updatedAt = new Date().toISOString();

    this.persist();
    return order;
  }

  public verifyCustomerPayment(orderId: string, verifiedBy = 'Super Admin'): Order {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status === 'fulfilled' || order.status === 'paid') {
      throw new Error('This order has already been verified and paid.');
    }

    const course = this.getCourseById(order.courseId);
    if (!course) throw new Error('Course reference not found');

    // Credit limit verification rule:
    // If order belongs to a reseller, check if reseller has available credit
    let isCreditLimitReached = false;
    if (order.resellerId) {
      const reseller = this.getResellerById(order.resellerId);
      if (reseller) {
        const check = checkOrderCreditEligibility(order.salePrice, reseller.creditLimit, reseller.outstandingBalance);
        if (!check.allowed) {
          isCreditLimitReached = true;
        }
      }
    }

    // If credit limit reached, put in 'paid_pending_fulfillment' as required:
    // "Place the order into a clear paid_pending_fulfillment or equivalent state and allow the Super Admin to fulfill, refund, or resolve it safely."
    if (isCreditLimitReached) {
      order.status = 'paid_pending_fulfillment';
      order.paymentVerifiedAt = new Date().toISOString();
      order.verifiedBy = verifiedBy;
      order.updatedAt = new Date().toISOString();
      this.logAudit(
        'admin',
        'super_admin',
        'PAYMENT_VERIFIED_CREDIT_HELD',
        'order',
        order.id,
        `Payment verified for ${order.orderNumber}, but held in paid_pending_fulfillment because reseller credit limit is exhausted.`
      );
      this.persist();
      return order;
    }

    // Otherwise, transition to 'paid' and accrue 50/50 owner receivable to the ledger
    order.paymentVerifiedAt = new Date().toISOString();
    order.verifiedBy = verifiedBy;
    order.status = 'paid';
    order.updatedAt = new Date().toISOString();

    // Accrue owner share in ledger and update reseller balance
    if (order.resellerId) {
      const reseller = this.getResellerById(order.resellerId);
      if (reseller) {
        reseller.accruedOwnerShare = roundCurrency(reseller.accruedOwnerShare + order.ownerShare);
        const creditStatus = calculateResellerCreditStatus({
          creditLimit: reseller.creditLimit,
          accruedOwnerShare: reseller.accruedOwnerShare,
          verifiedResellerPayments: reseller.verifiedResellerPayments,
          approvedAdjustments: reseller.approvedAdjustments,
        });
        reseller.outstandingBalance = creditStatus.outstandingBalance;
        reseller.availableCredit = creditStatus.availableCredit;

        // Record in ledger
        this.data.ledger.unshift({
          id: `led-${Date.now()}`,
          resellerId: reseller.id,
          resellerName: reseller.name,
          botId: order.botId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: 'SALE_ACCRUAL',
          grossAmount: order.salePrice,
          ownerShareDelta: order.ownerShare,
          resellerPaymentDelta: 0,
          adjustmentDelta: 0,
          balanceAfter: reseller.outstandingBalance,
          reference: `${order.orderNumber} customer payment verified`,
          notes: `50% owner share (৳${order.ownerShare}) accrued upon order approval`,
          recordedBy: verifiedBy,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Update bot sales stats
    const bot = this.getBotById(order.botId);
    if (bot) {
      bot.totalOrdersCount += 1;
      bot.totalGrossSales = roundCurrency(bot.totalGrossSales + order.salePrice);
    }
    course.totalEnrolled += 1;

    // Auto fulfill if enabled
    if (this.data.settings.autoFulfillOnVerification) {
      this.fulfillOrder(order.id, course.deliveryPayload);
    }

    this.persist();
    return order;
  }

  public fulfillOrder(orderId: string, customPayload?: string): Order {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');
    const course = this.getCourseById(order.courseId);
    if (!course) throw new Error('Course not found');

    const payload = customPayload || course.deliveryPayload;

    order.status = 'fulfilled';
    order.fulfillmentDetails = {
      method: course.deliveryMethod,
      inviteLink: payload,
      instructions: 'কোর্সের প্রাইভেট চ্যানেলে যুক্ত হয়ে প্রথম পিন করা মেসেজটি চেক করুন। কোনো প্রয়োজনে সাপোর্ট বটে মেসেজ দিন।',
      deliveredAt: new Date().toISOString(),
    };
    order.updatedAt = new Date().toISOString();

    this.logAudit(
      'admin',
      'super_admin',
      'ORDER_FULFILLED',
      'order',
      order.id,
      `Fulfilled order ${order.orderNumber} for ${order.customerName}`
    );

    this.persist();
    return order;
  }

  public rejectPayment(orderId: string, reason: string): Order {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');
    order.status = 'cancelled';
    order.rejectionReason = reason;
    order.updatedAt = new Date().toISOString();
    this.logAudit('admin', 'super_admin', 'PAYMENT_REJECTED', 'order', order.id, `Payment rejected for ${order.orderNumber}: ${reason}`);
    this.persist();
    return order;
  }

  public refundOrder(orderId: string, reason: string): Order {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');
    if (order.status !== 'fulfilled' && order.status !== 'paid') {
      throw new Error('Only paid or fulfilled orders can be refunded');
    }

    order.status = 'refunded';
    order.refundReason = reason;
    order.refundedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    // Reversal in ledger for reseller
    if (order.resellerId) {
      const reseller = this.getResellerById(order.resellerId);
      if (reseller) {
        // Reverse owner share
        reseller.accruedOwnerShare = roundCurrency(Math.max(0, reseller.accruedOwnerShare - order.ownerShare));
        const creditStatus = calculateResellerCreditStatus({
          creditLimit: reseller.creditLimit,
          accruedOwnerShare: reseller.accruedOwnerShare,
          verifiedResellerPayments: reseller.verifiedResellerPayments,
          approvedAdjustments: reseller.approvedAdjustments,
        });
        reseller.outstandingBalance = creditStatus.outstandingBalance;
        reseller.availableCredit = creditStatus.availableCredit;

        this.data.ledger.unshift({
          id: `led-${Date.now()}`,
          resellerId: reseller.id,
          resellerName: reseller.name,
          botId: order.botId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: 'SALE_REFUND',
          grossAmount: -order.salePrice,
          ownerShareDelta: -order.ownerShare,
          resellerPaymentDelta: 0,
          adjustmentDelta: 0,
          balanceAfter: reseller.outstandingBalance,
          reference: `Refund for ${order.orderNumber}`,
          notes: reason || 'Customer requested refund',
          recordedBy: 'Super Admin',
          createdAt: new Date().toISOString(),
        });
      }
    }

    this.logAudit('admin', 'super_admin', 'ORDER_REFUNDED', 'order', order.id, `Refunded ${order.orderNumber}: ${reason}`);
    this.persist();
    return order;
  }

  // --- Financial Statistics & Reports ---
  public getSuperAdminStats() {
    const orders = this.data.orders.filter((o) => o.status === 'fulfilled' || o.status === 'paid');
    const grossSales = roundCurrency(orders.reduce((sum, o) => sum + o.salePrice, 0));
    const totalOrders = orders.length;

    const totalOwnerAccrued = roundCurrency(
      this.data.resellers.reduce((sum, r) => sum + r.accruedOwnerShare, 0) +
        orders.filter((o) => !o.resellerId).reduce((sum, o) => sum + o.salePrice, 0)
    );

    const totalVerifiedPaymentsFromResellers = roundCurrency(
      this.data.resellers.reduce((sum, r) => sum + r.verifiedResellerPayments, 0)
    );

    const totalOutstandingBalanceAcrossResellers = roundCurrency(
      this.data.resellers.reduce((sum, r) => sum + r.outstandingBalance, 0)
    );

    const pendingOrdersCount = this.data.orders.filter(
      (o) => o.status === 'payment_pending_verification' || o.status === 'paid_pending_fulfillment'
    ).length;

    return {
      grossSales,
      totalOrders,
      totalOwnerAccrued,
      totalVerifiedPaymentsFromResellers,
      totalOutstandingBalanceAcrossResellers,
      pendingOrdersCount,
      activeBotsCount: this.data.bots.filter((b) => b.status === 'active').length,
      resellersCount: this.data.resellers.length,
      publishedCoursesCount: this.data.courses.filter((c) => c.status === 'published').length,
    };
  }

  public getResellerStats(resellerId: string) {
    const reseller = this.getResellerById(resellerId);
    if (!reseller) throw new Error('Reseller not found');

    const orders = this.data.orders.filter((o) => o.resellerId === resellerId);
    const successfulOrders = orders.filter((o) => o.status === 'fulfilled' || o.status === 'paid');
    const grossSales = roundCurrency(successfulOrders.reduce((sum, o) => sum + o.salePrice, 0));

    const creditStatus = calculateResellerCreditStatus({
      creditLimit: reseller.creditLimit,
      accruedOwnerShare: reseller.accruedOwnerShare,
      verifiedResellerPayments: reseller.verifiedResellerPayments,
      approvedAdjustments: reseller.approvedAdjustments,
    });

    const pendingOrdersCount = orders.filter(
      (o) => o.status === 'payment_pending_verification' || o.status === 'paid_pending_fulfillment'
    ).length;

    return {
      reseller,
      grossSales,
      successfulOrdersCount: successfulOrders.length,
      totalOrdersCount: orders.length,
      ownerAccruedShare: roundCurrency(grossSales * 0.5),
      resellerAccruedShare: roundCurrency(grossSales * 0.5),
      verifiedPaymentsToOwner: reseller.verifiedResellerPayments,
      outstandingBalance: creditStatus.outstandingBalance,
      creditLimit: reseller.creditLimit,
      availableCredit: creditStatus.availableCredit,
      isCreditExhausted: creditStatus.isCreditExhausted,
      pendingOrdersCount,
    };
  }

  public getLedger(filter?: { resellerId?: string }): LedgerEntry[] {
    if (filter?.resellerId) {
      return this.data.ledger.filter((l) => l.resellerId === filter.resellerId);
    }
    return this.data.ledger;
  }

  public getResellerPayments(filter?: { resellerId?: string }): ResellerPaymentRecord[] {
    if (filter?.resellerId) {
      return this.data.resellerPayments.filter((p) => p.resellerId === filter.resellerId);
    }
    return this.data.resellerPayments;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public getSettings(): PlatformSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<PlatformSettings>): PlatformSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.persist();
    return this.data.settings;
  }
}

export const db = new Database();
