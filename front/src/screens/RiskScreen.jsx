// screens/RiskScreen.jsx — SCR-004 리스크 지수
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/colors';
import { calcStats, formatIndex, formatNumber } from '../lib/helpers';
import { fetchIndicatorDaily, fetchIndicatorMonthly } from '../lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_W - 28;

const CHART_SERIES = [
  { key: 'ai_gpr_index',    label: 'AI GPR',       color: '#D85A30' },
  { key: 'oil_disruptions', label: '석유 차질(÷10)', color: '#EF9F27' },
  { key: 'gpr_original',    label: '기존 GPR',      color: '#888780' },
  { key: 'non_oil_gpr',     label: '비석유',         color: '#2E86AB' },
];

// ── Mock 데이터 ────────────────────────────────────────────────
const MOCK_DAILY = [
  { reference_date: '2026-03-22', ai_gpr_index: 170.8, oil_disruptions: 1200, gpr_original: 145.0, non_oil_gpr: 100.0 },
  { reference_date: '2026-03-23', ai_gpr_index: 185.2, oil_disruptions: 1280, gpr_original: 150.0, non_oil_gpr: 108.0 },
  { reference_date: '2026-03-24', ai_gpr_index: 200.0, oil_disruptions: 1350, gpr_original: 160.0, non_oil_gpr: 115.0 },
  { reference_date: '2026-03-25', ai_gpr_index: 215.5, oil_disruptions: 1420, gpr_original: 168.0, non_oil_gpr: 120.0 },
  { reference_date: '2026-03-26', ai_gpr_index: 225.0, oil_disruptions: 1480, gpr_original: 172.0, non_oil_gpr: 125.0 },
  { reference_date: '2026-03-27', ai_gpr_index: 232.2, oil_disruptions: 1550, gpr_original: 175.0, non_oil_gpr: 130.0 },
  { reference_date: '2026-03-28', ai_gpr_index: 345.8, oil_disruptions: 1620, gpr_original: 180.0, non_oil_gpr: 135.0 },
  { reference_date: '2026-03-29', ai_gpr_index: 280.1, oil_disruptions: 1680, gpr_original: 178.0, non_oil_gpr: 140.0 },
  { reference_date: '2026-03-30', ai_gpr_index: 232.2, oil_disruptions: 1370, gpr_original: 197.1, non_oil_gpr: 154.7 },
  { reference_date: '2026-03-31', ai_gpr_index: 250.6, oil_disruptions: 1717, gpr_original: 154.7, non_oil_gpr: 112.3 },
];

