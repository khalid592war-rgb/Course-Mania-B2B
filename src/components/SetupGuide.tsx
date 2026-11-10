import React, { useState } from 'react';
import {
  Smartphone,
  Server,
  Bot,
  Copy,
  Check,
  Shield,
  Terminal,
  Database,
  HelpCircle,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export const SetupGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              কোর্স ম্যানিয়া সেটআপ ও ডেপ্লয়মেন্ট গাইড (Beginner & Mobile Friendly)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              অ্যান্ড্রয়েড ফোন এবং উবুন্টু ক্লাউড সার্ভারে (VPS) বটের সফল সেটআপের সম্পূর্ণ নির্দেশিকা
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Android Mobile vs Server Clarification */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-base">
          <Smartphone className="w-5 h-5" />
          <h2>১. মোবাইল ফোন ব্যবহারকারীদের জন্য গুরুত্বপূর্ণ স্পষ্টীকরণ</h2>
        </div>
        <div className="text-xs sm:text-sm text-slate-300 space-y-2 leading-relaxed bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
          <p>
            💡 <strong>আপনার জানা জরুরি:</strong> টেলিগ্রাম বট ২৪ ঘণ্টা সচল রাখার জন্য আপনার মোবাইল ফোন সবসময় ইন্টারনেটে অন রাখার কোনো প্রয়োজন নেই!
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
            <li>
              <strong>অ্যান্ড্রয়েড মোবাইল দিয়ে আপনি যা যা করবেন:</strong> ব্রাউজার (Chrome) দিয়ে এই Super Admin ড্যাশবোর্ডে লগইন করে কোর্স যোগ করবেন, রিসেলারের বট অনবোর্ড করবেন, কাস্টমারের পেমেন্ট TrxID চেক করে এক ক্লিকে অনুমোদন দেবেন এবং টেলিগ্রামে বট ব্যবহার করবেন।
            </li>
            <li>
              <strong>সার্ভার যা করবে:</strong> একটি সাশ্রয়ী উবুন্টু VPS সার্ভার (যেমন $4/month Hetzner বা DigitalOcean) ব্যাকগ্রাউন্ডে সবসময় স্বয়ংক্রিয়ভাবে বট ও ডাটাবেজ সচল রাখবে।
            </li>
          </ul>
        </div>
      </div>

      {/* Section 2: Step-by-Step BotFather Guide */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 text-sky-400 font-bold text-base">
          <Bot className="w-5 h-5" />
          <h2>২. টেলিগ্রাম বট তৈরির নিয়ম (BotFather Onboarding)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
            <h4 className="font-bold text-white text-sm">ধাপ ১: ওনার বট তৈরি</h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
              <li>আপনার টেলিগ্রাম অ্যাপ খুলে সার্চ করুন: <strong className="text-sky-300">@BotFather</strong></li>
              <li>বটে গিয়ে <strong className="font-mono text-amber-300">/newbot</strong> কমান্ড দিন।</li>
              <li>বটের ডিসপ্লে নাম দিন (যেমন: Course Mania Official)।</li>
              <li>একটি ইউজারনেম দিন যার শেষে bot থাকবে (যেমন: CourseManiaOfficialBot)।</li>
              <li>BotFather আপনাকে একটি <strong>HTTP API Token</strong> দেবে।</li>
            </ol>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
            <h4 className="font-bold text-white text-sm">ধাপ ২: রিসেলারদের বট অনবোর্ড করা</h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
              <li>রিসেলার তার নিজের টেলিগ্রাম থেকে @BotFather এ গিয়ে নতুন বট বানাবেন।</li>
              <li>রিসেলার সেই বটের API টোকেনটি আপনাকে ইনবক্সে পাঠাবেন।</li>
              <li>আপনি সুপার এডমিন প্যানেলে <strong>"নতুন বট যুক্ত করুন"</strong> বাটনে ক্লিক করে টোকেন ও ক্রেডিট লিমিট সেট করবেন।</li>
              <li>বট স্বয়ংক্রিয়ভাবে সক্রিয় হয়ে সেন্ট্রাল কোর্স ক্যাটালগ বিক্রি শুরু করবে!</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Section 3: Ubuntu VPS Deployment with Docker */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-base">
          <Server className="w-5 h-5" />
          <h2>৩. উবুন্টু VPS সার্ভারে এক-ক্লিকে ডেপ্লয়মেন্ট কমান্ড</h2>
        </div>
        <p className="text-xs text-slate-400">
          আপনার মোবাইলে Termius বা Juicessh অ্যাপ ইনস্টল করে অথবা কম্পিউটার থেকে নিচের কমান্ডগুলো ক্রমানুসারে কপি করে পেস্ট করুন:
        </p>

        {/* Command 1 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>১. ডকার ও প্রয়োজনীয় টুলস ইনস্টল করুন:</span>
            <button
              onClick={() =>
                copyCode(
                  'c1',
                  'sudo apt update && sudo apt install -y curl git docker.io docker-compose'
                )
              }
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              {copiedIndex === 'c1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 'c1' ? 'কপি হয়েছে' : 'কমান্ড কপি করুন'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
            sudo apt update && sudo apt install -y curl git docker.io docker-compose
          </pre>
        </div>

        {/* Command 2 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>২. প্রজেক্ট রিপোজিটরি ক্লোন করুন ও ফোল্ডারে যান:</span>
            <button
              onClick={() =>
                copyCode(
                  'c2',
                  'git clone https://github.com/your-username/course-mania.git\ncd course-mania'
                )
              }
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              {copiedIndex === 'c2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 'c2' ? 'কপি হয়েছে' : 'কমান্ড কপি করুন'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
            git clone https://github.com/your-username/course-mania.git{'\n'}cd course-mania
          </pre>
        </div>

        {/* Command 3 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>৩. ডকার কম্পোজ দিয়ে ব্যাকগ্রাউন্ডে সার্ভার ও ডাটাবেজ চালু করুন:</span>
            <button
              onClick={() => copyCode('c3', 'docker-compose up -d --build')}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              {copiedIndex === 'c3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 'c3' ? 'কপি হয়েছে' : 'কমান্ড কপি করুন'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
            docker-compose up -d --build
          </pre>
        </div>
      </div>

      {/* Section 4: Webhook Configuration */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
          <Terminal className="w-5 h-5" />
          <h2>৪. টেলিগ্রাম ওয়েবহুক (Webhook) সেট করার নিয়ম</h2>
        </div>
        <p className="text-xs text-slate-400">
          আপনার ডোমেইনে SSL (HTTPS) চালু করার পর নিচের মতো করে টেলিগ্রামে ওয়েবহুক রেজিস্টার করবেন:
        </p>
        <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-amber-300 overflow-x-auto whitespace-pre-wrap">
          curl -F &quot;url=https://yourdomain.com/api/telegram/webhook/bot-owner&quot; -F &quot;secret_token=YOUR_WEBHOOK_SECRET&quot; https://api.telegram.org/bot&lt;YOUR_BOT_TOKEN&gt;/setWebhook
        </pre>
      </div>

      {/* Section 5: Troubleshooting Guide */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center gap-2.5 text-rose-400 font-bold text-base">
          <HelpCircle className="w-5 h-5" />
          <h2>৫. সাধারণ সমস্যা ও সমাধান (Troubleshooting)</h2>
        </div>
        <div className="space-y-3 text-xs text-slate-300">
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
            <strong className="text-white block mb-1">সমস্যা: বটে /start দিলে কোনো উত্তর আসছে না।</strong>
            <p className="text-slate-400">
              সমাধান: Bot token টি সঠিকভাবে ইনপুট দেওয়া হয়েছে কি না দেখুন। আপনার সার্ভারের পোর্ট 3000 বা ডোমেইনে HTTPS সঠিকভাবে চালু আছে কি না পরীক্ষা করুন।
            </p>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
            <strong className="text-white block mb-1">সমস্যা: রিসেলার ক্রেডিট লিমিট রিচ করলে কী হবে?</strong>
            <p className="text-slate-400">
              সমাধান: কোনো কাস্টমারের টাকা নষ্ট হবে না। অর্ডারটি &apos;paid_pending_fulfillment&apos; এ যাবে। সুপার এডমিন রিসেলারের কাছ থেকে পেমেন্ট ভেরিফাই করলেই অর্ডার স্বয়ংক্রিয়ভাবে এক্সেস দিয়ে দেবে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
