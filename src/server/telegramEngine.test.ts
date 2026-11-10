import test from 'node:test';
import assert from 'node:assert/strict';
import { telegramEngine } from './telegramEngine';

test('TelegramEngine generates welcome message with buttons for active bot', () => {
  const res = telegramEngine.handleIncoming({
    botId: 'bot-owner',
    chatId: 991823,
    fromName: 'Tanvir',
    text: '/start',
    lang: 'bn',
  });

  assert.equal(res.botId, 'bot-owner');
  assert.match(res.text, /স্বাগতম/);
  assert.ok(res.buttons && res.buttons.length >= 3);
});

test('TelegramEngine lists courses when browsing', () => {
  const res = telegramEngine.handleIncoming({
    botId: 'bot-owner',
    chatId: 991823,
    fromName: 'Tanvir',
    callbackData: 'browse_all',
    lang: 'bn',
  });

  assert.match(res.text, /উপলব্ধ কোর্স তালিকা/);
  assert.ok(res.buttons && res.buttons.length >= 3);
});

test('TelegramEngine returns course details when view_course is clicked', () => {
  const res = telegramEngine.handleIncoming({
    botId: 'bot-owner',
    chatId: 991823,
    fromName: 'Tanvir',
    callbackData: 'view_course:course-1',
    lang: 'bn',
  });

  assert.match(res.text, /ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্ট/);
  assert.ok(res.photoUrl);
  assert.ok(res.buttons?.some((row) => row.some((btn) => btn.callback_data.includes('order:course-1'))));
});

test('TelegramEngine gracefully handles suspended bot', () => {
  const res = telegramEngine.handleIncoming({
    botId: 'non-existent-bot',
    chatId: 991823,
    fromName: 'Tanvir',
    text: '/start',
  });

  assert.match(res.text, /বট কনফিগারেশন পাওয়া যায়নি/);
});