// ── 탭 버튼 ───────────────────────────────────────────────────
function TabBtn({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

// ── 범위 칩 ───────────────────────────────────────────────────
function RangeChip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.rangeChip, active && styles.rangeChipActive]}>
      <Text style={[styles.rangeChipText, active && styles.rangeChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

// ── 통계 셀 ───────────────────────────────────────────────────
function StatCell({ label, value, sub, subColor }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={[styles.statSub, subColor && { color: subColor }]}>{sub}</Text> : null}
    </View>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────────
export default function RiskScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab]   = useState('daily');   // 'daily' | 'monthly'
  const [range, setRange] = useState('10');    // '10' | '20' | 'all'
  const [daily, setDaily]     = useState(MOCK_DAILY);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [d, m] = await Promise.all([
          fetchIndicatorDaily(),
          fetchIndicatorMonthly(),
        ]);
        if (d?.length > 0) setDaily(d);
        if (m?.length > 0) setMonthly(m);
      } catch (_) { /* mock 유지 */ }
      finally { setLoading(false); }
    })();
  }, []);

  const rawData = tab === 'daily'
    ? daily
    : monthly.length > 0 ? monthly : daily;

  const slicedData = useMemo(() => {
    if (range === 'all') return rawData;
    const n = range === '10' ? 10 : 20;
    return rawData.slice(-n);
  }, [rawData, range]);

  const aiStats  = useMemo(() => calcStats(slicedData, 'ai_gpr_index'),    [slicedData]);
  const oilStats = useMemo(() => calcStats(slicedData, 'oil_disruptions'), [slicedData]);

  // 차트 레이블: 최대 6개만 표시
  const chartLabels = useMemo(() =>
    slicedData.map((d, i) => {
      const step = Math.ceil(slicedData.length / 6);
      return i % step === 0 ? (d.reference_date?.slice(5) ?? '') : '';
    }),
    [slicedData],
  );

  const aiSeries     = slicedData.map(d => Number(d.ai_gpr_index)    || 0);
  const oilSeries    = slicedData.map(d => (Number(d.oil_disruptions) || 0) / 10);
  const gprSeries    = slicedData.map(d => Number(d.gpr_original)    || 0);
  const nonOilSeries = slicedData.map(d => Number(d.non_oil_gpr)     || 0);

  const dateRange = slicedData.length >= 2
    ? `${slicedData[0].reference_date} ~ ${slicedData[slicedData.length - 1].reference_date}`
    : '';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>리스크 지수</Text>
          <Text style={styles.headerSub}>지정학 위험 트렌드</Text>
        </View>

        {/* 탭: 일간 / 월간 */}
        <View style={styles.tabRow}>
          <TabBtn label="일간" active={tab === 'daily'}   onPress={() => setTab('daily')} />
          <TabBtn label="월간" active={tab === 'monthly'} onPress={() => setTab('monthly')} />
        </View>

        {/* 범위 칩: 10일 / 20일 / 전체 */}
        <View style={styles.rangeRow}>
          <RangeChip label="10일" active={range === '10'}  onPress={() => setRange('10')} />
          <RangeChip label="20일" active={range === '20'}  onPress={() => setRange('20')} />
          <RangeChip label="전체" active={range === 'all'} onPress={() => setRange('all')} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {loading && <ActivityIndicator color={COLORS.headerBg} style={{ marginBottom: 12 }} />}

        {/* 통계 카드 2×2 */}
        {aiStats && oilStats && (
          <View style={styles.statsGrid}>
            <StatCell
              label="AI GPR"
              value={formatIndex(aiStats.last)}
              sub={aiStats.change > 0 ? `▲+${aiStats.change}` : `▼${aiStats.change}`}
              subColor={aiStats.change > 0 ? COLORS.up : COLORS.down}
            />
            <StatCell
              label="석유 공급"
              value={formatNumber(oilStats.last)}
              sub={oilStats.change > 0 ? `▲+${oilStats.change}` : `▼${oilStats.change}`}
              subColor={oilStats.change > 0 ? COLORS.up : COLORS.down}
            />
            <StatCell
              label="기간 최고"
              value={formatIndex(aiStats.max)}
              sub={aiStats.maxDate ?? ''}
            />
            <StatCell
              label="기간 최저"
              value={formatIndex(aiStats.min)}
              sub={aiStats.minDate ?? ''}
            />
          </View>
        )}

        {/* 차트 카드 */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {tab === 'daily' ? '일간' : '월간'} AI GPR 지수 추이
          </Text>
          <Text style={styles.chartSubtitle}>{dateRange}</Text>

          {/* 범례 */}
          <View style={styles.legendRow}>
            {CHART_SERIES.map(s => (
              <View key={s.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                <Text style={styles.legendText}>{s.label}</Text>
              </View>
            ))}
          </View>

          {slicedData.length >= 2 && (
            <LineChart
              data={{
                labels: chartLabels,
                datasets: [
                  { data: aiSeries,     color: () => '#D85A30', strokeWidth: 2   },
                  { data: oilSeries,    color: () => '#EF9F27', strokeWidth: 1.5 },
                  { data: gprSeries,    color: () => '#888780', strokeWidth: 1   },
                  { data: nonOilSeries, color: () => '#2E86AB', strokeWidth: 1.5 },
                ],
              }}
              width={CHART_WIDTH}
              height={180}
              withInnerLines
              withOuterLines={false}
              withShadow={false}
              fromZero
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo:   COLORS.white,
                decimalPlaces: 0,
                color:      (opacity = 1) => `rgba(30,58,95,${opacity})`,
                labelColor: (opacity = 1) => `rgba(107,114,128,${opacity})`,
                propsForDots: { r: '2', strokeWidth: '1', stroke: COLORS.white },
                propsForBackgroundLines: { strokeDasharray: '', stroke: '#E5E7EB' },
              }}
              style={{ marginLeft: -12, borderRadius: 8 }}
            />
          )}

          <Text style={styles.chartNote}>* 석유 공급 차질 지수는 ÷10 표시</Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ── StyleSheet ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },

  // Header
  header: {
    backgroundColor: COLORS.headerBg,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  headerTop:    { marginBottom: 12 },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: COLORS.headerText },
  headerSub:    { fontSize: 10, color: COLORS.headerAccent, marginTop: 2 },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tabBtn: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  tabBtnActive:     { backgroundColor: COLORS.white },
  tabBtnText:       { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  tabBtnTextActive: { color: COLORS.headerBg, fontWeight: '700' },

  // Range chips
  rangeRow: { flexDirection: 'row', gap: 8 },
  rangeChip: {
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  rangeChipActive:     { borderColor: 'rgba(255,255,255,0.5)' },
  rangeChipText:       { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  rangeChipTextActive: { color: 'rgba(255,255,255,0.9)' },

  // Body
  body: { padding: 14 },

  // Stats grid 2×2
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  statCell: {
    flex: 1, minWidth: '45%',
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  statSub:   { fontSize: 11, color: COLORS.textMuted },

  // Chart card
  chartCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  chartTitle:    { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  chartSubtitle: { fontSize: 10, color: COLORS.textMuted, marginBottom: 10 },
  legendRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendText:    { fontSize: 10, color: COLORS.textMuted },
  chartNote:     { fontSize: 9, color: COLORS.textLight, marginTop: 8 },
});
