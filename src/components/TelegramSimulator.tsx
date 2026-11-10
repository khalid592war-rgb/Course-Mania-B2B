import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  Check,
  CheckCheck,
  Smartphone,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  MoreVertical,
  Paperclip,
  Smile,
  ShieldCheck,
} from 'lucide-react';
import { TelegramBot, Order, PlatformSettings, PaymentMethod } from '../server/types';
import { ModalPaymentSubmission } from './ModalPaymentSubmission';

interface MessageItem {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  photoUrl?: string;
  buttons?: Array<Array<{ text: string; callback_data: string; url?: string }>>;
  time: string;
  order?: Order;
}

interface TelegramSimulatorProps {
  bots: TelegramBot[];
  selectedBotId: string;
  onSelectBot: (botId: string) => void;
  settings: PlatformSettings;
  onOrderCreatedOrUpdated?: () => void;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({
  bots,
  selectedBotId,
  onSelectBot,
  settings,
  onOrderCreatedOrUpdated,
}) => {
  const currentBot = bots.find((b) => b.id === selectedBotId) || bots[0];
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [isTyping, setIsTyping] = useState(false);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [preselectedMethod, setPreselectedMethod] = useState<PaymentMethod>('bkash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize or restart bot chat
  const startBotConversation = async (botId: string) => {
    setIsTyping(true);
    setMessages([]);
    try {
      const res = await fetch('/api/telegram/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId,
          chatId: 98127361,
          fromName: 'Student (Android)',
          fromUsername: 'student_bd',
          text: '/start',
          lang,
        }),
      });
      const data = await res.json();
      setMessages([
        {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: data.text,
          photoUrl: data.photoUrl,
          buttons: data.buttons,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (currentBot) {
      startBotConversation(currentBot.id);
    }
  }, [currentBot?.id, lang]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !currentBot) return;

    const userMsg: MessageItem = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/telegram/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: currentBot.id,
          chatId: 98127361,
          fromName: 'Student (Android)',
          fromUsername: 'student_bd',
          text,
          lang,
        }),
      });

      const reply = await res.json();
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: reply.text,
            photoUrl: reply.photoUrl,
            buttons: reply.buttons,
            order: reply.order,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsTyping(false);
        if (reply.order && onOrderCreatedOrUpdated) {
          onOrderCreatedOrUpdated();
        }
      }, 400);
    } catch (err) {
      setIsTyping(false);
    }
  };

  const handleButtonClick = async (callbackData: string, label: string) => {
    if (!currentBot) return;

    // Check if button is to open payment modal
    if (callbackData.startsWith('submit_trx_modal:') || callbackData.startsWith('pay_opt:')) {
      const parts = callbackData.split(':');
      const orderId = parts[1];
      const method = (parts[2] || 'bkash') as PaymentMethod;

      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const target: Order = await res.json();
          setPreselectedMethod(method);
          setPaymentModalOrder(target);
          return;
        }
      } catch (err) {
        console.error('Failed to fetch order for payment modal', err);
      }
    }

    // Add user click as message indication
    const userMsg: MessageItem = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: label,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/telegram/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: currentBot.id,
          chatId: 98127361,
          fromName: 'Student (Android)',
          fromUsername: 'student_bd',
          callbackData,
          lang,
        }),
      });

      const reply = await res.json();
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: reply.text,
            photoUrl: reply.photoUrl,
            buttons: reply.buttons,
            order: reply.order,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsTyping(false);
        if (reply.order && onOrderCreatedOrUpdated) {
          onOrderCreatedOrUpdated();
        }
      }, 350);
    } catch (err) {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4">
      {/* Bot Selector Bar */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 sm:p-4 mb-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">টেলিগ্রাম বট স্টোরফ্রন্ট এমুলেটর (Customer Experience)</h2>
          </div>
          <p className="text-xs text-slate-400">
            যেকোনো সক্রিয় বট নির্বাচন করে কাস্টমার হিসেবে কোর্স ব্রাউজ, অর্ডার ও পেমেন্ট টেস্ট করুন
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedBotId}
            onChange={(e) => onSelectBot(e.target.value)}
            className="flex-1 md:w-64 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-sky-500"
          >
            {bots.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} (@{b.username}) {b.isPrimaryOwnerBot ? '👑 Owner' : `🏢 Reseller`}
              </option>
            ))}
          </select>

          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl border border-slate-600 transition cursor-pointer"
          >
            {lang === 'bn' ? 'বাংলা' : 'EN'}
          </button>

          <button
            onClick={() => currentBot && startBotConversation(currentBot.id)}
            title="Restart /start"
            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl border border-slate-600 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Realistic Telegram Phone Container */}
      <div className="mx-auto max-w-[420px] bg-slate-900 rounded-3xl shadow-2xl border-4 border-slate-700 overflow-hidden flex flex-col h-[740px] relative">
        {/* Telegram App Header */}
        <div className="bg-[#242f3d] px-4 py-3 text-white flex items-center justify-between border-b border-[#17212b] shadow-xs">
          <div className="flex items-center gap-3">
            <button className="text-slate-300 hover:text-white cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-inner">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#242f3d]"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white truncate max-w-[170px]">
                  {currentBot?.name || 'Course Mania'}
                </h3>
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <p className="text-[11px] text-slate-400">bot • @{currentBot?.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSendMessage('/start')}
              className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-600/80 hover:bg-sky-500 text-white cursor-pointer"
            >
              /start
            </button>
            <MoreVertical className="w-5 h-5 text-slate-300" />
          </div>
        </div>

        {/* Telegram Chat Wallpaper Area */}
        <div
          className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0e1621]"
          style={{
            backgroundImage:
              'radial-gradient(#17212b 1px, transparent 1px), radial-gradient(#17212b 1px, #0e1621 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
        >
          {/* Encryption Notice */}
          <div className="text-center my-2">
            <span className="inline-block px-3 py-1 bg-[#182533]/80 rounded-full text-[10px] text-slate-400 border border-slate-700/50">
              🔒 End-to-end secured Telegram Bot Session
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3 shadow-md text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#2b5278] text-white rounded-br-xs'
                    : 'bg-[#182533] text-slate-100 rounded-bl-xs border border-slate-700/60'
                }`}
              >
                {/* Photo attachment if available */}
                {msg.photoUrl && (
                  <div className="mb-2.5 rounded-xl overflow-hidden border border-slate-700/80">
                    <img
                      src={msg.photoUrl}
                      alt="Course preview"
                      className="w-full h-36 object-cover hover:scale-105 transition duration-300"
                    />
                  </div>
                )}

                {/* Formatted Text */}
                <div className="whitespace-pre-wrap select-text font-sans">
                  {msg.text.split('\n').map((line, idx) => {
                    // Simple Markdown bold formatter
                    if (line.includes('**')) {
                      const parts = line.split('**');
                      return (
                        <p key={idx} className="mb-1">
                          {parts.map((p, i) =>
                            i % 2 === 1 ? <strong key={i} className="font-bold text-amber-300">{p}</strong> : p
                          )}
                        </p>
                      );
                    }
                    return (
                      <p key={idx} className="mb-0.5">
                        {line}
                      </p>
                    );
                  })}
                </div>

                {/* Timestamp */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                  <span>{msg.time}</span>
                  {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-sky-400" />}
                </div>
              </div>

              {/* Telegram Inline Keyboard Buttons */}
              {msg.buttons && msg.buttons.length > 0 && (
                <div className="mt-2 space-y-1.5 w-full max-w-[88%]">
                  {msg.buttons.map((row, rowIdx) => (
                    <div key={rowIdx} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}>
                      {row.map((btn, btnIdx) => (
                        <button
                          key={btnIdx}
                          onClick={() => {
                            if (btn.url) {
                              window.open(btn.url, '_blank');
                            } else {
                              handleButtonClick(btn.callback_data, btn.text);
                            }
                          }}
                          className="bg-[#242f3d] hover:bg-[#2b394a] active:bg-[#344458] text-[#64b5f6] hover:text-white font-semibold text-[11px] py-2 px-2.5 rounded-xl text-center border border-slate-700/80 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs truncate"
                        >
                          <span className="truncate">{btn.text}</span>
                          {btn.url && <ExternalLink className="w-3 h-3 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 bg-[#182533] text-slate-300 px-3 py-1.5 rounded-full w-24 text-[11px] border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
              <span className="text-[10px] text-slate-400 italic">typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Telegram Chat Input Bar */}
        <div className="bg-[#17212b] p-2.5 border-t border-[#0e1621] flex items-center gap-2">
          <button className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg cursor-pointer">
            <Smile className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSendMessage())}
            placeholder="মেসেজ লিখুন (যেমন: /courses, /help)..."
            className="flex-1 bg-[#242f3d] text-white text-xs rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-sky-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-full bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Payment TrxID Submission Modal */}
      {paymentModalOrder && (
        <ModalPaymentSubmission
          isOpen={!!paymentModalOrder}
          onClose={() => setPaymentModalOrder(null)}
          order={paymentModalOrder}
          settings={settings}
          preselectedMethod={preselectedMethod}
          onSubmitted={(updatedOrder) => {
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-paid-${Date.now()}`,
                sender: 'bot',
                text: `✅ **ধন্যবাদ! পেমেন্ট রিকোয়েস্ট গৃহীত হয়েছে।**\n\n🔖 অর্ডার: #${updatedOrder.orderNumber}\n💳 TrxID: \`${updatedOrder.paymentTrxId}\` (${updatedOrder.paymentMethod})\n\nএডমিন ভেরিফাই করা মাত্রই আপনার কোর্সের অ্যাক্সেস লিঙ্ক স্বয়ংক্রিয়ভাবে প্রদান করা হবে। স্ট্যাটাস চেক করতে নিচের বাটনটি চাপুন:`,
                buttons: [
                  [{ text: '📦 অর্ডার স্ট্যাটাস চেক করুন', callback_data: 'my_orders' }],
                  [{ text: '🏠 মূল মেন্যু', callback_data: 'menu_start' }],
                ],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            if (onOrderCreatedOrUpdated) onOrderCreatedOrUpdated();
          }}
        />
      )}
    </div>
  );
};
