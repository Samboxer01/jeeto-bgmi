import { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from './store';
import type { Match } from './types';

const BOT_TOKEN = '7701092713:AAGawRL4bUcC8yN3XvcHcnzI79c-a7CDP4o';
const CHAT_ID = '-1003739888243';
const UPI_ID = 'liju21977@okicici';

const MAP_COLORS: Record<string, string> = {
  Erangel: '#00ff88', Miramar: '#ffd700', Sanhok: '#00bfff',
  Livik: '#bf5af2', TDM: '#ff453a', default: '#ff453a'
};
const MAP_EMOJIS: Record<string, string> = {
  Erangel: '🏝️', Miramar: '🏜️', Sanhok: '🌴', Livik: '❄️', TDM: '⚔️'
};
const MAP_BG: Record<string, string> = {
  Erangel: 'https://images.unsplash.com/photo-1542779283-429940ce8336?w=400&q=80',
  Miramar: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=80',
  Sanhok: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80',
  Livik: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=400&q=80',
  TDM: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&q=80',
};

function getPrizePool(match: Match): number {
  if (match.customPrizePool > 0) return match.customPrizePool;
  return Math.floor(match.registeredPlayers * 20 * 0.4);
}

function playSound(type: 'click' | 'success' | 'error') {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'click') { osc.frequency.value = 800; gain.gain.value = 0.1; osc.start(); setTimeout(() => osc.stop(), 80); }
    else if (type === 'success') { osc.frequency.value = 523; gain.gain.value = 0.15; osc.start(); setTimeout(() => { osc.frequency.value = 659; setTimeout(() => { osc.frequency.value = 784; setTimeout(() => osc.stop(), 150); }, 150); }, 150); }
    else if (type === 'error') { osc.frequency.value = 200; gain.gain.value = 0.15; osc.start(); setTimeout(() => osc.stop(), 300); }
  } catch { /* silent */ }
}

