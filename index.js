import express from 'express';
import { initializeApp } from 'firebase/app';
import { get, ref as dbRef, query, orderByChild, equalTo, getDatabase, push, set } from "firebase/database";
import path from 'path';

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
app.use(express.json());

// Angularのビルド成果物を静的配信
app.use(express.static(path.join(process.cwd(), '/dist')));
// ルート以外のリクエストもindex.htmlを返す（SPA対応）
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});


app.post('/add', async (req, res) => {
  const { name, value } = req.body;
  if (!name || !value) {
    return res.status(400).send('nameとvalueが必要です');
  }
  try {
    const now = new Date();
    const date = now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }).replace(/[/\s:]/g, '');;
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
    const { name } = req.body;
    const dataRef = dbRef(db, 'data');
    const snapshot = await get(dataRef);

    if (!snapshot.exists()) {
      return res.json({});
    }

    const allData = snapshot.val();
    let filtered = {};

    if (name) {
      // nameプロパティが一致するものだけ返す
      Object.entries(allData).forEach(([key, value]) => {
        if (value && value.name === name) {
          filtered[key] = value;
        }
      });
      return res.json(filtered);
    } else {
      // 全件返す
      return res.json(allData);
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

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`posting-data: listening on port ${port}`);
});