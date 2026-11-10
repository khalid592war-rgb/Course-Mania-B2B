import { db } from './database';
import { Course, Order, PaymentMethod } from './types';

export interface TelegramButton {
  text: string;
  callback_data: string;
  url?: string;
}

export interface TelegramBotResponse {
  botId: string;
  chatId: number | string;
  text: string;
  photoUrl?: string;
  buttons?: TelegramButton[][];
  order?: Order;
}

export class TelegramEngine {
  /**
   * Processes an incoming message or callback query for a specific bot.
   */
  public handleIncoming(params: {
    botId: string;
    chatId: number | string;
    fromName: string;
    fromUsername?: string;
    text?: string;
    callbackData?: string;
    lang?: 'bn' | 'en';
  }): TelegramBotResponse {
    const { botId, chatId, fromName, fromUsername, callbackData } = params;
    const text = (params.text || '').trim();
    const lang = params.lang || 'bn';

    const bot = db.getBotById(botId);
    if (!bot) {
      return {
        botId,
        chatId,
        text: '⚠️ বট কনফিগারেশন পাওয়া যায়নি। এডমিনের সাথে যোগাযোগ করুন। (Bot not found).',
      };
    }

    if (bot.status !== 'active') {
      return {
        botId,
        chatId,
        text: `⚠️ **${bot.name}** বর্তমানে সাময়িকভাবে বন্ধ আছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা সাপোর্ট টিমে যোগাযোগ করুন।`,
      };
    }

    // 1. Handle Callback Queries (Button Clicks)
    if (callbackData) {
      return this.handleCallback({ botId, chatId, fromName, fromUsername, callbackData, lang });
    }

    // 2. Handle Text Commands
    if (text.startsWith('/start')) {
      return this.renderWelcomeMessage(botId, chatId, fromName, lang);
    }

    if (text.startsWith('/courses') || text === '📚 সকল কোর্স' || text === '📚 All Courses') {
      return this.renderCoursesList(botId, chatId, lang);
    }

    if (text.startsWith('/categories') || text === '🏷️ ক্যাটাগরি' || text === '🏷️ Categories') {
      return this.renderCategories(botId, chatId, lang);
    }

    if (text.startsWith('/mycourses') || text === '🎓 আমার কোর্সসমূহ' || text === '🎓 My Courses') {
      return this.renderMyCourses(botId, chatId, lang);
    }

    if (text.startsWith('/orders') || text === '📦 অর্ডার হিস্ট্রি' || text === '📦 My Orders') {
      return this.renderMyOrders(botId, chatId, lang);
    }

    if (text.startsWith('/support') || text === '💬 সাপোর্ট ও হেল্প' || text === '💬 Support') {
      return this.renderSupport(botId, chatId, lang);
    }

    // Check if text is a search query
    if (text.startsWith('/search') || text.length > 2) {
      const query = text.replace('/search', '').trim();
      const results = db.getCourses({ status: 'published', search: query });
      if (results.length > 0) {
        return this.renderSearchResults(botId, chatId, query, results, lang);
      }
    }

    // Default fallback: show main menu
    return this.renderWelcomeMessage(botId, chatId, fromName, lang);
  }

  private renderWelcomeMessage(botId: string, chatId: number | string, fromName: string, lang: 'bn' | 'en'): TelegramBotResponse {
    const bot = db.getBotById(botId);
    const botName = bot?.name || 'Course Mania';

    const bnText = `🎓 **স্বাগতম, ${fromName}!**\n\n**${botName}**-এ আপনাকে স্বাগতম। এখানে আপনি দেশের সেরা সব আইটি, প্রোগ্রামিং ও ফ্রিল্যান্সিং স্কিল ডেভেলপমেন্ট কোর্স সবচেয়ে সাশ্রয়ী মূল্যে পাবেন।\n\n📌 **নিচের বাটনগুলো চেপে যা করতে চান সিলেক্ট করুন:**`;
    const enText = `🎓 **Welcome, ${fromName}!**\n\nWelcome to **${botName}**. Discover premium IT, Programming, Freelancing, and Professional Skills courses at unbeatable prices.\n\n📌 **Choose an option below to get started:**`;

    return {
      botId,
      chatId,
      text: lang === 'bn' ? bnText : enText,
      buttons: [
        [
          { text: lang === 'bn' ? '📚 সকল কোর্স দেখুন' : '📚 Browse All Courses', callback_data: 'browse_all' },
          { text: lang === 'bn' ? '🏷️ ক্যাটাগরি' : '🏷️ Categories', callback_data: 'view_categories' },
        ],
        [
          { text: lang === 'bn' ? '🎓 আমার কোর্সসমূহ' : '🎓 My Enrolled Courses', callback_data: 'my_courses' },
          { text: lang === 'bn' ? '📦 অর্ডার স্ট্যাটাস' : '📦 Order Status', callback_data: 'my_orders' },
        ],
        [
          { text: lang === 'bn' ? '💬 হেল্প ও সাপোর্ট' : '💬 Help & Support', callback_data: 'support' },
          { text: lang === 'bn' ? '🌐 Language: English' : '🌐 ভাষা: বাংলা', callback_data: lang === 'bn' ? 'lang:en' : 'lang:bn' },
        ],
      ],
    };
  }

