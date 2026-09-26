import React, { useEffect, useRef, useState } from 'react';
import { 
  Trophy, Users, LayoutList, FileEdit, Printer, CloudUpload, 
  Search, Bell, UserCircle, Plus, Trash2, Zap, Medal, X, 
  ChevronRight, ArrowLeft, Smartphone, CheckCircle, Compass,
  Download, BarChart2, Award, FileText, Filter, RefreshCw, Database,
  ShieldCheck, AlertTriangle, Clock, Send, LogOut
} from 'lucide-react';

const initialGlobalEntries = [
  { id: 1, bib: '101', name: '伊藤 四郎', team: '静岡陸協', gender: '男子', event: '100m', pb: '10.85' },
  { id: 2, bib: '102', name: '田中 三郎', team: '富士宮TC', gender: '男子', event: '100m', pb: '11.02' },
  { id: 3, bib: '103', name: '佐藤 次郎', team: '沼津陸協', gender: '男子', event: '100m', pb: '10.75' },
  { id: 4, bib: '104', name: '山田 太郎', team: '静岡陸協', gender: '男子', event: '100m', pb: '10.45' },
  { id: 5, bib: '105', name: '高橋 健太', team: '掛川AC', gender: '男子', event: '100m', pb: '11.15' },
  { id: 6, bib: '106', name: '鈴木 一郎', team: '浜松クラブ', gender: '男子', event: '100m', pb: '10.62' },
  { id: 7, bib: '107', name: '渡辺 誠', team: '三島陸協', gender: '男子', event: '100m', pb: '' },
  { id: 8, bib: '108', name: '小林 大介', team: '静岡大学', gender: '男子', event: '100m', pb: '10.98' },
  { id: 9, bib: '201', name: '松本 隼人', team: '沼津工業高', gender: '男子', event: '走幅跳', pb: '7m12' },
  { id: 10, bib: '202', name: '井上 翔太', team: '静岡市立高', gender: '男子', event: '走幅跳', pb: '6m85' },
  { id: 11, bib: '203', name: '清水 健一', team: '浜松西高', gender: '男子', event: '走幅跳', pb: '7m01' },
  { id: 12, bib: '204', name: '岡田 龍之介', team: '藤枝明誠高', gender: '男子', event: '走幅跳', pb: '6m70' },
  { id: 13, bib: '301', name: '中村 美咲', team: '静岡陸協', gender: '女子', event: '100m', pb: '12.10' },
  { id: 14, bib: '302', name: '小川 葵', team: '浜松市立高', gender: '女子', event: '100m', pb: '12.35' },
  { id: 15, bib: '303', name: '渡辺 花子', team: '沼津西高', gender: '女子', event: '100m', pb: '12.02' },
];

const mockEvents = [
  { id: 'm100-final', category: '男子', event: '100m', round: '決勝', time: '14:30', status: '確定' },
  { id: 'w100-final', category: '女子', event: '100m', round: '決勝', time: '14:40', status: '進行中' },
  { id: 'm-longjump', category: '男子', event: '走幅跳', round: '決勝', time: '15:10', status: '進行中' },
  { id: 'm400-final', category: '男子', event: '400m', round: '決勝', time: '15:00', status: '準備中' },
];

const mockLiveResults = [
  { id: 4, lane: 4, bib: '104', name: '山田 太郎', team: '静岡陸協', time: '10.55', rank: '1', remarks: '大会新 (CR)', wind: '+1.2' },
  { id: 6, lane: 6, bib: '106', name: '鈴木 一郎', team: '浜松クラブ', time: '10.62', rank: '2', remarks: '', wind: '+1.2' },
  { id: 3, lane: 3, bib: '103', name: '佐藤 次郎', team: '沼津陸協', time: '10.82', rank: '3', remarks: '', wind: '+1.2' },
  { id: 1, lane: 5, bib: '101', name: '伊藤 四郎', team: '静岡陸協', time: '11.01', rank: '4', remarks: '', wind: '+1.2' },
];

const initialTrackAthletes = [
  { id: 1, lane: 1, bib: '107', name: '渡辺 誠', team: '三島陸協', time: '', rank: '', remarks: '' },
  { id: 2, lane: 2, bib: '102', name: '田中 三郎', team: '富士宮TC', time: '11.02', rank: '5', remarks: '' },
  { id: 3, lane: 3, bib: '103', name: '佐藤 次郎', team: '沼津陸協', time: '10.82', rank: '3', remarks: '' },
  { id: 4, lane: 4, bib: '104', name: '山田 太郎', team: '静岡陸協', time: '10.55', rank: '1', remarks: '大会新' },
  { id: 5, lane: 5, bib: '106', name: '鈴木 一郎', team: '浜松クラブ', time: '10.62', rank: '2', remarks: '' },
  { id: 6, lane: 6, bib: '101', name: '伊藤 四郎', team: '静岡陸協', time: '11.01', rank: '4', remarks: '' },
  { id: 7, lane: 7, bib: '108', name: '小林 大介', team: '静岡大学', time: '', rank: '', remarks: '' },
  { id: 8, lane: 8, bib: '105', name: '高橋 健太', team: '掛川AC', time: '', rank: '', remarks: '' },
];

const initialFieldAthletes = [
  { id: 1, order: 1, bib: '201', name: '松本 隼人', team: '沼津工業高', t1: '6.95', t2: 'x', t3: '7.12', t4: '7.05', t5: '7.10', t6: 'x', best: '7.12m', rank: '1' },
  { id: 2, order: 2, bib: '202', name: '井上 翔太', team: '静岡市立高', t1: '6.50', t2: '6.85', t3: '6.72', t4: '6.60', t5: '6.80', t6: '6.75', best: '6.85m', rank: '3' },
  { id: 3, order: 3, bib: '203', name: '清水 健一', team: '浜松西高', t1: '7.01', t2: '6.90', t3: 'x', t4: '6.98', t5: 'x', t6: '7.00', best: '7.01m', rank: '2' },
  { id: 4, order: 4, bib: '204', name: '岡田 龍之介', team: '藤枝明誠高', t1: '6.45', t2: '6.60', t3: '6.70', t4: '6.55', t5: '6.62', t6: '6.68', best: '6.70m', rank: '4' },
];

const timeFinalEvents = ['1000m', '1500m', '3000m'];
const initialTimeFinalResults = Object.fromEntries(timeFinalEvents.map(event => [event, [
  { id: `${event}-arrival-1`, bib: '', time: '' },
]]));
const localAppDataStorageKey = 'track-app-data-v1';
const googleAccessTokenStorageKey = 'track-app-google-access-token';

