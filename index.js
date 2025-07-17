import express from 'express';
import { initializeApp } from 'firebase/app';
import { getDatabase,ref, push } from "firebase/database";

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
app.use(express.json()); // JSONボディをパース


app.post('/add', async (req, res) => {
  const { name, value } = req.body;
  if (!name || !value) {
    return res.status(400).send('nameとvalueが必要です');
  }
  try {
    const dataRef = ref(db, 'data'); // 修正

    const newData = { name, value, date: new Date().toISOString() };
    await push(dataRef, newData);    // 修正
    res.send('登録しました');
  } catch (err) {
    console.error('Error saving data to Firebase:', err);
    res.status(500).send('登録に失敗しました');
  }
});

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World!!';
  res.send(`Hello ${name}!`);
});

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`posting-data: listening on port ${port}`);
});