  private renderCoursesList(botId: string, chatId: number | string, lang: 'bn' | 'en', category?: string): TelegramBotResponse {
    const courses = db.getCourses({ status: 'published', category });
    const catLabel = category ? ` (${category})` : '';

    if (courses.length === 0) {
      return {
        botId,
        chatId,
        text: lang === 'bn' ? '⚠️ দুঃখিত, এই ক্যাটাগরিতে কোনো কোর্স পাওয়া যায়নি।' : '⚠️ No courses found in this category.',
        buttons: [[{ text: '🔙 ফিরে যান', callback_data: 'browse_all' }]],
      };
    }

    const title = lang === 'bn' ? `📚 **উপলব্ধ কোর্স তালিকা${catLabel}:**` : `📚 **Available Courses${catLabel}:**`;
    const intro = lang === 'bn'
      ? 'কোর্সের বিস্তারিত তথ্য ও ভর্তির জন্য কোর্সের নামের বাটনে ক্লিক করুন:'
      : 'Click any course below to view syllabus, preview and enroll:';

    const buttons: TelegramButton[][] = courses.map((c) => {
      const priceText = c.isSaleActive ? `৳${c.salePrice} (মূল্যছাড়!)` : `৳${c.regularPrice}`;
      return [
        {
          text: `${lang === 'bn' ? c.titleBn : c.title} - ${priceText}`,
          callback_data: `view_course:${c.id}`,
        },
      ];
    });

    buttons.push([
      { text: lang === 'bn' ? '🏷️ ক্যাটাগরি অনুযায়ী ফিল্টার' : '🏷️ Filter by Category', callback_data: 'view_categories' },
      { text: lang === 'bn' ? '🏠 মূল মেন্যু' : '🏠 Main Menu', callback_data: 'menu_start' },
    ]);

    return {
      botId,
      chatId,
      text: `${title}\n\n${intro}`,
      buttons,
    };
  }

  private renderCategories(botId: string, chatId: number | string, lang: 'bn' | 'en'): TelegramBotResponse {
    const courses = db.getCourses({ status: 'published' });
    const categories = Array.from(new Set(courses.map((c) => c.category)));

    const buttons: TelegramButton[][] = categories.map((cat) => [
      { text: `📁 ${cat}`, callback_data: `cat_filter:${cat}` },
    ]);
    buttons.push([
      { text: lang === 'bn' ? '📚 সকল কোর্স' : '📚 All Courses', callback_data: 'browse_all' },
      { text: lang === 'bn' ? '🏠 মূল মেন্যু' : '🏠 Main Menu', callback_data: 'menu_start' },
    ]);

    return {
      botId,
      chatId,
      text: lang === 'bn' ? '🏷️ **পছন্দের ক্যাটাগরি বেছে নিন:**' : '🏷️ **Select a Category:**',
      buttons,
    };
  }

