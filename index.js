import express from 'express';
import { google } from 'googleapis';
import fs from 'fs';

const app = express();
app.use(express.json()); // JSONボディをパース

// Google Sheets API認証
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID; // スプレッドシートID

app.post('/add', async (req, res) => {
  const { name, value } = req.body;
  if (!name || !value) {
    return res.status(400).send('nameとvalueが必要です');
  }
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1', // 追加するシートと範囲
      valueInputOption: 'RAW',
      requestBody: {
        values: [[name, value]],
      },
    });
    res.send('登録しました');
  } catch (err) {
    res.status(500).send('登録に失敗しました');
  }
});

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World!!';
  res.send(`Hello ${name}!`);
});

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`helloworld: listening on port ${port}`);
});