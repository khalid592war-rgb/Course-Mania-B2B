import React, { useState } from 'react';
import { X, BookOpen, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Course, CourseCategory, DeliveryMethod } from '../server/types';

interface ModalAddCourseProps {
  isOpen: boolean;
  onClose: () => void;
  courseToEdit?: Course | null;
  onCourseSaved: () => void;
}

const CATEGORIES: CourseCategory[] = [
  'Web Development',
  'Graphic Design',
  'Digital Marketing',
  'AI & Data Science',
  'Spoken English & IELTS',
  'Video Editing & Animation',
  'Mobile App Development',
];

export const ModalAddCourse: React.FC<ModalAddCourseProps> = ({
  isOpen,
  onClose,
  courseToEdit,
  onCourseSaved,
}) => {
  const [title, setTitle] = useState(courseToEdit?.title || '');
  const [titleBn, setTitleBn] = useState(courseToEdit?.titleBn || '');
  const [description, setDescription] = useState(courseToEdit?.description || '');
  const [descriptionBn, setDescriptionBn] = useState(courseToEdit?.descriptionBn || '');
  const [category, setCategory] = useState<CourseCategory>(courseToEdit?.category || 'Web Development');
  const [regularPrice, setRegularPrice] = useState(courseToEdit?.regularPrice ? String(courseToEdit.regularPrice) : '2500');
  const [salePrice, setSalePrice] = useState(courseToEdit?.salePrice ? String(courseToEdit.salePrice) : '1500');
  const [isSaleActive, setIsSaleActive] = useState(courseToEdit ? courseToEdit.isSaleActive : true);
  const [thumbnailUrl, setThumbnailUrl] = useState(
    courseToEdit?.thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60'
  );
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(courseToEdit?.deliveryMethod || 'telegram_channel');
  const [deliveryPayload, setDeliveryPayload] = useState(courseToEdit?.deliveryPayload || 'https://t.me/+CM_Batch_VIP_Link');
  const [features, setFeatures] = useState<string[]>(
    courseToEdit?.features || [
      'লাইভ প্রজেক্ট ও সোর্স কোড',
      'প্রাইভেট টেলিগ্রাম ভিআইপি গ্রুপ অ্যাক্সেস',
      'কোর্স শেষে কমপ্লিশন সার্টিফিকেট',
    ]
  );
  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const reg = parseFloat(regularPrice);
    const sale = parseFloat(salePrice);

    if (isNaN(reg) || reg <= 0) {
      setError('নিয়মিত কোর্স ফি সঠিক সংখ্যা দিন।');
      return;
    }
    if (isSaleActive && (isNaN(sale) || sale <= 0)) {
      setError('অফার মূল্য সঠিক সংখ্যা দিন।');
      return;
    }

    setLoading(true);
    try {
      const payloadData = {
        title: title.trim(),
        titleBn: titleBn.trim() || title.trim(),
        description: description.trim(),
        descriptionBn: descriptionBn.trim() || description.trim(),
        category,
        regularPrice: reg,
        salePrice: isSaleActive ? sale : reg,
        isSaleActive,
        thumbnailUrl: thumbnailUrl.trim(),
        status: 'published',
        deliveryMethod,
        deliveryPayload: deliveryPayload.trim(),
        features,
      };

      const url = courseToEdit ? `/api/courses/${courseToEdit.id}` : '/api/courses';
      const method = courseToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'কোর্স সেভ করা যায়নি।');

      onCourseSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {courseToEdit ? 'কোর্স আপডেট করুন' : 'নতুন কোর্স যুক্ত করুন'}
              </h3>
              <p className="text-xs text-slate-400">Shared across all connected Telegram bots instantaneously</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">কোর্স শিরোনাম (English)</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Full-Stack Web Development Bootcamp"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">কোর্স শিরোনাম (বাংলা)</label>
              <input
                type="text"
                required
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="কমপ্লিট ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্ট"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ক্যাটাগরি</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">নিয়মিত মূল্য (৳ BDT)</label>
              <input
                type="number"
                required
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">বিক্রয়/অফার মূল্য (৳ BDT)</label>
              <input
                type="number"
                required
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">বিবরণ (English)</label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">বিবরণ (বাংলা)</label>
              <textarea
                rows={2}
                required
                value={descriptionBn}
                onChange={(e) => setDescriptionBn(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">কোর্স থাম্বনেইল ইমেজ URL</label>
              <input
                type="url"
                required
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ডেলিভারি মেথড</label>
              <select
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="telegram_channel">Telegram Private Channel / Group</option>
                <option value="access_link">Drive Folder / Web Access Link</option>
                <option value="manual">Manual Admin Fulfillment</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ডেলিভারি লিঙ্ক / চ্যানেল ইনভাইট URL (Customer Delivery Payload)
            </label>
            <input
              type="text"
              required
              value={deliveryPayload}
              onChange={(e) => setDeliveryPayload(e.target.value)}
              placeholder="https://t.me/+AbCdEfGhIjklm123"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              কাস্টমারের পেমেন্ট সফল বা ভেরিফাইড হলে এই লিঙ্কটি অটোমেটিক টেলিগ্রাম চ্যাটে প্রেরিত হবে।
            </span>
          </div>

          {/* Features list */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">কোর্সের প্রধান সুবিধাসমূহ (Features)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                placeholder="নতুন সুবিধা লিখুন ও Add চাপুন..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {features.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs"
                >
                  {f}
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(i)}
                    className="text-slate-400 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>সংরক্ষণ হচ্ছে...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>কোর্স প্রকাশ করুন (Publish to All Bots)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