  private renderCourseDetail(botId: string, chatId: number | string, courseId: string, lang: 'bn' | 'en'): TelegramBotResponse {
    const course = db.getCourseById(courseId);
    if (!course) {
      return {
        botId,
        chatId,
        text: '⚠️ কোর্সটি পাওয়া যায়নি।',
        buttons: [[{ text: '🔙 কোর্স তালিকা', callback_data: 'browse_all' }]],
      };
    }

    const title = lang === 'bn' ? course.titleBn : course.title;
    const desc = lang === 'bn' ? course.descriptionBn : course.description;
    const priceText = course.isSaleActive
      ? `🔥 অফার মূল্য: **৳${course.salePrice}** (আসল মূল্য: ~৳${course.regularPrice}~)`
      : `💰 কোর্স ফি: **৳${course.regularPrice}**`;

    const featuresList = course.features.map((f) => `  ✓ ${f}`).join('\n');

    const text = `📖 **${title}**\n📂 ক্যাটাগরি: *${course.category}*\n\n${desc}\n\n✨ **ফিচারসমূহ:**\n${featuresList}\n\n${priceText}\n\n📥 ডেলিভারি মাধ্যম: **টেলিগ্রাম ভিআইপি চ্যানেল ও ড্রাইভ লিঙ্ক**\n\nনিচের বাটনে ক্লিক করে এখনই অর্ডার করুন এবং ইনস্ট্যান্ট অ্যাক্সেস নিন:`;

    return {
      botId,
      chatId,
      photoUrl: course.thumbnailUrl,
      text,
      buttons: [
        [{ text: `🛒 ভর্তি হোন (${course.isSaleActive ? '৳' + course.salePrice : '৳' + course.regularPrice})`, callback_data: `order:${course.id}` }],
        [
          { text: '📚 অন্যান্য কোর্স', callback_data: 'browse_all' },
          { text: '🏠 মূল মেন্যু', callback_data: 'menu_start' },
        ],
      ],
    };
  }

  private handleCreateOrder(
    botId: string,
    chatId: number | string,
    fromName: string,
    fromUsername: string | undefined,
    courseId: string,
    lang: 'bn' | 'en'
  ): TelegramBotResponse {
    try {
      const order = db.createCustomerOrder({
        botId,
        customerTelegramId: chatId,
        customerName: fromName,
        customerUsername: fromUsername,
        courseId,
      });

      const settings = db.getSettings();
      const p = settings.manualPaymentInstructions;

      const message = `🧾 **অর্ডার তৈরি সম্পন্ন হয়েছে!**\n\n🔖 অর্ডার নম্বর: **${order.orderNumber}**\n📚 কোর্স: **${order.courseTitle}**\n💰 প্রদেয় মোট টাকা: **৳${order.salePrice}**\n\n📌 **পেমেন্ট করার নিয়ম:**\nনিচের যেকোনো মাধ্যমে ৳${order.salePrice} সেন্ড মানি বা পেমেন্ট করে TrxID সাবমিট করুন:\n\n📱 **বিকাশ (bKash ${p.bkash.type}):** \`${p.bkash.number}\`\n📱 **নগদ (Nagad ${p.nagad.type}):** \`${p.nagad.number}\`\n📱 **রকেট (Rocket ${p.rocket.type}):** \`${p.rocket.number}\`\n\nপেমেন্ট পাঠানোর পর নিচের বাটন চেপে আপনার পেমেন্ট মাধ্যম সিলেক্ট করে ট্রানজেকশন আইডি দিন:`;

      return {
        botId,
        chatId,
        text: message,
        order,
        buttons: [
          [
            { text: '📱 bKash পেমেন্ট দিয়েছি', callback_data: `pay_opt:${order.id}:bkash` },
            { text: '📱 Nagad পেমেন্ট দিয়েছি', callback_data: `pay_opt:${order.id}:nagad` },
          ],
          [
            { text: '📱 Rocket পেমেন্ট দিয়েছি', callback_data: `pay_opt:${order.id}:rocket` },
            { text: '🏛️ Bank Transfer', callback_data: `pay_opt:${order.id}:bank_transfer` },
          ],
          [{ text: '❌ অর্ডার বাতিল করুন', callback_data: `cancel_order:${order.id}` }],
        ],
      };
    } catch (err: any) {
      return {
        botId,
        chatId,
        text: `⚠️ **অর্ডার নেওয়া সম্ভব হচ্ছে না:**\n${err.message || 'Error creating order.'}`,
        buttons: [[{ text: '💬 সাপোর্টে কথা বলুন', callback_data: 'support' }]],
      };
    }
  }

