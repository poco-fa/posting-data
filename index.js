import 'dotenv/config';
import express from 'express';
import { initializeApp } from 'firebase/app';
import { get, ref as dbRef, query, orderByChild, equalTo, getDatabase, push, set, orderByKey, startAt } from "firebase/database";
import path from 'path';
import cors from 'cors';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const fb = initializeApp(firebaseConfig);
const db = getDatabase(fb);

const app = express();

// .envに CORS_ORIGIN を設定した場合のみCORSを有効化
const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
  app.use(cors({
    origin: corsOrigin
  }));
}

app.use(express.json({ limit: '50mb' }));

// クエリー文字列に基づいた静的ファイル配信
app.use((req, res, next) => {
  const isITMode = req.query.it === 'true' || req.query.it === '1';
  const staticDir = isITMode ? '/it' : '/dist';
  
  express.static(path.join(process.cwd(), staticDir))(req, res, next);
});

// ルート以外のリクエストもindex.htmlを返す（SPA対応）
app.get('*', (req, res) => {
  const isITMode = req.query.it === 'true' || req.query.it === '1';
  const staticDir = isITMode ? 'it' : 'dist';
  
  res.sendFile(path.join(process.cwd(), staticDir, 'index.html'));
});


app.post('/add', async (req, res) => {
  const { name, value } = req.body;
  if (!name || !value) {
    return res.status(400).send('nameとvalueが必要です');
  }
  try {
    const now = new Date();
    const date = now
      .toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false, // 24時間形式
      })
      .replace(/[/\s:]/g, '');
    const dataRef = dbRef(db, `data/${name}/${date}`);
    await set(dataRef, value);
    res.send('登録しました');
  } catch (err) {
    console.error('Error saving data to Firebase:', err);
    res.status(500).send('登録に失敗しました');
  }
});

app.post('/get', async (req, res) => {
  try {
    const { name, date } = req.body;

    if (name && date) {
      // nameとdate両方指定 → 指定nameのdate以降
      const q = query(
        dbRef(db, `data/${name}`),
        orderByKey(),
        startAt(date)
      );
      const snapshot = await get(q);
      if (!snapshot.exists()) return res.json({});
      return res.json({ [name]: snapshot.val() });

    } else if (name) {
      // nameのみ指定 → 指定nameの全件
      const dataRef = dbRef(db, `data/${name}`);
      const snapshot = await get(dataRef);
      if (!snapshot.exists()) return res.json({});
      return res.json({ [name]: snapshot.val() });

    } else if (date) {
      // dateのみ指定 → 全nameのdate以降
      const dataRef = dbRef(db, 'data');
      const usersSnapshot = await get(dataRef);
      if (!usersSnapshot.exists()) return res.json({});
      const usersData = usersSnapshot.val();
      const result = {};
      for (const n in usersData) {
        const q = query(
          dbRef(db, `data/${n}`),
          orderByKey(),
          startAt(date)
        );
        const snap = await get(q);
        if (snap.exists()) result[n] = snap.val();
      }
      return res.json(result);

    } else {
      // 無指定 → 全件
      const dataRef = dbRef(db, 'data');
      const snapshot = await get(dataRef);
      if (!snapshot.exists()) return res.json({});
      return res.json(snapshot.val());
    }
  } catch (err) {
    console.error('Error getting data from Firebase:', err);
    res.status(500).send('データ取得に失敗しました');
  }
});

app.post('/', (req, res) => {
  const name = process.env.NAME || 'World!!';
  res.send(`Hello ${name}!`);
});

app.post('/test-firebase', async (req, res) => {
  try {
    const testRef = dbRef(db, '/'); // ルート参照
    const snapshot = await get(testRef);
    res.json({ success: true, data: snapshot.val() });
  } catch (err) {
    console.error('Firebase接続エラー:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`posting-data: listening on port ${port}`);
});