const loadLocalAppData = () => {
  try {
    const data = JSON.parse(window.localStorage.getItem(localAppDataStorageKey) || '{}');
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
};

const driveBackupFilePrefix = 'track-app-backup-';
let googleIdentityServicesPromise;

const createDriveBackupFileName = (date = new Date()) => {
  const pad = (value, length = 2) => String(value).padStart(length, '0');
  const timestamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}-${pad(date.getMilliseconds(), 3)}`;
  return `${driveBackupFilePrefix}${timestamp}.json`;
};

const loadGoogleIdentityServices = () => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!googleIdentityServicesPromise) {
    googleIdentityServicesPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Google認証ライブラリを読み込めませんでした。'));
      document.head.appendChild(script);
    }).catch(error => {
      googleIdentityServicesPromise = null;
      throw error;
    });
  }
  return googleIdentityServicesPromise;
};

const requestDriveAccessToken = async (clientId, prompt = '') => {
  await loadGoogleIdentityServices();
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
      callback: response => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: error => reject(new Error(error.message || 'Google認証に失敗しました。')),
    });
    tokenClient.requestAccessToken({ prompt });
  });
};

const requestDriveApi = async (url, accessToken, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, ...options.headers },
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error?.message || `Google Drive API エラー (${response.status})`);
  }
  return response;
};

const findLatestDriveBackup = async (accessToken) => {
  const params = new URLSearchParams({
    q: `name contains 'track-app-backup' and trashed = false`,
    pageSize: '100',
    orderBy: 'modifiedTime desc,name desc',
    fields: 'files(id,name,modifiedTime)',
  });
  const response = await requestDriveApi(`https://www.googleapis.com/drive/v3/files?${params}`, accessToken);
  const result = await response.json();
  return result.files?.[0] || null;
};

const writeDriveBackup = async (accessToken, snapshot, fileName) => {
  const createResponse = await requestDriveApi('https://www.googleapis.com/drive/v3/files?fields=id', accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: fileName, mimeType: 'application/json' }),
  });
  const file = await createResponse.json();
  await requestDriveApi(`https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`, accessToken, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  });
};

const readLatestDriveBackup = async (accessToken) => {
  const file = await findLatestDriveBackup(accessToken);
  if (!file) return null;
  const response = await requestDriveApi(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, accessToken);
  return { fileName: file.name, snapshot: await response.json() };
};

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(value.trim());
      value = '';
    } else if (character === '\n' || character === '\r') {
      row.push(value.trim());
      if (row.some(cell => cell !== '')) rows.push(row);
      row = [];
      value = '';
      if (character === '\r' && text[index + 1] === '\n') index += 1;
    } else {
      value += character;
    }
  }

  row.push(value.trim());
  if (row.some(cell => cell !== '')) rows.push(row);
  return rows;
};

const csvColumnAliases = {
  bib: ['bib', 'ナンバー', 'ゼッケン番号'],
  name: ['name', '選手氏名', '氏名'],
  team: ['team', '所属団体', '所属'],
  gender: ['gender', '性別'],
  event: ['event', '種目'],
  pb: ['pb', '持ちタイム', '自己ベスト'],
};

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'entries', label: 'エントリー選手一覧', icon: Users },
    { id: 'program', label: 'プログラム編成', icon: LayoutList },
    { id: 'results', label: '記録入力・管理(トラック)', icon: FileEdit },
    { id: 'field', label: 'フィールド試技管理(跳躍・投てき)', icon: Compass },
    { id: 'analytics', label: '総合得点・チーム順位', icon: BarChart2 },
    { id: 'liveresult', label: '速報・リアルタイム表示', icon: Zap },
    { id: 'print', label: '帳票・賞状一括発行', icon: Printer },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <Trophy size={22} />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight">陸上競技大会システム</h1>
          <p className="text-xs text-slate-400">Pro Edition v4.4 Cloud</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>公式計時(FinishLynx)・風速計連動中</span>
        </div>
      </div>
    </aside>
  );
};

const TopBar = ({ onTriggerDemoNotification, globalSearch, setGlobalSearch, cloudSyncStatus, onSaveToDrive, onRestoreFromDrive, driveMessage, setDriveMessage, googleUser, onSignOut }) => {
  return (
    <>
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center bg-gray-100 rounded-md px-3 py-1.5 w-72 border border-gray-200">
        <Search size={18} className="text-gray-400" />
        <input 
          type="text" 
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="選手名、所属、ナンバー検索..." 
          className="bg-transparent border-none focus:outline-none ml-2 w-full text-sm placeholder-gray-500"
        />
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={onSaveToDrive}
          disabled={cloudSyncStatus === 'saving' || cloudSyncStatus === 'restoring'}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
            cloudSyncStatus === 'saving' || cloudSyncStatus === 'restoring' ? 'bg-blue-100 text-blue-700 animate-pulse' :
            cloudSyncStatus === 'saved' || cloudSyncStatus === 'restored' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            cloudSyncStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CloudUpload size={14} />
          {cloudSyncStatus === 'saving' ? 'Drive保存中...' : cloudSyncStatus === 'restoring' ? 'Drive読込中...' : cloudSyncStatus === 'saved' ? 'Drive保存完了' : cloudSyncStatus === 'restored' ? 'Drive復元完了' : cloudSyncStatus === 'error' ? 'Driveエラー' : 'Google Drive保存'}
        </button>
        <button onClick={onRestoreFromDrive} disabled={cloudSyncStatus === 'saving' || cloudSyncStatus === 'restoring'} title="Google Driveから復元" aria-label="Google Driveから復元" className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40">
          <Download size={16} />
        </button>

        <button onClick={onTriggerDemoNotification} className="hidden md:flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
          <Medal size={14} /> 表彰・アナウンステスト
        </button>
        <div className="h-6 w-px bg-gray-200"></div>
        <button onClick={onSignOut} title="ログアウト" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
          {googleUser.picture ? <img src={googleUser.picture} alt="" className="h-7 w-7 rounded-full" /> : <UserCircle size={26} className="text-gray-400" />}
          <span className="max-w-40 truncate text-sm font-bold">{googleUser.name || googleUser.email}</span>
          <LogOut size={15} />
        </button>
      </div>
    </header>
    {driveMessage && (
      <div role="status" className="fixed top-20 right-6 z-50 flex max-w-md items-start gap-3 border border-blue-200 bg-white p-4 text-sm text-gray-700 shadow-xl rounded-lg">
        <span className="flex-1">{driveMessage}</span>
        <button onClick={() => setDriveMessage('')} aria-label="閉じる" className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
      </div>
    )}
    </>
  );
};