  private renderPaymentMethodPrompt(
    botId: string,
    chatId: number | string,
    orderId: string,
    method: PaymentMethod
  ): TelegramBotResponse {
    const order = db.getOrderById(orderId);
    if (!order) {
      return { botId, chatId, text: '⚠️ অর্ডার পাওয়া যায়নি।' };
    }

    const settings = db.getSettings();
    const methodName = method === 'bkash' ? 'bKash' : method === 'nagad' ? 'Nagad' : method === 'rocket' ? 'Rocket' : 'Bank';
    const num =
      method === 'bkash'
        ? settings.manualPaymentInstructions.bkash.number
        : method === 'nagad'
        ? settings.manualPaymentInstructions.nagad.number
        : settings.manualPaymentInstructions.rocket.number;

    const text = `💳 **${methodName} পেমেন্ট সাবমিশন**\n\n🔖 অর্ডার: **${order.orderNumber}**\n💰 প্রদেয় টাকা: **৳${order.salePrice}**\n📞 নম্বর: \`${num}\`\n\nঅনুগ্রহ করে নিচে আপনার ট্রানজেকশন আইডি (TrxID) এবং যে নম্বর থেকে টাকা পাঠিয়েছেন তা সাবমিট করুন।`;

    return {
      botId,
      chatId,
      text,
      order,
      buttons: [
        [{ text: `✅ TrxID সাবমিট করুন (অর্ডার #${order.orderNumber})`, callback_data: `submit_trx_modal:${order.id}:${method}` }],
        [{ text: '🔙 পেমেন্ট মাধ্যম পরিবর্তন', callback_data: `order:${order.courseId}` }],
      ],
    };
  }

  private renderMyCourses(botId: string, chatId: number | string, lang: 'bn' | 'en'): TelegramBotResponse {
    const orders = db.getOrders({ botId }).filter((o) => String(o.customerTelegramId) === String(chatId) && o.status === 'fulfilled');

    if (orders.length === 0) {
      return {
        botId,
        chatId,
        text: lang === 'bn'
          ? '🎓 আপনি এখনও কোনো কোর্সে ভর্তি হননি বা আপনার পেমেন্ট ভেরিফিকেশন প্রক্রিয়াধীন রয়েছে।'
          : "🎓 You haven't enrolled in any courses yet or your order verification is in progress.",
        buttons: [
          [{ text: '📚 কোর্স ব্রাউজ করুন', callback_data: 'browse_all' }],
          [{ text: '📦 পেন্ডিং অর্ডার স্ট্যাটাস', callback_data: 'my_orders' }],
        ],
      };
    }

    let text = `🎓 **আপনার সচল কোর্সসমূহ (${orders.length}টি):**\n\n`;
    const buttons: TelegramButton[][] = [];

    orders.forEach((o, idx) => {
      text += `${idx + 1}. **${o.courseTitle}**\n`;
      text += `   📅 ভর্তির তারিখ: ${o.paymentVerifiedAt ? o.paymentVerifiedAt.slice(0, 10) : o.createdAt.slice(0, 10)}\n`;
      if (o.fulfillmentDetails?.inviteLink) {
        text += `   🔗 অ্যাক্সেস লিঙ্ক: ${o.fulfillmentDetails.inviteLink}\n\n`;
        buttons.push([
          { text: `🚀 জয়েন করুন: ${o.courseTitle.slice(0, 22)}...`, url: o.fulfillmentDetails.inviteLink, callback_data: `open_course:${o.id}` },
        ]);
      }
    });

    buttons.push([{ text: '🏠 মূল মেন্যু', callback_data: 'menu_start' }]);

    return { botId, chatId, text, buttons };
  }

  private renderMyOrders(botId: string, chatId: number | string, lang: 'bn' | 'en'): TelegramBotResponse {
    const orders = db.getOrders({ botId }).filter((o) => String(o.customerTelegramId) === String(chatId));

    if (orders.length === 0) {
      return {
        botId,
        chatId,
        text: '📦 আপনার কোনো পূর্ববর্তী অর্ডার রেকর্ড পাওয়া যায়নি।',
        buttons: [[{ text: '📚 নতুন কোর্স দেখুন', callback_data: 'browse_all' }]],
      };
    }

    let text = `📦 **আপনার অর্ডার হিস্ট্রি:**\n\n`;
    orders.slice(0, 5).forEach((o) => {
      const statusIcon =
        o.status === 'fulfilled'
          ? '✅ সফল'
          : o.status === 'paid'
          ? '🟢 পরিশোধিত'
          : o.status === 'payment_pending_verification'
          ? '⏳ ভেরিফিকেশন পেন্ডিং'
          : o.status === 'awaiting_payment'
          ? '⚠️ পেমেন্ট বাকি'
          : o.status === 'refunded'
          ? '↩️ রিফান্ডেড'
          : '❌ বাতিল';

      text += `🔖 **অর্ডার #${o.orderNumber}** - ${o.courseTitle}\n`;
      text += `💰 মূল্য: ৳${o.salePrice} | স্ট্যাটাস: ${statusIcon}\n`;
      if (o.paymentTrxId) text += `💳 TrxID: \`${o.paymentTrxId}\` (${o.paymentMethod || 'Manual'})\n`;
      text += `📅 তারিখ: ${o.createdAt.slice(0, 16).replace('T', ' ')}\n\n`;
    });

    return {
      botId,
      chatId,
      text,
      buttons: [
        [{ text: '🎓 আমার সচল কোর্সসমূহ', callback_data: 'my_courses' }],
        [{ text: '🏠 মূল মেন্যু', callback_data: 'menu_start' }],
      ],
    };
  }

