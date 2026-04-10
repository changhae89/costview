// screens/DashboardScreen.jsx — SCR-001 대시보드
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DirectionDot from '../components/DirectionDot';
import ReliabilityBadge from '../components/ReliabilityBadge';
import { CATEGORY_MAP, DIRECTION_MAP, MAGNITUDE_MAP } from '../constants/category';
import { COLORS } from '../constants/colors';
import { formatNumber } from '../lib/helpers';
import { fetchCausalChains, fetchIndicatorLatest, fetchNewsList } from '../lib/supabase';

// ── Mock 데이터 ────────────────────────────────────────────────
const MOCK_INDICATORS = [
  { ai_gpr_index: 250.6, oil_disruptions: 1717, gpr_original: 154.7, non_oil_gpr: 112.3, reference_date: '2026-03-31' },
  { ai_gpr_index: 232.2, oil_disruptions: 1370, gpr_original: 197.1, non_oil_gpr: 154.7, reference_date: '2026-03-30' },
];

const MOCK_CHAINS = [
  { category: 'travel',  direction: 'up',      magnitude: 'high',   change_pct_min: 22,  change_pct_max: 28,  news_count: 3 },
  { category: 'fuel',    direction: 'down',     magnitude: 'medium', change_pct_min: -5,  change_pct_max: -2,  news_count: 2 },
  { category: 'utility', direction: 'down',     magnitude: 'low',    change_pct_min: -5,  change_pct_max: -5,  news_count: 1 },
  { category: 'dining',  direction: 'neutral',  magnitude: 'low',    change_pct_min: 0,   change_pct_max: 0,   news_count: 1 },
];

const MOCK_NEWS = [
  {
    id: '1',
    summary: '항공사 수하물 요금 인상 예고, 여름 성수기 앞두고 여행 비용 증가',
    reliability: 0.92,
    raw_news: {
      title: 'Airlines Raise Baggage Fees Ahead of Summer',
      keyword: ['airline', 'travel', 'fee'],
      increased_items: ['fuel', 'oil'],
      decreased_items: [],
    },
    causal_chains: [{ direction: 'up', category: 'travel' }],
  },
  {
    id: '2',
    summary: '러시아 석유 제재 완화 논의, 국제유가 하락 압력',
    reliability: 0.72,
    raw_news: {
      title: 'Russia Oil Sanctions Easing Talks',
      keyword: ['oil', 'sanction', 'war'],
      increased_items: [],
      decreased_items: ['fuel'],
    },
    causal_chains: [{ direction: 'down', category: 'fuel' }],
  },
  {
    id: '3',
    summary: '유럽 천연가스 공급 정상화로 전기요금 안정세 전망',
    reliability: 0.55,
    raw_news: {
      title: 'European Gas Supply Normalizes',
      keyword: ['gas', 'utility', 'europe'],
      increased_items: [],
      decreased_items: ['utility'],
    },
    causal_chains: [{ direction: 'down', category: 'utility' }],
  },
  {
    id: '4',
    summary: '홍해 물류 차질 지속, 소비재 전반 가격 상승 압박',
    reliability: 0.88,
    raw_news: {
      title: 'Red Sea Logistics Disruption Continues',
      keyword: ['war', 'shipping', 'supply'],
      increased_items: ['fuel'],
      decreased_items: [],
    },
    causal_chains: [{ direction: 'up', category: 'dining' }],
  },
  {
    id: '5',
    summary: 'OPEC+ 감산 연장 합의, 유가 상방 압력 강화',
    reliability: 0.81,
    raw_news: {
      title: 'OPEC+ Extends Production Cuts',
      keyword: ['oil', 'opec', 'fuel'],
      increased_items: ['fuel', 'oil'],
      decreased_items: [],
    },
    causal_chains: [{ direction: 'up', category: 'fuel' }],
  },
];