const NotificationToast = ({ message, onClose }) => (
  <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
    <div className="bg-white border-l-4 border-amber-500 shadow-2xl rounded-xl p-4 max-w-sm w-full flex items-start gap-4 border border-gray-100">
      <div className="bg-amber-100 p-2.5 rounded-full text-amber-600 shrink-0 mt-0.5">
        <Award size={20} />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-gray-900 mb-1">公式表彰・アナウンス通知</h4>
        <p className="text-xs text-gray-600 leading-relaxed">{message}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={onClose} className="bg-amber-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-amber-600 transition-colors">了解しました</button>
        </div>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0"><X size={16} /></button>
    </div>
  </div>
);

const GoogleLoginScreen = ({ clientId, isSigningIn, errorMessage, onSignIn }) => (
  <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
        <Trophy size={28} />
      </div>
      <h1 className="text-xl font-black text-slate-900">陸上競技大会システム</h1>
      <p className="mt-2 text-sm font-semibold text-slate-500">Googleアカウントでログイン</p>
      {errorMessage && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-left text-sm text-red-700">{errorMessage}</p>}
      <button
        onClick={onSignIn}
        disabled={!clientId || isSigningIn}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="text-lg font-black text-blue-600">G</span>
        {isSigningIn ? '認証中...' : 'Googleでログイン'}
      </button>
      {!clientId && <p className="mt-4 text-left text-xs text-amber-700">OAuth Client IDが設定されていません。</p>}
    </section>
  </main>
);

const EntriesInput = ({ entries, setEntries, globalSearch }) => {
  const [selectedGender, setSelectedGender] = useState('すべて');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAthlete, setNewAthlete] = useState({ bib: '', name: '', team: '', gender: '男子', event: '100m', pb: '' });
  const [csvMessage, setCsvMessage] = useState('');
  const csvInputRef = useRef(null);

  const filteredEntries = entries.filter(e => {
    const matchSearch = e.name.includes(globalSearch) || e.team.includes(globalSearch) || e.bib.includes(globalSearch);
    const matchGender = selectedGender === 'すべて' || e.gender === selectedGender;
    return matchSearch && matchGender;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newAthlete.name || !newAthlete.bib) return;
    setEntries(prev => [...prev, { ...newAthlete, id: Date.now() }]);
    setNewAthlete({ bib: '', name: '', team: '', gender: '男子', event: '100m', pb: '' });
    setShowAddModal(false);
  };

  const handleCsvImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      let text;
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      } catch {
        text = new TextDecoder('windows-31j').decode(buffer);
      }

      const rows = parseCsv(text);
      if (rows.length < 2) {
        setCsvMessage('CSVに取り込むデータがありません。');
        return;
      }

      const headers = rows[0].map(header => header.replace(/^\uFEFF/, '').trim().toLowerCase());
      const columnIndexes = Object.fromEntries(Object.entries(csvColumnAliases).map(([field, aliases]) => [
        field,
        headers.findIndex(header => aliases.map(alias => alias.toLowerCase()).includes(header)),
      ]));
      if (columnIndexes.bib < 0 || columnIndexes.name < 0) {
        setCsvMessage('CSVのヘッダーに「bib（ナンバー）」と「name（選手氏名）」が必要です。');
        return;
      }

      const knownBibs = new Set(entries.map(entry => String(entry.bib).trim()));
      const importedEntries = [];
      let duplicateCount = 0;
      let invalidCount = 0;
      rows.slice(1).forEach((row, index) => {
        const getValue = (field, fallback = '') => columnIndexes[field] < 0 ? fallback : (row[columnIndexes[field]] || fallback).trim();
        const bib = getValue('bib');
        const name = getValue('name');
        if (!bib || !name) {
          invalidCount += 1;
          return;
        }
        if (knownBibs.has(bib)) {
          duplicateCount += 1;
          return;
        }

        knownBibs.add(bib);
        const gender = getValue('gender', '男子');
        importedEntries.push({
          id: `csv-${Date.now()}-${index}`,
          bib,
          name,
          team: getValue('team'),
          gender: ['男子', '女子'].includes(gender) ? gender : '男子',
          event: getValue('event', '100m'),
          pb: getValue('pb'),
        });
      });

      if (importedEntries.length > 0) setEntries(previous => [...previous, ...importedEntries]);
      setCsvMessage(`${importedEntries.length}名を登録しました（重複 ${duplicateCount}件、必須項目不足 ${invalidCount}件をスキップ）。`);
    } catch {
      setCsvMessage('CSVを読み込めませんでした。文字コードとファイル形式を確認してください。');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900">エントリー選手一覧・管理</h2>
          <p className="text-xs text-gray-500 mt-1">大会に登録されたすべての選手の持ちタイム(PB)および所属クラブデータの管理・新規追加</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold">
            {['すべて', '男子', '女子'].map(g => (
              <button 
                key={g} 
                onClick={() => setSelectedGender(g)}
                className={`px-3 py-1.5 rounded-md transition-all ${selectedGender === g ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
              >
                {g}
              </button>
            ))}
          </div>
          <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleCsvImport} className="hidden" />
          <button
            onClick={() => csvInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50"
          >
            <CloudUpload size={16} /> CSV一括登録
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 shadow-sm transition-all"
          >
            <Plus size={16} /> 選手追加
          </button>
        </div>
      </div>

      {csvMessage && (
        <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          {csvMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">ナンバー</th>
              <th className="py-3.5 px-6">選手氏名</th>
              <th className="py-3.5 px-6">所属団体</th>
              <th className="py-3.5 px-6">性別・種目</th>
              <th className="py-3.5 px-6">パーソナルベスト (PB)</th>
              <th className="py-3.5 px-6 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="py-4 px-6 font-mono font-bold text-blue-600">{entry.bib}</td>
                <td className="py-4 px-6 font-bold text-gray-900">{entry.name}</td>
                <td className="py-4 px-6 text-gray-600 font-medium">{entry.team}</td>
                <td className="py-4 px-6">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${entry.gender === '男子' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                    {entry.gender} {entry.event}
                  </span>
                </td>
                <td className="py-4 px-6 font-mono font-semibold text-gray-700">
                  {entry.pb && entry.pb.trim() !== '' ? entry.pb : <span className="text-gray-400 font-normal">NT (記録なし)</span>}
                </td>
                <td className="py-4 px-6 text-center">
                  <button onClick={() => setEntries(prev => prev.filter(item => item.id !== entry.id))} className="text-gray-400 hover:text-red-600 p-1.5 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-gray-900">新規選手エントリー登録</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ゼッケン番号 (Bib)</label>
                <input required type="text" value={newAthlete.bib} onChange={e => setNewAthlete({...newAthlete, bib: e.target.value})} placeholder="例: 109" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">選手氏名</label>
                <input required type="text" value={newAthlete.name} onChange={e => setNewAthlete({...newAthlete, name: e.target.value})} placeholder="例: 山田 花子" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">所属団体</label>
                <input required type="text" value={newAthlete.team} onChange={e => setNewAthlete({...newAthlete, team: e.target.value})} placeholder="例: 静岡陸協" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">性別</label>
                  <select value={newAthlete.gender} onChange={e => setNewAthlete({...newAthlete, gender: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm bg-white">
                    <option value="男子">男子</option>
                    <option value="女子">女子</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">メイン種目</label>
                  <select value={newAthlete.event} onChange={e => setNewAthlete({...newAthlete, event: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm bg-white">
                    <option value="100m">100m</option>
                    <option value="400m">400m</option>
                    <option value="1000m">1000m</option>
                    <option value="1500m">1500m</option>
                    <option value="3000m">3000m</option>
                    <option value="走幅跳">走幅跳</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">持ちタイム (PB)</label>
                <input type="text" value={newAthlete.pb} onChange={e => setNewAthlete({...newAthlete, pb: e.target.value})} placeholder="例: 10.88 または 7m10" className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50">キャンセル</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">登録する</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DrawsSimulation = ({ entries }) => {
  const targetEntries = entries.filter(e => e.event === '100m');
  const simulateDraw = () => {
    const validEntries = targetEntries.filter(e => e.pb).sort((a, b) => parseFloat(a.pb) - parseFloat(b.pb));
    const ntEntries = targetEntries.filter(e => !e.pb);
    const sorted = [...validEntries, ...ntEntries];

    const laneOrder = [4, 5, 3, 6, 2, 7, 1, 8];
    const drawn = sorted.map((entry, index) => ({
      ...entry,
      lane: index < 8 ? laneOrder[index] : '-'
    }));
    
    return drawn.sort((a, b) => (a.lane === '-' ? 99 : a.lane) - (b.lane === '-' ? 99 : b.lane));
  };

  const assignedEntries = simulateDraw();
  const [successMsg, setSuccessMsg] = useState("");

  const handleConfirmDraw = () => {
    setSuccessMsg("男子 100m 決勝のレーン割振が確定し、公式番組表へ反映されました！");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900">プログラム自動編成 (レーン割振)</h2>
          <p className="text-xs text-gray-500 mt-1">日本陸連競技規則に基づき、持ちタイム(PB)の優れた選手を中央レーンへ自動割り当て</p>
        </div>
        <button onClick={handleConfirmDraw} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-700 shadow-sm transition-all">
          <CheckCircle size={16} /> 編成を確定してプログラム出力
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-bold flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-indigo-50/80 px-6 py-3.5 border-b border-gray-200 flex justify-between items-center">
          <span className="font-bold text-indigo-900 text-sm">男子 100m 決勝 (自動編成プレビュー)</span>
          <span className="text-xs font-semibold text-indigo-700 bg-white px-2.5 py-1 rounded-md shadow-sm">参加 {assignedEntries.length}名</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-6 text-center w-24">割当レーン</th>
              <th className="py-3.5 px-6">ナンバー</th>
              <th className="py-3.5 px-6">選手氏名</th>
              <th className="py-3.5 px-6">所属団体</th>
              <th className="py-3.5 px-6">持ちタイム (PB)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {assignedEntries.map((entry) => (
              <tr key={entry.id} className={entry.lane === 4 || entry.lane === 5 ? "bg-amber-50/40" : ""}>
                <td className="py-4 px-6 text-center">
                  <span className={`inline-block w-8 h-8 leading-8 rounded-lg font-black text-base ${entry.lane === 4 || entry.lane === 5 ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-700'}`}>
                    {entry.lane}
                  </span>
                </td>
                <td className="py-4 px-6 font-mono font-semibold text-gray-500">{entry.bib}</td>
                <td className="py-4 px-6 font-bold text-gray-900 text-base">{entry.name}</td>
                <td className="py-4 px-6 text-gray-600 font-medium">{entry.team}</td>
                <td className="py-4 px-6 font-mono font-semibold text-gray-700">{entry.pb || 'NT'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TimeFinalResultsInput = ({ entries, resultsByEvent, setResultsByEvent, onRecordSaved, onBack }) => {
  const [selectedEvent, setSelectedEvent] = useState(timeFinalEvents[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const rows = resultsByEvent[selectedEvent] || [];
  const athleteByBib = new Map(entries.map(entry => [String(entry.bib).trim(), entry]));

  const updateRows = (updater) => {
    setResultsByEvent(previous => ({
      ...previous,
      [selectedEvent]: typeof updater === 'function' ? updater(previous[selectedEvent] || []) : updater,
    }));
  };

  const handleRowChange = (id, field, value) => {
    updateRows(previous => previous.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddRow = () => {
    updateRows(previous => [...previous, { id: `${selectedEvent}-${Date.now()}`, bib: '', time: '' }]);
  };

  const handleSave = () => {
    const enteredRows = rows.filter(row => row.bib.trim() || row.time.trim());
    if (enteredRows.length === 0) {
      setSaveMessage('エントリー番号と記録を入力してください。');
      return;
    }
    if (enteredRows.some(row => !row.bib.trim() || !row.time.trim())) {
      setSaveMessage('入力途中の行があります。番号と記録を両方入力してください。');
      return;
    }
    if (enteredRows.some(row => !athleteByBib.has(row.bib.trim()))) {
      setSaveMessage('未登録のエントリー番号があります。選手エントリーを確認してください。');
      return;
    }
    if (new Set(enteredRows.map(row => row.bib.trim())).size !== enteredRows.length) {
      setSaveMessage('同じエントリー番号が複数あります。番号を確認してください。');
      return;
    }

    setSaveMessage('');
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onRecordSaved?.(`${selectedEvent} タイム決勝`);
    }, 500);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} aria-label="トラック記録入力へ戻る" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800">
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-xs font-bold text-blue-700">タイム決勝・到着順入力</span>
            <h2 className="mt-1 text-xl font-black text-gray-900">{selectedEvent} 記録入力</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedEvent} onChange={event => { setSelectedEvent(event.target.value); setSaveMessage(''); }} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold">
            {timeFinalEvents.map(event => <option key={event} value={event}>{event}</option>)}
          </select>
          <button onClick={handleAddRow} className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
            <Plus size={15} /> 行を追加
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50">
            <CloudUpload size={15} /> {isSaving ? '確定中...' : '記録を確定'}
          </button>
        </div>
      </div>

      {saveMessage && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{saveMessage}</div>}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600">
          行の上から到着順です。エントリー番号を入力すると選手情報を表示します。
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-bold text-gray-500">
                <th className="w-24 px-5 py-3 text-center">到着順</th>
                <th className="w-48 px-5 py-3">エントリー番号</th>
                <th className="px-5 py-3">選手氏名 / 所属</th>
                <th className="w-56 px-5 py-3">記録</th>
                <th className="w-20 px-5 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {rows.map((row, index) => {
                const athlete = athleteByBib.get(row.bib.trim());
                const duplicate = Boolean(row.bib.trim()) && rows.slice(0, index).some(previous => previous.bib.trim() === row.bib.trim());
                return (
                  <tr key={row.id} className="hover:bg-blue-50/30">
                    <td className="px-5 py-3 text-center font-mono font-bold text-gray-700">{index + 1}</td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={row.bib}
                        onChange={event => handleRowChange(row.id, 'bib', event.target.value)}
                        placeholder="例: 101"
                        aria-label={`${index + 1}着のエントリー番号`}
                        className={`w-full rounded-lg border px-3 py-2 font-mono font-bold focus:outline-none focus:ring-2 ${duplicate ? 'border-red-300 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                      />
                    </td>
                    <td className="px-5 py-3">
                      {athlete ? (
                        <div>
                          <div className="font-bold text-gray-900">{athlete.name}</div>
                          <div className="mt-0.5 text-xs text-gray-500">{athlete.team} ・ {athlete.gender}</div>
                          {duplicate && <span className="mt-1 block text-xs font-bold text-red-600">番号重複</span>}
                        </div>
                      ) : row.bib.trim() ? (
                        <span className="text-xs font-semibold text-red-600">該当する選手がいません</span>
                      ) : (
                        <span className="text-sm text-gray-400">番号入力後に表示</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={row.time}
                        onChange={event => handleRowChange(row.id, 'time', event.target.value)}
                        placeholder="例: 3:00.25"
                        aria-label={`${index + 1}着の記録`}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => updateRows(previous => previous.filter(item => item.id !== row.id))} aria-label={`${index + 1}着の行を削除`} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ResultsInput = ({ onRecordSaved, athletes, setAthletes, wind, setWind, refereeApproved, setRefereeApproved, entries, timeFinalResults, setTimeFinalResults }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoImported, setIsAutoImported] = useState(false);
  const [inputMode, setInputMode] = useState('lanes');

  const handleInputChange = (id, field, value) => {
    setAthletes(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleFinishLynxAutoImport = () => {
    setIsAutoImported(true);
    setTimeout(() => {
      setAthletes(prev => prev.map(a => {
        if (a.bib === '104') return { ...a, time: '10.55', rank: '1', remarks: '大会新' };
        if (a.bib === '106') return { ...a, time: '10.62', rank: '2', remarks: '' };
        if (a.bib === '103') return { ...a, time: '10.82', rank: '3', remarks: '' };
        if (a.bib === '101') return { ...a, time: '11.01', rank: '4', remarks: '' };
        if (a.bib === '102') return { ...a, time: '11.02', rank: '5', remarks: '' };
        return a;
      }));
      setWind('+1.2');
    }, 400);
  };

  const handleSave = () => {
    if (!refereeApproved) {
      alert("審判長(Referee)のデジタル承認署名を行ってください。");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      if (onRecordSaved) onRecordSaved("男子 100m 決勝");
    }, 600);
  };

  return inputMode === 'timeFinal' ? (
    <TimeFinalResultsInput entries={entries} resultsByEvent={timeFinalResults} setResultsByEvent={setTimeFinalResults} onRecordSaved={onRecordSaved} onBack={() => setInputMode('lanes')} />
  ) : (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md">トラック競技・公認記録</span>
          <h2 className="text-xl font-black text-gray-900 mt-1">男子 100m 決勝 (記録入力コンソール)</h2>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setInputMode('timeFinal')} className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">
            <Clock size={14} /> タイム決勝入力
          </button>
          <button 
            onClick={handleFinishLynxAutoImport}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all"
          >
            <RefreshCw size={14} className={isAutoImported ? 'animate-spin' : ''} />
            {isAutoImported ? '自動計時同期済み' : 'FinishLynx自動読込'}
          </button>
          
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-sm">
            <span className="text-gray-500 text-xs font-bold">風速:</span>
            <input type="text" value={wind} onChange={(e) => setWind(e.target.value)} className="w-16 bg-white border border-gray-300 rounded-lg px-2 py-1 text-center font-mono font-bold text-sm"/>
            <span className="text-gray-500 text-xs font-bold">m/s</span>
          </div>

          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all">
            <CloudUpload size={16} /> {isSaving ? '送信中...' : '記録を確定して速報送信'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-6 text-center w-20">レーン</th>
              <th className="py-3.5 px-6">選手氏名 / ナンバー</th>
              <th className="py-3.5 px-6">所属団体</th>
              <th className="py-3.5 px-4 w-36">公認記録 (秒)</th>
              <th className="py-3.5 px-4 w-28 text-center">順位</th>
              <th className="py-3.5 px-6 w-36">備考 / 記録種別</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {athletes.map((athlete) => (
              <tr key={athlete.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="py-4 px-6 text-center font-bold text-base text-gray-700">{athlete.lane}</td>
                <td className="py-4 px-6 font-bold text-gray-900">
                  {athlete.name} <span className="text-xs font-mono font-normal text-gray-400 ml-2">({athlete.bib})</span>
                </td>
                <td className="py-4 px-6 text-gray-600 font-medium">{athlete.team}</td>
                <td className="py-4 px-4">
                  <input 
                    type="text" 
                    value={athlete.time} 
                    onChange={(e) => handleInputChange(athlete.id, 'time', e.target.value)} 
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 font-mono font-bold text-base focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="10.55"
                  />
                </td>
                <td className="py-4 px-4 text-center">
                  <input 
                    type="text" 
                    value={athlete.rank} 
                    onChange={(e) => handleInputChange(athlete.id, 'rank', e.target.value)} 
                    className="w-16 mx-auto border border-gray-300 rounded-xl py-2 text-center font-black text-base focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                    placeholder="1"
                  />
                </td>
                <td className="py-4 px-6">
                  <select 
                    value={athlete.remarks} 
                    onChange={(e) => handleInputChange(athlete.id, 'remarks', e.target.value)}
                    className="border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white font-medium"
                  >
                    <option value="">通常</option>
                    <option value="大会新">大会新 (CR)</option>
                    <option value="県新">県新 (PR)</option>
                    <option value="DNS">欠場 (DNS)</option>
                    <option value="DQ">失格 (DQ)</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bg-slate-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} className={refereeApproved ? 'text-emerald-600' : 'text-gray-400'} />
            <div>
              <h4 className="text-xs font-bold text-gray-900">審判長デジタル承認署名</h4>
              <p className="text-[11px] text-gray-500">公認記録として発表するためには審判長の承認が必要です</p>
            </div>
          </div>
          <button 
            onClick={() => setRefereeApproved(!refereeApproved)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              refereeApproved 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {refereeApproved ? '✓ 審判長承認済み (署名完了)' : '審判長署名を行う'}
          </button>
        </div>
      </div>
    </div>
  );
};

const FieldEventManagement = ({ onRecordSaved, fieldAthletes, setFieldAthletes, wind, setWind }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleTrialChange = (id, trialKey, value) => {
    setFieldAthletes(prev => prev.map(athlete => {
      if (athlete.id !== id) return athlete;
      const updated = { ...athlete, [trialKey]: value };
      const trials = [updated.t1, updated.t2, updated.t3, updated.t4, updated.t5, updated.t6];
      const validNumbers = trials.map(t => parseFloat(t)).filter(n => !isNaN(n));
      const bestVal = validNumbers.length > 0 ? Math.max(...validNumbers).toFixed(2) + 'm' : (trials.some(t => t.toLowerCase() === 'x') ? 'NM' : '-');
      updated.best = bestVal;
      return updated;
    }));
  };

  const handleSaveField = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      if (onRecordSaved) onRecordSaved("男子 走幅跳 決勝");
    }, 600);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-md">フィールド競技・跳躍試技管理</span>
          <h2 className="text-xl font-black text-gray-900 mt-1">男子 走幅跳 決勝 (試技・順位管理)</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-sm">
            <span className="text-gray-500 text-xs font-bold">風速:</span>
            <input type="text" value={wind} onChange={(e) => setWind(e.target.value)} className="w-16 bg-white border border-gray-300 rounded-lg px-2 py-1 text-center font-mono font-bold"/>
            <span className="text-gray-500 text-xs font-bold">m/s</span>
          </div>
          <button onClick={handleSaveField} disabled={isSaving} className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-purple-700 disabled:opacity-50 shadow-sm transition-all">
            <CloudUpload size={16} /> {isSaving ? '送信中...' : 'フィールド記録確定'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 text-center w-16">試技順</th>
              <th className="py-3.5 px-4">選手氏名 / 所属</th>
              <th className="py-3.5 px-2 text-center w-20">1回目</th>
              <th className="py-3.5 px-2 text-center w-20">2回目</th>
              <th className="py-3.5 px-2 text-center w-20">3回目</th>
              <th className="py-3.5 px-2 text-center w-20">4回目</th>
              <th className="py-3.5 px-2 text-center w-20">5回目</th>
              <th className="py-3.5 px-2 text-center w-20">6回目</th>
              <th className="py-3.5 px-4 text-center w-28 bg-purple-50 text-purple-900 font-bold">最高 (Best)</th>
              <th className="py-3.5 px-2 text-center w-16">順位</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm font-mono">
            {fieldAthletes.map((athlete) => (
              <tr key={athlete.id} className="hover:bg-purple-50/30 transition-colors">
                <td className="py-4 px-4 text-center font-bold text-gray-700">{athlete.order}</td>
                <td className="py-4 px-4 font-sans">
                  <div className="font-bold text-gray-900">{athlete.name}</div>
                  <div className="text-xs text-gray-500 font-medium">{athlete.team} ({athlete.bib})</div>
                </td>
                {['t1', 't2', 't3', 't4', 't5', 't6'].map((tKey) => (
                  <td key={tKey} className="py-4 px-1.5">
                    <input 
                      type="text" 
                      value={athlete[tKey]} 
                      onChange={(e) => handleTrialChange(athlete.id, tKey, e.target.value)} 
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-center font-mono font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none" 
                      placeholder="-"
                    />
                  </td>
                ))}
                <td className="py-4 px-4 text-center font-bold text-purple-700 bg-purple-50/50 text-base">
                  {athlete.best}
                </td>
                <td className="py-4 px-2 text-center font-sans">
                  <input 
                    type="text" 
                    value={athlete.rank} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFieldAthletes(prev => prev.map(a => a.id === athlete.id ? { ...a, rank: val } : a));
                    }} 
                    className="w-12 mx-auto border border-gray-300 rounded-lg py-2 text-center font-black focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TeamAnalytics = () => {
  const teamStandings = [
    { rank: 1, team: '静岡陸協', gold: 5, silver: 3, bronze: 2, totalPoints: 48 },
    { rank: 2, team: '沼津陸協', gold: 3, silver: 4, bronze: 1, totalPoints: 36 },
    { rank: 3, team: '浜松クラブ', gold: 2, silver: 3, bronze: 4, totalPoints: 31 },
    { rank: 4, team: '静岡大学', gold: 1, silver: 2, bronze: 3, totalPoints: 22 },
    { rank: 5, team: '富士宮TC', gold: 1, silver: 1, bronze: 2, totalPoints: 16 },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-black text-gray-900">総合得点・チーム対抗順位</h2>
        <p className="text-xs text-gray-500 mt-1">各種目の入賞ポイント（1位:8点, 2位:7点...）に基づくリアルタイム集計</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-6 text-center w-24">順位</th>
              <th className="py-3.5 px-6">所属チーム名</th>
              <th className="py-3.5 px-6 text-center text-amber-600 font-bold">金メダル</th>
              <th className="py-3.5 px-6 text-center text-slate-500 font-bold">銀メダル</th>
              <th className="py-3.5 px-6 text-center text-amber-800 font-bold">銅メダル</th>
              <th className="py-3.5 px-6 text-right font-black text-gray-900">総得点</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {teamStandings.map((t) => (
              <tr key={t.rank} className="hover:bg-gray-50/80 transition-colors">
                <td className="py-4 px-6 text-center font-black text-lg text-gray-700">
                  <span className={`inline-block w-8 h-8 leading-8 rounded-full ${t.rank === 1 ? 'bg-amber-100 text-amber-700' : t.rank === 2 ? 'bg-slate-100 text-slate-700' : t.rank === 3 ? 'bg-amber-50 text-amber-900' : 'text-gray-500'}`}>
                    {t.rank}
                  </span>
                </td>
                <td className="py-4 px-6 font-bold text-gray-900 text-base">{t.team}</td>
                <td className="py-4 px-6 text-center font-mono font-bold text-amber-600">{t.gold}</td>
                <td className="py-4 px-6 text-center font-mono font-bold text-slate-600">{t.silver}</td>
                <td className="py-4 px-6 text-center font-mono font-bold text-amber-800">{t.bronze}</td>
                <td className="py-4 px-6 text-right font-mono font-black text-lg text-blue-600">{t.totalPoints} pt</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BatchPrintCenter = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handlePrintAll = (type) => {
    setIsGenerating(true);
    setSuccessMsg("");
    setTimeout(() => {
      setIsGenerating(false);
      setSuccessMsg(`${type}のPDFが一括生成され、ダウンロード準備が完了しました！`);
    }, 1200);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-black text-gray-900">帳票・賞状一括発行センター</h2>
        <p className="text-xs text-gray-500 mt-1">公式競技記録を反映した賞状、プログラム番組表、審判用リザルト用紙のPDF自動一括生成</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-bold flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: '公式賞状一括発行 (PDF)', desc: '入賞者の氏名と記録を埋め込んだ表彰状を自動レイアウト', icon: Award, color: 'text-amber-600 bg-amber-50' },
          { title: '競技プログラム番組表', desc: '全競技のタイムテーブルとスタートリストを一括出力', icon: FileText, color: 'text-blue-600 bg-blue-50' },
          { title: '審判長承認済公式リザルト', desc: '大会結果報告用の全種目正式成績一覧表', icon: Printer, color: 'text-purple-600 bg-purple-50' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.desc}</p>
              </div>
              <button 
                onClick={() => handlePrintAll(item.title)} 
                disabled={isGenerating}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
              >
                <Download size={16} /> {isGenerating ? '生成中...' : 'PDF一括ダウンロード'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MobileLiveResult = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const EventList = () => (
    <div className="space-y-3 p-4">
      <div className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block mb-1">本日の競技速報一覧</div>
      {mockEvents.map(ev => (
        <button 
          key={ev.id}
          onClick={() => setSelectedEvent(ev)}
          className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-95 transition-transform"
        >
          <div className="text-left">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{ev.category} {ev.round}</span>
            <h3 className="font-black text-lg text-gray-900 mt-1">{ev.event}</h3>
            <span className="text-xs text-gray-400 font-mono mt-1 block">{ev.time} 開始</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              ev.status === '確定' ? 'bg-emerald-100 text-emerald-700' : 
              ev.status === '進行中' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500'
            }`}>{ev.status}</span>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        </button>
      ))}
    </div>
  );

  const EventDetail = () => (
    <div className="bg-gray-50 min-h-full pb-10">
      <div className="bg-slate-900 text-white p-5 rounded-b-3xl shadow-md sticky top-0 z-10">
        <button onClick={() => setSelectedEvent(null)} className="flex items-center gap-1 text-slate-400 mb-2 hover:text-white text-xs font-bold">
          <ArrowLeft size={16} /> 競技一覧へ戻る
        </button>
        <div className="flex justify-between items-end mt-2">
          <div>
            <span className="bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded mb-1 inline-block">{selectedEvent.category}</span>
            <h2 className="text-xl font-black">{selectedEvent.event} {selectedEvent.round}</h2>
          </div>
          <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded">風速: +1.2m/s</span>
        </div>
      </div>
      
      <div className="p-4 space-y-3 mt-1">
        {mockLiveResults.map((result, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 relative overflow-hidden">
            {result.rank === '1' && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>}
            {result.rank === '2' && <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-300"></div>}
            {result.rank === '3' && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-700"></div>}
            
            <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-black text-base ${
              result.rank === '1' ? 'bg-amber-100 text-amber-600' :
              result.rank === '2' ? 'bg-slate-100 text-slate-600' :
              result.rank === '3' ? 'bg-amber-50 text-amber-800' : 'bg-gray-50 text-gray-400'
            }`}>
              {result.rank}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-gray-900 text-base leading-tight">{result.name}</span>
                {result.remarks && (
                  <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">{result.remarks}</span>
                )}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">{result.team} ・ レーン {result.lane}</div>
            </div>
            <div className="text-right">
              <span className={`font-mono text-xl font-black ${result.rank === '1' ? 'text-amber-500' : 'text-slate-700'}`}>
                {result.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center bg-slate-100 animate-fade-in overflow-y-auto">
      <div className="mb-4 text-center">
        <h2 className="text-lg font-bold text-gray-800 flex items-center justify-center gap-2">
          <Smartphone size={20} className="text-blue-600"/>
          一般観客・選手向け モバイル速報プレビュー
        </h2>
      </div>

      <div className="w-[375px] h-[720px] bg-gray-50 rounded-[3rem] shadow-2xl border-[12px] border-slate-900 overflow-hidden relative flex flex-col">
        <div className="h-5 w-full bg-slate-900 absolute top-0 left-0 z-20 flex justify-center">
          <div className="w-28 h-3.5 bg-black rounded-b-xl"></div>
        </div>
        
        {!selectedEvent && (
          <div className="pt-10 pb-4 px-5 bg-white border-b border-gray-100 shadow-sm z-10">
            <h1 className="font-black text-lg text-gray-900">第45回 県陸上競技選手権大会</h1>
            <p className="text-[11px] text-blue-600 font-bold mt-0.5">公式リアルタイム速報 (Live)</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pt-2 no-scrollbar">
          {selectedEvent ? <EventDetail /> : <EventList />}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [localAppData] = useState(loadLocalAppData);
  const [googleUser, setGoogleUser] = useState(null);
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('results');
  const [entries, setEntries] = useState(() => Array.isArray(localAppData.entries) ? localAppData.entries : initialGlobalEntries);
  const [trackAthletes, setTrackAthletes] = useState(() => Array.isArray(localAppData.trackAthletes) ? localAppData.trackAthletes : initialTrackAthletes);
  const [trackWind, setTrackWind] = useState(() => typeof localAppData.trackWind === 'string' ? localAppData.trackWind : '+1.2');
  const [trackRefereeApproved, setTrackRefereeApproved] = useState(() => Boolean(localAppData.trackRefereeApproved));
  const [fieldAthletes, setFieldAthletes] = useState(() => Array.isArray(localAppData.fieldAthletes) ? localAppData.fieldAthletes : initialFieldAthletes);
  const [fieldWind, setFieldWind] = useState(() => typeof localAppData.fieldWind === 'string' ? localAppData.fieldWind : '+0.5');
  const [timeFinalResults, setTimeFinalResults] = useState(() => localAppData.timeFinalResults && typeof localAppData.timeFinalResults === 'object' ? localAppData.timeFinalResults : initialTimeFinalResults);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [cloudSyncStatus, setCloudSyncStatus] = useState('idle');
  const [driveMessage, setDriveMessage] = useState('');

  useEffect(() => {
    let isActive = true;
    const accessToken = window.sessionStorage.getItem(googleAccessTokenStorageKey);
    if (!accessToken) {
      setIsRestoringSession(false);
      return () => { isActive = false; };
    }

    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(response => {
        if (!response.ok) throw new Error('Google session expired');
        return response.json();
      })
      .then(profile => {
        if (!isActive) return;
        setGoogleAccessToken(accessToken);
        setGoogleUser(profile);
      })
      .catch(() => {
        window.sessionStorage.removeItem(googleAccessTokenStorageKey);
      })
      .finally(() => {
        if (isActive) setIsRestoringSession(false);
      });

    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(localAppDataStorageKey, JSON.stringify({
        entries,
        trackAthletes,
        trackWind,
        trackRefereeApproved,
        fieldAthletes,
        fieldWind,
        timeFinalResults,
      }));
    } catch (error) {
      console.error('ローカル保存に失敗しました。', error);
    }
  }, [entries, trackAthletes, trackWind, trackRefereeApproved, fieldAthletes, fieldWind, timeFinalResults]);

  const handleGoogleSignIn = async () => {
    if (!googleClientId) {
      setAuthError('Google OAuth Client IDが設定されていません。');
      return;
    }
    setIsSigningIn(true);
    setAuthError('');
    try {
      const accessToken = await requestDriveAccessToken(googleClientId, 'select_account');
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('Googleアカウント情報を取得できませんでした。');
      window.sessionStorage.setItem(googleAccessTokenStorageKey, accessToken);
      setGoogleAccessToken(accessToken);
      setGoogleUser(await response.json());
    } catch (error) {
      setAuthError(`Google認証に失敗しました: ${error.message}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = () => {
    if (!window.confirm('ログアウトしますか？')) return;
    window.sessionStorage.removeItem(googleAccessTokenStorageKey);
    setGoogleAccessToken('');
    setGoogleUser(null);
  };

  const triggerAwardNotification = (eventName) => {
    setToastMessage(`${eventName} の公式記録確定から20分が経過しました。表彰式のアナウンスおよび賞状印刷の準備を行ってください。`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 8000);
  };

  const handleRecordSaved = (eventName) => {
    setTimeout(() => triggerAwardNotification(eventName), 1200);
  };

  const handleDriveSave = async () => {
    if (!googleClientId) {
      setCloudSyncStatus('error');
      setDriveMessage('Google Drive保存にはOAuth Client IDの設定が必要です。');
      return;
    }

    setCloudSyncStatus('saving');
    setDriveMessage('');
    try {
      const accessToken = await requestDriveAccessToken(googleClientId);
      const fileName = createDriveBackupFileName();
      await writeDriveBackup(accessToken, {
        format: 'track-app-backup',
        version: 1,
        savedAt: new Date().toISOString(),
        entries,
        track: { athletes: trackAthletes, wind: trackWind, refereeApproved: trackRefereeApproved },
        field: { athletes: fieldAthletes, wind: fieldWind },
        timeFinalResults,
      }, fileName);
      setCloudSyncStatus('saved');
      setDriveMessage(`${fileName} としてGoogle Driveに新しいバックアップを保存しました。`);
    } catch (error) {
      setCloudSyncStatus('error');
      setDriveMessage(`Google Driveへの保存に失敗しました: ${error.message}`);
    }
  };

  const handleDriveRestore = async () => {
    if (!googleClientId) {
      setCloudSyncStatus('error');
      setDriveMessage('Google Driveからの復元にはOAuth Client IDの設定が必要です。');
      return;
    }
    if (!window.confirm('最新のGoogle Driveバックアップで現在の選手・競技データを置き換えます。続行しますか？')) return;

    setCloudSyncStatus('restoring');
    setDriveMessage('');
    try {
      const accessToken = await requestDriveAccessToken(googleClientId);
      const backup = await readLatestDriveBackup(accessToken);
      if (!backup) throw new Error('Google Driveにバックアップがありません。');
      const snapshot = backup.snapshot;
      if (
        snapshot.format !== 'track-app-backup' || snapshot.version !== 1 ||
        !Array.isArray(snapshot.entries) || !Array.isArray(snapshot.track?.athletes) ||
        !Array.isArray(snapshot.field?.athletes) || typeof snapshot.track.wind !== 'string' ||
        typeof snapshot.field.wind !== 'string'
      ) throw new Error('バックアップの形式が正しくありません。');

      setEntries(snapshot.entries);
      setTrackAthletes(snapshot.track.athletes);
      setTrackWind(snapshot.track.wind);
      setTrackRefereeApproved(Boolean(snapshot.track.refereeApproved));
      setFieldAthletes(snapshot.field.athletes);
      setFieldWind(snapshot.field.wind);
      setTimeFinalResults(snapshot.timeFinalResults && typeof snapshot.timeFinalResults === 'object' ? snapshot.timeFinalResults : initialTimeFinalResults);
      setCloudSyncStatus('restored');
      setDriveMessage(`${backup.fileName} から最新データを復元しました。`);
    } catch (error) {
      setCloudSyncStatus('error');
      setDriveMessage(`Google Driveからの復元に失敗しました: ${error.message}`);
    }
  };

  if (isRestoringSession) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600">ログイン状態を確認中...</main>;
  }

  if (!googleUser) {
    return <GoogleLoginScreen clientId={googleClientId} isSigningIn={isSigningIn} errorMessage={authError} onSignIn={handleGoogleSignIn} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-gray-900">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.35s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {showToast && (
        <NotificationToast message={toastMessage} onClose={() => setShowToast(false)} />
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <TopBar 
          onTriggerDemoNotification={() => triggerAwardNotification("男子 走幅跳 決勝")} 
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          cloudSyncStatus={cloudSyncStatus}
          onSaveToDrive={handleDriveSave}
          onRestoreFromDrive={handleDriveRestore}
          driveMessage={driveMessage}
          setDriveMessage={setDriveMessage}
          googleUser={googleUser}
          onSignOut={handleSignOut}
        />
        
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          {activeTab === 'entries' && <EntriesInput entries={entries} setEntries={setEntries} globalSearch={globalSearch} />}
          {activeTab === 'program' && <DrawsSimulation entries={entries} />}
          {activeTab === 'results' && <ResultsInput onRecordSaved={handleRecordSaved} athletes={trackAthletes} setAthletes={setTrackAthletes} wind={trackWind} setWind={setTrackWind} refereeApproved={trackRefereeApproved} setRefereeApproved={setTrackRefereeApproved} entries={entries} timeFinalResults={timeFinalResults} setTimeFinalResults={setTimeFinalResults} />}
          {activeTab === 'field' && <FieldEventManagement onRecordSaved={handleRecordSaved} fieldAthletes={fieldAthletes} setFieldAthletes={setFieldAthletes} wind={fieldWind} setWind={setFieldWind} />}
          {activeTab === 'analytics' && <TeamAnalytics />}
          {activeTab === 'print' && <BatchPrintCenter />}
          {activeTab === 'liveresult' && <MobileLiveResult />}
        </main>
      </div>
    </div>
  );
}