import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Users, LayoutList, FileEdit, Printer, Radio,
  Search, CheckCircle, Shuffle, Upload, LogOut, Lock, Shield, AlertTriangle,
  Plus, Trash2, Award, Download, UserCheck, Edit3, X, Filter, Flag, UserPlus, CalendarDays, Clock
} from 'lucide-react';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '/api';

// 部門表記
const DEPARTMENTS = ['一般', '高校', '中学', '小学', '壮年'];
const GENDERS = ['男子', '女子', '混合'];
const INDIVIDUAL_EVENTS = ['100m', '200m', '800m', '1500m', '3000m', '110mH（ハードル）', '100mH（ハードル）', '走り幅跳び', '走高跳', '砲丸投'];
const RELAY_EVENTS = ['4×100mR', '4×400mR'];
const ALL_EVENTS = [...INDIVIDUAL_EVENTS, ...RELAY_EVENTS];
const STORAGE_KEY = 'track-and-field-meet-data-v1';
const AUTH_TOKEN_KEY = 'track-app-auth-token';
const AUTH_USER_KEY = 'track-app-auth-user';

// ログインセッション（トークン＋ユーザー情報）をブラウザに保持する。
// 画面更新（リロード）直後でも保存済み情報からログイン状態を復元できるようにするためのヘルパー。
const readStoredSession = () => {
  if (typeof window === 'undefined') return { token: '', user: null };
  let token = '';
  let cachedUser = null;
  try {
    token = window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const rawUser = window.localStorage.getItem(AUTH_USER_KEY);
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed && typeof parsed === 'object') cachedUser = parsed;
    }
  } catch (error) {
    console.warn('保存済みのログイン情報を読み込めませんでした。', error);
  }
  return { token, user: token ? cachedUser : null };
};

const persistSession = (token, sessionUser) => {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      if (sessionUser) window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (error) {
    console.warn('ログイン情報を保存できませんでした。', error);
  }
};

// 認証APIが返すエラーコードを、運営担当者向けの日本語メッセージに変換する
const AUTH_ERROR_MESSAGES = {
  username_already_exists: 'そのログインIDは既に登録されています。',
  email_already_exists: 'そのログインIDは既に登録されています。',
  duplicate_user: 'そのログインIDは既に登録されています。',
  password_too_short: 'パスワードは12文字以上で入力してください。',
  invalid_password: 'パスワードは12文字以上で入力してください。',
  weak_password: 'パスワードは12文字以上で入力してください。',
  missing_fields: 'ログインID・表示名・初期パスワードをすべて入力してください。',
  unauthorized: 'ログインセッションが切れています。もう一度ログインしてください。',
  invalid_credentials: 'ログインIDまたはパスワードが正しくありません。'
};

const describeAuthError = (error, fallback) => {
  const code = String((error && error.message) || error || '');
  if (AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  if (code.includes('already_exists') || code.includes('already_used')) return 'そのログインIDは既に登録されています。';
  if (code.toLowerCase().includes('password')) return 'パスワードは12文字以上で入力してください。';
  if (code.includes('unauthorized') || code.includes('session_expired') || code.includes('token')) return 'ログインセッションが切れています。もう一度ログインしてください。';
  return fallback;
};

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const parseCsvLine = (line) => {
  const columns = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i += 1; }
      else { quoted = !quoted; }
    } else if (char === ',' && !quoted) {
      columns.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }
  columns.push(value.trim());
  return columns;
};

const parseNumericRecord = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const normalized = String(value).trim().replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parsePerformanceValue = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (text.includes(':')) {
    const [minutes, seconds] = text.split(':');
    const minuteValue = Number.parseFloat(minutes);
    const secondValue = Number.parseFloat(seconds);
    if (Number.isFinite(minuteValue) && Number.isFinite(secondValue)) return minuteValue * 60 + secondValue;
  }
  return parseNumericRecord(text);
};

