export interface PlayerRegistration {
  id: string;
  bgmiName: string;
  characterId: string;
  upiId: string;
  verified: boolean;
  prizeSent: boolean;
  timestamp: number;
  matchId: string;
  userId: string;
  banned: boolean;
  banReason: string;
}

export interface Match {
  id: string;
  map: string;
  type: string;
  date: string;
  time: string;
  status: 'open' | 'live' | 'done';
  registeredPlayers: number;
  maxPlayers: number;
  roomId: string;
  roomPassword: string;
  entryFee: number;
  createdAt: number;
  players: PlayerRegistration[];
  customPrizePool: number;
  prizeFirst: number;
  prizeSecond: number;
  prizeThird: number;
  winner1: string;
  winner2: string;
  winner3: string;
  winnersAnnounced: boolean;
}

export interface MatchHistoryItem {
  matchId: string;
  map: string;
  type: string;
  date: string;
  time: string;
  entryFee: number;
  result: 'pending' | 'won' | 'lost';
  prize: number;
  timestamp: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  bgmiName: string;
  characterId: string;
  upiId: string;
  walletBalance: number;
  couponBalance: number;
  totalMatchesPlayed: number;
  totalMoneySpent: number;
  totalWinnings: number;
  createdAt: number;
  matchHistory: MatchHistoryItem[];
  referralCode: string;
  referredBy: string;
  referralCount: number;
  totalReferralEarned: number;
  isBanned: boolean;
  banReason: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  bgmiName: string;
  upiId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  processedAt?: number;
  adminNote?: string;
}

export interface AddCashRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  bgmiName: string;
  amount: number;
  screenshotTelegramSent: boolean;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  processedAt?: number;
  adminNote?: string;
}
