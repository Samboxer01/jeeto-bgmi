import { create } from 'zustand';
import type { Match, PlayerRegistration, UserProfile, WithdrawalRequest, MatchHistoryItem, AddCashRequest } from './types';
import {
  matchesCollection, withdrawalsCollection, addCashCollection,
  getMatchDoc, getUserDoc, getWithdrawalDoc, getAddCashDoc,
  setDoc, updateDoc, deleteDoc, onSnapshot, collection, db
} from './firebase';

const ADMIN_EMAIL = 'shantanuvishwakarma877@gmail.com';
const ADMIN_PASSWORD = '6392821977';
const AUTO_LOGOUT_MS = 2 * 60 * 60 * 1000;
const USER_KEY = 'bgmi_user_uid';
const SESSION_KEY = 'bgmi_session_start';

interface Store {
  matches: Match[];
  loading: boolean;
  adminLoggedIn: boolean;
  currentUser: UserProfile | null;
  userLoading: boolean;
  withdrawals: WithdrawalRequest[];
  addCashRequests: AddCashRequest[];

  setCurrentUser: (user: UserProfile | null) => void;
  initFirestore: () => () => void;
  initWithdrawals: () => () => void;
  initAddCash: () => () => void;
  loadUserFromStorage: () => Promise<void>;

  createMatch: (map: string, type: string, date: string, time: string) => Promise<void>;
  updateStatus: (id: string, status: Match['status']) => Promise<void>;
  updatePlayers: (id: string, count: number) => Promise<void>;
  updateRoomInfo: (id: string, roomId: string, roomPassword: string) => Promise<void>;
  updatePrizePool: (id: string, customPrize: number, first: number, second: number, third: number) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  registerPlayer: (matchId: string, bgmiName: string, characterId: string, upiId: string) => Promise<void>;
  verifyPlayer: (matchId: string, playerId: string) => Promise<void>;
  markPrizeSent: (matchId: string, playerId: string, prizeAmount: number) => Promise<void>;
  announceWinners: (matchId: string, first: string, second: string, third: string) => Promise<void>;
  banPlayer: (matchId: string, playerId: string, reason: string) => Promise<void>;

  loginAdmin: (email: string, password: string) => boolean;
  logoutAdmin: () => void;

  signupUser: (email: string, password: string, displayName: string, bgmiName: string, characterId?: string, upiId?: string) => Promise<boolean>;
  loginUser: (email: string, password: string) => Promise<boolean>;
  logoutUser: () => void;
  updateUserProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  checkAutoLogout: () => void;

  creditWallet: (userId: string, amount: number) => Promise<void>;
  requestWithdrawal: (amount: number) => Promise<void>;
  approveWithdrawal: (withdrawalId: string) => Promise<void>;
  rejectWithdrawal: (withdrawalId: string, note: string) => Promise<void>;

  submitAddCash: (amount: number, screenshotFile: File) => Promise<void>;
  approveAddCash: (requestId: string) => Promise<void>;
  rejectAddCash: (requestId: string, note: string) => Promise<void>;
}

const maxPlayersMap: Record<string, number> = {
  'TDM': 8, 'Erangel': 100, 'Miramar': 100, 'Sanhok': 100, 'Livik': 52,
};

function firestoreToMatch(id: string, data: Record<string, unknown>): Match {
  return {
    id,
    map: (data.map as string) || '',
    type: (data.type as string) || '',
    date: (data.date as string) || '',
    time: (data.time as string) || '',
    status: (data.status as Match['status']) || 'open',
    registeredPlayers: (data.registeredPlayers as number) || 0,
    maxPlayers: (data.maxPlayers as number) || 100,
    roomId: (data.roomId as string) || '',
    roomPassword: (data.roomPassword as string) || '',
    entryFee: (data.entryFee as number) || 20,
    createdAt: (data.createdAt as number) || Date.now(),
    players: ((data.players as PlayerRegistration[]) || []).map(p => ({
      id: p.id || '',
      bgmiName: p.bgmiName || '',
      characterId: p.characterId || '',
      upiId: p.upiId || '',
      verified: p.verified || false,
      prizeSent: p.prizeSent || false,
      timestamp: p.timestamp || Date.now(),
      matchId: p.matchId || id,
      userId: p.userId || '',
      banned: p.banned || false,
      banReason: p.banReason || '',
    })),
    customPrizePool: (data.customPrizePool as number) || 0,
    prizeFirst: (data.prizeFirst as number) || 0,
    prizeSecond: (data.prizeSecond as number) || 0,
    prizeThird: (data.prizeThird as number) || 0,
    winner1: (data.winner1 as string) || '',
    winner2: (data.winner2 as string) || '',
    winner3: (data.winner3 as string) || '',
    winnersAnnounced: (data.winnersAnnounced as boolean) || false,
  };
}

