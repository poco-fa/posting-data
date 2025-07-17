import express from 'express';
import { Storage } from '@google-cloud/storage'; // 追加

const app = express();
app.use(express.json()); // JSONボディをパース

// Google Cloud Storageの設定
const storage = new Storage();
const BUCKET_NAME = process.env.BUCKET_NAME || 'posting-data-bucket'; // バケット名を環境変数から取得

app.post('/add', async (req, res) => {
  const { name, value } = req.body;
  if (!name || !value) {
    return res.status(400).send('nameとvalueが必要です');
  }
  try {
    // 既存データの取得
    let arr = [];
    const file = storage.bucket(BUCKET_NAME).file('data.json');
    const [exists] = await file.exists();
    if (exists) {
      const [contents] = await file.download();
      arr = JSON.parse(contents.toString());
    }
    // 新しいデータを追加
    arr.push({ name, value, date: new Date().toISOString() });
    // バケットに保存
    await file.save(JSON.stringify(arr, null, 2), {
      contentType: 'application/json',
    });
    res.send('登録しました');
  } catch (err) {
    console.error('Error saving data to Cloud Storage:', err);
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