// ==================== LOADING SCREEN ====================
function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setTimeout(onDone, 300); return 100; }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onDone]);
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ fontSize: 64, marginBottom: 16, animation: 'spin 2s linear infinite' }}>🎮</div>
      <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: 32, color: '#ff453a', marginBottom: 8, letterSpacing: 4 }}>JEETO</h1>
      <p style={{ color: '#888', marginBottom: 32, fontSize: 14 }}>BGMI Tournament Platform</p>
      <div style={{ width: 240, height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #ff453a, #ff9f0a)', borderRadius: 2, transition: 'width 0.1s' }} />
      </div>
      <p style={{ color: '#555', marginTop: 16, fontSize: 12 }}>Loading... {progress}%</p>
      <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ==================== TOAST ====================
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colors: Record<string, string> = { success: '#30d158', error: '#ff453a', info: '#0a84ff' };
  return (
    <div style={{ position: 'fixed', top: 80, right: 16, left: 16, maxWidth: 360, margin: '0 auto', background: '#1c1c1e', border: `1px solid ${colors[type]}`, borderRadius: 12, padding: '12px 16px', color: '#fff', zIndex: 9998, display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 0 20px ${colors[type]}44` }}>
      <span style={{ fontSize: 20 }}>{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span style={{ flex: 1, fontSize: 14 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}>×</button>
    </div>
  );
}

// ==================== NAVBAR ====================
function Navbar({ page, setPage, logoTaps, onLogoTap }: {
  page: string; setPage: (p: string) => void; logoTaps: number; onLogoTap: () => void;
}) {
  const { currentUser, adminLoggedIn } = useStore();
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1a1a1a', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div onClick={onLogoTap} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 24 }}>🎮</span>
        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 18, color: '#ff453a', fontWeight: 700 }}>JEETO</span>
        {logoTaps > 0 && <span style={{ fontSize: 10, color: '#555' }}>{logoTaps}/5</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {['home', 'winners', 'leaderboard'].map(p => (
          <button key={p} onClick={() => { playSound('click'); setPage(p); }} style={{ background: page === p ? '#ff453a22' : 'none', border: page === p ? '1px solid #ff453a44' : '1px solid transparent', borderRadius: 8, padding: '6px 12px', color: page === p ? '#ff453a' : '#888', fontSize: 13, cursor: 'pointer', textTransform: 'capitalize', display: window.innerWidth < 480 ? 'none' : 'block' }}>
            {p === 'home' ? '🏠' : p === 'winners' ? '🏆' : '📊'} {p}
          </button>
        ))}
        <button onClick={() => { playSound('click'); setPage('profile'); }} style={{ background: page === 'profile' ? '#ff453a22' : 'none', border: '1px solid #333', borderRadius: 8, padding: '6px 12px', color: page === 'profile' ? '#ff453a' : '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          {currentUser ? (
            <><span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #ff453a, #ff9f0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{currentUser.displayName[0]?.toUpperCase()}</span><span style={{ display: window.innerWidth < 480 ? 'none' : 'block' }}>{currentUser.displayName.split(' ')[0]}</span></>
          ) : <><span>👤</span><span style={{ display: window.innerWidth < 480 ? 'none' : 'block' }}>Profile</span></>}
        </button>
        {adminLoggedIn && (
          <button onClick={() => { playSound('click'); setPage('admin'); }} style={{ background: page === 'admin' ? '#ff453a' : '#ff453a22', border: '1px solid #ff453a', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>⚙️</button>
        )}
      </div>
    </nav>
  );
}

// ==================== BOTTOM NAV ====================
function BottomNav({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'winners', icon: '🏆', label: 'Winners' },
    { id: 'leaderboard', icon: '📊', label: 'Ranks' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ];
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.98)', borderTop: '1px solid #1a1a1a', display: 'flex', zIndex: 100, backdropFilter: 'blur(20px)' }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => { playSound('click'); setPage(tab.id); }} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          <span style={{ fontSize: 10, color: page === tab.id ? '#ff453a' : '#555', fontWeight: page === tab.id ? 700 : 400 }}>{tab.label}</span>
          {page === tab.id && <div style={{ width: 20, height: 2, background: '#ff453a', borderRadius: 1 }} />}
        </button>
      ))}
    </div>
  );
}

// ==================== MATCH CARD ====================
function MatchCard({ match, onRegister }: { match: Match; onRegister: (match: Match) => void }) {
  const { currentUser } = useStore();
  const color = MAP_COLORS[match.map] || MAP_COLORS.default;
  const prize = getPrizePool(match);
  const seatsLeft = match.maxPlayers - match.registeredPlayers;
  const fillPct = (match.registeredPlayers / match.maxPlayers) * 100;
  const [showPrize, setShowPrize] = useState(false);
  const [tilting, setTilting] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const isRegistered = currentUser && match.players.some(p => p.userId === currentUser.uid);
  const isVerified = currentUser && match.players.some(p => p.userId === currentUser.uid && p.verified);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
    const y = ((e.clientX - rect.left) / rect.width - 0.5) * -10;
    setTilting({ x, y });
  };

  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const update = () => {
      if (!match.date || !match.time) return;
      const target = new Date(`${match.date}T${match.time}`).getTime();
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) { setCountdown('Started'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [match.date, match.time]);

  return (
    <div ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={() => setTilting({ x: 0, y: 0 })}
      style={{ background: '#0d0d0d', border: `1px solid ${color}33`, borderRadius: 16, overflow: 'hidden', transform: `perspective(1000px) rotateX(${tilting.x}deg) rotateY(${tilting.y}deg)`, transition: 'transform 0.1s', boxShadow: `0 0 20px ${color}22` }}>
      {/* Banner */}
      <div style={{ height: 120, background: `url(${MAP_BG[match.map]}) center/cover`, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, #0d0d0d)' }} />
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8 }}>
          <span style={{ background: match.status === 'open' ? '#30d15822' : match.status === 'live' ? '#ff453a22' : '#55555522', border: `1px solid ${match.status === 'open' ? '#30d158' : match.status === 'live' ? '#ff453a' : '#555'}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: match.status === 'open' ? '#30d158' : match.status === 'live' ? '#ff453a' : '#888', fontWeight: 700 }}>
            {match.status === 'open' ? '🟢 OPEN' : match.status === 'live' ? '🔴 LIVE' : '✅ DONE'}
          </span>
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#fff' }}>
          {MAP_EMOJIS[match.map]} {match.map}
        </div>
        <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
          <span style={{ color: '#888', fontSize: 11 }}>{match.type} • {match.time}</span>
        </div>
        {match.status === 'open' && countdown && (
          <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#ffd700' }}>⏰ {countdown}</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        {/* Prize */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>💰 PRIZE POOL</div>
          <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: 'Orbitron, monospace' }}>₹{prize}</div>
        </div>

        {/* Prize split toggle */}
        <button onClick={() => setShowPrize(!showPrize)} style={{ width: '100%', background: '#1a1a1a', border: 'none', borderRadius: 8, padding: '6px', color: '#888', fontSize: 12, cursor: 'pointer', marginBottom: 8 }}>
          {showPrize ? '▲' : '▼'} Prize Split
        </button>
        {showPrize && (
          <div style={{ background: '#111', borderRadius: 8, padding: 12, marginBottom: 8 }}>
            {[{ place: '🥇 1st', pct: 0.5 }, { place: '🥈 2nd', pct: 0.3 }, { place: '🥉 3rd', pct: 0.2 }].map(({ place, pct }) => (
              <div key={place} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#888' }}>{place}</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>₹{Math.floor(prize * pct)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Seats */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#888', fontSize: 12 }}>💺 Seats Left</span>
            <span style={{ color: seatsLeft < 10 ? '#ff453a' : '#fff', fontSize: 12, fontWeight: 700 }}>{seatsLeft}/{match.maxPlayers}</span>
          </div>
          <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${fillPct}%`, background: fillPct > 80 ? '#ff453a' : fillPct > 50 ? '#ffd700' : '#30d158', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 12 }}>
          <span style={{ color: '#555' }}>Entry Fee</span>
          <span style={{ color: '#fff', fontWeight: 700 }}>₹20</span>
        </div>

        {/* Room ID for verified */}
        {isVerified && match.roomId && (
          <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 10, marginBottom: 12, border: '1px solid #30d15844' }}>
            <div style={{ fontSize: 11, color: '#30d158', marginBottom: 4 }}>🔑 ROOM DETAILS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#888' }}>ID: <span style={{ color: '#fff' }}>{match.roomId}</span></span>
              <span style={{ color: '#888' }}>Pass: <span style={{ color: '#fff' }}>{match.roomPassword}</span></span>
            </div>
          </div>
        )}

        {/* Share buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {[
            { icon: '📱', label: 'WA', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`🎮 BGMI Tournament!\n🗺️ ${match.map} ${match.type}\n💰 Prize: ₹${prize}\n💺 Seats: ${seatsLeft}/${match.maxPlayers}\n💵 Entry: ₹20\nJoin: t.me/pampa_ji_op`)}`) },
            { icon: '✈️', label: 'TG', action: () => window.open(`https://t.me/share/url?url=t.me/pampa_ji_op&text=${encodeURIComponent(`🎮 BGMI ${match.map} ${match.type}\n💰 Prize: ₹${prize}\n💺 ${seatsLeft} seats left!`)}`) },
          ].map(({ icon, label, action }) => (
            <button key={label} onClick={action} style={{ flex: 1, background: '#1a1a1a', border: 'none', borderRadius: 8, padding: '6px', color: '#888', fontSize: 12, cursor: 'pointer' }}>{icon} {label}</button>
          ))}
        </div>

        {/* Register button */}
        {match.status === 'open' && !isRegistered && (
          <button onClick={() => { playSound('click'); onRegister(match); }} style={{ width: '100%', background: `linear-gradient(135deg, ${color}cc, ${color}88)`, border: 'none', borderRadius: 10, padding: '12px', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Orbitron, monospace' }}>
            REGISTER NOW
          </button>
        )}
        {isRegistered && !isVerified && (
          <div style={{ textAlign: 'center', padding: '10px', background: '#ffd70022', border: '1px solid #ffd70044', borderRadius: 10, color: '#ffd700', fontSize: 13 }}>
            ⏳ Awaiting Verification
          </div>
        )}
        {isRegistered && isVerified && (
          <div style={{ textAlign: 'center', padding: '10px', background: '#30d15822', border: '1px solid #30d15844', borderRadius: 10, color: '#30d158', fontSize: 13 }}>
            ✅ Verified — Ready to Play!
          </div>
        )}
        {match.status === 'live' && !isRegistered && (
          <div style={{ textAlign: 'center', padding: '10px', background: '#ff453a22', border: '1px solid #ff453a44', borderRadius: 10, color: '#ff453a', fontSize: 13 }}>
            🔴 Match Started
          </div>
        )}
        {match.status === 'done' && (
          <div style={{ textAlign: 'center', padding: '10px', background: '#55555522', border: '1px solid #55555544', borderRadius: 10, color: '#888', fontSize: 13 }}>
            ✅ Match Completed
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== REGISTRATION MODAL ====================
function RegistrationModal({ match, onClose, showToast }: {
  match: Match; onClose: () => void; showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}) {
  const { currentUser, registerPlayer } = useStore();
  const [step, setStep] = useState(1);
  const [bgmiName, setBgmiName] = useState(currentUser?.bgmiName || '');
  const [charId, setCharId] = useState(currentUser?.characterId || '');
  const [upiId, setUpiId] = useState(currentUser?.upiId || '');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [bgmiScreenshot, setBgmiScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [charIdError, setCharIdError] = useState('');
  const prize = getPrizePool(match);

  const validateCharId = (val: string) => {
    if (!/^\d{8,12}$/.test(val)) setCharIdError('Character ID must be 8-12 digits only!');
    else setCharIdError('');
  };

  const handleSubmit = async () => {
    if (!screenshot) { showToast('Please upload payment screenshot!', 'error'); return; }
    if (!bgmiScreenshot) { showToast('Please upload BGMI profile screenshot!', 'error'); return; }
    if (charIdError) { showToast('Fix Character ID error first!', 'error'); return; }
    if (!currentUser?.upiId && !upiId) { showToast('Please add UPI ID in your profile first!', 'error'); return; }

    // Anti-fraud check
    const isDuplicate = match.players.some(p => p.characterId === charId);
    if (isDuplicate) {
      showToast('This Character ID is already registered!', 'error');
      // Send fraud alert to Telegram
      const msg = `⚠️ FRAUD ATTEMPT!\n👤 ${bgmiName}\n🆔 Char ID: ${charId} (Already registered!)\n🗺️ ${match.map} ${match.type}`;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: CHAT_ID, text: msg }) });
      return;
    }

    setLoading(true);
    try {
      // Send payment screenshot to Telegram
      const formData = new FormData();
      formData.append('chat_id', CHAT_ID);
      formData.append('photo', screenshot);
      formData.append('caption',
        `🚀 New Registration!\n\n👤 BGMI Name: ${bgmiName}\n🆔 Character ID: ${charId}\n💳 UPI ID: ${upiId || currentUser?.upiId}\n🗺️ Match: ${match.map} (${match.type})\n⏰ Time: ${match.time}\n\n💰 Send Prize to: ${upiId || currentUser?.upiId}\n✅ Verify in Admin Panel`
      );
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: formData });

      // Send BGMI profile screenshot
      const formData2 = new FormData();
      formData2.append('chat_id', CHAT_ID);
      formData2.append('photo', bgmiScreenshot);
      formData2.append('caption', `📸 BGMI Profile Screenshot\n👤 ${bgmiName}\n🆔 ${charId}\n🗺️ ${match.map}`);
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: formData2 });

      await registerPlayer(match.id, bgmiName, charId, upiId || currentUser?.upiId || '');
      playSound('success');
      setStep(4);
    } catch (err) {
      showToast('Registration failed. Try again!', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0d0d0d', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: 24, border: '1px solid #1a1a1a' }}>

        {/* Step indicator */}
        {step < 4 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= s ? '#ff453a' : '#1a1a1a', transition: 'background 0.3s' }} />
            ))}
          </div>
        )}

        {/* Step 1: Rules */}
        {step === 1 && (
          <>
            <h2 style={{ color: '#fff', fontFamily: 'Orbitron, monospace', marginBottom: 8 }}>📋 Rules</h2>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>Read carefully before registering</p>
            <div style={{ background: '#111', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              {['📸 Result screenshot is compulsory', '🚫 No hacks or cheats allowed', '🛡️ Anti-cheat system is active', '⚠️ Admin will kick unauthorized players', '💰 Entry fee ₹20 is non-refundable', '🆔 Fake Character ID = Permanent Ban'].map((rule, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: i < 5 ? '1px solid #1a1a1a' : 'none', color: '#ccc', fontSize: 14 }}>{rule}</div>
              ))}
            </div>
            <div style={{ background: '#ff453a11', border: '1px solid #ff453a44', borderRadius: 10, padding: 12, marginBottom: 20 }}>
              <p style={{ color: '#ff453a', fontSize: 13, margin: 0 }}>⚠️ Violation of rules = Permanent ban without refund</p>
            </div>
            <button onClick={() => { playSound('click'); setStep(2); }} style={{ width: '100%', background: 'linear-gradient(135deg, #ff453a, #ff9f0a)', border: 'none', borderRadius: 12, padding: 14, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              ✅ I Agree — Continue
            </button>
          </>
        )}

        {/* Step 2: Player Details */}
        {step === 2 && (
          <>
            <h2 style={{ color: '#fff', fontFamily: 'Orbitron, monospace', marginBottom: 20 }}>👤 Player Details</h2>
            {[
              { label: 'BGMI Name', value: bgmiName, set: setBgmiName, placeholder: 'Your in-game name' },
              { label: 'Character ID (8-12 digits)', value: charId, set: (v: string) => { setCharId(v); validateCharId(v); }, placeholder: '1234567890', error: charIdError },
              { label: 'UPI ID (for prize)', value: upiId, set: setUpiId, placeholder: 'yourname@upi' },
            ].map(({ label, value, set, placeholder, error }) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>{label}</label>
                <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                  style={{ width: '100%', background: '#1a1a1a', border: `1px solid ${error ? '#ff453a' : '#333'}`, borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                {error && <p style={{ color: '#ff453a', fontSize: 12, marginTop: 4 }}>{error}</p>}
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>📸 BGMI Profile Screenshot (showing Character ID)</label>
              <label style={{ display: 'block', background: bgmiScreenshot ? '#30d15822' : '#1a1a1a', border: `2px dashed ${bgmiScreenshot ? '#30d158' : '#333'}`, borderRadius: 10, padding: 16, textAlign: 'center', cursor: 'pointer' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setBgmiScreenshot(e.target.files?.[0] || null)} />
                <span style={{ color: bgmiScreenshot ? '#30d158' : '#555', fontSize: 14 }}>{bgmiScreenshot ? `✅ ${bgmiScreenshot.name}` : '📷 Upload BGMI Profile Screenshot'}</span>
              </label>
            </div>
            <button onClick={() => { if (!bgmiName || !charId || charIdError) { showToast('Fill all fields correctly!', 'error'); return; } playSound('click'); setStep(3); }}
              style={{ width: '100%', background: 'linear-gradient(135deg, #ff453a, #ff9f0a)', border: 'none', borderRadius: 12, padding: 14, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              Continue →
            </button>
          </>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <>
            <h2 style={{ color: '#fff', fontFamily: 'Orbitron, monospace', marginBottom: 20 }}>💳 Payment</h2>
            <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Pay ₹20 to UPI ID:</div>
              <div style={{ fontSize: 18, color: '#fff', fontWeight: 700, marginBottom: 12 }}>{UPI_ID}</div>
              <button onClick={() => { navigator.clipboard.writeText(UPI_ID); showToast('UPI ID copied!', 'success'); playSound('success'); }}
                style={{ background: '#ff453a22', border: '1px solid #ff453a44', borderRadius: 8, padding: '8px 20px', color: '#ff453a', cursor: 'pointer', fontSize: 14 }}>
                📋 Copy UPI ID
              </button>
            </div>
            <div style={{ background: '#111', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 60, marginBottom: 8 }}>📱</div>
              <div style={{ color: '#888', fontSize: 13 }}>Scan QR or pay to UPI ID above</div>
              <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>Open PhonePe / GPay / Paytm</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>📸 Upload Payment Screenshot</label>
              <label style={{ display: 'block', background: screenshot ? '#30d15822' : '#1a1a1a', border: `2px dashed ${screenshot ? '#30d158' : '#333'}`, borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setScreenshot(e.target.files?.[0] || null)} />
                <span style={{ color: screenshot ? '#30d158' : '#555', fontSize: 14 }}>{screenshot ? `✅ ${screenshot.name}` : '📷 Tap to upload screenshot'}</span>
              </label>
            </div>
            <div style={{ background: '#ffd70011', border: '1px solid #ffd70033', borderRadius: 10, padding: 12, marginBottom: 20 }}>
              <p style={{ color: '#ffd700', fontSize: 13, margin: 0 }}>⚠️ Match: {match.map} {match.type} — Entry: ₹20 — Prize: ₹{prize}</p>
            </div>
            <button onClick={handleSubmit} disabled={loading}
              style={{ width: '100%', background: loading ? '#333' : 'linear-gradient(135deg, #30d158, #00bfff)', border: 'none', borderRadius: 12, padding: 14, color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ Submitting...' : '🚀 Submit Registration'}
            </button>
          </>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 80, marginBottom: 16, animation: 'bounce 1s infinite' }}>🎉</div>
            <h2 style={{ color: '#30d158', fontFamily: 'Orbitron, monospace', marginBottom: 8 }}>Registered!</h2>
            <p style={{ color: '#888', marginBottom: 20, fontSize: 14 }}>Admin will verify your payment soon. Room ID will appear on your match card after verification.</p>
            <div style={{ background: '#111', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Match:</div>
              <div style={{ color: '#fff', fontWeight: 700 }}>{match.map} ({match.type}) — {match.time}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 8, marginBottom: 4 }}>Prize Pool:</div>
              <div style={{ color: '#ffd700', fontWeight: 700, fontSize: 20 }}>₹{prize}</div>
            </div>
            <button onClick={() => window.open('https://t.me/pampa_ji_op', '_blank')}
              style={{ width: '100%', background: '#0088cc', border: 'none', borderRadius: 12, padding: 14, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 10 }}>
              ✈️ Join Telegram for Updates
            </button>
            <button onClick={onClose}
              style={{ width: '100%', background: '#1a1a1a', border: 'none', borderRadius: 12, padding: 14, color: '#888', fontSize: 14, cursor: 'pointer' }}>
              Close
            </button>
            <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== HOME PAGE ====================
function HomePage({ setPage, showToast }: { setPage: (p: string) => void; showToast: (msg: string, type: 'success' | 'error' | 'info') => void }) {
  const { matches, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<'open' | 'live' | 'done'>('open');
  const [mapFilter, setMapFilter] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [typingText, setTypingText] = useState('');
  const [counters, setCounters] = useState({ matches: 0, players: 0, prizes: 0 });
  const messages = ['India\'s #1 BGMI Platform', 'Win Real Cash Prizes', '₹20 Entry — Big Wins', 'Register. Play. Win.'];
  const msgIndex = useRef(0);
  const charIndex = useRef(0);
  const isDeleting = useRef(false);

  // Typing animation
  useEffect(() => {
    const tick = () => {
      const current = messages[msgIndex.current];
      if (!isDeleting.current) {
        setTypingText(current.substring(0, charIndex.current + 1));
        charIndex.current++;
        if (charIndex.current === current.length) { isDeleting.current = true; setTimeout(tick, 2000); return; }
      } else {
        setTypingText(current.substring(0, charIndex.current - 1));
        charIndex.current--;
        if (charIndex.current === 0) { isDeleting.current = false; msgIndex.current = (msgIndex.current + 1) % messages.length; }
      }
      setTimeout(tick, isDeleting.current ? 50 : 80);
    };
    setTimeout(tick, 500);
  }, []);

  // Animated counters
  const totalPlayers = matches.reduce((s, m) => s + m.registeredPlayers, 0);
  const totalPrizes = matches.filter(m => m.status === 'done').reduce((s, m) => s + getPrizePool(m), 0);
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounters({ matches: Math.floor(matches.length * progress), players: Math.floor(totalPlayers * progress), prizes: Math.floor(totalPrizes * progress) });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [matches.length, totalPlayers, totalPrizes]);

  const filtered = matches.filter(m => {
    if (m.status !== activeTab) return false;
    if (mapFilter !== 'all' && m.map !== mapFilter) return false;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingTop: 60, paddingBottom: 80 }}>
      {/* Particles */}
      <canvas id="particles" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Hero */}
      <div style={{ position: 'relative', padding: '40px 16px 60px', textAlign: 'center', background: 'radial-gradient(ellipse at 50% 0%, #ff453a22 0%, transparent 70%)' }}>
        {currentUser && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a1a1a', border: '1px solid #ff453a33', borderRadius: 20, padding: '6px 14px', marginBottom: 20, fontSize: 13, color: '#888' }}>
            <span>👋</span>
            <span>Welcome, <strong style={{ color: '#fff' }}>{currentUser.displayName}</strong>!</span>
            <span style={{ color: '#ffd700' }}>💰 ₹{currentUser.walletBalance || 0}</span>
          </div>
        )}
        <p style={{ color: '#ff453a', fontSize: 13, letterSpacing: 4, marginBottom: 8, fontFamily: 'Orbitron, monospace' }}>🎮 BGMI TOURNAMENT</p>
        <h1 style={{ fontFamily: 'Orbitron, monospace', fontSize: window.innerWidth < 480 ? 36 : 52, fontWeight: 900, color: '#fff', marginBottom: 8, lineHeight: 1.1 }}>
          BATTLE.<br /><span style={{ background: 'linear-gradient(135deg, #ff453a, #ff9f0a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WIN.</span>
        </h1>
        <div style={{ height: 28, marginBottom: 24 }}>
          <p style={{ color: '#888', fontSize: 16 }}>{typingText}<span style={{ animation: 'blink 1s infinite', color: '#ff453a' }}>|</span></p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          {[
            { label: 'Matches', value: counters.matches, icon: '🎮' },
            { label: 'Players', value: counters.players, icon: '👥' },
            { label: 'Prizes', value: `₹${counters.prizes}`, icon: '💰' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: '12px 20px', textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, fontFamily: 'Orbitron, monospace' }}>{value}</div>
              <div style={{ color: '#555', fontSize: 11 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          {['🛡️ Secure', '🔒 Private Rooms', '⚡ Fast Verify', '💰 Real Cash'].map(b => (
            <span key={b} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#888' }}>{b}</span>
          ))}
        </div>

        {!currentUser && (
          <button onClick={() => { playSound('click'); setPage('profile'); }}
            style={{ background: 'linear-gradient(135deg, #ff453a, #ff9f0a)', border: 'none', borderRadius: 12, padding: '12px 32px', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'Orbitron, monospace' }}>
            🎮 CREATE ACCOUNT
          </button>
        )}
      </div>

      {/* Announcement ticker */}
      <div style={{ background: '#ff453a11', borderTop: '1px solid #ff453a22', borderBottom: '1px solid #ff453a22', padding: '8px 0', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ whiteSpace: 'nowrap', animation: 'ticker 20s linear infinite', display: 'inline-block' }}>
          {['🔴 LIVE MATCHES HAPPENING NOW', `🎮 ${matches.filter(m => m.status === 'open').length} MATCHES OPEN FOR REGISTRATION`, '💰 WIN REAL CASH PRIZES', '📱 JOIN TELEGRAM FOR UPDATES', '⚡ INSTANT VERIFICATION'].map((t, i) => (
            <span key={i} style={{ color: '#ff453a', fontSize: 13, marginRight: 60, fontFamily: 'Orbitron, monospace' }}>• {t}</span>
          ))}
        </div>
      </div>

      {/* Map filters */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {['all', 'Erangel', 'Miramar', 'Sanhok', 'Livik', 'TDM'].map(map => (
            <button key={map} onClick={() => { playSound('click'); setMapFilter(map); }}
              style={{ flexShrink: 0, background: mapFilter === map ? '#ff453a' : '#1a1a1a', border: '1px solid ' + (mapFilter === map ? '#ff453a' : '#333'), borderRadius: 20, padding: '6px 14px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
              {map === 'all' ? '🌍 All' : `${MAP_EMOJIS[map]} ${map}`}
            </button>
          ))}
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', background: '#0d0d0d', borderRadius: 12, padding: 4 }}>
          {(['open', 'live', 'done'] as const).map(tab => {
            const count = matches.filter(m => m.status === tab && (mapFilter === 'all' || m.map === mapFilter)).length;
            return (
              <button key={tab} onClick={() => { playSound('click'); setActiveTab(tab); }}
                style={{ flex: 1, background: activeTab === tab ? '#ff453a' : 'none', border: 'none', borderRadius: 10, padding: '8px 4px', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: activeTab === tab ? 700 : 400 }}>
                {tab === 'open' ? '🟢' : tab === 'live' ? '🔴' : '✅'} {tab.charAt(0).toUpperCase() + tab.slice(1)} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Match cards */}
      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
            <p>No {activeTab} matches right now</p>
            <p style={{ fontSize: 13 }}>Check back soon or join our Telegram!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(match => (
              <MatchCard key={match.id} match={match} onRegister={m => {
                if (!currentUser) { showToast('Please login to register!', 'error'); setPage('profile'); return; }
                setSelectedMatch(m);
              }} />
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={{ padding: '48px 16px 24px' }}>
        <h2 style={{ textAlign: 'center', color: '#fff', fontFamily: 'Orbitron, monospace', marginBottom: 32, fontSize: 22 }}>HOW IT WORKS</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { step: '01', icon: '📝', title: 'Register', desc: 'Create account & choose a match' },
            { step: '02', icon: '💳', title: 'Pay ₹20', desc: 'Pay entry via UPI & upload proof' },
            { step: '03', icon: '✅', title: 'Get Verified', desc: 'Admin verifies & shares Room ID' },
            { step: '04', icon: '🏆', title: 'Win Cash', desc: 'Play, win & get prize in wallet' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 11, color: '#ff453a', marginBottom: 8 }}>{step}</div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
              <h3 style={{ color: '#fff', marginBottom: 4, fontSize: 16 }}>{title}</h3>
              <p style={{ color: '#555', fontSize: 13, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ padding: '24px 16px' }}>
        <h2 style={{ textAlign: 'center', color: '#fff', fontFamily: 'Orbitron, monospace', marginBottom: 24, fontSize: 20 }}>PLAYER REVIEWS</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {[
            { name: 'SHADOW_KILLER', text: 'Won ₹400 in my first match! Instant payment!', rating: 5, emoji: '😎' },
            { name: 'PRO_SNIPER99', text: 'Best tournament platform. 100% legit!', rating: 5, emoji: '🎯' },
            { name: 'RUSH_MASTER', text: 'Room ID comes quickly. Admin is responsive!', rating: 5, emoji: '⚡' },
            { name: 'CLUTCH_KING', text: 'Playing daily! Great matches and prizes.', rating: 5, emoji: '👑' },
          ].map(({ name, text, rating, emoji }) => (
            <div key={name} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #ff453a, #ff9f0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{emoji}</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{name}</div>
                  <div style={{ color: '#ffd700', fontSize: 12 }}>{'⭐'.repeat(rating)}</div>
                </div>
              </div>
              <p style={{ color: '#888', fontSize: 13, margin: 0, fontStyle: 'italic' }}>"{text}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: '24px 16px' }}>
        <h2 style={{ textAlign: 'center', color: '#fff', fontFamily: 'Orbitron, monospace', marginBottom: 24, fontSize: 20 }}>FAQ</h2>
        {[
          { q: 'How do I register?', a: 'Create an account, choose a match, pay ₹20, upload payment screenshot.' },
          { q: 'When do I get Room ID?', a: 'After admin verifies your payment. Usually within 30 minutes.' },
          { q: 'How are prizes paid?', a: 'Prizes are sent directly to your UPI ID after match results.' },
          { q: 'What if I win?', a: 'Upload your result screenshot in Results section for prize claim.' },
          { q: 'Is it safe?', a: 'Yes! We use Firebase for data security and Telegram for transparency.' },
        ].map(({ q, a }, i) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [open, setOpen] = useState(false);
          return (
            <div key={i} style={{ borderBottom: '1px solid #1a1a1a', marginBottom: 8 }}>
              <button onClick={() => setOpen(!open)} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: '#fff', fontSize: 15, textAlign: 'left' }}>
                <span>{q}</span><span style={{ color: '#ff453a', fontSize: 20 }}>{open ? '−' : '+'}</span>
              </button>
              {open && <p style={{ color: '#888', fontSize: 14, paddingBottom: 12, margin: 0 }}>{a}</p>}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '32px 16px', borderTop: '1px solid #1a1a1a', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎮</div>
        <div style={{ fontFamily: 'Orbitron, monospace', color: '#ff453a', fontSize: 18, marginBottom: 16 }}>JEETO</div>
        <div style={{ color: '#555', fontSize: 13, marginBottom: 16 }}>India's #1 BGMI Tournament Platform</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <a href="mailto:shontyvishwakarma@gmail.com" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>✉️ shontyvishwakarma@gmail.com</a>
          <a href="mailto:liju9546@gmail.com" style={{ color: '#888', fontSize: 13, textDecoration: 'none' }}>✉️ liju9546@gmail.com</a>
        </div>
        <p style={{ color: '#333', fontSize: 12 }}>© 2025 JEETO. All rights reserved.</p>
      </div>

      {/* Registration Modal */}
      {selectedMatch && <RegistrationModal match={selectedMatch} onClose={() => setSelectedMatch(null)} showToast={showToast} />}

      <style>{`
        @keyframes ticker { 0%{transform:translateX(100%)} 100%{transform:translateX(-100%)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

// ==================== PROFILE PAGE (Login/Signup/Profile) ====================
function ProfilePage({ showToast }: { showToast: (msg: string, type: 'success' | 'error' | 'info') => void }) {
  const { currentUser, loginUser, signupUser, logoutUser, updateUserProfile, requestWithdrawal, submitAddCash } = useStore();
  const [view, setView] = useState<'landing' | 'login' | 'signup'>('landing');
  const [tab, setTab] = useState('overview');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bgmiName, setBgmiName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editBgmi, setEditBgmi] = useState('');
  const [editUpi, setEditUpi] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [addCashAmount, setAddCashAmount] = useState('');
  const [addCashFile, setAddCashFile] = useState<File | null>(null);

  // If user is logged in — show profile directly
  if (currentUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', paddingTop: 60, paddingBottom: 80 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>

          {/* Profile header */}
          <div style={{ background: 'linear-gradient(135deg, #ff453a22, #ff9f0a22)', border: '1px solid #ff453a33', borderRadius: 20, padding: 24, textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #ff453a, #ff9f0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, margin: '0 auto 12px', color: '#fff' }}>
              {currentUser.displayName[0]?.toUpperCase()}
            </div>
            <h2 style={{ color: '#fff', fontFamily: 'Orbitron, monospace', fontSize: 20, marginBottom: 4 }}>{currentUser.displayName}</h2>
            <p style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>{currentUser.email}</p>
            {currentUser.isBanned && (
              <div style={{ background: '#ff453a22', border: '1px solid #ff453a', borderRadius: 8, padding: '6px 12px', color: '#ff453a', fontSize: 13, marginBottom: 8 }}>🚫 Account Banned: {currentUser.banReason}</div>
            )}
            <button onClick={() => { logoutUser(); showToast('Logged out!', 'info'); playSound('click'); }}
              style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '8px 20px', color: '#888', cursor: 'pointer', fontSize: 14 }}>
              🚪 Logout
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#0d0d0d', borderRadius: 12, padding: 4, marginBottom: 20 }}>
            {['overview', 'wallet', 'history'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? '#ff453a' : 'none', border: 'none', borderRadius: 10, padding: '8px 4px', color: '#fff', fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
                {t === 'overview' ? '👤' : t === 'wallet' ? '💰' : '📋'} {t}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Matches', value: currentUser.totalMatchesPlayed || 0, icon: '🎮' },
                  { label: 'Spent', value: `₹${currentUser.totalMoneySpent || 0}`, icon: '💸' },
                  { label: 'Winnings', value: `₹${currentUser.totalWinnings || 0}`, icon: '🏆' },
                  { label: 'Balance', value: `₹${currentUser.walletBalance || 0}`, icon: '💰' },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{value}</div>
                    <div style={{ color: '#555', fontSize: 12 }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                {editMode ? (
                  <>
                    <h3 style={{ color: '#fff', marginBottom: 16, fontSize: 16 }}>✏️ Edit Profile</h3>
                    {[
                      { label: 'BGMI Name', value: editBgmi, set: setEditBgmi },
                      { label: 'UPI ID', value: editUpi, set: setEditUpi },
                    ].map(({ label, value, set }) => (
                      <div key={label} style={{ marginBottom: 12 }}>
                        <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 4 }}>{label}</label>
                        <input value={value} onChange={e => set(e.target.value)} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={async () => {
                        await updateUserProfile(currentUser.uid, { bgmiName: editBgmi, upiId: editUpi });
                        setEditMode(false); showToast('Profile updated!', 'success'); playSound('success');
                      }} style={{ flex: 1, background: '#30d158', border: 'none', borderRadius: 8, padding: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Save</button>
                      <button onClick={() => setEditMode(false)} style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '10px', color: '#888', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ color: '#fff', fontSize: 16, margin: 0 }}>Profile Info</h3>
                      <button onClick={() => { setEditBgmi(currentUser.bgmiName); setEditUpi(currentUser.upiId); setEditMode(true); }}
                        style={{ background: '#ff453a22', border: '1px solid #ff453a44', borderRadius: 8, padding: '6px 12px', color: '#ff453a', cursor: 'pointer', fontSize: 13 }}>✏️ Edit</button>
                    </div>
                    {[
                      { label: 'BGMI Name', value: currentUser.bgmiName || 'Not set' },
                      { label: 'Character ID', value: currentUser.characterId || 'Not set' },
                      { label: 'UPI ID', value: currentUser.upiId || 'Not set ⚠️' },
                      { label: 'Referral Code', value: currentUser.referralCode || 'N/A' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a1a', fontSize: 14 }}>
                        <span style={{ color: '#555' }}>{label}</span>
                        <span style={{ color: value.includes('Not set') ? '#ff453a' : '#fff' }}>{value}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          )}

          {/* Wallet tab */}
          {tab === 'wallet' && (
            <>
              <div style={{ background: 'linear-gradient(135deg, #ffd70022, #ff9f0a22)', border: '1px solid #ffd70033', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Available Balance</div>
                <div style={{ fontSize: 48, fontWeight: 700, color: '#ffd700', fontFamily: 'Orbitron, monospace' }}>₹{currentUser.walletBalance || 0}</div>
              </div>

              {/* Add Cash */}
              <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 16 }}>➕ Add Cash</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {[50, 100, 200, 500].map(amt => (
                    <button key={amt} onClick={() => setAddCashAmount(amt.toString())}
                      style={{ background: addCashAmount === amt.toString() ? '#ff453a' : '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input value={addCashAmount} onChange={e => setAddCashAmount(e.target.value)} placeholder="Custom amount" type="number"
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
                <div style={{ background: '#111', borderRadius: 10, padding: 12, marginBottom: 12, textAlign: 'center' }}>
                  <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>Pay to UPI: <strong style={{ color: '#fff' }}>{UPI_ID}</strong></div>
                  <button onClick={() => { navigator.clipboard.writeText(UPI_ID); showToast('Copied!', 'success'); }}
                    style={{ background: '#ff453a22', border: '1px solid #ff453a44', borderRadius: 6, padding: '4px 12px', color: '#ff453a', cursor: 'pointer', fontSize: 13 }}>📋 Copy</button>
                </div>
                <label style={{ display: 'block', background: addCashFile ? '#30d15822' : '#1a1a1a', border: `2px dashed ${addCashFile ? '#30d158' : '#333'}`, borderRadius: 10, padding: 16, textAlign: 'center', cursor: 'pointer', marginBottom: 12 }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setAddCashFile(e.target.files?.[0] || null)} />
                  <span style={{ color: addCashFile ? '#30d158' : '#555', fontSize: 14 }}>{addCashFile ? `✅ ${addCashFile.name}` : '📷 Upload payment screenshot'}</span>
                </label>
                <button onClick={async () => {
                  if (!addCashAmount || !addCashFile) { showToast('Enter amount and upload screenshot!', 'error'); return; }
                  setLoading(true);
                  try { await submitAddCash(Number(addCashAmount), addCashFile); showToast('Request submitted! Admin will approve soon.', 'success'); playSound('success'); setAddCashAmount(''); setAddCashFile(null); }
                  catch (e) { showToast('Failed to submit. Try again!', 'error'); }
                  finally { setLoading(false); }
                }} disabled={loading}
                  style={{ width: '100%', background: '#30d158', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
                  {loading ? '⏳ Submitting...' : '➕ Submit Add Cash Request'}
                </button>
              </div>

              {/* Withdraw */}
              <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16, padding: 20 }}>
                <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 16 }}>💸 Withdraw</h3>
                {!currentUser.upiId ? (
                  <div style={{ background: '#ff453a11', border: '1px solid #ff453a33', borderRadius: 10, padding: 16, color: '#ff453a', fontSize: 14, textAlign: 'center' }}>
                    ⚠️ Add UPI ID in Profile Overview to withdraw
                  </div>
                ) : (
                  <>
                    <div style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>Will be sent to: <strong style={{ color: '#fff' }}>{currentUser.upiId}</strong></div>
                    <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder={`Max: ₹${currentUser.walletBalance || 0}`} type="number"
                      style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
                    <button onClick={async () => {
                      const amt = Number(withdrawAmount);
                      if (!amt || amt <= 0) { showToast('Enter valid amount!', 'error'); return; }
                      if (amt > (currentUser.walletBalance || 0)) { showToast('Insufficient balance!', 'error'); return; }
                      setLoading(true);
                      try { await requestWithdrawal(amt); showToast('Withdrawal requested! Admin will process soon.', 'success'); playSound('success'); setWithdrawAmount(''); }
                      catch (e) { showToast('Failed. Try again!', 'error'); }
                      finally { setLoading(false); }
                    }} disabled={loading}
                      style={{ width: '100%', background: '#ff453a', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
                      {loading ? '⏳ Processing...' : '💸 Request Withdrawal'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* History tab */}
          {tab === 'history' && (
            <div>
              {(currentUser.matchHistory || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
                  <p>No matches played yet</p>
                  <p style={{ fontSize: 13 }}>Register for a match to get started!</p>
                </div>
              ) : (
                [...(currentUser.matchHistory || [])].reverse().map((item, i) => (
                  <div key={i} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{MAP_EMOJIS[item.map]} {item.map} ({item.type})</span>
                      <span style={{ color: item.result === 'won' ? '#30d158' : item.result === 'lost' ? '#ff453a' : '#ffd700', fontSize: 13 }}>
                        {item.result === 'won' ? '🏆 Won' : item.result === 'lost' ? '❌ Lost' : '⏳ Pending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#555' }}>{item.date} • {item.time}</span>
                      <span style={{ color: '#888' }}>Entry: ₹{item.entryFee}</span>
                    </div>
                    {item.prize > 0 && <div style={{ color: '#ffd700', fontSize: 14, marginTop: 4 }}>Prize: ₹{item.prize}</div>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Not logged in — show landing/login/signup
  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingTop: 60, paddingBottom: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>

        {/* Landing */}
        {view === 'landing' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>👤</div>
            <h2 style={{ color: '#fff', fontFamily: 'Orbitron, monospace', fontSize: 24, marginBottom: 8 }}>Your Profile</h2>
            <p style={{ color: '#888', marginBottom: 32, fontSize: 15 }}>Login or create account to view your profile, wallet, and match history</p>
            <button onClick={() => { playSound('click'); setView('login'); }}
              style={{ width: '100%', background: 'linear-gradient(135deg, #ff453a, #ff9f0a)', border: 'none', borderRadius: 14, padding: '16px', color: '#fff', fontWeight: 700, fontSize: 18, cursor: 'pointer', marginBottom: 12, fontFamily: 'Orbitron, monospace' }}>
              🔐 LOGIN
            </button>
            <button onClick={() => { playSound('click'); setView('signup'); }}
              style={{ width: '100%', background: '#0d0d0d', border: '1px solid #333', borderRadius: 14, padding: '16px', color: '#fff', fontWeight: 700, fontSize: 18, cursor: 'pointer', fontFamily: 'Orbitron, monospace' }}>
              📝 CREATE ACCOUNT
            </button>
          </div>
        )}

        {/* Login */}
        {view === 'login' && (
          <div>
            <button onClick={() => setView('landing')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 24, marginBottom: 20 }}>←</button>
            <h2 style={{ color: '#fff', fontFamily: 'Orbitron, monospace', fontSize: 24, marginBottom: 24 }}>🔐 Login</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
                style={{ width: '100%', background: '#0d0d0d', border: '1px solid #333', borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && !loading && document.getElementById('loginBtn')?.click()}
                  style={{ width: '100%', background: '#0d0d0d', border: '1px solid #333', borderRadius: 12, padding: '14px 48px 14px 16px', color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}>{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <button id="loginBtn" onClick={async () => {
              if (!email || !password) { showToast('Fill all fields!', 'error'); playSound('error'); return; }
              setLoading(true);
              try {
                await loginUser(email, password);
                showToast('Welcome back! 🎮', 'success');
                playSound('success');
              } catch (err) {
                const msg = err instanceof Error ? err.message : 'Login failed!';
                showToast(msg, 'error');
                playSound('error');
              } finally { setLoading(false); }
            }} disabled={loading}
              style={{ width: '100%', background: loading ? '#333' : 'linear-gradient(135deg, #ff453a, #ff9f0a)', border: 'none', borderRadius: 12, padding: '16px', color: '#fff', fontWeight: 700, fontSize: 18, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Orbitron, monospace' }}>
              {loading ? '⏳ Logging in...' : '🔐 LOGIN'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, color: '#555', fontSize: 14 }}>
              No account? <button onClick={() => setView('signup')} style={{ background: 'none', border: 'none', color: '#ff453a', cursor: 'pointer', fontSize: 14 }}>Create one</button>
            </p>
          </div>
        )}

        {/* Signup */}
        {view === 'signup' && (
          <div>
            <button onClick={() => setView('landing')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 24, marginBottom: 20 }}>←</button>
            <h2 style={{ color: '#fff', fontFamily: 'Orbitron, monospace', fontSize: 24, marginBottom: 24 }}>📝 Create Account</h2>
            {[
              { label: 'Display Name', value: displayName, set: setDisplayName, placeholder: 'Your name', type: 'text' },
              { label: 'BGMI Name', value: bgmiName, set: setBgmiName, placeholder: 'In-game name', type: 'text' },
              { label: 'Email', value: email, set: setEmail, placeholder: 'your@email.com', type: 'email' },
              { label: 'Password (min 6 chars)', value: password, set: setPassword, placeholder: '••••••••', type: showPass ? 'text' : 'password' },
            ].map(({ label, value, set, placeholder, type }) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>{label}</label>
                <input value={value} onChange={e => set(e.target.value)} type={type} placeholder={placeholder}
                  style={{ width: '100%', background: '#0d0d0d', border: '1px solid #333', borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ background: '#1a1a1a', borderRadius: 10, padding: 12, marginBottom: 20, fontSize: 13, color: '#888' }}>
              💡 UPI ID can be added later in Profile
            </div>
            <button onClick={async () => {
              if (!displayName || !bgmiName || !email || !password) { showToast('Fill all required fields!', 'error'); playSound('error'); return; }
              if (password.length < 6) { showToast('Password must be at least 6 characters!', 'error'); return; }
              setLoading(true);
              try {
                await signupUser(email, password, displayName, bgmiName);
                showToast('Account created! Please login.', 'success');
                playSound('success');
                setView('login');
              } catch (err) {
                const msg = err instanceof Error ? err.message : 'Signup failed!';
                showToast(msg, 'error');
                playSound('error');
              } finally { setLoading(false); }
            }} disabled={loading}
              style={{ width: '100%', background: loading ? '#333' : 'linear-gradient(135deg, #ff453a, #ff9f0a)', border: 'none', borderRadius: 12, padding: '16px', color: '#fff', fontWeight: 700, fontSize: 18, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Orbitron, monospace' }}>
              {loading ? '⏳ Creating...' : '📝 CREATE ACCOUNT'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, color: '#555', fontSize: 14 }}>
              Have account? <button onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: '#ff453a', cursor: 'pointer', fontSize: 14 }}>Login</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== WINNERS PAGE ====================
function WinnersPage() {
  const { matches } = useStore();
  const announced = matches.filter(m => m.winnersAnnounced);
  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingTop: 80, paddingBottom: 80, padding: '80px 16px' }}>
      <h1 style={{ textAlign: 'center', color: '#fff', fontFamily: 'Orbitron, monospace', fontSize: 28, marginBottom: 8 }}>🏆 WINNERS</h1>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: 32 }}>Past match champions</p>
      {announced.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
          <p>No winners announced yet</p>
        </div>
      ) : (
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {announced.map(match => (
            <div key={match.id} style={{ background: '#0d0d0d', border: '1px solid #ffd70033', borderRadius: 20, padding: 24 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ background: '#ffd70022', border: '1px solid #ffd70044', borderRadius: 8, padding: '4px 12px', color: '#ffd700', fontSize: 13 }}>{MAP_EMOJIS[match.map]} {match.map} ({match.type}) — {match.time}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
                {[
                  { place: '🥇', name: match.winner1, prize: Math.floor(getPrizePool(match) * 0.5), color: '#ffd700', size: 72 },
                  { place: '🥈', name: match.winner2, prize: Math.floor(getPrizePool(match) * 0.3), color: '#c0c0c0', size: 60 },
                  { place: '🥉', name: match.winner3, prize: Math.floor(getPrizePool(match) * 0.2), color: '#cd7f32', size: 60 },
                ].filter(w => w.name).map(({ place, name, prize, color, size }) => (
                  <div key={place} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: size === 72 ? 40 : 32, marginBottom: 4 }}>{place}</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{name}</div>
                    <div style={{ color, fontSize: 16, fontWeight: 700 }}>₹{prize}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', color: '#555', fontSize: 13 }}>Total Prize: ₹{getPrizePool(match)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== LEADERBOARD ====================
function LeaderboardPage() {
  const { matches } = useStore();
  const playerMap: Record<string, { name: string; matches: number; verified: number }> = {};
  matches.forEach(match => {
    (match.players || []).forEach(p => {
      if (!playerMap[p.characterId]) playerMap[p.characterId] = { name: p.bgmiName, matches: 0, verified: 0 };
      playerMap[p.characterId].matches++;
      if (p.verified) playerMap[p.characterId].verified++;
    });
  });
  const players = Object.values(playerMap).sort((a, b) => b.matches - a.matches).slice(0, 20);

  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingTop: 80, paddingBottom: 80, padding: '80px 16px' }}>
      <h1 style={{ textAlign: 'center', color: '#fff', fontFamily: 'Orbitron, monospace', fontSize: 28, marginBottom: 8 }}>📊 LEADERBOARD</h1>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: 32 }}>Top players by matches played</p>
      {players.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
          <p>No players yet — be the first!</p>
        </div>
      ) : (
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          {/* Top 3 podium */}
          {players.length >= 3 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 32, height: 160 }}>
              {[{ i: 1, h: 100, emoji: '🥈', color: '#c0c0c0' }, { i: 0, h: 140, emoji: '🥇', color: '#ffd700' }, { i: 2, h: 80, emoji: '🥉', color: '#cd7f32' }].map(({ i, h, emoji, color }) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{emoji}</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{players[i]?.name}</div>
                  <div style={{ background: `${color}22`, border: `1px solid ${color}44`, borderRadius: '8px 8px 0 0', height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color, fontWeight: 700, fontSize: 18 }}>{players[i]?.matches}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {players.map((p, i) => (
            <div key={i} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : '#555', fontWeight: 700, width: 24, textAlign: 'center' }}>#{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: '#555', fontSize: 12 }}>{p.matches} matches • {p.verified} verified</div>
              </div>
              {p.matches >= 10 ? <span title="Veteran">🏅</span> : p.matches >= 5 ? <span title="Pro">⚡</span> : p.matches >= 3 ? <span title="Regular">🎮</span> : <span title="Rookie">🌟</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== ADMIN PANEL ====================
function AdminPanel({ showToast }: { showToast: (msg: string, type: 'success' | 'error' | 'info') => void }) {
  const { matches, withdrawals, addCashRequests, loginAdmin, logoutAdmin, adminLoggedIn, createMatch, updateStatus, updatePlayers, updateRoomInfo, updatePrizePool, deleteMatch, verifyPlayer, markPrizeSent, banPlayer, announceWinners, approveWithdrawal, rejectWithdrawal, approveAddCash, rejectAddCash } = useStore();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState('matches');
  const [newMap, setNewMap] = useState('Erangel');
  const [newType, setNewType] = useState('Solo');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('20:00');
  const [roomInputs, setRoomInputs] = useState<Record<string, { id: string; pass: string }>>({});
  const [prizeInputs, setPrizeInputs] = useState<Record<string, { total: string; first: string; second: string; third: string }>>({});
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [winnerInputs, setWinnerInputs] = useState({ first: '', second: '', third: '' });
  const [banReason, setBanReason] = useState('');

  if (!adminLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 360, background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 20, padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔐</div>
            <h2 style={{ color: '#fff', fontFamily: 'Orbitron, monospace' }}>ADMIN LOGIN</h2>
          </div>
          {[
            { label: 'Email', value: email, set: setEmail, type: 'email' },
            { label: 'Password', value: pass, set: setPass, type: 'password' },
          ].map(({ label, value, set, type }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>{label}</label>
              <input value={value} onChange={e => set(e.target.value)} type={type}
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          <button onClick={() => {
            if (loginAdmin(email, pass)) { showToast('Welcome Admin! 👑', 'success'); playSound('success'); }
            else { showToast('Invalid credentials!', 'error'); playSound('error'); }
          }} style={{ width: '100%', background: 'linear-gradient(135deg, #ff453a, #ff9f0a)', border: 'none', borderRadius: 10, padding: '14px', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            Login →
          </button>
        </div>
      </div>
    );
  }

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
  const pendingAddCash = addCashRequests.filter(r => r.status === 'pending').length;
  const totalCollection = matches.reduce((s, m) => s + m.registeredPlayers * 20, 0);
  const _totalPrize = matches.reduce((s, m) => s + getPrizePool(m), 0); void _totalPrize;

  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingTop: 60, paddingBottom: 80 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ color: '#fff', fontFamily: 'Orbitron, monospace', fontSize: 20 }}>⚙️ ADMIN</h1>
          <button onClick={() => { logoutAdmin(); showToast('Logged out!', 'info'); }} style={{ background: '#ff453a22', border: '1px solid #ff453a44', borderRadius: 8, padding: '8px 16px', color: '#ff453a', cursor: 'pointer', fontSize: 13 }}>🚪 Logout</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Matches', value: matches.length, icon: '🎮' },
            { label: 'Players', value: matches.reduce((s, m) => s + m.registeredPlayers, 0), icon: '👥' },
            { label: 'Collection', value: `₹${totalCollection}`, icon: '💰' },
            { label: 'Your Profit', value: `₹${Math.floor(totalCollection * 0.6)}`, icon: '📈' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{value}</div>
                <div style={{ color: '#555', fontSize: 12 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
          {[
            { id: 'matches', label: '🎮 Matches' },
            { id: 'create', label: '➕ Create' },
            { id: 'players', label: '👥 Players' },
            { id: 'winners', label: '🏆 Winners' },
            { id: 'withdraw', label: `💸 Withdraw ${pendingWithdrawals > 0 ? `(${pendingWithdrawals})` : ''}` },
            { id: 'addcash', label: `💰 Cash ${pendingAddCash > 0 ? `(${pendingAddCash})` : ''}` },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} style={{ flexShrink: 0, background: tab === id ? '#ff453a' : '#0d0d0d', border: '1px solid ' + (tab === id ? '#ff453a' : '#333'), borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        {/* MATCHES TAB */}
        {tab === 'matches' && matches.map(match => (
          <div key={match.id} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={{ color: '#fff', fontWeight: 700 }}>{MAP_EMOJIS[match.map]} {match.map} ({match.type})</span>
                <div style={{ color: '#555', fontSize: 13 }}>{match.date} • {match.time}</div>
              </div>
              <button onClick={async () => { if (confirm('Delete?')) { await deleteMatch(match.id); showToast('Deleted!', 'info'); playSound('click'); } }}
                style={{ background: '#ff453a22', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#ff453a', cursor: 'pointer', fontSize: 18 }}>🗑️</button>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {(['open', 'live', 'done'] as const).map(s => (
                <button key={s} onClick={async () => { await updateStatus(match.id, s); playSound('click'); }}
                  style={{ background: match.status === s ? (s === 'open' ? '#30d158' : s === 'live' ? '#ff453a' : '#555') : '#1a1a1a', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: match.status === s ? 700 : 400 }}>
                  {s === 'open' ? '🟢 OPEN' : s === 'live' ? '🔴 LIVE' : '✅ DONE'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: '#888', fontSize: 13 }}>Players: {match.registeredPlayers}/{match.maxPlayers}</span>
              <button onClick={async () => { await updatePlayers(match.id, match.registeredPlayers - 1); }} style={{ background: '#1a1a1a', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#fff', cursor: 'pointer' }}>−</button>
              <button onClick={async () => { await updatePlayers(match.id, match.registeredPlayers + 1); }} style={{ background: '#1a1a1a', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#fff', cursor: 'pointer' }}>+</button>
              <span style={{ color: '#ffd700', fontSize: 13 }}>Prize: ₹{getPrizePool(match)}</span>
            </div>

            {/* Room ID */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input placeholder="Room ID" value={roomInputs[match.id]?.id ?? match.roomId}
                onChange={e => setRoomInputs(r => ({ ...r, [match.id]: { id: e.target.value, pass: r[match.id]?.pass ?? match.roomPassword } }))}
                style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, outline: 'none' }} />
              <input placeholder="Password" value={roomInputs[match.id]?.pass ?? match.roomPassword}
                onChange={e => setRoomInputs(r => ({ ...r, [match.id]: { id: r[match.id]?.id ?? match.roomId, pass: e.target.value } }))}
                style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, outline: 'none' }} />
              <button onClick={async () => { const r = roomInputs[match.id]; await updateRoomInfo(match.id, r?.id ?? match.roomId, r?.pass ?? match.roomPassword); showToast('Room updated!', 'success'); playSound('success'); }}
                style={{ background: '#30d158', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontSize: 14 }}>Save</button>
            </div>

            {/* Prize inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[
                { label: 'Total', key: 'total' as const, current: match.customPrizePool },
                { label: '1st', key: 'first' as const, current: match.prizeFirst },
                { label: '2nd', key: 'second' as const, current: match.prizeSecond },
                { label: '3rd', key: 'third' as const, current: match.prizeThird },
              ].map(({ label, key, current }) => (
                <div key={key}>
                  <div style={{ color: '#555', fontSize: 11, marginBottom: 4 }}>{label}</div>
                  <input type="number" placeholder={`${current}`} value={prizeInputs[match.id]?.[key] ?? ''}
                    onChange={e => setPrizeInputs(p => ({ ...p, [match.id]: { ...p[match.id], [key]: e.target.value } }))}
                    style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: '6px 8px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <button onClick={async () => {
              const p = prizeInputs[match.id] || {};
              await updatePrizePool(match.id, Number(p.total || 0), Number(p.first || 0), Number(p.second || 0), Number(p.third || 0));
              showToast('Prize updated!', 'success'); playSound('success');
            }} style={{ marginTop: 8, background: '#ff9f0a22', border: '1px solid #ff9f0a44', borderRadius: 8, padding: '6px 14px', color: '#ff9f0a', cursor: 'pointer', fontSize: 13 }}>💰 Update Prize</button>
          </div>
        ))}

        {/* CREATE TAB */}
        {tab === 'create' && (
          <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16, padding: 24 }}>
            <h2 style={{ color: '#fff', fontFamily: 'Orbitron, monospace', marginBottom: 20, fontSize: 18 }}>➕ Create Match</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>Map</label>
                <select value={newMap} onChange={e => setNewMap(e.target.value)} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 15, outline: 'none' }}>
                  {['Erangel', 'Miramar', 'Sanhok', 'Livik', 'TDM'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>Type</label>
                <select value={newType} onChange={e => setNewType(e.target.value)} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 15, outline: 'none' }}>
                  {['Solo', 'Duo', 'Squad'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>Date</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>Time</label>
                <select value={newTime} onChange={e => setNewTime(e.target.value)} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 15, outline: 'none' }}>
                  {Array.from({ length: 19 }, (_, i) => { const h = (i + 8) % 24; return `${h.toString().padStart(2, '0')}:00`; }).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button onClick={async () => {
              if (!newDate) { showToast('Select a date!', 'error'); return; }
              await createMatch(newMap, newType, newDate, newTime);
              showToast('Match created! 🎮', 'success'); playSound('success');
            }} style={{ width: '100%', marginTop: 20, background: 'linear-gradient(135deg, #ff453a, #ff9f0a)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              🎮 Create Match
            </button>
          </div>
        )}

        {/* PLAYERS TAB */}
        {tab === 'players' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>Select Match</label>
              <select value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 15, outline: 'none' }}>
                <option value="">-- Select Match --</option>
                {matches.map(m => <option key={m.id} value={m.id}>{MAP_EMOJIS[m.map]} {m.map} ({m.type}) — {m.time} — {m.registeredPlayers} players</option>)}
              </select>
            </div>
            {selectedMatchId && (() => {
              const match = matches.find(m => m.id === selectedMatchId);
              if (!match) return null;
              return match.players.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}><p>No players registered yet</p></div>
              ) : (
                match.players.map((player, i) => (
                  <div key={player.id} style={{ background: '#0d0d0d', border: `1px solid ${player.banned ? '#ff453a44' : '#1a1a1a'}`, borderRadius: 12, padding: 16, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <span style={{ color: '#fff', fontWeight: 700 }}>#{i + 1} {player.bgmiName}</span>
                        {player.banned && <span style={{ background: '#ff453a22', border: '1px solid #ff453a44', borderRadius: 4, padding: '2px 6px', color: '#ff453a', fontSize: 11, marginLeft: 6 }}>BANNED</span>}
                        {player.verified && <span style={{ background: '#30d15822', border: '1px solid #30d15844', borderRadius: 4, padding: '2px 6px', color: '#30d158', fontSize: 11, marginLeft: 6 }}>VERIFIED</span>}
                      </div>
                    </div>
                    <div style={{ color: '#555', fontSize: 13, marginBottom: 8 }}>
                      <div>🆔 {player.characterId}</div>
                      <div>💳 {player.upiId || 'No UPI'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {!player.verified && !player.banned && (
                        <button onClick={async () => { await verifyPlayer(match.id, player.id); showToast('Player verified!', 'success'); playSound('success'); }}
                          style={{ background: '#30d15822', border: '1px solid #30d15844', borderRadius: 8, padding: '6px 12px', color: '#30d158', cursor: 'pointer', fontSize: 13 }}>✅ Verify</button>
                      )}
                      {!player.prizeSent && player.verified && (
                        <button onClick={async () => { const prize = Math.floor(getPrizePool(match) * 0.5); await markPrizeSent(match.id, player.id, prize); showToast(`Prize ₹${prize} marked!`, 'success'); playSound('success'); }}
                          style={{ background: '#ffd70022', border: '1px solid #ffd70044', borderRadius: 8, padding: '6px 12px', color: '#ffd700', cursor: 'pointer', fontSize: 13 }}>💰 Prize Sent</button>
                      )}
                      {player.prizeSent && <span style={{ color: '#30d158', fontSize: 13 }}>✅ Prize Sent</span>}
                      {!player.banned && (
                        <>
                          <select value={banReason} onChange={e => setBanReason(e.target.value)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '6px', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                            <option value="">Ban reason...</option>
                            {['Fake Character ID', 'Payment fraud', 'Hacking/Cheating', 'Abusive behavior'].map(r => <option key={r}>{r}</option>)}
                          </select>
                          <button onClick={async () => { if (!banReason) { showToast('Select ban reason!', 'error'); return; } await banPlayer(match.id, player.id, banReason); showToast('Player banned!', 'info'); playSound('error'); }}
                            style={{ background: '#ff453a22', border: '1px solid #ff453a44', borderRadius: 8, padding: '6px 12px', color: '#ff453a', cursor: 'pointer', fontSize: 13 }}>🚫 Ban</button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              );
            })()}
          </>
        )}

        {/* WINNERS TAB */}
        {tab === 'winners' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>Select Completed Match</label>
              <select value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 15, outline: 'none' }}>
                <option value="">-- Select Match --</option>
                {matches.filter(m => m.status === 'done').map(m => <option key={m.id} value={m.id}>{MAP_EMOJIS[m.map]} {m.map} ({m.type}) — {m.time}</option>)}
              </select>
            </div>
            {selectedMatchId && (
              <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16, padding: 24 }}>
                <h3 style={{ color: '#fff', fontSize: 16, marginBottom: 16 }}>🏆 Announce Winners</h3>
                {[
                  { label: '🥇 1st Place Winner', key: 'first' as const },
                  { label: '🥈 2nd Place Winner', key: 'second' as const },
                  { label: '🥉 3rd Place Winner', key: 'third' as const },
                ].map(({ label, key }) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 6 }}>{label}</label>
                    <input value={winnerInputs[key]} onChange={e => setWinnerInputs(w => ({ ...w, [key]: e.target.value }))} placeholder="BGMI Name"
                      style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <button onClick={async () => {
                  await announceWinners(selectedMatchId, winnerInputs.first, winnerInputs.second, winnerInputs.third);
                  const match = matches.find(m => m.id === selectedMatchId);
                  const prize = match ? getPrizePool(match) : 0;
                  const msg = `🏆 MATCH RESULTS!\n\n🗺️ ${match?.map} (${match?.type})\n\n🥇 1st: ${winnerInputs.first} — ₹${Math.floor(prize * 0.5)}\n🥈 2nd: ${winnerInputs.second} — ₹${Math.floor(prize * 0.3)}\n🥉 3rd: ${winnerInputs.third} — ₹${Math.floor(prize * 0.2)}\n\n💰 Total: ₹${prize}`;
                  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: CHAT_ID, text: msg }) });
                  showToast('Winners announced on Telegram! 🏆', 'success'); playSound('success');
                }} style={{ width: '100%', background: 'linear-gradient(135deg, #ffd700, #ff9f0a)', border: 'none', borderRadius: 12, padding: '14px', color: '#000', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                  🏆 Announce & Post to Telegram
                </button>
              </div>
            )}
          </>
        )}

        {/* WITHDRAW TAB */}
        {tab === 'withdraw' && (
          withdrawals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>
              <p>No withdrawal requests</p>
            </div>
          ) : withdrawals.map(w => (
            <div key={w.id} style={{ background: '#0d0d0d', border: `1px solid ${w.status === 'pending' ? '#ffd70033' : '#1a1a1a'}`, borderRadius: 12, padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{w.userName}</div>
                  <div style={{ color: '#555', fontSize: 13 }}>{w.userEmail}</div>
                </div>
                <div style={{ color: '#ffd700', fontWeight: 700, fontSize: 20 }}>₹{w.amount}</div>
              </div>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>
                <div>💳 UPI: <button onClick={() => { navigator.clipboard.writeText(w.upiId); showToast('Copied!', 'success'); }} style={{ background: '#1a1a1a', border: 'none', borderRadius: 4, padding: '2px 8px', color: '#fff', cursor: 'pointer', fontSize: 13 }}>{w.upiId} 📋</button></div>
                <div>🎮 BGMI: {w.bgmiName}</div>
              </div>
              {w.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={async () => { await approveWithdrawal(w.id); showToast('Withdrawal approved!', 'success'); playSound('success'); }}
                    style={{ flex: 1, background: '#30d15822', border: '1px solid #30d15844', borderRadius: 8, padding: '8px', color: '#30d158', cursor: 'pointer', fontWeight: 700 }}>✅ Approve</button>
                  <button onClick={async () => { await rejectWithdrawal(w.id, 'Rejected by admin'); showToast('Rejected & refunded!', 'info'); }}
                    style={{ flex: 1, background: '#ff453a22', border: '1px solid #ff453a44', borderRadius: 8, padding: '8px', color: '#ff453a', cursor: 'pointer', fontWeight: 700 }}>❌ Reject & Refund</button>
                </div>
              ) : (
                <span style={{ color: w.status === 'approved' ? '#30d158' : '#ff453a', fontSize: 13 }}>{w.status === 'approved' ? '✅ Approved' : '❌ Rejected'}</span>
              )}
            </div>
          ))
        )}

        {/* ADD CASH TAB */}
        {tab === 'addcash' && (
          addCashRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>
              <p>No add cash requests</p>
            </div>
          ) : addCashRequests.map(r => (
            <div key={r.id} style={{ background: '#0d0d0d', border: `1px solid ${r.status === 'pending' ? '#30d15833' : '#1a1a1a'}`, borderRadius: 12, padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{r.userName}</div>
                  <div style={{ color: '#555', fontSize: 13 }}>{r.userEmail}</div>
                </div>
                <div style={{ color: '#30d158', fontWeight: 700, fontSize: 20 }}>+₹{r.amount}</div>
              </div>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 10 }}>🎮 {r.bgmiName}</div>
              <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 13, color: '#555' }}>📱 Check Telegram for payment screenshot</div>
              {r.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={async () => { await approveAddCash(r.id); showToast(`₹${r.amount} added to wallet!`, 'success'); playSound('success'); }}
                    style={{ flex: 1, background: '#30d15822', border: '1px solid #30d15844', borderRadius: 8, padding: '8px', color: '#30d158', cursor: 'pointer', fontWeight: 700 }}>✅ Approve — Add ₹{r.amount}</button>
                  <button onClick={async () => { await rejectAddCash(r.id, 'Rejected by admin'); showToast('Rejected!', 'info'); }}
                    style={{ flex: 1, background: '#ff453a22', border: '1px solid #ff453a44', borderRadius: 8, padding: '8px', color: '#ff453a', cursor: 'pointer', fontWeight: 700 }}>❌ Reject</button>
                </div>
              ) : (
                <span style={{ color: r.status === 'approved' ? '#30d158' : '#ff453a', fontSize: 13 }}>{r.status === 'approved' ? '✅ Approved' : '❌ Rejected'}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('home');
  const [logoTaps, setLogoTaps] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { initFirestore, initWithdrawals, initAddCash, loadUserFromStorage, checkAutoLogout } = useStore();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  }, []);

  // Initialize app
  useEffect(() => {
    const unsubMatches = initFirestore();
    const unsubWithdrawals = initWithdrawals();
    const unsubAddCash = initAddCash();
    loadUserFromStorage();

    // Auto logout check every 30 seconds
    const autoLogoutInterval = setInterval(checkAutoLogout, 30000);

    return () => {
      unsubMatches();
      unsubWithdrawals();
      unsubAddCash();
      clearInterval(autoLogoutInterval);
    };
  }, []);

  // Particle animation
  useEffect(() => {
    const canvas = document.getElementById('particles') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 1,
      color: ['#ff453a', '#0a84ff', '#30d158', '#ffd700', '#bf5af2'][Math.floor(Math.random() * 5)],
    }));
    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '44';
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleLogoTap = () => {
    const newTaps = logoTaps + 1;
    setLogoTaps(newTaps);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (newTaps >= 5) { setPage('admin'); setLogoTaps(0); playSound('success'); return; }
    tapTimer.current = setTimeout(() => setLogoTaps(0), 2000);
  };

  if (loading) return <LoadingScreen onDone={() => setLoading(false)} />;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#000', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Navbar page={page} setPage={setPage} logoTaps={logoTaps} onLogoTap={handleLogoTap} />

      {page === 'home' && <HomePage setPage={setPage} showToast={showToast} />}
      {page === 'profile' && <ProfilePage showToast={showToast} />}
      {page === 'winners' && <WinnersPage />}
      {page === 'leaderboard' && <LeaderboardPage />}
      {page === 'admin' && <AdminPanel showToast={showToast} />}

      <BottomNav page={page} setPage={setPage} />

      {/* Floating Telegram */}
      <a href="https://t.me/pampa_ji_op" target="_blank" rel="noreferrer"
        style={{ position: 'fixed', bottom: 80, right: 16, background: '#0088cc', borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, textDecoration: 'none', zIndex: 200, boxShadow: '0 0 20px #0088cc44' }}>
        ✈️
      </a>
    </div>
  );
}
