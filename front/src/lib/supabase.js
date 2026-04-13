// lib/supabase.js
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ───── Queries ──────────────────────────────────────────────────

/** SCR-001 / SCR-004: indicator_daily_logs 최신 2건 (전일 대비 계산용) */
export async function fetchIndicatorLatest() {
  const { data, error } = await supabase
    .from('indicator_daily_logs')
    .select('ai_gpr_index, oil_disruptions, gpr_original, non_oil_gpr, reference_date')
    .order('reference_date', { ascending: false })
    .limit(2);
  if (error) throw error;
  return data ?? [];
}

/** SCR-004: 일간 전체 (최신 365건) */
export async function fetchIndicatorDaily() {
  const { data, error } = await supabase
    .from('indicator_daily_logs')
    .select('ai_gpr_index, oil_disruptions, gpr_original, non_oil_gpr, reference_date')
    .order('reference_date', { ascending: false })
    .limit(1250); // DB 전체 테이터(현재 1186개) 조회를 위해 1250으로 설정
  if (error) throw error;
  return (data ?? []).reverse();
}

/** SCR-004: 월간 전체 (최신 120건) */
export async function fetchIndicatorMonthly() {
  const { data, error } = await supabase
    .from('indicator_logs')
    .select('"AI_GPR_Index", oil_disruptions, gpr_original, non_oil_gpr, reference_date')
    .order('reference_date', { ascending: false })
    .limit(120);
  if (error) throw error;
  // 단일 쿼리용 필드 재설정 및 시간상 오름차순 역정렬
  return (data ?? []).reverse().map(d => ({
    ...d,
    ai_gpr_index: d['AI_GPR_Index'],
  }));
}

/** SCR-001: 카테고리별 가격 영향 */
export async function fetchCausalChains() {
  const { data, error } = await supabase
    .from('causal_chains')
    .select(`
      category, direction, magnitude,
      change_pct_min, change_pct_max,
      news_analyses!inner(reliability, created_at)
    `)
    .neq('direction', 'neutral')
    .gte('news_analyses.reliability', 0.3);
  if (error) throw error;
  return data ?? [];
}

/** SCR-003: 품목별 물가 예측 (causal_chains 전체) */
export async function fetchPredictions() {
  const { data, error } = await supabase
    .from('causal_chains')
    .select(`
      id, category, direction, magnitude,
      change_pct_min, change_pct_max,
      event, result, mechanism,
      monthly_impact,
      news_analyses!inner(
        id, summary, reliability, created_at,
        raw_news:raw_news_id(title, keyword, increased_items, decreased_items)
      )
    `)
    .gte('news_analyses.reliability', 0.3);
  if (error) throw error;
  return data ?? [];
}

/** SCR-002: 뉴스 목록 */
export async function fetchNewsList() {
  const { data, error } = await supabase
    .from('news_analyses')
    .select(`
      id, summary, reliability, created_at,
      raw_news:raw_news_id(title, keyword, increased_items, decreased_items, is_deleted),
      causal_chains(category, direction, magnitude)
    `)
    .gte('reliability', 0.3)
    .order('created_at', { ascending: false });
  if (error) throw error;
  // is_deleted 필터링
  return (data ?? []).filter(n => !n.raw_news?.is_deleted);
}
