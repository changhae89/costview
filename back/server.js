import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Init environment variables (추후 .env 파일 구성 예정)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Supabase (추후 연동)
// const supabaseUrl = process.env.SUPABASE_URL || '';
// const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
// const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// 기본 상태 확인 라우트
app.get('/', (req, res) => {
  res.send('Costview Backend API Server is running.');
});

// 향후 프론트엔드가 요청할 API 엔드포인트 뼈대
app.get('/api/news', async (req, res) => {
  res.json({ message: 'News endpoint ready to be wired' });
});

app.get('/api/indicators/latest', async (req, res) => {
  res.json({ message: 'Indicators endpoint ready to be wired' });
});

app.listen(PORT, () => {
  console.log(`Backend Server started on http://localhost:${PORT}`);
});