  private renderSupport(botId: string, chatId: number | string, lang: 'bn' | 'en'): TelegramBotResponse {
    const settings = db.getSettings();
    const text = `💬 **কোর্স ম্যানিয়া হেল্প ও সাপোর্ট**\n\nকোর্স সংক্রান্ত যেকোনো জিজ্ঞাসা, পেমেন্ট সংক্রান্ত জটিলতা অথবা কাস্টমার কেয়ারের সাথে কথা বলতে সরাসরি যোগাযোগ করুন:\n\n📱 টেলিগ্রাম সাপোর্ট: ${settings.ownerSupportTelegram}\n📞 হটলাইন: ${settings.ownerSupportPhone}\n⏰ সাপোর্ট সময়: সকাল ১০:০০ - রাত ১১:০০\n\nআমরা আপনাকে দ্রুততম সময়ে সহায়তা করতে প্রতিশ্রুতিবদ্ধ!`;

    return {
      botId,
      chatId,
      text,
      buttons: [
        [{ text: '📚 কোর্স তালিকা', callback_data: 'browse_all' }],
        [{ text: '🏠 মূল মেন্যু', callback_data: 'menu_start' }],
      ],
    };
  }

  private renderSearchResults(
    botId: string,
    chatId: number | string,
    query: string,
    results: Course[],
    lang: 'bn' | 'en'
  ): TelegramBotResponse {
    const text = `🔍 **"${query}" এর জন্য সার্চ রেজাল্ট (${results.length}টি):**\n\nপছন্দের কোর্সের বিস্তারিত দেখতে নিচে ক্লিক করুন:`;
    const buttons: TelegramButton[][] = results.map((c) => [
      { text: `${c.titleBn} (৳${c.isSaleActive ? c.salePrice : c.regularPrice})`, callback_data: `view_course:${c.id}` },
    ]);
    buttons.push([{ text: '🔙 সকল কোর্স', callback_data: 'browse_all' }]);

    return { botId, chatId, text, buttons };
  }

  private handleCallback(params: {
    botId: string;
    chatId: number | string;
    fromName: string;
    fromUsername?: string;
    callbackData: string;
    lang: 'bn' | 'en';
  }): TelegramBotResponse {
    const { botId, chatId, fromName, fromUsername, callbackData, lang } = params;

    if (callbackData === 'menu_start') {
      return this.renderWelcomeMessage(botId, chatId, fromName, lang);
    }
    if (callbackData === 'browse_all') {
      return this.renderCoursesList(botId, chatId, lang);
    }
    if (callbackData === 'view_categories') {
      return this.renderCategories(botId, chatId, lang);
    }
    if (callbackData.startsWith('cat_filter:')) {
      const cat = callbackData.replace('cat_filter:', '');
      return this.renderCoursesList(botId, chatId, lang, cat);
    }
    if (callbackData.startsWith('view_course:')) {
      const courseId = callbackData.replace('view_course:', '');
      return this.renderCourseDetail(botId, chatId, courseId, lang);
    }
    if (callbackData.startsWith('order:')) {
      const courseId = callbackData.replace('order:', '');
      return this.handleCreateOrder(botId, chatId, fromName, fromUsername, courseId, lang);
    }
    if (callbackData.startsWith('pay_opt:')) {
      const parts = callbackData.split(':');
      const orderId = parts[1];
      const method = parts[2] as PaymentMethod;
      return this.renderPaymentMethodPrompt(botId, chatId, orderId, method);
    }
    if (callbackData === 'my_courses') {
      return this.renderMyCourses(botId, chatId, lang);
    }
    if (callbackData === 'my_orders') {
      return this.renderMyOrders(botId, chatId, lang);
    }
    if (callbackData === 'support') {
      return this.renderSupport(botId, chatId, lang);
    }
    if (callbackData.startsWith('lang:')) {
      const newLang = callbackData.replace('lang:', '') as 'bn' | 'en';
      return this.renderWelcomeMessage(botId, chatId, fromName, newLang);
    }

    return this.renderWelcomeMessage(botId, chatId, fromName, lang);
  }
}

export const telegramEngine = new TelegramEngine();
