const BOT_TOKEN = '7701092713:AAGawRL4bUcC8yN3XvcHcnzI79c-a7CDP4o';
const CHAT_ID = '-1003739888243';

interface RegParams { bgmiName: string; characterId: string; upiId: string; matchName: string; matchTime: string; screenshot: File; }
interface ResultParams { bgmiName: string; matchName: string; screenshot: File; }

export async function sendRegistrationToTelegram(p: RegParams): Promise<boolean> {
  try {
    const caption =
      `🚀 *New Registration!*\n\n` +
      `👤 *BGMI Name:* ${p.bgmiName}\n` +
      `🆔 *Character ID:* ${p.characterId}\n` +
      `💳 *UPI ID:* \`${p.upiId}\`\n` +
      `🗺️ *Match:* ${p.matchName}\n` +
      `⏰ *Time:* ${p.matchTime}\n\n` +
      `💰 *Send Prize to:* \`${p.upiId}\`\n` +
      `✅ Verify in Admin Panel.`;

    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('photo', p.screenshot);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    return res.ok;
  } catch (e) {
    console.error('Telegram send failed:', e);
    return false;
  }
}

export async function sendResultToTelegram(p: ResultParams): Promise<boolean> {
  try {
    const caption =
      `🏆 *Result Submission*\n\n` +
      `👤 *Name:* ${p.bgmiName}\n` +
      `🗺️ *Match:* ${p.matchName}\n\n` +
      `📸 Winning screenshot attached.`;

    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('photo', p.screenshot);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    return res.ok;
  } catch (e) {
    console.error('Telegram result send failed:', e);
    return false;
  }
}

export async function sendAddCashToTelegram(
  userName: string, userEmail: string, bgmiName: string, amount: number, screenshot: File
): Promise<boolean> {
  try {
    const caption =
      `💰 *Add Cash Request!*\n\n` +
      `👤 *Name:* ${userName}\n` +
      `📧 *Email:* ${userEmail}\n` +
      `🎮 *BGMI:* ${bgmiName}\n` +
      `💵 *Amount:* ₹${amount}\n\n` +
      `✅ Approve in Admin Panel → Add Cash Tab`;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('photo', screenshot);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: formData });
    return res.ok;
  } catch(e) { return false; }
}

export async function sendWinnerAnnouncementToTelegram(
  winnerName: string, upiId: string, prizeAmount: number, rank: number, matchMap: string, matchType: string
): Promise<boolean> {
  try {
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
    const rankText = rank === 1 ? '1st Place' : rank === 2 ? '2nd Place' : '3rd Place';
    const message =
      `🎉 *WINNER ANNOUNCEMENT!*\n\n` +
      `${rankEmoji} *${rankText}:* ${winnerName}\n` +
      `🗺️ *Match:* ${matchMap} (${matchType})\n` +
      `💰 *Prize:* ₹${prizeAmount}\n` +
      `💳 *UPI:* \`${upiId}\`\n\n` +
      `🏆 Congratulations! Prize will be sent shortly.`;

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' }),
    });
    return res.ok;
  } catch (e) {
    console.error('Telegram winner announce failed:', e);
    return false;
  }
}
