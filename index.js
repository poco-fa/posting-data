import express from 'express';
import { initializeApp } from 'firebase/app';
import { get, ref as dbRef, query, orderByChild, equalTo, getDatabase, push } from "firebase/database";
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
    const dataRef = dbRef(db, 'data');

    const newData = { name, value, date: new Date().toISOString() };
    await push(dataRef, newData);
    res.send('登録しました');
  } catch (err) {
    console.error('Error saving data to Firebase:', err);
    res.status(500).send('登録に失敗しました');
  }
});

app.post('/get', async (req, res) => {
  try {
    const { name } = req.body;
    let snapshot;
    if (name) {
      // nameが指定されている場合はフィルタ
      const q = query(
        dbRef(db, 'data'),
        orderByChild('name'),
        equalTo(name)
      );
      snapshot = await get(q);
    } else {
      // nameが指定されていない場合は全件取得
      const dataRef = dbRef(db, 'data');
      snapshot = await get(dataRef);
    }
    if (snapshot.exists()) {
      res.json(snapshot.val());
    } else {
      res.json({});
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