export const useStore = create<Store>((set, get) => ({
  matches: [],
  loading: true,
  adminLoggedIn: localStorage.getItem('bgmi_admin') === 'true',
  currentUser: null,
  userLoading: true,
  withdrawals: [],
  addCashRequests: [],

  setCurrentUser: (user) => set({ currentUser: user, userLoading: false }),

  // Load user from localStorage on app start
  loadUserFromStorage: async () => {
    const uid = localStorage.getItem(USER_KEY);
    const sessionStart = localStorage.getItem(SESSION_KEY);

    if (!uid || !sessionStart) {
      set({ currentUser: null, userLoading: false });
      return;
    }

    // Check 2 hour session
    const elapsed = Date.now() - parseInt(sessionStart);
    if (elapsed > AUTO_LOGOUT_MS) {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SESSION_KEY);
      set({ currentUser: null, userLoading: false });
      return;
    }

    // Load user from Firestore
    try {
      const { getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(getUserDoc(uid));
      if (docSnap.exists()) {
        set({ currentUser: docSnap.data() as UserProfile, userLoading: false });
      } else {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(SESSION_KEY);
        set({ currentUser: null, userLoading: false });
      }
    } catch {
      set({ currentUser: null, userLoading: false });
    }
  },

  initFirestore: () => {
    const unsubscribe = onSnapshot(matchesCollection, (snapshot) => {
      const matches: Match[] = [];
      snapshot.forEach((docSnap) => {
        matches.push(firestoreToMatch(docSnap.id, docSnap.data() as Record<string, unknown>));
      });
      matches.sort((a, b) => b.createdAt - a.createdAt);
      set({ matches, loading: false });
    }, () => {
      set({ loading: false });
    });
    return unsubscribe;
  },

  initWithdrawals: () => {
    const unsubscribe = onSnapshot(withdrawalsCollection, (snapshot) => {
      const withdrawals: WithdrawalRequest[] = [];
      snapshot.forEach((docSnap) => withdrawals.push(docSnap.data() as WithdrawalRequest));
      withdrawals.sort((a, b) => b.requestedAt - a.requestedAt);
      set({ withdrawals });
    });
    return unsubscribe;
  },

  initAddCash: () => {
    const unsubscribe = onSnapshot(addCashCollection, (snapshot) => {
      const requests: AddCashRequest[] = [];
      snapshot.forEach((docSnap) => requests.push(docSnap.data() as AddCashRequest));
      requests.sort((a, b) => b.requestedAt - a.requestedAt);
      set({ addCashRequests: requests });
    });
    return unsubscribe;
  },

  // ===================== MATCH ACTIONS =====================
  createMatch: async (map, type, date, time) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const match: Match = {
      id, map, type, date, time, status: 'open',
      registeredPlayers: 0, maxPlayers: maxPlayersMap[map] || 100,
      roomId: '', roomPassword: '', entryFee: 20, createdAt: Date.now(),
      players: [], customPrizePool: 0, prizeFirst: 0, prizeSecond: 0, prizeThird: 0,
      winner1: '', winner2: '', winner3: '', winnersAnnounced: false,
    };
    await setDoc(getMatchDoc(id), { ...match, players: [] });
  },

  updateStatus: async (id, status) => { await updateDoc(getMatchDoc(id), { status }); },

  updatePlayers: async (id, count) => {
    const match = get().matches.find(m => m.id === id);
    if (match) await updateDoc(getMatchDoc(id), { registeredPlayers: Math.max(0, Math.min(match.maxPlayers, count)) });
  },

  updateRoomInfo: async (id, roomId, roomPassword) => {
    await updateDoc(getMatchDoc(id), { roomId, roomPassword });
  },

  updatePrizePool: async (id, customPrize, first, second, third) => {
    await updateDoc(getMatchDoc(id), { customPrizePool: customPrize, prizeFirst: first, prizeSecond: second, prizeThird: third });
  },

  deleteMatch: async (id) => { await deleteDoc(getMatchDoc(id)); },

  registerPlayer: async (matchId, bgmiName, characterId, upiId) => {
    const match = get().matches.find(m => m.id === matchId);
    const currentUser = get().currentUser;
    if (!match) return;
    const player: PlayerRegistration = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      bgmiName, characterId, upiId, verified: false, prizeSent: false,
      timestamp: Date.now(), matchId, userId: currentUser?.uid || '',
      banned: false, banReason: '',
    };
    await updateDoc(getMatchDoc(matchId), {
      registeredPlayers: match.registeredPlayers + 1,
      players: [...match.players, player].map(p => ({ ...p })),
    });
    if (currentUser) {
      const historyItem: MatchHistoryItem = {
        matchId, map: match.map, type: match.type, date: match.date,
        time: match.time, entryFee: match.entryFee, result: 'pending', prize: 0, timestamp: Date.now(),
      };
      const updatedProfile = {
        ...currentUser,
        totalMatchesPlayed: (currentUser.totalMatchesPlayed || 0) + 1,
        totalMoneySpent: (currentUser.totalMoneySpent || 0) + match.entryFee,
        matchHistory: [...(currentUser.matchHistory || []), historyItem],
      };
      await updateDoc(getUserDoc(currentUser.uid), {
        totalMatchesPlayed: updatedProfile.totalMatchesPlayed,
        totalMoneySpent: updatedProfile.totalMoneySpent,
        matchHistory: updatedProfile.matchHistory,
      });
      set({ currentUser: updatedProfile });
    }
  },

  verifyPlayer: async (matchId, playerId) => {
    const match = get().matches.find(m => m.id === matchId);
    if (match) {
      const updatedPlayers = match.players.map(p => p.id === playerId ? { ...p, verified: true } : p);
      await updateDoc(getMatchDoc(matchId), { players: updatedPlayers.map(p => ({ ...p })) });
    }
  },

  markPrizeSent: async (matchId, playerId, prizeAmount) => {
    const match = get().matches.find(m => m.id === matchId);
    if (match) {
      const player = match.players.find(p => p.id === playerId);
      const updatedPlayers = match.players.map(p => p.id === playerId ? { ...p, prizeSent: true } : p);
      await updateDoc(getMatchDoc(matchId), { players: updatedPlayers.map(p => ({ ...p })) });
      if (player?.userId) await get().creditWallet(player.userId, prizeAmount);
    }
  },

  announceWinners: async (matchId, first, second, third) => {
    await updateDoc(getMatchDoc(matchId), { winner1: first, winner2: second, winner3: third, winnersAnnounced: true });
  },

  banPlayer: async (matchId, playerId, reason) => {
    const match = get().matches.find(m => m.id === matchId);
    if (match) {
      const updatedPlayers = match.players.map(p => p.id === playerId ? { ...p, banned: true, banReason: reason } : p);
      await updateDoc(getMatchDoc(matchId), { players: updatedPlayers.map(p => ({ ...p })) });
    }
  },

  // ===================== ADMIN =====================
  loginAdmin: (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('bgmi_admin', 'true');
      set({ adminLoggedIn: true });
      return true;
    }
    return false;
  },

  logoutAdmin: () => {
    localStorage.removeItem('bgmi_admin');
    set({ adminLoggedIn: false });
  },

  // ===================== USER AUTH (Simple - No Firebase Auth) =====================
  signupUser: async (email, password, displayName, bgmiName, characterId = '', upiId = '') => {
    try {
      // Check if email exists in Firestore
      const { getDocs, query, where } = await import('firebase/firestore');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        throw new Error('Email already registered! Please login.');
      }

      const uid = 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
      const userProfile: UserProfile = {
        uid, email, password, displayName, bgmiName,
        characterId: characterId || '',
        upiId: upiId || '',
        walletBalance: 0, couponBalance: 0,
        totalMatchesPlayed: 0, totalMoneySpent: 0, totalWinnings: 0,
        createdAt: Date.now(), matchHistory: [],
        referralCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
        referredBy: '', referralCount: 0, totalReferralEarned: 0,
        isBanned: false, banReason: '',
      };

      await setDoc(getUserDoc(uid), userProfile);
      return true;
    } catch (error) {
      throw error;
    }
  },

  loginUser: async (email, password) => {
    try {
      const { getDocs, query, where } = await import('firebase/firestore');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), where('password', '==', password));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Invalid email or password!');
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data() as UserProfile;

      // Save session to localStorage
      localStorage.setItem(USER_KEY, userData.uid);
      localStorage.setItem(SESSION_KEY, Date.now().toString());

      set({ currentUser: userData, userLoading: false });
      return true;
    } catch (error) {
      throw error;
    }
  },

  logoutUser: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
    set({ currentUser: null, userLoading: false });
  },

  updateUserProfile: async (uid, data) => {
    await updateDoc(getUserDoc(uid), data as Record<string, unknown>);
    const currentUser = get().currentUser;
    if (currentUser && currentUser.uid === uid) {
      const updatedUser = { ...currentUser, ...data };
      set({ currentUser: updatedUser });
      // Update localStorage with fresh data
    }
  },

  checkAutoLogout: () => {
    const sessionStart = localStorage.getItem(SESSION_KEY);
    if (sessionStart && get().currentUser) {
      const elapsed = Date.now() - parseInt(sessionStart);
      if (elapsed > AUTO_LOGOUT_MS) {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(SESSION_KEY);
        set({ currentUser: null });
      }
    }
  },

  // ===================== WALLET =====================
  creditWallet: async (userId, amount) => {
    const { getDoc } = await import('firebase/firestore');
    const docSnap = await getDoc(getUserDoc(userId));
    if (docSnap.exists()) {
      const userData = docSnap.data() as UserProfile;
      const newBalance = (userData.walletBalance || 0) + amount;
      const newWinnings = (userData.totalWinnings || 0) + amount;
      await updateDoc(getUserDoc(userId), { walletBalance: newBalance, totalWinnings: newWinnings });
      if (get().currentUser?.uid === userId) {
        set({ currentUser: { ...get().currentUser!, walletBalance: newBalance, totalWinnings: newWinnings } });
      }
    }
  },

  requestWithdrawal: async (amount) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('Not logged in');
    if ((currentUser.walletBalance || 0) < amount) throw new Error('Insufficient balance');
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const withdrawal: WithdrawalRequest = {
      id, userId: currentUser.uid, userEmail: currentUser.email,
      userName: currentUser.displayName, bgmiName: currentUser.bgmiName,
      upiId: currentUser.upiId, amount, status: 'pending', requestedAt: Date.now(),
    };
    await setDoc(getWithdrawalDoc(id), withdrawal);
    const newBalance = (currentUser.walletBalance || 0) - amount;
    await updateDoc(getUserDoc(currentUser.uid), { walletBalance: newBalance });
    set({ currentUser: { ...currentUser, walletBalance: newBalance } });
  },

  approveWithdrawal: async (withdrawalId) => {
    await updateDoc(getWithdrawalDoc(withdrawalId), { status: 'approved', processedAt: Date.now() });
  },

  rejectWithdrawal: async (withdrawalId, note) => {
    const withdrawal = get().withdrawals.find(w => w.id === withdrawalId);
    if (withdrawal) {
      await updateDoc(getWithdrawalDoc(withdrawalId), { status: 'rejected', processedAt: Date.now(), adminNote: note });
      await get().creditWallet(withdrawal.userId, withdrawal.amount);
    }
  },

  // ===================== ADD CASH =====================
  submitAddCash: async (amount, screenshotFile) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('Not logged in');
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const BOT_TOKEN = '7701092713:AAGawRL4bUcC8yN3XvcHcnzI79c-a7CDP4o';
    const CHAT_ID = '-1003739888243';
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('photo', screenshotFile);
    formData.append('caption',
      `💰 Add Cash Request!\n\n` +
      `👤 Name: ${currentUser.displayName}\n` +
      `📧 Email: ${currentUser.email}\n` +
      `🎮 BGMI: ${currentUser.bgmiName}\n` +
      `💵 Amount: ₹${amount}\n` +
      `🆔 Request ID: ${id}\n\n` +
      `✅ Approve in Admin Panel → Add Cash Tab`
    );
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: 'POST', body: formData });
    } catch { /* silent */ }
    const request: AddCashRequest = {
      id, userId: currentUser.uid, userEmail: currentUser.email,
      userName: currentUser.displayName, bgmiName: currentUser.bgmiName,
      amount, screenshotTelegramSent: true, status: 'pending', requestedAt: Date.now(),
    };
    await setDoc(getAddCashDoc(id), request);
  },

  approveAddCash: async (requestId) => {
    const request = get().addCashRequests.find(r => r.id === requestId);
    if (!request) return;
    await updateDoc(getAddCashDoc(requestId), { status: 'approved', processedAt: Date.now() });
    await get().creditWallet(request.userId, request.amount);
  },

  rejectAddCash: async (requestId, note) => {
    await updateDoc(getAddCashDoc(requestId), { status: 'rejected', processedAt: Date.now(), adminNote: note });
  },
}));