// ── 리스크 카드 ────────────────────────────────────────────────
function RiskCard({ label, value, change }) {
  const changeNum = Number(change);
  const changeColor = changeNum > 0 ? '#FF8A7A' : '#6EE7B7';
  const changeText = changeNum > 0
    ? `▲+${changeNum.toFixed(1)}`
    : changeNum < 0
      ? `▼${changeNum.toFixed(1)}`
      : '─ 0.0';

  return (
    <View style={styles.riskCard}>
      <Text style={styles.riskLabel}>{label}</Text>
      <Text style={styles.riskValue} numberOfLines={1}>{formatNumber(value)}</Text>
      <View style={styles.riskBar}>
        <View style={styles.riskBarFill} />
      </View>
      <Text style={[styles.riskChange, { color: changeColor }]}>{changeText}</Text>
    </View>
  );
}

// ── 카테고리 행 ────────────────────────────────────────────────
function CategoryRow({ item, isLast }) {
  const catName = CATEGORY_MAP[item.category] ?? item.category;
  const dir = DIRECTION_MAP[item.direction] ?? DIRECTION_MAP.neutral;
  const mag = MAGNITUDE_MAP[item.magnitude] ?? MAGNITUDE_MAP.low;
  const min = item.change_pct_min ?? 0;
  const max = item.change_pct_max ?? 0;

  let rangeText = '';
  if (item.direction === 'neutral') {
    rangeText = '─ 중립';
  } else if (min === max) {
    rangeText = `${dir.label.split(' ')[0]} 약${min > 0 ? '+' : ''}${min}%`;
  } else {
    rangeText = `${dir.label.split(' ')[0]}${min > 0 ? '+' : ''}${min}~${max > 0 ? '+' : ''}${max}%`;
  }

  return (
    <View style={[styles.categoryRow, !isLast && styles.rowBorder]}>
      <View style={styles.rowLeft}>
        <DirectionDot direction={item.direction} size={8} />
        <View>
          <Text style={styles.categoryName}>{catName}</Text>
          <Text style={styles.categoryCount}>{item.news_count ?? 0}건의 분석</Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.categoryChange, { color: dir.color }]}>{rangeText}</Text>
        <View style={styles.magnitudeDots}>
          {mag.dots.map((c, i) => (
            <View key={i} style={[styles.magnitudeDot, { backgroundColor: c }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ── 뉴스 행 ───────────────────────────────────────────────────
function NewsRow({ item, isLast }) {
  const mainChain = item.causal_chains?.[0];
  const keywords = item.raw_news?.keyword?.slice(0, 3) ?? [];

  return (
    <View style={[styles.newsRow, !isLast && styles.rowBorder]}>
      <View style={styles.newsRowTop}>
        <DirectionDot direction={mainChain?.direction ?? 'neutral'} size={7} />
        <Text style={styles.newsTitle} numberOfLines={2}>{item.summary}</Text>
        <ReliabilityBadge reliability={item.reliability} />
      </View>
      <Text style={styles.newsSummaryEn} numberOfLines={1}>{item.raw_news?.title ?? ''}</Text>
      <View style={styles.tagRow}>
        {(item.raw_news?.increased_items ?? []).map(k => (
          <View key={k} style={[styles.tag, { backgroundColor: COLORS.tagUpBg }]}>
            <Text style={[styles.tagText, { color: COLORS.tagUpText }]}>▲{k}</Text>
          </View>
        ))}
        {(item.raw_news?.decreased_items ?? []).map(k => (
          <View key={k} style={[styles.tag, { backgroundColor: COLORS.tagDownBg }]}>
            <Text style={[styles.tagText, { color: COLORS.tagDownText }]}>▼{k}</Text>
          </View>
        ))}
        {keywords.map(k => (
          <View key={k} style={styles.tagGray}>
            <Text style={styles.tagGrayText}>{k}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── 화면 본체 ─────────────────────────────────────────────────
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [indicators, setIndicators] = useState(MOCK_INDICATORS);
  const [chains, setChains] = useState(MOCK_CHAINS);
  const [news, setNews] = useState(MOCK_NEWS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [ind, ch, nw] = await Promise.all([
          fetchIndicatorLatest(),
          fetchCausalChains(),
          fetchNewsList(),
        ]);
        if (ind?.length >= 2) setIndicators(ind);
        if (ch?.length > 0) {
          const grouped = {};
          ch.forEach(c => {
            if (!grouped[c.category]) {
              grouped[c.category] = { ...c, news_count: 1 };
            } else {
              grouped[c.category].news_count += 1;
            }
          });
          setChains(Object.values(grouped));
        }
        if (nw?.length > 0) setNews(nw.slice(0, 5));
      } catch (_) { /* Supabase 미연결 시 mock 유지 */ }
      finally { setLoading(false); }
    })();
  }, []);

  const latest = indicators[0] ?? {};
  const prev   = indicators[1] ?? {};
  const aiChange   = ((latest.ai_gpr_index ?? 0)   - (prev.ai_gpr_index ?? 0));
  const oilChange  = ((latest.oil_disruptions ?? 0) - (prev.oil_disruptions ?? 0));
  const nonOilChange = ((latest.non_oil_gpr ?? 0)  - (prev.non_oil_gpr ?? 0));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      {/* ── 헤더 ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>물가 레이더</Text>
            <Text style={styles.headerSub}>WAR PRICE RADAR</Text>
          </View>
          {latest.reference_date ? (
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>기준일 {latest.reference_date}</Text>
            </View>
          ) : null}
        </View>

        {/* 리스크 카드 3개 */}
        <View style={styles.riskRow}>
          <RiskCard label="AI GPR"   value={latest.ai_gpr_index}    change={aiChange} />
          <RiskCard label="석유차질"  value={latest.oil_disruptions}  change={oilChange} />
          <RiskCard label="비석유"   value={latest.non_oil_gpr}      change={nonOilChange} />
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && <ActivityIndicator color={COLORS.headerBg} style={{ marginBottom: 12 }} />}

        {/* 카테고리별 가격 영향 */}
        <Text style={styles.sectionLabel}>카테고리별 가격 영향</Text>
        <View style={styles.card}>
          {chains.map((item, i) => (
            <CategoryRow
              key={item.category + i}
              item={item}
              isLast={i === chains.length - 1}
            />
          ))}
        </View>

        {/* 최신 뉴스 */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>최신 뉴스</Text>
        <View style={styles.card}>
          {news.map((item, i) => (
            <NewsRow key={item.id} item={item} isLast={i === news.length - 1} />
          ))}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

// ── StyleSheet ────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },

  // Header
  header: {
    backgroundColor: COLORS.headerBg,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.headerText },
  headerSub:   { fontSize: 10, color: COLORS.headerAccent, marginTop: 2 },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dateBadgeText: { fontSize: 10, color: COLORS.headerText },

  // Risk cards
  riskRow:   { flexDirection: 'row', gap: 8 },
  riskCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  riskLabel:   { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  riskValue:   { fontSize: 18, fontWeight: '700', color: COLORS.headerText },
  riskBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginVertical: 4,
  },
  riskBarFill: { width: '60%', height: 3, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 },
  riskChange:  { fontSize: 10 },

  // Body
  body:        { flex: 1 },
  bodyContent: { padding: 14 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  rowBorder:   { borderBottomWidth: 0.5, borderBottomColor: COLORS.border },

  // Category row
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  rowLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowRight:    { alignItems: 'flex-end' },
  categoryName:   { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  categoryCount:  { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  categoryChange: { fontSize: 13, fontWeight: '700' },
  magnitudeDots:  { flexDirection: 'row', gap: 3, marginTop: 3 },
  magnitudeDot:   { width: 6, height: 6, borderRadius: 3 },

  // News row
  newsRow:     { paddingVertical: 11, paddingHorizontal: 14 },
  newsRowTop:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 },
  newsTitle:   { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, marginRight: 8 },
  newsSummaryEn: { fontSize: 11, color: COLORS.textMuted, marginBottom: 6, marginLeft: 15 },
  tagRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginLeft: 15 },
  tag:         { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  tagText:     { fontSize: 10, fontWeight: '600' },
  tagGray:     { backgroundColor: '#F3F4F6', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  tagGrayText: { fontSize: 10, color: COLORS.textMuted },
});