const timeToMinutes = (value) => {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const minutesToTime = (value) => {
  const normalized = ((Number(value) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');


const createPublicCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const values = new Uint32Array(6);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) window.crypto.getRandomValues(values);
  else for (let i = 0; i < values.length; i += 1) values[i] = Math.floor(Math.random() * 0xffffffff);
  return Array.from(values, value => alphabet[value % alphabet.length]).join('');
};

const getPageContext = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const liveParam = params.get('live');
  const nakedParam = [...params.keys()].find(key => /^[A-Za-z0-9]{6}$/.test(key));
  const publicCode = /^[A-Za-z0-9]{6}$/.test(liveParam || '') ? liveParam : nakedParam;
  const isAdminPage = params.get('admin') === '1';
  const isPublicLivePage = !isAdminPage && Boolean(publicCode);
  return { publicCode, isAdminPage, isPublicLivePage, isForbiddenPage: !isAdminPage && !isPublicLivePage };
};

// 部門名の正規化処理
const normalizeDepartment = (dept) => {
  if (!dept) return '一般';
  let d = dept.replace(/の部$/, '').trim();
  if (d === '中学生') return '中学';
  if (d === '小学生') return '小学';
  if (d === 'マスターズ') return '壮年';
  return DEPARTMENTS.includes(d) ? d : '一般';
};

// リレー種目判定
const isRelayEvent = (ev) => ev ? (ev.includes('R') || ev.includes('リレー')) : false;

const isHurdleEvent = (ev) => ev === '110mH（ハードル）' || ev === '100mH（ハードル）';
const isIndividualEventAllowed = (department, gender, event) => {
  if (event === '110mH（ハードル）') return department === '中学' && gender === '男子';
  if (event === '100mH（ハードル）') return department === '中学' && gender === '女子';
  return INDIVIDUAL_EVENTS.includes(event);
};
const getAvailableIndividualEvents = (department, gender) => INDIVIDUAL_EVENTS
  .filter(event => isIndividualEventAllowed(department, gender, event));

// フィールド種目判定
const isFieldEvent = (ev) => ev ? (ev.includes('跳') || ev.includes('投') || ev.includes('ジャンプ') || ev.includes('高')) : false;

// タイム決勝（1組限定編成）種目判定 (1500m, 3000m, フィールド種目)
const isSingleRaceEvent = (ev) => ev === '1500m' || ev === '3000m' || isFieldEvent(ev);

// 種目・組数を考慮した初期所要時間（分）。生成後は日程表上で個別に変更できます。
const estimateTimetableDuration = (event, heats, participants, field) => {
  if (field) return Math.max(45, 20 + Number(heats || 1) * 10);
  const perHeat = event === '3000m' ? 12
    : event === '1500m' ? 8
      : event === '800m' ? 5
        : event === '200m' || event === '110mH（ハードル）' || event === '100mH（ハードル）' ? 4
          : event === '4×400mR' ? 8
            : isRelayEvent(event) ? 6 : 3;
  const setup = event === '3000m' ? 5 : 2;
  return Math.max(5, setup + perHeat * Math.max(1, Number(heats || 1)) + (Number(participants || 0) > 0 ? 1 : 0));
};

const parseDrawKey = (key) => {
  const parts = String(key).split('-');
  const event = parts.pop() || '';
  const gender = parts.pop() || '';
  return { department: parts.join('-'), gender, event };
};

const recalculateTimetableRows = (rows, config, anchorKey = null, requestedStart = null) => {
  const next = rows.map(row => ({ ...row }));
  ['トラック', 'フィールド'].forEach(venue => {
    const indices = next.map((row, index) => row.venue === venue ? index : -1).filter(index => index >= 0);
    if (!indices.length) return;
    const anchorIndex = indices.find(index => next[index].key === anchorKey);
    const getGap = row => Math.max(
      Number(row.durationMinutes) || 0,
      venue === 'フィールド' ? Number(config.fieldInterval) : Number(config.trackInterval)
    );
    if (anchorIndex === undefined) {
      let clock = timeToMinutes(venue === 'フィールド' ? config.fieldStart : config.trackStart) ?? (venue === 'フィールド' ? 9 * 60 : 8 * 60 + 45);
      indices.forEach(index => {
        next[index].startTime = minutesToTime(clock);
        clock += getGap(next[index]);
      });
    } else {
      next[anchorIndex].startTime = minutesToTime(requestedStart);
      const anchorPosition = indices.indexOf(anchorIndex);
      for (let position = anchorPosition - 1; position >= 0; position -= 1) {
        const currentIndex = indices[position];
        const nextIndex = indices[position + 1];
        next[currentIndex].startTime = minutesToTime(timeToMinutes(next[nextIndex].startTime) - getGap(next[currentIndex]));
      }
      for (let position = anchorPosition + 1; position < indices.length; position += 1) {
        const currentIndex = indices[position];
        const previousIndex = indices[position - 1];
        next[currentIndex].startTime = minutesToTime(timeToMinutes(next[previousIndex].startTime) + getGap(next[previousIndex]));
      }
    }
    indices.forEach(index => {
      const start = timeToMinutes(next[index].startTime);
      const callStart = venue === 'フィールド' ? config.fieldCallStart : config.trackCallStart;
      const callComplete = venue === 'フィールド' ? config.fieldCallComplete : config.trackCallComplete;
      next[index].callStartTime = minutesToTime(start - callStart);
      next[index].callCompleteTime = minutesToTime(start - callComplete);
    });
  });
  return next.map((row, index) => ({ ...row, order: index + 1 }));
};

// JWTパース
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// 陸上標準のレーン配置 (Center-Out Seeding)
const getSeedingLanes = (athleteCount, totalLanes) => {
  let laneOrder = [];
  if (totalLanes === 8) {
    laneOrder = [4, 5, 3, 6, 2, 7, 1, 8];
  } else if (totalLanes === 6) {
    laneOrder = [3, 4, 2, 5, 1, 6];
  } else {
    laneOrder = Array.from({ length: totalLanes }, (_, i) => i + 1);
  }
  return laneOrder.slice(0, athleteCount);
};

const buildGeneratedRaces = (targetEntries, event, lanesPerRace) => {
  const isField = isFieldEvent(event);
  const sorted = [...targetEntries].sort((a, b) => {
    const valA = parseNumericRecord(a.pb);
    const valB = parseNumericRecord(b.pb);
    if (valA === null && valB === null) return 0;
    if (valA === null) return 1;
    if (valB === null) return -1;
    return isField ? valB - valA : valA - valB;
  });
  const generatedRaces = [];
  if (isSingleRaceEvent(event)) {
    generatedRaces.push({
      raceNumber: 1,
      lanes: sorted.map((athlete, idx) => ({ lane: idx + 1, athlete }))
    });
    return generatedRaces;
  }
  const safeLanes = Number.isInteger(lanesPerRace) && lanesPerRace >= 4 ? lanesPerRace : 6;
  const raceCount = Math.ceil(sorted.length / safeLanes);
  for (let i = 0; i < raceCount; i += 1) {
    const raceAthletes = sorted.slice(i * safeLanes, (i + 1) * safeLanes);
    const laneAssignments = getSeedingLanes(raceAthletes.length, safeLanes);
    const lanes = raceAthletes.map((athlete, idx) => ({ lane: laneAssignments[idx], athlete }))
      .sort((a, b) => a.lane - b.lane);
    generatedRaces.push({ raceNumber: i + 1, lanes });
  }
  return generatedRaces;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [entrySubTab, setEntrySubTab] = useState('individual'); // 'individual' | 'relay'
  // 画面更新（リロード）直後は、保存済みのトークン＋ユーザー情報から
  // ログイン状態を同期的に復元し、ログイン画面へ戻らないようにする
  const [initialSession] = useState(readStoredSession);
  const [user, setUser] = useState(initialSession.user);
  const [authToken, setAuthToken] = useState(initialSession.token);
  const [authRestoring, setAuthRestoring] = useState(Boolean(initialSession.token) && !initialSession.user);
  const [sessionWarning, setSessionWarning] = useState('');
  const [authCheckNonce, setAuthCheckNonce] = useState(0);
  const skipNextAuthValidation = useRef('');
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userEdit, setUserEdit] = useState({ username: '', displayName: '', password: '' });
  const [userEditMessage, setUserEditMessage] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersMessage, setAdminUsersMessage] = useState('');
  const [authError, setAuthError] = useState('');

  // アプリデータ State
  const [individualEntries, setIndividualEntries] = useState([]);
  const [relayTeams, setRelayTeams] = useState([]);
  const [draws, setDraws] = useState({});
  const [results, setResults] = useState({});
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [certificateContent, setCertificateContent] = useState(null);

  // 選択・フィルター State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [resultSummaryMode, setResultSummaryMode] = useState('top8');
  const [lanesPerRace, setLanesPerRace] = useState(8);
  const [timetableConfig, setTimetableConfig] = useState({
    date: '', reserveDate: '', venue: 'トラック',
    trackStart: '08:45', fieldStart: '09:00',
    trackInterval: 10, fieldInterval: 15,
    trackCallStart: 30, trackCallComplete: 15,
    fieldCallStart: 40, fieldCallComplete: 20
  });
  const [timetableRows, setTimetableRows] = useState([]);
  const [draggingTimetableIndex, setDraggingTimetableIndex] = useState(null);

  // エントリー追加・編集 State
  const [editingId, setEditingId] = useState(null);
  const [selectedIndividualIds, setSelectedIndividualIds] = useState([]);
  const [selectedRelayIds, setSelectedRelayIds] = useState([]);
  const [newIndividual, setNewIndividual] = useState({
    bib: '', name: '', affiliation: '', department: '一般', gender: '男子', event: '100m', pb: ''
  });
  const [newRelayTeam, setNewRelayTeam] = useState({
    teamId: '', teamName: '', affiliation: '', department: '一般', gender: '男子', event: '4×100mR', pb: ''
  });

  // 当日リレーオーダー編集モーダル用 State
  const [editingTeamForOrder, setEditingTeamForOrder] = useState(null);
  const [isStorageHydrated, setIsStorageHydrated] = useState(false);
  const [publicCode, setPublicCode] = useState(() => {
    return getPageContext().publicCode || createPublicCode();
  });
  const { isAdminPage, isPublicLivePage, isForbiddenPage } = getPageContext();
  // 403（公開URLでも管理URLでもない）場合のみ非表示。ログイン状態の復元中も画面は表示し続ける
  const canRenderApp = !isForbiddenPage;

  useEffect(() => {
    document.title = isForbiddenPage
      ? '403エラー'
      : (isAdminPage ? (user ? '陸上競技記録管理システム' : '管理者ログイン') : '速報・リアルタイム結果');
  }, [user, isAdminPage, isForbiddenPage]);

  useEffect(() => {
    if (!authToken) {
      setAuthRestoring(false);
      return undefined;
    }
    if (skipNextAuthValidation.current === authToken) {
      skipNextAuthValidation.current = '';
      setAuthRestoring(false);
      return undefined;
    }
    let cancelled = false;
    let retryTimer = null;
    let attempt = 0;
    const validateSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${authToken}` }, cache: 'no-store' });
        if (cancelled) return;
        if (response.ok) {
          const body = await response.json().catch(() => ({}));
          if (cancelled) return;
          if (body.user) {
            setUser(body.user);
            persistSession(authToken, body.user);
            setUserEdit({ username: body.user.email, displayName: body.user.name, password: '' });
          }
          setSessionWarning('');
          setAuthRestoring(false);
          return;
        }
        if (response.status === 401 || response.status === 403) {
          // トークンがサーバー側で無効になった場合だけログイン状態を解除する
          persistSession('', null);
          setUser(null);
          setAuthToken('');
          setSessionWarning('');
          setAuthError('ログインの有効期限が切れました。もう一度ログインしてください。');
          setAuthRestoring(false);
          return;
        }
        throw new Error(`session_check_failed_${response.status}`);
      } catch (error) {
        if (cancelled) return;
        // 一時的な通信障害では確立済みのログイン状態を消去せず、自動的に再試行します。
        attempt += 1;
        if (attempt <= 3) {
          retryTimer = window.setTimeout(validateSession, 1200 * attempt);
          return;
        }
        console.warn('ログイン状態の確認に失敗しました。', error);
        setAuthRestoring(false);
        setSessionWarning('ログイン状態を確認できませんでした（通信エラー）。セッションは保持されています。');
      }
    };
    validateSession();
    return () => { cancelled = true; if (retryTimer) window.clearTimeout(retryTimer); };
  }, [authToken, authCheckNonce]);

  // ブラウザ内に大会データを保存し、リロード後も復元する
  useEffect(() => {
    let cancelled = false;
    const loadState = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/state`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`API state request failed: ${response.status}`);
        let parsed = await response.json();
        const hasData = state => Boolean(
          (state?.individualEntries?.length || 0) > 0
          || (state?.relayTeams?.length || 0) > 0
          || Object.keys(state?.draws || {}).length > 0
          || Object.keys(state?.results || {}).length > 0
          || (state?.timetableRows?.length || 0) > 0
        );
        // DB初期化直後だけ、既存ブラウザのlocalStorageを初回移行元として利用します。
        if (!hasData(parsed)) {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const localState = JSON.parse(saved);
            if (hasData(localState)) parsed = localState;
          }
        }
        if (cancelled) return;
        if (Array.isArray(parsed.individualEntries)) setIndividualEntries(parsed.individualEntries);
        if (Array.isArray(parsed.relayTeams)) setRelayTeams(parsed.relayTeams);
        if (parsed.draws && typeof parsed.draws === 'object') setDraws(parsed.draws);
        if (parsed.results && typeof parsed.results === 'object') setResults(parsed.results);
        if (parsed.timetableConfig && typeof parsed.timetableConfig === 'object') setTimetableConfig(prev => ({ ...prev, ...parsed.timetableConfig }));
        if (Array.isArray(parsed.timetableRows)) setTimetableRows(parsed.timetableRows);
      } catch (apiError) {
        console.warn('共有APIからの復元に失敗したため、ローカル保存を確認します。', apiError);
        try {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (!cancelled && Array.isArray(parsed.individualEntries)) setIndividualEntries(parsed.individualEntries);
            if (!cancelled && Array.isArray(parsed.relayTeams)) setRelayTeams(parsed.relayTeams);
            if (!cancelled && parsed.draws && typeof parsed.draws === 'object') setDraws(parsed.draws);
            if (!cancelled && parsed.results && typeof parsed.results === 'object') setResults(parsed.results);
            if (!cancelled && parsed.timetableConfig && typeof parsed.timetableConfig === 'object') setTimetableConfig(prev => ({ ...prev, ...parsed.timetableConfig }));
            if (!cancelled && Array.isArray(parsed.timetableRows)) setTimetableRows(parsed.timetableRows);
          }
        } catch (localError) {
          console.warn('大会データの復元に失敗しました。', localError);
        }
      } finally {
        if (!cancelled) setIsStorageHydrated(true);
      }
    };
    loadState();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isStorageHydrated) return;
    const state = { individualEntries, relayTeams, draws, results, timetableConfig, timetableRows };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { console.warn('ローカル保存に失敗しました。', error); }
    if (!user || !authToken) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/state`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify(state)
        });
        if (!response.ok) console.warn('共有APIへの保存に失敗しました。', response.status);
      } catch (error) { console.warn('共有APIへの接続に失敗しました。', error); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [isStorageHydrated, user, authToken, individualEntries, relayTeams, draws, results, timetableConfig, timetableRows]);

  useEffect(() => {
    if (!editingTeamForOrder) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setEditingTeamForOrder(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editingTeamForOrder]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError('');
    try {
      const verifyResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginId, password: loginPassword })
      });
      const verified = await verifyResponse.json();
      if (!verifyResponse.ok || !verified.user) {
        setAuthError('IDまたはパスワードが正しくありません。');
        return;
      }
      if (!verified.token) {
        setAuthError('認証トークンを取得できませんでした。管理者に確認してください。');
        return;
      }
      skipNextAuthValidation.current = verified.token;
      persistSession(verified.token, verified.user);
      setAuthToken(verified.token);
      setUser(verified.user);
      setUserEdit({ username: verified.user.email, displayName: verified.user.name, password: '' });
      setSessionWarning('');
      setLoginPassword('');
    } catch (error) {
      console.warn('ログインAPIに接続できません。', error);
      setAuthError('認証サーバーに接続できないため、ログインできません。');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken('');
    persistSession('', null);
    setSessionWarning('');
    setActiveTab('live');
  };

  // 401/403（セッション失効）時の共通処理。保存済みセッションを破棄して再ログインを促す
  const handleSessionExpired = (message = 'ログインの有効期限が切れました。もう一度ログインしてください。') => {
    persistSession('', null);
    setUser(null);
    setAuthToken('');
    setSessionWarning('');
    setAuthError(message);
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    setUserEditMessage('');
    if (!authToken) {
      setUserEditMessage('ログインセッションが切れています。もう一度ログインしてください。');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ ...userEdit, email: userEdit.username, name: userEdit.displayName, displayName: userEdit.displayName })
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        setUserEditMessage('ログインセッションが切れています。もう一度ログインしてください。');
        return;
      }
      if (!response.ok) throw new Error(body.error || 'user_update_failed');
      if (!body.user) throw new Error('user_update_failed');
      setUser(body.user);
      persistSession(authToken, body.user);
      setUserEdit(prev => ({ ...prev, username: body.user.email, displayName: body.user.name, password: '' }));
      setUserEditMessage('ユーザー情報を更新しました。');
    } catch (error) {
      setUserEditMessage(describeAuthError(error, 'ユーザー情報の更新に失敗しました。入力内容とログイン状態をご確認ください。'));
    }
  };

  const loadAdminUsers = async () => {
    if (!authToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (response.ok) {
        const body = await response.json().catch(() => ({}));
        setAdminUsers(Array.isArray(body.users) ? body.users : []);
        return;
      }
      if (response.status === 401 || response.status === 403) setAdminUsersMessage('ログインセッションが切れています。もう一度ログインしてください。');
    } catch (error) {
      console.warn('管理ユーザー一覧の取得に失敗しました。', error);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'userSettings') loadAdminUsers();
  }, [user, activeTab, authToken]);

  const handleDeleteAdminUser = async (id) => {
    if (!window.confirm('このユーザーを削除しますか？')) return;
    if (!authToken) {
      setAdminUsersMessage('ログインセッションが切れています。もう一度ログインしてください。');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${authToken}` } });
      if (response.ok) {
        setAdminUsersMessage('ユーザーを削除しました。');
        await loadAdminUsers();
        return;
      }
      if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        setAdminUsersMessage('ログインセッションが切れています。もう一度ログインしてください。');
        return;
      }
      setAdminUsersMessage('現在ログイン中のユーザーは削除できません。');
    } catch (error) {
      setAdminUsersMessage('通信エラーのため、ユーザーを削除できませんでした。');
    }
  };

  // --- 登録機能 ---

  const rebuildDrawsFor = (conditions, individuals, relays) => {
    if (!conditions.length) return;
    setDraws(prev => {
      const next = { ...prev };
      conditions.forEach(({ department, gender, event }) => {
        const isRelay = isRelayEvent(event);
        const targetEntries = isRelay
          ? relays.filter(t => t.department === department && t.gender === gender && t.event === event)
            .map(t => ({ id: t.id, bib: t.teamId, name: t.teamName, affiliation: t.affiliation, department: t.department, gender: t.gender, event: t.event, pb: t.pb, order: t.order, isRelay: true }))
          : individuals.filter(e => e.department === department && e.gender === gender && e.event === event)
            .map(e => ({ id: e.id, bib: e.bib, name: e.name, affiliation: e.affiliation, department: e.department, gender: e.gender, event: e.event, pb: e.pb, isRelay: false }));
        const key = `${department}-${gender}-${event}`;
        if (targetEntries.length) next[key] = buildGeneratedRaces(targetEntries, event, lanesPerRace);
        else delete next[key];
      });
      return next;
    });
  };

  const handleSaveIndividual = (e) => {
    e.preventDefault();
    const cleaned = { ...newIndividual, name: newIndividual.name.trim(), affiliation: newIndividual.affiliation.trim() };
    if (!cleaned.name || !cleaned.affiliation) return;
    if (!isIndividualEventAllowed(cleaned.department, cleaned.gender, cleaned.event) || !DEPARTMENTS.includes(cleaned.department) || !GENDERS.includes(cleaned.gender)) return;

    const savedEntry = { ...cleaned, id: editingId || createId('ind') };
    const nextIndividuals = editingId
      ? individualEntries.map(item => item.id === editingId ? savedEntry : item)
      : [...individualEntries, savedEntry];
    setIndividualEntries(nextIndividuals);
    rebuildDrawsFor([{ department: cleaned.department, gender: cleaned.gender, event: cleaned.event }], nextIndividuals, relayTeams);
    if (editingId) setEditingId(null);

    setNewIndividual({ bib: '', name: '', affiliation: '', department: selectedDepartment || '一般', gender: selectedGender || '男子', event: '100m', pb: '' });
  };

  const handleSaveRelayTeam = (e) => {
    e.preventDefault();
    const cleaned = { ...newRelayTeam, teamName: newRelayTeam.teamName.trim(), affiliation: newRelayTeam.affiliation.trim(), order: newRelayTeam.order || { r1: '', r2: '', r3: '', r4: '' } };
    if (!cleaned.teamName || !cleaned.affiliation) return;
    if (!RELAY_EVENTS.includes(cleaned.event) || !DEPARTMENTS.includes(cleaned.department) || !GENDERS.includes(cleaned.gender)) return;

    const savedTeam = {
      ...cleaned,
      id: editingId || createId('relay'),
      order: editingId ? cleaned.order : { r1: '', r2: '', r3: '', r4: '' }
    };
    const nextRelays = editingId
      ? relayTeams.map(item => item.id === editingId ? savedTeam : item)
      : [...relayTeams, savedTeam];
    setRelayTeams(nextRelays);
    rebuildDrawsFor([{ department: cleaned.department, gender: cleaned.gender, event: cleaned.event }], individualEntries, nextRelays);
    if (editingId) setEditingId(null);

    setNewRelayTeam({ teamId: '', teamName: '', affiliation: '', department: selectedDepartment || '一般', gender: selectedGender || '男子', event: '4×100mR', pb: '' });
  };

  const handleStartEditIndividual = (entry) => {
    setEditingId(entry.id);
    setNewIndividual({ ...entry });
  };

  const handleStartEditRelay = (team) => {
    setEditingId(team.id);
    setNewRelayTeam({ ...team });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewIndividual({ bib: '', name: '', affiliation: '', department: selectedDepartment || '一般', gender: selectedGender || '男子', event: '100m', pb: '' });
    setNewRelayTeam({ teamId: '', teamName: '', affiliation: '', department: selectedDepartment || '一般', gender: selectedGender || '男子', event: '4×100mR', pb: '' });
  };

  // CSV インポート（引用符・カンマ・改行コードに対応）
  const handleCSVImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const input = event.target;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = String(loadEvent.target?.result || '').replace(/^\uFEFF/, '');
      const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim());
      if (lines.length < 2) {
        alert('CSVファイルに有効なデータが含まれていません。');
        input.value = '';
        return;
      }

      const newIndividuals = [];
      const newRelays = [];
      lines.slice(1).forEach((line, index) => {
        const cols = parseCsvLine(line);
        if (cols.length < 6) return;
        const eventName = cols[5] || '';
        const department = normalizeDepartment(cols[3]);
        const gender = GENDERS.includes(cols[4]) ? cols[4] : '男子';
        if (isRelayEvent(eventName)) {
          if (!cols[1] || !cols[2] || !RELAY_EVENTS.includes(eventName)) return;
          newRelays.push({ id: createId(`relay-${index}`), teamId: cols[0] || '', teamName: cols[1], affiliation: cols[2], department, gender, event: eventName, pb: cols[6] || '', order: { r1: cols[7] || '', r2: cols[8] || '', r3: cols[9] || '', r4: cols[10] || '' } });
        } else {
          if (!cols[1] || !cols[2] || !isIndividualEventAllowed(department, gender, eventName)) return;
          newIndividuals.push({ id: createId(`ind-${index}`), bib: cols[0] || '', name: cols[1], affiliation: cols[2], department, gender, event: eventName, pb: cols[6] || '' });
        }
      });

      const nextIndividuals = newIndividuals.length ? [...individualEntries, ...newIndividuals] : individualEntries;
      const nextRelays = newRelays.length ? [...relayTeams, ...newRelays] : relayTeams;
      if (newIndividuals.length) setIndividualEntries(nextIndividuals);
      if (newRelays.length) setRelayTeams(nextRelays);
      const conditions = [...newIndividuals, ...newRelays]
        .map(entry => ({ department: entry.department, gender: entry.gender, event: entry.event }))
        .filter((condition, index, list) => list.findIndex(item => item.department === condition.department && item.gender === condition.gender && item.event === condition.event) === index);
      rebuildDrawsFor(conditions, nextIndividuals, nextRelays);
      const messages = [];
      if (newIndividuals.length) messages.push(`個人選手: ${newIndividuals.length}件`);
      if (newRelays.length) messages.push(`リレーチーム: ${newRelays.length}件`);
      alert(messages.length ? `CSVデータを読み込みました:\n${messages.join('\n')}` : '有効なエントリーデータが見つかりませんでした。');
      input.value = '';
    };
    reader.onerror = () => { alert('CSVファイルの読み込みに失敗しました。'); input.value = ''; };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDownloadSampleCSV = (type) => {
    let csvContent = "";
    let fileName = "";

    if (type === 'individual') {
      csvContent = "ゼッケン,氏名,所属団体,部門,性別,種目,PB\n" +
        "101,陸上 太郎,水戸アスリートクラブ,一般,男子,100m,11.50\n" +
        "102,水戸 史郎,水戸アスリートクラブ,一般,男子,1500m,4:15.00\n" +
        "103,鹿島 次郎,鹿島クラブ,壮年,男子,走り幅跳び,6.20";
      fileName = "sample_individual_entries.csv";
    } else {
      csvContent = "チームID,チーム名,所属団体,部門,性別,種目,申込タイム,1走,2走,3走,4走\n" +
        "501,水戸AC-A,水戸アスリートクラブ,一般,男子,4×100mR,42.50,陸上 太郎,水戸 史郎,鹿島 次郎,山田 花子\n" +
        "502,水戸AC-B,水戸アスリートクラブ,一般,男子,4×100mR,44.10,佐藤 一郎,鈴木 二郎,田中 三郎,高橋 四郎";
      fileName = "sample_relay_teams.csv";
    }

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSelectedEntriesCsv = () => {
    const selectedIndividuals = individualEntries.filter(entry => selectedIndividualIds.includes(entry.id));
    const selectedRelays = relayTeams.filter(team => selectedRelayIds.includes(team.id));
    const selectedEntries = [
      ...selectedIndividuals.map(entry => ({ type: '個人', id: entry.bib, name: entry.name, affiliation: entry.affiliation, department: entry.department, gender: entry.gender, event: entry.event, record: entry.pb, order: {} })),
      ...selectedRelays.map(team => ({ type: 'リレー', id: team.teamId, name: team.teamName, affiliation: team.affiliation, department: team.department, gender: team.gender, event: team.event, record: team.pb, order: team.order || {} }))
    ];
    if (!selectedEntries.length) {
      alert('CSV出力するエントリーをチェックしてください。');
      return;
    }
    const headers = ['種別', 'ID/ゼッケン', '氏名/チーム名', '所属団体', '部門', '性別', '種目', '記録', '1走', '2走', '3走', '4走'];
    const rows = selectedEntries.map(entry => [entry.type, entry.id, entry.name, entry.affiliation, entry.department, entry.gender, entry.event, entry.record || '', entry.order.r1 || '', entry.order.r2 || '', entry.order.r3 || '', entry.order.r4 || '']);
    const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `track-and-field-selected-entries-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteIndividual = (id) => {
    if (window.confirm('この選手エントリーを削除しますか？')) {
      setIndividualEntries(prev => prev.filter(e => e.id !== id));
      setSelectedIndividualIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleDeleteRelay = (id) => {
    if (window.confirm('このリレーチームエントリーを削除しますか？')) {
      setRelayTeams(prev => prev.filter(t => t.id !== id));
      setSelectedRelayIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkDeleteIndividuals = () => {
    if (!selectedIndividualIds.length) return;
    if (!window.confirm(`選択した${selectedIndividualIds.length}件の個人エントリーを削除しますか？この操作は元に戻せません。`)) return;
    const selected = individualEntries.filter(entry => selectedIndividualIds.includes(entry.id));
    const nextIndividuals = individualEntries.filter(entry => !selectedIndividualIds.includes(entry.id));
    setIndividualEntries(nextIndividuals);
    setSelectedIndividualIds([]);
    rebuildDrawsFor(selected.map(entry => ({ department: entry.department, gender: entry.gender, event: entry.event })), nextIndividuals, relayTeams);
  };

  const handleBulkDeleteRelays = () => {
    if (!selectedRelayIds.length) return;
    if (!window.confirm(`選択した${selectedRelayIds.length}件のリレーチームを削除しますか？この操作は元に戻せません。`)) return;
    const selected = relayTeams.filter(team => selectedRelayIds.includes(team.id));
    const nextRelays = relayTeams.filter(team => !selectedRelayIds.includes(team.id));
    setRelayTeams(nextRelays);
    setSelectedRelayIds([]);
    rebuildDrawsFor(selected.map(team => ({ department: team.department, gender: team.gender, event: team.event })), individualEntries, nextRelays);
  };

  const findEntryById = (id) => {
    const ind = individualEntries.find(e => e.id === id);
    if (ind) return { ...ind, isRelay: false };
    const relay = relayTeams.find(t => t.id === id);
    if (relay) return { ...relay, bib: relay.teamId, name: relay.teamName, isRelay: true };
    return null;
  };

  // 2. 自動組割り編成 (1500m/3000m/フィールド種目は1組のみに固定)
  const generateDraws = () => {
    const effectiveLanes = Number.isInteger(lanesPerRace) && lanesPerRace >= 4 ? lanesPerRace : 6;
    const conditions = allConditionMode
      ? [...individualEntries, ...relayTeams]
        .map(entry => ({ department: entry.department, gender: entry.gender, event: entry.event }))
        .filter((condition, index, list) => list.findIndex(item => item.department === condition.department && item.gender === condition.gender && item.event === condition.event) === index)
      : [{ department: selectedDepartment, gender: selectedGender, event: selectedEvent }];
    if (!conditions.length) {
      alert('組割りを作成できるエントリーデータがありません。');
      return;
    }
    const generated = {};
    let generatedCount = 0;
    conditions.forEach(condition => {
      const relay = isRelayEvent(condition.event);
      const targetEntries = relay
        ? relayTeams.filter(t => t.department === condition.department && t.gender === condition.gender && t.event === condition.event)
          .map(t => ({ id: t.id, bib: t.teamId, name: t.teamName, affiliation: t.affiliation, department: t.department, gender: t.gender, event: t.event, pb: t.pb, order: t.order, isRelay: true }))
        : individualEntries.filter(e => e.department === condition.department && e.gender === condition.gender && e.event === condition.event)
          .map(e => ({ id: e.id, bib: e.bib, name: e.name, affiliation: e.affiliation, department: e.department, gender: e.gender, event: e.event, pb: e.pb, isRelay: false }));
      if (!targetEntries.length) return;
      generated[`${condition.department}-${condition.gender}-${condition.event}`] = buildGeneratedRaces(targetEntries, condition.event, effectiveLanes);
      generatedCount += 1;
    });
    setDraws(prev => ({ ...prev, ...generated }));
    alert(allConditionMode ? `${generatedCount}種目の組割りを一括生成しました。` : '組割りを生成しました。');
  };

  // 3-A. トラック種目: 着順順入力ハンドラー（レーン番号を入力すると選手情報を自動補完）
  const handleTrackResultChange = (raceKey, rankIndex, field, value, raceLanes) => {
    setResults(prev => {
      const currentRaceResults = prev[raceKey] || [];
      let updated = [...currentRaceResults];

      // 着順位置の配列要素を確保
      while (updated.length <= rankIndex) {
        updated.push({
          rank: updated.length + 1,
          lane: '',
          athleteId: '',
          time: '',
          wind: '+0.0',
          status: 'OK'
        });
      }

      let item = { ...updated[rankIndex] };
      item[field] = value;
      item.rank = rankIndex + 1; // 1着, 2着...

      // レーン番号が入力されたら該当の選手IDを自動紐付け
      if (field === 'lane') {
        const laneValue = String(value).trim();
        const matchedLane = raceLanes.find(l => String(l.lane) === laneValue);
        const alreadyUsed = updated.some((result, index) => index !== rankIndex && String(result.lane) === laneValue && laneValue !== '');
        item.lane = alreadyUsed ? '' : laneValue;
        item.athleteId = matchedLane && !alreadyUsed ? matchedLane.athlete.id : '';
      }

      updated[rankIndex] = item;
      return { ...prev, [raceKey]: updated };
    });
  };

  // 3-B. フィールド種目: 5回試技入力ハンドラー（自動最高記録計算）
  const handleFieldAttemptChange = (raceKey, athleteId, attemptIndex, value) => {
    setResults(prev => {
      const currentRaceResults = prev[raceKey] || [];
      const existingIndex = currentRaceResults.findIndex(r => r.athleteId === athleteId);

      let updated = [...currentRaceResults];
      let item = existingIndex >= 0 
        ? { ...updated[existingIndex] } 
        : { athleteId, time: '', status: 'OK', rank: '-', wind: '+0.0', attempts: ['', '', '', '', ''] };

      const newAttempts = [...(item.attempts || ['', '', '', '', ''])];
      newAttempts[attemptIndex] = String(value).trim();
      item.attempts = newAttempts;

      // 5回の試技の中から最高記録（数値としての最大値）を自動判定
      const validNumbers = newAttempts
        .map(v => parseNumericRecord(v))
        .filter(n => !isNaN(n));

      if (validNumbers.length > 0) {
        item.time = Math.max(...validNumbers).toFixed(2);
      } else {
        item.time = '';
      }

      if (existingIndex >= 0) {
        updated[existingIndex] = item;
      } else {
        updated.push(item);
      }

      // ランキング更新
      const validResults = updated.filter(r => r.time && !isNaN(parseFloat(r.time)) && r.status === 'OK');
      validResults.sort((a, b) => parseFloat(b.time) - parseFloat(a.time));

      updated = updated.map(resItem => {
        if (resItem.status !== 'OK') return { ...resItem, rank: resItem.status };
        const rankIndex = validResults.findIndex(vr => vr.athleteId === resItem.athleteId);
        return {
          ...resItem,
          rank: rankIndex >= 0 ? rankIndex + 1 : '-'
        };
      });

      return { ...prev, [raceKey]: updated };
    });
  };

  // フィールド種目の状態・風速等ハンドラー
  const handleFieldGeneralChange = (raceKey, athleteId, field, value) => {
    setResults(prev => {
      const currentRaceResults = prev[raceKey] || [];
      const existingIndex = currentRaceResults.findIndex(r => r.athleteId === athleteId);

      let updated = [...currentRaceResults];
      let item = existingIndex >= 0 
        ? { ...updated[existingIndex] } 
        : { athleteId, time: '', status: 'OK', rank: '-', wind: '+0.0', attempts: ['', '', '', '', ''] };

      item[field] = value;

      if (existingIndex >= 0) {
        updated[existingIndex] = item;
      } else {
        updated.push(item);
      }

      return { ...prev, [raceKey]: updated };
    });
  };

  // リレーオーダーを同一所属・部門・性別の個人エントリーから自動設定
  const handleAutoAssignRelayOrder = () => {
    if (!editingTeamForOrder) return;

    const candidates = individualEntries
      .filter(ind => ind.affiliation === editingTeamForOrder.affiliation
        && ind.department === editingTeamForOrder.department
        && ind.gender === editingTeamForOrder.gender)
      .sort((a, b) => {
        const bibA = Number.parseInt(a.bib, 10);
        const bibB = Number.parseInt(b.bib, 10);
        if (Number.isFinite(bibA) && Number.isFinite(bibB)) return bibA - bibB;
        return String(a.name).localeCompare(String(b.name), 'ja');
      });

    if (candidates.length < 4) {
      alert(`自動設定には候補選手が4名以上必要です。現在の候補: ${candidates.length}名`);
      return;
    }

    const selected = candidates.slice(0, 4);
    setEditingTeamForOrder(prev => ({
      ...prev,
      order: {
        ...(prev.order || {}),
        r1: selected[0].name,
        r2: selected[1].name,
        r3: selected[2].name,
        r4: selected[3].name
      }
    }));
  };

  const handleRandomizeResults = () => {
    const targets = allConditionMode
      ? Object.entries(draws).map(([key, races]) => ({ key, races, event: parseDrawKey(key).event }))
      : [{ key: currentKey, races: draws[currentKey], event: selectedEvent }];
    const validTargets = targets.filter(target => target.races?.length);
    if (!validTargets.length) {
      alert('先にプログラム編成・組割りを作成してください。');
      return;
    }

    const randomBetween = (min, max) => min + Math.random() * (max - min);
    const shuffled = (items) => [...items].sort(() => Math.random() - 0.5);
    const randomWind = () => `+${randomBetween(0, 2).toFixed(1)}`;
    const randomTime = (event, rank) => {
      const base = event === '800m' ? 125 : event === '1500m' ? 250 : event === '3000m' ? 570 : isRelayEvent(event) ? 42 : isHurdleEvent(event) ? 16 : 11;
      const spread = event === '800m' ? 18 : event === '1500m' ? 35 : event === '3000m' ? 70 : isRelayEvent(event) ? 5 : isHurdleEvent(event) ? 3 : 2.5;
      return (base + randomBetween(0, spread) + rank * 0.01).toFixed(2);
    };
    const generatedResults = {};

    validTargets.forEach(target => target.races.forEach(race => {
      const raceKey = `${target.key}-${race.raceNumber}`;
      if (isFieldEvent(target.event)) {
        const fieldResults = race.lanes.map(item => {
          const attempts = Array.from({ length: 5 }, () => randomBetween(4.5, 7.5).toFixed(2));
          return { athleteId: item.athlete.id, time: Math.max(...attempts.map(Number)).toFixed(2), status: 'OK', rank: '-', wind: randomWind(), attempts };
        });
        fieldResults.sort((a, b) => Number(b.time) - Number(a.time));
        generatedResults[raceKey] = fieldResults.map((result, index) => ({ ...result, rank: index + 1 }));
      } else {
        generatedResults[raceKey] = shuffled(race.lanes).map((item, index) => ({
          rank: index + 1,
          lane: String(item.lane),
          athleteId: item.athlete.id,
          time: randomTime(target.event, index),
          wind: randomWind(),
          status: 'OK'
        }));
      }
    }));

    setResults(prev => ({ ...prev, ...generatedResults }));
    alert(allConditionMode ? `${validTargets.length}競技の結果をランダム入力しました。` : '選択中の競技にランダム結果を入力しました。');
  };

  const handleExportResultsCsv = () => {
    const headers = ['部門', '性別', '種目', '組', '順位', 'ID/ゼッケン', '氏名/チーム名', '所属', '記録', '風速', '状態', '試技1', '試技2', '試技3', '試技4', '試技5', '1走', '2走', '3走', '4走'];
    const rows = [];
    Object.entries(results).forEach(([raceKey, raceResults]) => {
      const parts = raceKey.split('-');
      const raceNumber = parts.pop() || '';
      const event = parts.pop() || '';
      const gender = parts.pop() || '';
      const department = parts.join('-');
      raceResults.forEach(result => {
        const target = findEntryById(result.athleteId);
        if (!target) return;
        rows.push([
          department, gender, event, raceNumber, result.rank || '', target.bib || '', target.name || '', target.affiliation || '',
          result.time || '', result.wind || '', result.status || '', ...(result.attempts || ['', '', '', '', '']),
          target.order?.r1 || '', target.order?.r2 || '', target.order?.r3 || '', target.order?.r4 || ''
        ]);
      });
    });
    if (!rows.length) {
      alert('エクスポートできる競技結果がありません。');
      return;
    }
    const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `track-and-field-results-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getResultSummaryGroups = (limit = null) => {
    const groups = {};
    Object.entries(results).forEach(([raceKey, raceResults]) => {
      const raceNumber = String(raceKey).split('-').pop() || '';
      const meta = parseDrawKey(String(raceKey).slice(0, -(raceNumber.length + 1)));
      (Array.isArray(raceResults) ? raceResults : []).forEach(result => {
        const target = findEntryById(result.athleteId);
        if (!target || (!result.time && result.status !== 'DNS' && result.status !== 'DQ' && result.status !== 'NM')) return;
        const groupKey = `${meta.department}-${meta.gender}-${meta.event}`;
        if (!groups[groupKey]) groups[groupKey] = { ...meta, rows: [] };
        groups[groupKey].rows.push({
          ...result,
          raceNumber,
          bib: target.bib || target.teamId || '',
          name: target.name || target.teamName || '',
          affiliation: target.affiliation || ''
        });
      });
    });
    return Object.values(groups).map(group => ({
      ...group,
      rows: group.rows
        .sort((a, b) => {
          const rankA = Number(a.rank); const rankB = Number(b.rank);
          if (Number.isFinite(rankA) && Number.isFinite(rankB)) return rankA - rankB;
          if (Number.isFinite(rankA)) return -1;
          if (Number.isFinite(rankB)) return 1;
          return String(a.time || '').localeCompare(String(b.time || ''), 'ja');
        })
        .slice(0, limit || undefined)
        .map((row, index) => ({ ...row, summaryRank: index + 1 }))
    })).sort((a, b) => `${a.department}${a.gender}${a.event}`.localeCompare(`${b.department}${b.gender}${b.event}`, 'ja'));
  };

  const handlePrintResultSummary = (limit = null) => {
    const groups = getResultSummaryGroups(limit);
    if (!groups.length) {
      alert('印刷できる競技結果がありません。');
      return;
    }
    const title = limit ? '各競技 上位8位記録一覧' : '各競技 全記録一覧';
    const sections = groups.map(group => `
      <section class="event">
        <h2>${escapeHtml(`${group.department} ${group.gender} ${group.event}`)}</h2>
        <table><thead><tr><th>順位</th><th>組</th><th>ゼッケン</th><th>氏名／チーム名</th><th>所属</th><th>記録</th><th>風速</th><th>状態</th></tr></thead>
        <tbody>${group.rows.map(row => `<tr><td>${escapeHtml(row.summaryRank || '-')}</td><td>第${escapeHtml(row.raceNumber)}組</td><td>${escapeHtml(row.bib)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.affiliation)}</td><td>${escapeHtml(row.time || '-')}</td><td>${escapeHtml(row.wind || '-')}</td><td>${escapeHtml(row.status || 'OK')}</td></tr>`).join('')}</tbody></table>
      </section>`).join('');
    const popup = window.open('', '_blank', 'width=1200,height=850');
    if (!popup) {
      alert('印刷用ウィンドウがブロックされました。ポップアップを許可してください。');
      return;
    }
    popup.document.write(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
      @page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,"Noto Sans JP",sans-serif;color:#111;font-size:10px;margin:0}h1{font-size:20px;margin:0 0 14px;border-bottom:2px solid #111;padding-bottom:8px}.event{break-inside:avoid;margin:0 0 18px}h2{font-size:14px;margin:0 0 5px;background:#e5e7eb;padding:6px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #777;padding:4px 5px;text-align:left}th{background:#f3f4f6;font-weight:700}td:first-child,td:nth-child(2),td:nth-child(3){text-align:center}footer{margin-top:12px;color:#555;font-size:9px}@media print{.no-print{display:none}}</style></head><body><h1>${escapeHtml(title)}</h1>${sections}<footer>出力日時：${escapeHtml(new Date().toLocaleString('ja-JP'))}</footer></body></html>`);
    popup.document.close();
    popup.focus();
    popup.onload = () => { popup.print(); };
  };

  const publicLiveUrl = `${window.location.origin}${window.location.pathname}?${publicCode}`;
  const handleCopyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicLiveUrl);
      alert('速報公開URLをコピーしました。');
    } catch {
      window.prompt('速報公開URLをコピーしてください。', publicLiveUrl);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const generateTimetable = () => {
    const candidates = Object.entries(draws).map(([key, races]) => {
      const parts = key.split('-');
      const event = parts.pop() || '';
      const gender = parts.pop() || '';
      const department = parts.join('-');
      const raceList = Array.isArray(races) ? races : [];
      if (!raceList.length) return null;
      const field = isFieldEvent(event);
      const relay = isRelayEvent(event);
      const round = raceList.length === 1
        ? (isSingleRaceEvent(event) ? 'タイムレース' : '決勝')
        : '予選';
      return {
        key, department, gender, event, field, relay,
        title: `${department}${gender}${event}`,
        venue: field ? 'フィールド' : 'トラック',
        round, heats: raceList.length,
        participants: raceList.reduce((sum, race) => sum + (race.lanes?.length || 0), 0),
        durationMinutes: estimateTimetableDuration(event, raceList.length, raceList.reduce((sum, race) => sum + (race.lanes?.length || 0), 0), field)
      };
    }).filter(Boolean).sort((a, b) => Number(a.field) - Number(b.field) || a.event.localeCompare(b.event, 'ja'));
    let trackClock = timeToMinutes(timetableConfig.trackStart) ?? 8 * 60 + 45;
    let fieldClock = timeToMinutes(timetableConfig.fieldStart) ?? 9 * 60;
    const rows = candidates.map((candidate, index) => {
      const isField = candidate.field;
      const start = isField ? fieldClock : trackClock;
      const callStart = isField ? timetableConfig.fieldCallStart : timetableConfig.trackCallStart;
      const callComplete = isField ? timetableConfig.fieldCallComplete : timetableConfig.trackCallComplete;
      const interval = Math.max(isField ? Number(timetableConfig.fieldInterval) : Number(timetableConfig.trackInterval), Number(candidate.durationMinutes) || 0);
      const row = {
        ...candidate, order: index + 1, startTime: minutesToTime(start),
        callStartTime: minutesToTime(start - callStart),
        callCompleteTime: minutesToTime(start - callComplete),
        callLocation: isField ? candidate.event : '各種目スタート付近'
      };
      if (isField) fieldClock += interval;
      else trackClock += interval;
      return row;
    });
    setTimetableRows(rows);
    if (!rows.length) alert('組割り済みの競技がありません。先にエントリー登録と組割りを行ってください。');
  };

  const reorderTimetableRows = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === undefined || toIndex === null || toIndex === undefined || fromIndex === toIndex) return;
    setTimetableRows(prev => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return recalculateTimetableRows(next, timetableConfig);
    });
  };

  const updateTimetableStartTime = (rowKey, value) => {
    if (!/^\d{2}:\d{2}$/.test(value)) return;
    setTimetableRows(prev => recalculateTimetableRows(
      prev.map(row => row.key === rowKey ? { ...row, manuallyScheduled: true } : row),
      timetableConfig,
      rowKey,
      timeToMinutes(value)
    ));
  };

  const moveTimetableRow = (index, direction) => {
    const targetIndex = index + direction;
    reorderTimetableRows(index, targetIndex);
  };

  const handleTimetableDrop = (targetIndex) => {
    reorderTimetableRows(draggingTimetableIndex, targetIndex);
    setDraggingTimetableIndex(null);
  };

  const handleExportTimetableCsv = () => {
    if (!timetableRows.length) return;
    const headers = ['順序', '開始時間', '所要時間(分)', '招集開始時間', '招集完了時間', '競技名', '競技場所', 'ラウンド', '組数', '参加人数', '招集場所'];
    const csvCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csvRows = timetableRows.map(row => [row.order, row.startTime, row.durationMinutes, row.callStartTime, row.callCompleteTime, row.title, row.venue, row.round, row.heats, row.participants, row.callLocation]);
    const csv = [headers, ...csvRows].map(row => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `track-and-field-timetable-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  const openCertificatePopup = (content, target) => {
    if (!content) return;
    const popup = window.open('', 'certificate-preview-window', 'width=900,height=900,resizable=yes,scrollbars=yes');
    if (!popup) {
      alert('ポップアップがブロックされました。ブラウザのポップアップを許可してください。');
      return;
    }
    const fieldSuffix = isFieldEvent(content.event) ? 'm' : '';
    const order = target?.isRelay
      ? `<div class="order">走者: 1走 ${escapeHtml(target.order?.r1 || '-')} / 2走 ${escapeHtml(target.order?.r2 || '-')} / 3走 ${escapeHtml(target.order?.r3 || '-')} / 4走 ${escapeHtml(target.order?.r4 || '-')}</div>`
      : '';
    popup.document.open();
    popup.document.write(`<!doctype html><html lang="ja"><head><meta charset="UTF-8"><title>${escapeHtml(content.title || '賞状')}</title><style>
      *{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,'Noto Sans JP',sans-serif;padding:32px}.toolbar{text-align:right;margin:0 auto 16px;max-width:760px}.toolbar button{background:#059669;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-weight:bold;cursor:pointer}.certificate{background:#fff;border:8px solid rgba(217,119,6,.3);max-width:760px;margin:0 auto;padding:72px 64px;text-align:center;box-shadow:0 12px 30px rgba(15,23,42,.15)}h1{display:inline-block;font-size:32px;letter-spacing:.35em;border-bottom:2px solid #0f172a;padding-bottom:8px;margin:0 0 36px}.recipient{font-size:20px;font-weight:900;margin:0 0 6px}.meta{color:#64748b;font-size:13px}.order{display:inline-block;background:#f8fafc;border-top:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;padding:10px 16px;margin:18px 0;font-family:monospace;font-size:12px}.body{white-space:pre-line;color:#475569;font-size:14px;line-height:2;margin:28px 0}.record{display:inline-block;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px 24px;text-align:left;font-family:monospace;font-size:13px;line-height:1.9}.footer{color:#64748b;font-size:13px;margin-top:32px}.issuer{font-weight:bold;color:#1e293b;margin-top:6px}@media print{body{padding:0;background:#fff}.toolbar{display:none}.certificate{border-color:#92400e;box-shadow:none;max-width:none;min-height:100vh;margin:0}}
    </style></head><body><div class="toolbar"><button onclick="window.print()">賞状を印刷する</button></div><main class="certificate"><h1>${escapeHtml(content.title || '賞 状')}</h1><p class="recipient">${escapeHtml(content.name)} 殿</p><p class="meta">（${escapeHtml(content.affiliation)} / ${escapeHtml(content.department)}）</p>${order}<p class="body">${escapeHtml(content.body)}</p><div class="record"><div><b>ID / ゼッケン:</b> No. ${escapeHtml(target?.bib || '-')}</div><div><b>部門:</b> ${escapeHtml(content.department || '-')}</div><div><b>種目:</b> ${escapeHtml(content.gender)} ${escapeHtml(content.event)}</div><div><b>順位:</b> 第 ${escapeHtml(content.rank)} 位</div><div><b>記録:</b> ${escapeHtml(content.time)} ${fieldSuffix}</div></div><div class="footer"><div>${escapeHtml(content.date)}</div><div class="issuer">${escapeHtml(content.issuer)}</div></div></main></body></html>`);
    popup.document.close();
    popup.focus();
  };

  const handleCertificatePreview = (target, raceKey, result, dept, gender, ev) => {
    if (!target || !result?.time) return;
    const nextContent = {
      title: '賞 状',
      name: target.name || '',
      affiliation: target.affiliation || '',
      department: dept || '',
      gender: gender || '',
      event: ev || '',
      rank: result.rank || '-',
      time: result.time || '',
      body: 'あなたは第35回市民陸上競技大会において\n下記の通り優秀な成績を収められましたのでこれを賞します。',
      date: '2026年 10月 15日',
      issuer: '陸上競技大会実行委員会 会長'
    };
    setSelectedCertificate({ target, raceKey, result, dept, gender, ev });
    setCertificateContent(nextContent);
    openCertificatePopup(nextContent, target);
    window.setTimeout(() => {
      document.getElementById('certificate-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const navTabs = [
    { id: 'entries', label: 'エントリー管理 (個人 / リレー)', icon: Users, protected: true },
    { id: 'draws', label: 'プログラム編成・組割り', icon: LayoutList, protected: true },
    { id: 'results', label: '競技結果入力', icon: FileEdit, protected: true },
    { id: 'live', label: '速報・リアルタイム表示', icon: Radio, protected: false },
    { id: 'timetable', label: 'タイムテーブル', icon: CalendarDays, protected: true },
    { id: 'certificates', label: '記録証・賞状発行', icon: Printer, protected: true },
    { id: 'userSettings', label: 'ログインユーザー管理', icon: UserCheck, protected: true },
  ];

  const currentTabObj = navTabs.find(t => t.id === activeTab);
  const currentKey = `${selectedDepartment}-${selectedGender}-${selectedEvent}`;
  const allConditionMode = !selectedDepartment && !selectedGender && !selectedEvent;
  const overallFinalResults = (draws[currentKey] || []).flatMap(race => {
    const raceKey = `${currentKey}-${race.raceNumber}`;
    return (results[raceKey] || []).map(result => ({
      ...result,
      raceNumber: race.raceNumber,
      athlete: race.lanes.find(item => item.athlete.id === result.athleteId)?.athlete
    }));
  }).filter(result => result.athlete && result.status === 'OK' && parsePerformanceValue(result.time) !== null)
    .sort((a, b) => {
      const diff = parsePerformanceValue(a.time) - parsePerformanceValue(b.time);
      return isFieldEvent(selectedEvent) ? -diff : diff;
    })
    .map((result, index) => ({ ...result, overallRank: index + 1 }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* ヘッダー */}
      <header className="bg-slate-900 text-white shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Trophy className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wide">
                {isForbiddenPage ? '403エラー' : (isAdminPage ? (user ? '陸上競技記録管理システム' : '管理者ログイン') : '速報・リアルタイム結果')}
              </h1>
              <p className="text-xs text-slate-400">Track & Field Meet Operations Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                <div aria-hidden="true" className="w-7 h-7 rounded-full border border-slate-600 bg-indigo-600 flex items-center justify-center text-xs font-black text-white">{(user.name || '役').slice(0, 1)}</div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Shield size={10} /> 役員ログイン中
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  type="button" title="ログアウト" aria-label="ログアウト"
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors ml-1"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : authRestoring ? (
              <span className="text-xs text-slate-300 font-semibold">ログイン状態を確認中...</span>
            ) : null}
          </div>
        </div>

        {authError && (
          <div className="bg-rose-600 text-white text-xs py-2 px-6 flex items-center justify-between font-bold">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{authError}</span>
            </div>
            <button onClick={() => setAuthError('')} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {sessionWarning && !authError && (
          <div className="bg-amber-500 text-white text-xs py-2 px-6 flex items-center justify-between font-bold">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{sessionWarning}</span>
            </div>
            <button
              type="button"
              onClick={() => { setSessionWarning(''); setAuthCheckNonce(count => count + 1); }}
              className="text-white underline decoration-white/60 hover:decoration-white"
            >
              再試行
            </button>
          </div>
        )}

        {canRenderApp && (!isAdminPage || user) && (
          <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto border-t border-slate-800">
            {navTabs.filter(tab => user || !tab.protected).map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-indigo-500 text-white bg-slate-800/80' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {tab.protected && !user && <Lock size={12} className="text-amber-400 ml-0.5" />}
              </button>
            );
            })}
          </div>
        )}
      </header>

      {isForbiddenPage ? (
        <main className="max-w-7xl mx-auto p-6">
          <div className="min-h-[55vh] flex items-center justify-center">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center max-w-lg">
              <div className="text-6xl font-black text-slate-300 mb-4">403</div>
              <h2 className="text-xl font-black text-slate-800">アクセスできません</h2>
              <p className="text-sm text-slate-500 mt-3">公開速報URLまたは管理者専用URLからアクセスしてください。</p>
            </div>
          </div>
        </main>
      ) : canRenderApp && (
        <main className="max-w-7xl mx-auto p-6">
        {!user && authRestoring && (isAdminPage || currentTabObj?.protected) ? (
          <div className="min-h-[60vh] flex items-center justify-center py-10">
            <div className="text-center px-4">
              <div className="mx-auto w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" aria-hidden="true" />
              <p className="mt-4 text-sm font-bold text-slate-700">ログイン状態を確認しています...</p>
              <p className="mt-1 text-xs text-slate-500">画面を更新してもログイン画面には戻りません。しばらくお待ちください。</p>
            </div>
          </div>
        ) : isAdminPage && !user ? (
          <div className="min-h-[68vh] flex items-center justify-center py-10">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-8 sm:p-10">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center"><Lock className="text-indigo-600" size={32} /></div>
              <h2 className="mt-5 text-center text-2xl font-black text-slate-900">管理者ログイン</h2>
              <p className="mt-3 text-center text-sm leading-6 text-slate-600">大会運営機能を利用するには、登録済みの管理者アカウントでログインしてください。</p>
              <div className="mt-5 rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-xs leading-5 text-indigo-900">
                <p className="font-bold">ログイン画面の使い方</p>
                <ol className="list-decimal list-inside mt-1 space-y-0.5"><li>管理者から発行されたログインIDを入力</li><li>対応するパスワードを入力</li><li>「ログイン」ボタンを押す</li></ol>
              </div>
              <form onSubmit={handleLogin} className="mt-7 space-y-5">
                <label className="block text-sm font-bold text-slate-700">ユーザー名（ログインID）<input id="admin-login-id" value={loginId} onChange={event => setLoginId(event.target.value)} placeholder="例：official" autoComplete="username" required className="mt-2 w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-base text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label>
                <label className="block text-sm font-bold text-slate-700">パスワード<input id="admin-login-password" value={loginPassword} onChange={event => setLoginPassword(event.target.value)} type="password" placeholder="パスワードを入力" autoComplete="current-password" required className="mt-2 w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-base text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label>
                <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-base font-black shadow-md transition-colors">ログイン</button>
              </form>
              <p className="mt-5 text-center text-xs text-slate-500">パスワードが分からない場合は、大会システム管理者に確認してください。</p>
            </div>
          </div>
        ) : currentTabObj?.protected && !user ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center text-amber-900 shadow-sm my-8">
            <Lock className="mx-auto text-amber-600 mb-3" size={36} />
            <h3 className="text-base font-bold">役員権限が必要です</h3>
            <p className="text-xs text-amber-700 mt-1 mb-4">
              エントリー情報の閲覧・登録、プログラム編成、結果入力、賞状発行を行うには 役員アカウントでのログインが必要です。
            </p>
            <form onSubmit={handleLogin} className="flex flex-wrap justify-center gap-3">
              <label className="flex flex-col items-start gap-1 text-xs font-bold text-slate-600"><span>ログインID</span><input value={loginId} onChange={event => setLoginId(event.target.value)} placeholder="例：official" autoComplete="username" className="w-44 px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:ring-2 focus:ring-indigo-400" /></label>
              <label className="flex flex-col items-start gap-1 text-xs font-bold text-slate-600"><span>パスワード</span><input value={loginPassword} onChange={event => setLoginPassword(event.target.value)} type="password" placeholder="パスワード" autoComplete="current-password" className="w-44 px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:ring-2 focus:ring-indigo-400" /></label>
              <button type="submit" className="self-end px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all shadow-md">ログイン</button>
            </form>
          </div>
        ) : (
          <>
            {activeTab === 'timetable' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><CalendarDays size={20} className="text-indigo-600" />競技日程表・タイムテーブル</h2>
                  <p className="text-xs text-slate-500 mt-2">現在の組割りから、PDF見本に近い競技順・開始時間・招集時間・組数を自動作成します。</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                    <label className="text-xs font-bold text-slate-600">開催日<input type="text" placeholder="9月19日(土)" value={timetableConfig.date} onChange={event => setTimetableConfig({ ...timetableConfig, date: event.target.value })} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm" /></label>
                    <label className="text-xs font-bold text-slate-600">予備日<input type="text" placeholder="9月26日(土)" value={timetableConfig.reserveDate} onChange={event => setTimetableConfig({ ...timetableConfig, reserveDate: event.target.value })} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm" /></label>
                    <label className="text-xs font-bold text-slate-600">トラック開始<input type="time" value={timetableConfig.trackStart} onChange={event => setTimetableConfig({ ...timetableConfig, trackStart: event.target.value })} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm" /></label>
                    <label className="text-xs font-bold text-slate-600">フィールド開始<input type="time" value={timetableConfig.fieldStart} onChange={event => setTimetableConfig({ ...timetableConfig, fieldStart: event.target.value })} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm" /></label>
                    <label className="text-xs font-bold text-slate-600">トラック間隔(分)<input type="number" min="1" value={timetableConfig.trackInterval} onChange={event => setTimetableConfig({ ...timetableConfig, trackInterval: event.target.value })} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm" /></label>
                    <label className="text-xs font-bold text-slate-600">フィールド間隔(分)<input type="number" min="1" value={timetableConfig.fieldInterval} onChange={event => setTimetableConfig({ ...timetableConfig, fieldInterval: event.target.value })} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm" /></label>
                    <label className="text-xs font-bold text-slate-600">トラック招集完了(分前)<input type="number" min="0" value={timetableConfig.trackCallComplete} onChange={event => setTimetableConfig({ ...timetableConfig, trackCallComplete: event.target.value })} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm" /></label>
                    <label className="text-xs font-bold text-slate-600">フィールド招集完了(分前)<input type="number" min="0" value={timetableConfig.fieldCallComplete} onChange={event => setTimetableConfig({ ...timetableConfig, fieldCallComplete: event.target.value })} className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-sm" /></label>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-5">
                    <button type="button" onClick={generateTimetable} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold"><Clock size={16} />組割りから自動生成</button>
                    <button type="button" onClick={handlePrint} disabled={!timetableRows.length} className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-sm font-bold"><Printer size={16} />印刷</button>
                    <button type="button" onClick={handleExportTimetableCsv} disabled={!timetableRows.length} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-sm font-bold"><Download size={16} />CSV出力</button>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="timetable-preview">
                  <div className="text-center mb-5"><h1 className="text-xl font-black text-slate-900">競技日程表</h1><p className="text-sm font-bold text-slate-700">{timetableConfig.date || '開催日未設定'}<span className="ml-8 text-xs font-normal text-slate-500">予備日：{timetableConfig.reserveDate || '未設定'}</span></p></div>
                  <div className="mb-5 text-sm text-slate-700"><h3 className="font-black border-b-2 border-slate-700 pb-1">◆ 招集時間について</h3><p className="mt-2">トラック競技は競技開始時間の{timetableConfig.trackCallComplete}分前が招集完了時間です。招集場所は各種目のスタート付近になります。</p><p>フィールド競技は競技開始時間の{timetableConfig.fieldCallComplete}分前が招集完了時間です。招集場所は各種目のピットになります。</p></div>
                  {['トラック', 'フィールド'].map(section => {
                    const sectionRows = timetableRows.filter(row => row.venue === section);
                    if (!sectionRows.length) return null;
                    return <section key={section} className="mb-7"><h2 className="text-base font-black border-b-2 border-slate-800 pb-1 mb-2">{section}競技</h2><p className="text-[11px] text-slate-500 mb-2 print:hidden">行をドラッグして移動するか、↑↓ボタンで競技順を変更できます。開始時刻を変更すると、全競技を所要時間に沿って自動調整します。</p><div className="overflow-x-auto"><table className="w-full text-xs border-collapse"><thead><tr className="bg-slate-100"><th className="border border-slate-300 p-1 print:hidden">移動</th><th className="border border-slate-300 p-1">順序</th><th className="border border-slate-300 p-1">開始時間</th><th className="border border-slate-300 p-1">所要時間</th><th className="border border-slate-300 p-1">招集開始</th><th className="border border-slate-300 p-1">招集完了</th><th className="border border-slate-300 p-1 text-left">競技名</th><th className="border border-slate-300 p-1">競技場所</th><th className="border border-slate-300 p-1">ラウンド</th><th className="border border-slate-300 p-1">組数</th><th className="border border-slate-300 p-1">参加人数</th></tr></thead><tbody>{sectionRows.map(row => { const index = timetableRows.findIndex(item => item.key === row.key); return <tr key={row.key} draggable onDragStart={() => setDraggingTimetableIndex(index)} onDragOver={event => event.preventDefault()} onDrop={() => handleTimetableDrop(index)} className={draggingTimetableIndex === index ? 'bg-indigo-50 opacity-60' : 'hover:bg-slate-50'}><td className="border border-slate-300 p-1 text-center print:hidden"><div className="flex items-center justify-center gap-1"><button type="button" title="1つ上へ移動" aria-label={`${row.title}を1つ上へ移動`} disabled={index === 0} onClick={() => moveTimetableRow(index, -1)} className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-30 font-bold">↑</button><button type="button" title="1つ下へ移動" aria-label={`${row.title}を1つ下へ移動`} disabled={index === timetableRows.length - 1} onClick={() => moveTimetableRow(index, 1)} className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-30 font-bold">↓</button></div></td><td className="border border-slate-300 p-1 text-center">{row.order}</td><td className="border border-slate-300 p-1 text-center font-bold"><input type="time" value={row.startTime} onChange={event => updateTimetableStartTime(row.key, event.target.value)} onInput={event => updateTimetableStartTime(row.key, event.currentTarget.value)} onBlur={event => updateTimetableStartTime(row.key, event.currentTarget.value)} step="60" className="w-24 p-1 border border-slate-300 rounded font-bold print:border-0 print:p-0" aria-label={`${row.title}の開始時刻`} /></td><td className="border border-slate-300 p-1 text-center">{row.durationMinutes}分</td><td className="border border-slate-300 p-1 text-center">{row.callStartTime}</td><td className="border border-slate-300 p-1 text-center">{row.callCompleteTime}</td><td className="border border-slate-300 p-1">{row.title}</td><td className="border border-slate-300 p-1 text-center">{row.venue}</td><td className="border border-slate-300 p-1 text-center">{row.round}</td><td className="border border-slate-300 p-1 text-center">{row.heats}</td><td className="border border-slate-300 p-1 text-center">{row.participants}</td></tr>; })}</tbody></table></div></section>;
                  })}
                  {!timetableRows.length && <div className="py-16 text-center text-slate-400 text-sm">「組割りから自動生成」を押すとタイムテーブルが表示されます。</div>}
                </div>
              </div>
            )}
            {activeTab === 'userSettings' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><UserCheck size={20} className="text-indigo-600" />ログインユーザー管理</h2>
                  <p className="text-xs text-slate-500 mt-2">パスワードは表示されません。変更する場合だけ新しいパスワードを入力してください。</p>
                  <form onSubmit={handleUpdateUser} className="mt-6 space-y-4">
                    <label className="block text-sm font-bold text-slate-700">ログインID<input value={userEdit.username} onChange={event => setUserEdit({ ...userEdit, username: event.target.value })} autoComplete="username" required className="mt-1 w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400" /></label>
                    <label className="block text-sm font-bold text-slate-700">表示名<input value={userEdit.displayName} onChange={event => setUserEdit({ ...userEdit, displayName: event.target.value })} required className="mt-1 w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400" /></label>
                    <label className="block text-sm font-bold text-slate-700">新しいパスワード<span className="ml-2 text-xs font-normal text-slate-400">変更しない場合は空欄</span><input value={userEdit.password} onChange={event => setUserEdit({ ...userEdit, password: event.target.value })} type="password" autoComplete="new-password" minLength={12} placeholder="12文字以上推奨" className="mt-1 w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400" /></label>
                    <div className="flex items-center justify-between gap-3 pt-2"><span className="text-sm font-bold text-emerald-600">{userEditMessage}</span><button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold">ユーザー情報を保存</button></div>
                  </form>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  {adminUsersMessage && <p className="mt-3 text-sm font-bold text-indigo-600">{adminUsersMessage}</p>}
                  <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
                    {adminUsers.map(account => (
                      <div key={account.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                        <div><span className="font-bold text-slate-800">{account.displayName}</span><span className="ml-2 text-slate-500">({account.username})</span></div>
                        {String(account.id) !== String(user?.id) && <button type="button" onClick={() => handleDeleteAdminUser(account.id)} className="px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50">削除</button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* 1. エントリー管理 */}
            {activeTab === 'entries' && (
              <div className="space-y-6">
                <div className="flex border-b border-slate-200 gap-4">
                  <button
                    onClick={() => { setEntrySubTab('individual'); handleCancelEdit(); }}
                    className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                      entrySubTab === 'individual'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <UserPlus size={16} /> 個人エントリー管理 ({individualEntries.length}件)
                  </button>
                  <button
                    onClick={() => { setEntrySubTab('relay'); handleCancelEdit(); }}
                    className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                      entrySubTab === 'relay'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Flag size={16} /> リレーチームエントリー管理 ({relayTeams.length}件)
                  </button>
                  <button
                    type="button"
                    onClick={handleExportSelectedEntriesCsv}
                    disabled={!selectedIndividualIds.length && !selectedRelayIds.length}
                    className="ml-auto self-start flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold"
                  >
                    <Download size={14} /> 選択エントリーをCSV出力 ({selectedIndividualIds.length + selectedRelayIds.length})
                  </button>
                </div>

                {/* 個人エントリー管理 */}
                {entrySubTab === 'individual' && (
                  <div className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          {editingId ? <Edit3 size={16} className="text-amber-600" /> : <Plus size={16} className="text-indigo-600" />}
                          {editingId ? '個人選手情報の編集' : '個人選手エントリー追加'}
                        </h2>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadSampleCSV('individual')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                          >
                            <Download size={14} /> サンプルCSV (個人)
                          </button>
                          <label className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm">
                            <Upload size={14} /> CSV一括インポート
                            <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                          </label>
                        </div>
                      </div>

                      <form onSubmit={handleSaveIndividual} className="grid grid-cols-1 md:grid-cols-7 gap-3">
                        <input
                          type="text"
                          placeholder="ゼッケン"
                          value={newIndividual.bib}
                          onChange={e => setNewIndividual({ ...newIndividual, bib: e.target.value })}
                          className="p-2 border border-slate-300 rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          placeholder="氏名"
                          value={newIndividual.name}
                          onChange={e => setNewIndividual({ ...newIndividual, name: e.target.value })}
                          className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                          required
                        />
                        <input
                          type="text"
                          placeholder="所属団体 (例: 水戸AC)"
                          value={newIndividual.affiliation}
                          onChange={e => setNewIndividual({ ...newIndividual, affiliation: e.target.value })}
                          className="p-2 border border-slate-300 rounded-lg text-xs"
                          required
                        />
                        <select
                          value={newIndividual.department}
                          onChange={e => {
                            const department = e.target.value;
                            const events = getAvailableIndividualEvents(department, newIndividual.gender);
                            setNewIndividual({ ...newIndividual, department, event: events.includes(newIndividual.event) ? newIndividual.event : events[0] });
                          }}
                          className="p-2 border border-slate-300 rounded-lg text-xs"
                        >
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select
                          value={newIndividual.gender}
                          onChange={e => {
                            const gender = e.target.value;
                            const events = getAvailableIndividualEvents(newIndividual.department, gender);
                            setNewIndividual({ ...newIndividual, gender, event: events.includes(newIndividual.event) ? newIndividual.event : events[0] });
                          }}
                          className="p-2 border border-slate-300 rounded-lg text-xs"
                        >
                          {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select
                          value={newIndividual.event}
                          onChange={e => setNewIndividual({ ...newIndividual, event: e.target.value })}
                          className="p-2 border border-slate-300 rounded-lg text-xs font-bold text-indigo-600"
                        >
                          {getAvailableIndividualEvents(newIndividual.department, newIndividual.gender).map(ev => <option key={ev} value={ev}>{ev}</option>)}
                        </select>
                        <input
                          type="text"
                          placeholder="PB (例: 11.50)"
                          value={newIndividual.pb}
                          onChange={e => setNewIndividual({ ...newIndividual, pb: e.target.value })}
                          className="p-2 border border-slate-300 rounded-lg text-xs font-mono"
                        />
                        <div className="md:col-span-7 flex justify-end gap-2 pt-2">
                          {editingId && (
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1"
                            >
                              <X size={14} /> キャンセル
                            </button>
                          )}
                          <button
                            type="submit"
                            className={`px-6 py-2 text-white font-bold text-xs rounded-lg transition-colors shadow-sm ${
                              editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            {editingId ? '変更を保存' : '個人選手を追加'}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Search size={16} className="text-slate-400" />
                          <input
                            type="text"
                            placeholder="ゼッケン・氏名・所属で検索..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="p-2 border border-slate-200 rounded-lg text-xs w-64"
                          />
                        </div>
                        <div className="flex items-center gap-3"><span className="text-xs text-slate-500 font-semibold">全 {individualEntries.length} 名</span><button type="button" onClick={handleBulkDeleteIndividuals} disabled={!selectedIndividualIds.length} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold">選択した個人を一括削除 ({selectedIndividualIds.length})</button></div>
                      </div>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="p-3 font-bold w-10 text-center"><input type="checkbox" aria-label="個人エントリーを全選択" checked={individualEntries.length > 0 && selectedIndividualIds.length === individualEntries.length} onChange={event => setSelectedIndividualIds(event.target.checked ? individualEntries.map(entry => entry.id) : [])} /></th>
                            <th className="p-3 font-bold w-16 text-center">ゼッケン</th>
                            <th className="p-3 font-bold">氏名</th>
                            <th className="p-3 font-bold">所属団体</th>
                            <th className="p-3 font-bold">部門</th>
                            <th className="p-3 font-bold w-16 text-center">性別</th>
                            <th className="p-3 font-bold">種目</th>
                            <th className="p-3 font-bold">PB</th>
                            <th className="p-3 font-bold text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {individualEntries
                            .filter(e => e.name.includes(searchTerm) || e.affiliation.includes(searchTerm) || e.bib.includes(searchTerm))
                            .map(entry => (
                              <tr key={entry.id} className="hover:bg-slate-50/80">
                                <td className="p-3 text-center"><input type="checkbox" aria-label={`${entry.name}を選択`} checked={selectedIndividualIds.includes(entry.id)} onChange={event => setSelectedIndividualIds(prev => event.target.checked ? [...prev, entry.id] : prev.filter(id => id !== entry.id))} /></td>
                                <td className="p-3 text-center font-mono font-bold text-indigo-600">{entry.bib || '-'}</td>
                                <td className="p-3 font-bold text-slate-800">{entry.name}</td>
                                <td className="p-3 text-slate-600">{entry.affiliation}</td>
                                <td className="p-3 text-slate-600">{entry.department}</td>
                                <td className="p-3 text-center text-slate-600">{entry.gender}</td>
                                <td className="p-3 text-indigo-600 font-bold">{entry.event}</td>
                                <td className="p-3 text-slate-600 font-mono">{entry.pb || '-'}</td>
                                <td className="p-3 text-right space-x-1">
                                  <button type="button" aria-label={`${entry.name}を編集`} onClick={() => handleStartEditIndividual(entry)} className="text-amber-600 hover:text-amber-800 p-1"><Edit3 size={14} /></button>
                                  <button type="button" aria-label={`${entry.name}を削除`} onClick={() => handleDeleteIndividual(entry.id)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 size={14} /></button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* リレーチームエントリー管理 */}
                {entrySubTab === 'relay' && (
                  <div className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            {editingId ? <Edit3 size={16} className="text-amber-600" /> : <Plus size={16} className="text-indigo-600" />}
                            {editingId ? 'リレーチーム情報の編集' : 'リレーチームエントリー追加'}
                          </h2>
                          <p className="text-[11px] text-slate-500 mt-0.5">※当日の走者（1〜4走）は一覧の「オーダー設定」から登録できます。</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadSampleCSV('relay')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                          >
                            <Download size={14} /> サンプルCSV (リレー)
                          </button>
                          <label className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm">
                            <Upload size={14} /> CSV一括インポート
                            <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                          </label>
                        </div>
                      </div>

                      <form onSubmit={handleSaveRelayTeam} className="grid grid-cols-1 md:grid-cols-7 gap-3">
                        <input
                          type="text"
                          placeholder="チームID/ゼッケン"
                          value={newRelayTeam.teamId}
                          onChange={e => setNewRelayTeam({ ...newRelayTeam, teamId: e.target.value })}
                          className="p-2 border border-slate-300 rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          placeholder="チーム名"
                          value={newRelayTeam.teamName}
                          onChange={e => setNewRelayTeam({ ...newRelayTeam, teamName: e.target.value })}
                          className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                          required
                        />
                        <input
                          type="text"
                          placeholder="所属団体"
                          value={newRelayTeam.affiliation}
                          onChange={e => setNewRelayTeam({ ...newRelayTeam, affiliation: e.target.value })}
                          className="p-2 border border-slate-300 rounded-lg text-xs"
                          required
                        />
                        <select
                          value={newRelayTeam.department}
                          onChange={e => setNewRelayTeam({ ...newRelayTeam, department: e.target.value })}
                          className="p-2 border border-slate-300 rounded-lg text-xs"
                        >
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select
                          value={newRelayTeam.gender}
                          onChange={e => setNewRelayTeam({ ...newRelayTeam, gender: e.target.value })}
                          className="p-2 border border-slate-300 rounded-lg text-xs"
                        >
                          {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select
                          value={newRelayTeam.event}
                          onChange={e => setNewRelayTeam({ ...newRelayTeam, event: e.target.value })}
                          className="p-2 border border-slate-300 rounded-lg text-xs font-bold text-indigo-600"
                        >
                          {RELAY_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                        </select>
                        <input
                          type="text"
                          placeholder="申込タイム"
                          value={newRelayTeam.pb}
                          onChange={e => setNewRelayTeam({ ...newRelayTeam, pb: e.target.value })}
                          className="p-2 border border-slate-300 rounded-lg text-xs font-mono"
                        />
                        <div className="md:col-span-7 flex justify-end gap-2 pt-2">
                          {editingId && (
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1"
                            >
                              <X size={14} /> キャンセル
                            </button>
                          )}
                          <button
                            type="submit"
                            className={`px-6 py-2 text-white font-bold text-xs rounded-lg transition-colors shadow-sm ${
                              editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            {editingId ? '変更を保存' : 'リレーチームを追加'}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Search size={16} className="text-slate-400" />
                          <input
                            type="text"
                            placeholder="チーム名・所属で検索..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="p-2 border border-slate-200 rounded-lg text-xs w-64"
                          />
                        </div>
                        <div className="flex items-center gap-3"><span className="text-xs text-slate-500 font-semibold">全 {relayTeams.length} チーム</span><button type="button" onClick={handleBulkDeleteRelays} disabled={!selectedRelayIds.length} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold">選択したリレーを一括削除 ({selectedRelayIds.length})</button></div>
                      </div>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="p-3 font-bold w-10 text-center"><input type="checkbox" aria-label="リレーを全選択" checked={relayTeams.length > 0 && selectedRelayIds.length === relayTeams.length} onChange={event => setSelectedRelayIds(event.target.checked ? relayTeams.map(team => team.id) : [])} /></th>
                            <th className="p-3 font-bold w-16 text-center">ID</th>
                            <th className="p-3 font-bold">チーム名</th>
                            <th className="p-3 font-bold">所属団体</th>
                            <th className="p-3 font-bold">部門 / 性別</th>
                            <th className="p-3 font-bold">種目</th>
                            <th className="p-3 font-bold">申込タイム</th>
                            <th className="p-3 font-bold">当日オーダー (1走〜4走)</th>
                            <th className="p-3 font-bold text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {relayTeams
                            .filter(t => t.teamName.includes(searchTerm) || t.affiliation.includes(searchTerm) || t.teamId.includes(searchTerm))
                            .map(team => {
                              const hasOrder = team.order?.r1 || team.order?.r2 || team.order?.r3 || team.order?.r4;
                              return (
                                <tr key={team.id} className="hover:bg-slate-50/80">
                                  <td className="p-3 text-center"><input type="checkbox" aria-label={`${team.teamName}を選択`} checked={selectedRelayIds.includes(team.id)} onChange={event => setSelectedRelayIds(prev => event.target.checked ? [...prev, team.id] : prev.filter(id => id !== team.id))} /></td>
                                  <td className="p-3 text-center font-mono font-bold text-indigo-600">{team.teamId || '-'}</td>
                                  <td className="p-3 font-bold text-slate-800">{team.teamName}</td>
                                  <td className="p-3 text-slate-600">{team.affiliation}</td>
                                  <td className="p-3 text-slate-600">{team.department} / {team.gender}</td>
                                  <td className="p-3 text-indigo-600 font-bold">{team.event}</td>
                                  <td className="p-3 text-slate-600 font-mono">{team.pb || '-'}</td>
                                  <td className="p-3">
                                    {hasOrder ? (
                                      <div className="text-[11px] font-mono text-slate-700 bg-indigo-50/60 p-1.5 rounded border border-indigo-100">
                                        1:{team.order.r1 || '未'} | 2:{team.order.r2 || '未'} | 3:{team.order.r3 || '未'} | 4:{team.order.r4 || '未'}
                                      </div>
                                    ) : (
                                      <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold border border-amber-200">
                                        オーダー未定
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right space-x-1">
                                    <button
                                      onClick={() => setEditingTeamForOrder({ ...team })}
                                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[11px] transition-colors border border-indigo-200"
                                    >
                                      オーダー設定
                                    </button>
                                    <button type="button" aria-label={`${team.teamName}を編集`} onClick={() => handleStartEditRelay(team)} className="text-amber-600 hover:text-amber-800 p-1"><Edit3 size={14} /></button>
                                    <button type="button" aria-label={`${team.teamName}を削除`} onClick={() => handleDeleteRelay(team.id)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 size={14} /></button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 当日リレーオーダー設定モーダル */}
            {editingTeamForOrder && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setEditingTeamForOrder(null); }}>
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4" role="dialog" aria-modal="true" aria-labelledby="relay-order-title">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <h3 id="relay-order-title" className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <UserCheck className="text-indigo-600" size={20} />
                        当日リレーオーダー確定・変更
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {editingTeamForOrder.teamName}（{editingTeamForOrder.affiliation} / {editingTeamForOrder.department} {editingTeamForOrder.gender}）
                      </p>
                    </div>
                    <button onClick={() => setEditingTeamForOrder(null)} className="text-slate-400 hover:text-slate-600 p-1">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                    <div>
                      <p className="text-xs font-bold text-indigo-900">オーダーを自動設定</p>
                      <p className="text-[11px] text-indigo-700 mt-0.5">同一所属・部門・性別からゼッケン順に4名を選出します。</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoAssignRelayOrder}
                      className="shrink-0 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      自動設定
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {['r1', 'r2', 'r3', 'r4'].map((runnerKey, idx) => {
                      const runnerLabels = ['1走', '2走', '3走', '4走'];
                      return (
                        <div key={runnerKey} className="flex items-center gap-2">
                          <span className="w-12 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-2 rounded-lg text-center">
                            {runnerLabels[idx]}
                          </span>
                          <input
                            type="text"
                            list={`candidates-${editingTeamForOrder.id}`}
                            placeholder={`${runnerLabels[idx]}の氏名を入力または選択`}
                            value={editingTeamForOrder.order?.[runnerKey] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingTeamForOrder(prev => ({
                                ...prev,
                                order: {
                                  ...prev.order,
                                  [runnerKey]: val
                                }
                              }));
                            }}
                            className="flex-1 p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>
                      );
                    })}

                    <datalist id={`candidates-${editingTeamForOrder.id}`}>
                      {individualEntries
                        .filter(ind => ind.affiliation === editingTeamForOrder.affiliation)
                        .map(ind => (
                          <option key={ind.id} value={ind.name}>
                            {ind.name} (ゼッケン: {ind.bib || 'なし'}) - {ind.event}
                          </option>
                        ))}
                    </datalist>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setEditingTeamForOrder(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => {
                        setRelayTeams(prev => prev.map(t => t.id === editingTeamForOrder.id ? editingTeamForOrder : t));
                        setEditingTeamForOrder(null);
                      }}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm"
                    >
                      オーダーを確定
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. プログラム編成・組割り */}
            {activeTab === 'draws' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                      <Filter size={14} /> 条件設定:
                    </div>
                    <select
                      value={selectedDepartment}
                      onChange={e => setSelectedDepartment(e.target.value)}
                      className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      <option value="">全ての部門</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                      value={selectedGender}
                      onChange={e => setSelectedGender(e.target.value)}
                      className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      <option value="">全ての性別</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select
                      value={selectedEvent}
                      onChange={e => setSelectedEvent(e.target.value)}
                      className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      <option value="">全ての種目</option>
                      {ALL_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                    </select>

                    {!isSingleRaceEvent(selectedEvent) && (
                      <div className="flex items-center gap-1 ml-2 border-l pl-3 border-slate-200 text-xs">
                        <span className="text-slate-500 font-bold">1組のレーン数:</span>
                        <select
                          value={lanesPerRace}
                          onChange={e => setLanesPerRace(Number(e.target.value))}
                          className="p-1.5 border border-slate-300 rounded text-xs font-bold"
                        >
                          <option value={4}>4レーン</option>
                          <option value={6}>6レーン</option>
                          <option value={8}>8レーン</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={generateDraws}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm w-full md:w-auto justify-center"
                  >
                    <Shuffle size={14} /> {allConditionMode ? '全種目の組割りを一括生成' : '組割り編成を実行'}
                  </button>
                </div>

                {allConditionMode ? (
                  Object.keys(draws).length ? (
                    <div className="space-y-4">{Object.entries(draws).map(([key, races]) => {
                      const meta = parseDrawKey(key);
                      return <div key={key} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div className="bg-slate-800 text-white px-4 py-3 text-sm font-black">{meta.department} {meta.gender} {meta.event}（{races.length}組）</div><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">組</th><th className="p-3">レーン/試技順</th><th className="p-3">ID/ゼッケン</th><th className="p-3">氏名/チーム名</th><th className="p-3">所属</th><th className="p-3">申込タイム/PB</th></tr></thead><tbody className="divide-y divide-slate-100">{races.flatMap(race => race.lanes.map(item => <tr key={`${race.raceNumber}-${item.lane}`}><td className="p-3">第{race.raceNumber}組</td><td className="p-3 text-center font-bold text-indigo-600">{item.lane}</td><td className="p-3">{item.athlete.bib || '-'}</td><td className="p-3 font-bold">{item.athlete.name}</td><td className="p-3 text-slate-600">{item.athlete.affiliation}</td><td className="p-3">{item.athlete.pb || '-'}</td></tr>))}</tbody></table></div>;
                    })}</div>
                  ) : <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">表示できる組割りデータがありません。</div>
                ) : draws[currentKey] ? (
                  <div className="grid grid-cols-1 gap-6">
                    {draws[currentKey].map(race => (
                      <div key={race.raceNumber} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-800 text-white px-4 py-3 text-xs font-bold flex justify-between items-center">
                          <span className="text-sm font-black tracking-wide">
                            {selectedDepartment} {selectedGender} {selectedEvent} - 第 {race.raceNumber} 組み
                          </span>
                          {isSingleRaceEvent(selectedEvent) ? (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-md text-[11px] font-bold">
                              ※ タイム決勝のため1組のみ編成
                            </span>
                          ) : (
                            <span className="bg-slate-700 px-2.5 py-1 rounded-md text-[10px] text-slate-300">
                              {lanesPerRace}レーン編成（中央シード配置）
                            </span>
                          )}
                        </div>
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="p-3 text-center w-16 font-bold">{isFieldEvent(selectedEvent) ? '試技順' : 'レーン/並び'}</th>
                              <th className="p-3 w-20 text-center font-bold">ID/ゼッケン</th>
                              <th className="p-3 font-bold">{isRelayEvent(selectedEvent) ? 'チーム名' : '氏名'}</th>
                              <th className="p-3 font-bold">所属</th>
                              {isRelayEvent(selectedEvent) && (
                                <th className="p-3 font-bold">1走～4走 オーダー</th>
                              )}
                              <th className="p-3 font-bold w-24">申込タイム/PB</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {race.lanes.map(item => (
                              <tr key={item.lane} className="hover:bg-slate-50/80">
                                <td className="p-3 text-center font-black text-indigo-600 bg-slate-50/50 text-sm">{item.lane}</td>
                                <td className="p-3 text-center font-mono text-slate-500">{item.athlete.bib || '-'}</td>
                                <td className="p-3 font-bold text-slate-800">{item.athlete.name}</td>
                                <td className="p-3 text-slate-600">{item.athlete.affiliation}</td>

                                {isRelayEvent(selectedEvent) && (
                                  <td className="p-3">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1 text-[11px] font-mono">
                                      <div className="bg-indigo-50/80 px-2 py-1 rounded border border-indigo-100 text-indigo-900">
                                        <span className="text-[9px] font-bold text-indigo-400 block">1走</span>
                                        {item.athlete.order?.r1 || '未設定'}
                                      </div>
                                      <div className="bg-indigo-50/80 px-2 py-1 rounded border border-indigo-100 text-indigo-900">
                                        <span className="text-[9px] font-bold text-indigo-400 block">2走</span>
                                        {item.athlete.order?.r2 || '未設定'}
                                      </div>
                                      <div className="bg-indigo-50/80 px-2 py-1 rounded border border-indigo-100 text-indigo-900">
                                        <span className="text-[9px] font-bold text-indigo-400 block">3走</span>
                                        {item.athlete.order?.r3 || '未設定'}
                                      </div>
                                      <div className="bg-indigo-50/80 px-2 py-1 rounded border border-indigo-100 text-indigo-900">
                                        <span className="text-[9px] font-bold text-indigo-400 block">4走</span>
                                        {item.athlete.order?.r4 || '未設定'}
                                      </div>
                                    </div>
                                  </td>
                                )}

                                <td className="p-3 text-slate-500 font-mono">{item.athlete.pb || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    条件を選択し「組割り編成を実行」ボタンを押すとプログラムが生成されます。
                  </div>
                )}
              </div>
            )}

            {/* 3. 競技結果入力 (トラック種目: 着順順にレーン番号自動照会入力 / フィールド種目: 5回試技記録入力) */}
            {activeTab === 'results' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center">
                  <select
                    value={selectedDepartment}
                    onChange={e => setSelectedDepartment(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="">全ての部門</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select
                    value={selectedGender}
                    onChange={e => setSelectedGender(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="">全ての性別</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <select
                    value={selectedEvent}
                    onChange={e => setSelectedEvent(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="">全ての種目</option>
                    {ALL_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                  <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100 ml-auto">
                    {isFieldEvent(selectedEvent) 
                      ? 'フィールド種目 (試技順 / 5回試技・最高記録判定)' 
                      : 'トラック種目 (着順順入力 / レーン番号入力で自動表示)'}
                  </span>
                  <button
                    type="button"
                    onClick={handleRandomizeResults}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                    title={allConditionMode ? '全競技にランダムなテスト結果を入力' : '選択中の全組にランダムなテスト結果を入力'}
                  >
                    <Shuffle size={14} /> {allConditionMode ? '全競技にランダム入力' : 'テスト結果をランダム入力'}
                  </button>
                  {!isPublicLivePage && (
                    <button
                      type="button"
                      onClick={handleExportResultsCsv}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                    >
                      <Download size={14} /> 全競技結果をCSV出力
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center gap-2">
                    <div className="mr-auto">
                      <h2 className="font-black text-slate-800">競技結果一覧</h2>
                      <p className="text-[11px] text-slate-500 mt-1">各競技の記録を順位順に集計して表示します。</p>
                    </div>
                    <button type="button" onClick={() => setResultSummaryMode('top8')} className={`px-3 py-2 rounded-lg text-xs font-bold ${resultSummaryMode === 'top8' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>上位8位まで</button>
                    <button type="button" onClick={() => setResultSummaryMode('all')} className={`px-3 py-2 rounded-lg text-xs font-bold ${resultSummaryMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>全ての記録</button>
                    {!isPublicLivePage && (
                      <button type="button" onClick={() => handlePrintResultSummary(resultSummaryMode === 'top8' ? 8 : null)} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold">
                        <Printer size={14} /> {resultSummaryMode === 'top8' ? '上位8位をPDF出力' : '全記録をPDF出力'}
                      </button>
                    )}
                  </div>
                  {getResultSummaryGroups(resultSummaryMode === 'top8' ? 8 : null).length ? (
                    <div className="p-4 space-y-4">
                      {getResultSummaryGroups(resultSummaryMode === 'top8' ? 8 : null).map(group => (
                        <div key={`${group.department}-${group.gender}-${group.event}`} className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-900 text-white px-4 py-2.5 text-sm font-black">{group.department} {group.gender} {group.event}</div>
                          <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-2.5">順位</th><th className="p-2.5">組</th><th className="p-2.5">ゼッケン</th><th className="p-2.5">氏名／チーム名</th><th className="p-2.5">所属</th><th className="p-2.5">記録</th><th className="p-2.5">風速</th><th className="p-2.5">状態</th></tr></thead><tbody className="divide-y divide-slate-100">{group.rows.map((row, index) => <tr key={`${row.athleteId}-${row.raceNumber}-${index}`}><td className="p-2.5 font-black text-indigo-700">{row.summaryRank}</td><td className="p-2.5">第{row.raceNumber}組</td><td className="p-2.5 font-mono">{row.bib || '-'}</td><td className="p-2.5 font-bold">{row.name}</td><td className="p-2.5 text-slate-600">{row.affiliation}</td><td className="p-2.5 font-mono font-bold">{row.time || '-'}</td><td className="p-2.5">{row.wind || '-'}</td><td className="p-2.5">{row.status || 'OK'}</td></tr>)}</tbody></table></div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="p-10 text-center text-slate-400 text-xs">表示できる競技結果がありません。</div>}
                </div>

                {allConditionMode ? (
                  Object.keys(draws).length ? (
                    <div className="space-y-4">{Object.entries(draws).map(([key, races]) => {
                      const meta = parseDrawKey(key);
                      return <div key={key} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div className="bg-slate-900 text-white px-4 py-3 text-sm font-black">{meta.department} {meta.gender} {meta.event}（{races.length}組）</div><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">組</th><th className="p-3">レーン/試技順</th><th className="p-3">氏名/チーム名</th><th className="p-3">所属</th><th className="p-3">順位</th><th className="p-3">記録</th><th className="p-3">状態</th></tr></thead><tbody className="divide-y divide-slate-100">{races.flatMap(race => { const raceResults = results[`${key}-${race.raceNumber}`] || []; return race.lanes.map(item => { const result = raceResults.find(entry => entry.athleteId === item.athlete.id) || {}; return <tr key={`${race.raceNumber}-${item.lane}`}><td className="p-3">第{race.raceNumber}組</td><td className="p-3 text-center font-bold text-indigo-600">{item.lane}</td><td className="p-3 font-bold">{item.athlete.name}</td><td className="p-3 text-slate-600">{item.athlete.affiliation}</td><td className="p-3">{result.rank || '-'}</td><td className="p-3 font-mono">{result.time || '未入力'}</td><td className="p-3">{result.status || '未入力'}</td></tr>; }); })}</tbody></table></div>;
                    })}</div>
                  ) : <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">表示できる組割りデータがありません。</div>
                ) : draws[currentKey] ? (
                  draws[currentKey].map(race => {
                    const raceKey = `${currentKey}-${race.raceNumber}`;
                    const isField = isFieldEvent(selectedEvent);

                    return (
                      <div key={race.raceNumber} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-900 text-white px-4 py-3 text-xs font-bold flex justify-between items-center">
                          <span className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-400" />
                            {selectedDepartment} {selectedGender} {selectedEvent} - 第 {race.raceNumber} 組み (結果入力)
                          </span>
                          {!isField && (
                            <span className="text-[11px] text-amber-300 font-normal">
                              ※ 着順順にレーン番号を入力してください（ゼッケン・氏名が自動反映されます）
                            </span>
                          )}
                        </div>

                        {/* トラック種目: 着順順に入力するテーブル */}
                        {!isField ? (
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                              <tr>
                                <th className="p-3 text-center w-16 font-bold bg-amber-50/50">着順</th>
                                <th className="p-3 text-center w-28 font-bold">レーン番号</th>
                                <th className="p-3 text-center w-20 font-bold">ゼッケン</th>
                                <th className="p-3 font-bold">{isRelayEvent(selectedEvent) ? 'チーム名 (自動表示)' : '氏名 (自動表示)'}</th>
                                <th className="p-3 font-bold">所属 (自動表示)</th>
                                <th className="p-3 font-bold w-32">タイム/記録</th>
                                <th className="p-3 font-bold w-20">風速</th>
                                <th className="p-3 font-bold w-28">状態</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {race.lanes.map((_, rankIdx) => {
                                const currentRaceResults = results[raceKey] || [];
                                const athleteResult = currentRaceResults[rankIdx] || {};
                                const matchedLane = race.lanes.find(l => String(l.lane) === String(athleteResult.lane));
                                const matchedAthlete = matchedLane?.athlete;

                                return (
                                  <tr key={rankIdx} className="hover:bg-slate-50">
                                    <td className="p-3 text-center font-black text-amber-600 bg-amber-50/30 text-sm">
                                      {rankIdx + 1} 着
                                    </td>
                                    <td className="p-3">
                                      <div className="relative">
                                        <input
                                          type="number"
                                          min="1"
                                          max="20"
                                          placeholder="レーン"
                                          list={`lanes-list-${raceKey}-${rankIdx}`}
                                          value={athleteResult.lane || ''}
                                          onChange={e => handleTrackResultChange(raceKey, rankIdx, 'lane', e.target.value, race.lanes)}
                                          className="p-1.5 border border-slate-300 rounded text-xs w-full font-bold text-center font-mono text-indigo-700 bg-indigo-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <datalist id={`lanes-list-${raceKey}-${rankIdx}`}>
                                          {race.lanes.map(l => (
                                            <option key={l.lane} value={l.lane}>
                                              {l.lane}レーン ({l.athlete.name})
                                            </option>
                                          ))}
                                        </datalist>
                                      </div>
                                    </td>
                                    <td className="p-3 text-center font-mono text-slate-600 font-bold">
                                      {matchedAthlete ? (matchedAthlete.bib || '-') : '-'}
                                    </td>
                                    <td className="p-3 font-bold text-slate-800">
                                      {matchedAthlete ? matchedAthlete.name : (athleteResult.lane ? <span className="text-rose-500 font-normal">該当レーン選手なし</span> : <span className="text-slate-400 font-normal">レーン未入力</span>)}
                                    </td>
                                    <td className="p-3 text-slate-600">
                                      {matchedAthlete ? matchedAthlete.affiliation : '-'}
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="text"
                                        placeholder="例: 11.20"
                                        value={athleteResult.time || ''}
                                        onChange={e => handleTrackResultChange(raceKey, rankIdx, 'time', e.target.value, race.lanes)}
                                        className="p-1.5 border border-slate-300 rounded text-xs w-full font-mono font-bold"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="text"
                                        placeholder="+0.5"
                                        value={athleteResult.wind || '+0.0'}
                                        onChange={e => handleTrackResultChange(raceKey, rankIdx, 'wind', e.target.value, race.lanes)}
                                        className="p-1.5 border border-slate-300 rounded text-xs w-full font-mono"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <select
                                        value={athleteResult.status || 'OK'}
                                        onChange={e => handleTrackResultChange(raceKey, rankIdx, 'status', e.target.value, race.lanes)}
                                        className="p-1.5 border border-slate-300 rounded text-xs w-full"
                                      >
                                        <option value="OK">完走 / 記録</option>
                                        <option value="DNS">DNS(欠場)</option>
                                        <option value="DQ">DQ(失格)</option>
                                      </select>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          /* フィールド種目: 試技順・5回試技記録入力テーブル */
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                              <tr>
                                <th className="p-3 text-center w-12 font-bold">試技順</th>
                                <th className="p-3 text-center w-16 font-bold">ゼッケン</th>
                                <th className="p-3 font-bold">氏名</th>
                                <th className="p-3 font-bold">所属団体</th>
                                <th className="p-2 text-center font-bold w-16">試技1</th>
                                <th className="p-2 text-center font-bold w-16">試技2</th>
                                <th className="p-2 text-center font-bold w-16">試技3</th>
                                <th className="p-2 text-center font-bold w-16">試技4</th>
                                <th className="p-2 text-center font-bold w-16">試技5</th>
                                <th className="p-3 font-bold w-20 text-indigo-700 bg-indigo-50/50">最高記録</th>
                                <th className="p-3 font-bold w-20">風速</th>
                                <th className="p-3 font-bold w-24">状態</th>
                                <th className="p-3 font-bold text-center w-16">順位</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {race.lanes.map(item => {
                                const athleteResult = (results[raceKey] || []).find(r => r.athleteId === item.athlete.id) || {};
                                const attempts = athleteResult.attempts || ['', '', '', '', ''];

                                return (
                                  <tr key={item.lane} className="hover:bg-slate-50">
                                    <td className="p-3 text-center font-bold text-slate-500">{item.lane}</td>
                                    <td className="p-3 text-center font-mono text-slate-500">{item.athlete.bib || '-'}</td>
                                    <td className="p-3 font-bold text-slate-800">{item.athlete.name}</td>
                                    <td className="p-3 text-slate-600">{item.athlete.affiliation}</td>
                                    {[0, 1, 2, 3, 4].map(idx => (
                                      <td key={idx} className="p-1">
                                        <input
                                          type="text"
                                          placeholder="m"
                                          value={attempts[idx] || ''}
                                          onChange={e => handleFieldAttemptChange(raceKey, item.athlete.id, idx, e.target.value)}
                                          className="p-1 border border-slate-300 rounded text-xs w-full text-center font-mono"
                                        />
                                      </td>
                                    ))}
                                    <td className="p-3 font-mono font-black text-indigo-700 bg-indigo-50/30 text-sm">
                                      {athleteResult.time || '-'}
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="text"
                                        placeholder="+0.5"
                                        value={athleteResult.wind || '+0.0'}
                                        onChange={e => handleFieldGeneralChange(raceKey, item.athlete.id, 'wind', e.target.value)}
                                        className="p-1.5 border border-slate-300 rounded text-xs w-full font-mono"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <select
                                        value={athleteResult.status || 'OK'}
                                        onChange={e => handleFieldGeneralChange(raceKey, item.athlete.id, 'status', e.target.value)}
                                        className="p-1.5 border border-slate-300 rounded text-xs w-full"
                                      >
                                        <option value="OK">完走 / 記録</option>
                                        <option value="DNS">DNS(欠場)</option>
                                        <option value="DQ">DQ(失格)</option>
                                        <option value="NM">NM(記録なし)</option>
                                      </select>
                                    </td>
                                    <td className="p-3 text-center font-black text-indigo-600 text-sm">
                                      {athleteResult.rank || '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    先に「プログラム編成・組割り」タブで選択条件の組割りを作成してください。
                  </div>
                )}

                <section className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                  <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-amber-900">タイム決勝・全組総合結果</h3>
                      <p className="text-[11px] text-amber-700 mt-0.5">組に関係なく、入力済みの記録を全組で比較した順位です。</p>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-white px-2 py-1 rounded border border-amber-200">
                      {isFieldEvent(selectedEvent) ? '最高記録の大きい順' : '記録の速い順'}
                    </span>
                  </div>
                  {overallFinalResults.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="p-3 text-center w-16 font-bold">総合順位</th>
                            <th className="p-3 text-center w-20 font-bold">組</th>
                            <th className="p-3 text-center w-20 font-bold">ID/ゼッケン</th>
                            <th className="p-3 font-bold">{isRelayEvent(selectedEvent) ? 'チーム名' : '氏名'}</th>
                            <th className="p-3 font-bold">所属</th>
                            <th className="p-3 font-bold">{isFieldEvent(selectedEvent) ? '最高記録' : '記録'}</th>
                            <th className="p-3 font-bold">風速</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {overallFinalResults.map(result => (
                            <tr key={`${result.raceNumber}-${result.athleteId}`} className={result.overallRank === 1 ? 'bg-amber-50/60 font-bold' : ''}>
                              <td className="p-3 text-center font-black text-amber-600">{result.overallRank}位</td>
                              <td className="p-3 text-center text-slate-500">{result.raceNumber}組</td>
                              <td className="p-3 text-center font-mono text-slate-600">{result.athlete.bib || '-'}</td>
                              <td className="p-3 font-bold text-slate-800">
                                <div>{result.athlete.name}</div>
                                {result.athlete.isRelay && <div className="text-[10px] text-indigo-600 font-normal">走者: {[result.athlete.order?.r1, result.athlete.order?.r2, result.athlete.order?.r3, result.athlete.order?.r4].filter(Boolean).join(' / ') || '未設定'}</div>}
                              </td>
                              <td className="p-3 text-slate-600">{result.athlete.affiliation}</td>
                              <td className="p-3 font-mono font-black text-indigo-700">{result.time}{isFieldEvent(selectedEvent) ? 'm' : ''}</td>
                              <td className="p-3 text-slate-500 font-mono">{result.wind || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">結果を入力すると、全組のタイム決勝順位が表示されます。</div>
                  )}
                </section>
              </div>
            )}

            {/* 4. 速報・リアルタイム表示 */}
            {activeTab === 'live' && (
              <div className="space-y-6">
                <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Radio className="animate-pulse text-rose-400" size={24} />
                    <div>
                      <h2 className="text-sm font-black">大会公式 リアルタイム競技速報</h2>
                      <p className="text-[10px] text-indigo-200">入力された競技結果がリアルタイムで即時更新されます</p>
                    </div>
                  </div>
                  <span className="bg-indigo-800 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-300">
                    LIVE UPDATE
                  </span>
                </div>
                {!isPublicLivePage && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">一般公開用 速報URL</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">URLの6文字コード: <span className="font-mono font-bold text-indigo-600">{publicCode}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPublicCode(createPublicCode())} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">コード更新</button>
                      <button type="button" onClick={handleCopyPublicUrl} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold">URLをコピー</button>
                      <button type="button" onClick={handleExportResultsCsv} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"><Download size={13} /> CSV出力</button>
                    </div>
                  </div>
                    <input readOnly value={publicLiveUrl} aria-label="一般公開用速報URL" className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 bg-slate-50" />
                  </div>
                )}

                {Object.keys(results).length > 0 ? (
                  Object.entries(results).map(([raceKey, raceResults]) => {
                    const [dept, gender, ev, raceNum] = raceKey.split('-');
                    const isField = isFieldEvent(ev);

                    return (
                      <div key={raceKey} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-800 text-white px-4 py-2.5 text-xs font-bold flex justify-between">
                          <span>{dept} {gender} {ev} - 第 {raceNum} 組み 公式結果</span>
                          <span className="text-[10px] text-slate-300 font-normal">
                            {isField ? 'フィールド種目 (5回試技)' : 'トラック種目'}
                          </span>
                        </div>
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="p-3 text-center w-16 font-bold">着順</th>
                              <th className="p-3 text-center w-16 font-bold">ID/ゼッケン</th>
                              <th className="p-3 font-bold">{isRelayEvent(ev) ? 'チーム名 / オーダー' : '氏名'}</th>
                              <th className="p-3 font-bold">所属</th>
                              <th className="p-3 font-bold">{isField ? '最高記録' : '記録'}</th>
                              {isField && <th className="p-3 font-bold">試技履歴 (1〜5回)</th>}
                              <th className="p-3 font-bold">風速</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[...raceResults]
                              .sort((a, b) => (parseInt(a.rank) || 99) - (parseInt(b.rank) || 99))
                              .map((r, idx) => {
                                const target = findEntryById(r.athleteId);
                                return (
                                  <tr key={r.athleteId || idx} className={idx === 0 ? 'bg-amber-50/50 font-bold' : ''}>
                                    <td className="p-3 text-center">
                                      {r.rank === 1 ? <span className="text-amber-500 font-black">🥇 1</span> : r.rank}
                                    </td>
                                    <td className="p-3 text-center font-mono text-slate-500">{target?.bib || '-'}</td>
                                    <td className="p-3 font-bold text-slate-800">
                                      <div>{target?.name || '未登録'}</div>
                                      {target?.isRelay && (
                                        <div className="text-[10px] text-indigo-600 font-mono font-normal mt-0.5">
                                          走者: {[target.order?.r1, target.order?.r2, target.order?.r3, target.order?.r4].filter(Boolean).join(' - ') || '未確定'}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 text-slate-600">{target?.affiliation || '-'}</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">{r.time ? `${r.time}${isField ? 'm' : ''}` : '-'}</td>
                                    {isField && (
                                      <td className="p-3 font-mono text-[11px] text-slate-500">
                                        {(r.attempts || []).map((att, i) => att ? `[${i+1}]${att}m` : `[${i+1}]-`).join(' ')}
                                      </td>
                                    )}
                                    <td className="p-3 text-slate-500">{r.wind}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    現在、確定した競技結果はありません。
                  </div>
                )}
              </div>
            )}

            {/* 5. 記録証・賞状発行 */}
            {activeTab === 'certificates' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
                  <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Award size={18} className="text-indigo-600" /> 賞状・記録証の発行対象選択
                  </h2>
                  <p className="text-xs text-slate-500 mb-4">結果入力済みの選手・リレーチーム一覧から発行対象を選択してください。</p>

                  <div className="space-y-2">
                    {Object.entries(results).map(([raceKey, raceResults]) => {
                      const [dept, gender, ev] = raceKey.split('-');
                      return raceResults.map((r, idx) => {
                        const target = findEntryById(r.athleteId);
                        if (!target || !r.time) return null;
                        return (
                          <div key={r.athleteId || idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                            <div>
                              <span className="font-mono text-indigo-600 font-bold mr-2">#{target.bib || '-'}</span>
                              <span className="font-bold text-slate-800 mr-2">{target.name}</span>
                              <span className="text-slate-500">{dept} {gender} {ev} ({r.rank}位 - {r.time}{isFieldEvent(ev) ? 'm' : ''})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCertificatePreview(target, raceKey, r, dept, gender, ev)}
                              aria-label={`${target.name}の賞状プレビューを表示`}
                              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                            >
                              賞状プレビュー表示
                            </button>
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>

                {selectedCertificate && (
                  <div id="certificate-preview" className="space-y-4" aria-live="polite">
                    {certificateContent && (
                      <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm print:hidden">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <Edit3 size={16} className="text-indigo-600" /> 印刷内容を編集
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            ['title', '賞状タイトル'],
                            ['name', '宛名'],
                            ['affiliation', '所属'],
                            ['department', '部門'],
                            ['gender', '性別'],
                            ['event', '種目'],
                            ['rank', '順位'],
                            ['time', '記録'],
                            ['date', '発行日'],
                            ['issuer', '発行者']
                          ].map(([field, label]) => (
                            <label key={field} className="text-xs font-bold text-slate-600">
                              {label}
                              <input
                                type="text"
                                value={certificateContent[field] || ''}
                                onChange={e => setCertificateContent(prev => ({ ...prev, [field]: e.target.value }))}
                                className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-xs font-normal text-slate-800"
                              />
                            </label>
                          ))}
                          <label className="text-xs font-bold text-slate-600 md:col-span-2">
                            本文
                            <textarea
                              rows={3}
                              value={certificateContent.body || ''}
                              onChange={e => setCertificateContent(prev => ({ ...prev, body: e.target.value }))}
                              className="mt-1 w-full p-2 border border-slate-300 rounded-lg text-xs font-normal text-slate-800 leading-relaxed"
                            />
                          </label>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-3">編集内容はこのプレビューと印刷結果に反映されます。</p>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 print:hidden">
                      <button
                        type="button"
                        onClick={() => openCertificatePopup(certificateContent, selectedCertificate.target)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <Printer size={16} /> 別ウィンドウで表示
                      </button>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <Printer size={16} /> 賞状を印刷する
                      </button>
                    </div>

                    <div className="bg-white p-12 rounded-2xl border-8 border-amber-600/30 shadow-xl max-w-2xl mx-auto text-center space-y-6 print:border-amber-800 print:shadow-none print:m-0 print:p-8">
                      <h1 className="text-2xl font-black tracking-widest text-slate-900 border-b-2 border-slate-800 pb-2 inline-block">
                        {certificateContent?.title || '賞 状'}
                      </h1>
                      <div className="text-sm font-bold text-slate-700 leading-relaxed">
                        <p className="text-base text-slate-900 font-black mb-1">{certificateContent?.name || selectedCertificate.target.name} 殿</p>
                        <p className="text-xs text-slate-500">（{certificateContent?.affiliation || selectedCertificate.target.affiliation} / {certificateContent?.department || selectedCertificate.dept}）</p>
                        
                        {selectedCertificate.target.isRelay && (
                          <div className="text-xs text-slate-600 mt-3 font-mono border-t border-b border-slate-200 py-2 inline-block px-4 bg-slate-50/50">
                            走者: 1走 {selectedCertificate.target.order?.r1 || '-'} / 2走 {selectedCertificate.target.order?.r2 || '-'} / 3走 {selectedCertificate.target.order?.r3 || '-'} / 4走 {selectedCertificate.target.order?.r4 || '-'}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {certificateContent?.body || 'あなたは第35回市民陸上競技大会において\n下記の通り優秀な成績を収められましたのでこれを賞します。'}
                      </p>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block text-left text-xs font-mono">
                        <p><span className="font-bold">ID / ゼッケン:</span> No. {selectedCertificate.target.bib || '-'}</p>
                        <p><span className="font-bold">部門:</span> {certificateContent?.department || selectedCertificate.dept || '-'}</p>
                        <p><span className="font-bold">種目:</span> {certificateContent?.gender || selectedCertificate.gender} {certificateContent?.event || selectedCertificate.ev}</p>
                        <p><span className="font-bold">順位:</span> 第 {certificateContent?.rank || selectedCertificate.result.rank} 位</p>
                        <p><span className="font-bold">記録:</span> {certificateContent?.time || selectedCertificate.result.time} {isFieldEvent(certificateContent?.event || selectedCertificate.ev) ? 'm' : ''}</p>
                      </div>
                      <div className="text-xs text-slate-500 pt-4">
                        <p>{certificateContent?.date || '2026年 10月 15日'}</p>
                        <p className="font-bold text-slate-800 mt-1">{certificateContent?.issuer || '陸上競技大会実行委員会 会長'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        </main>
      )}
    </div>
  );
}
