import { useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;
const chartWidth = Math.max(screenWidth - 64, 280);
const monthLabels = ["M0", "M1", "M2", "M3", "M4", "M5", "M6"];

const mockChains = [
  {
    chain_id: "CHN_001",
    event_id: "EVT_1973_OIL",
    region: "Middle East",
    category: "Energy",
    headline: "아랍 산유국 금수 조치, 국제 유가 4배 폭등",
    description: "원유 공급이 급감하면서 정유, 운송, 식품 전반 가격이 단기간에 급등했다.",
    quantitative_data: {
      lag_months: 1,
      raw_price_change_pct: 400,
      consumer_price_change_pct: 80,
    },
  },
  {
    chain_id: "CHN_002",
    event_id: "EVT_2022_GRAIN",
    region: "Black Sea",
    category: "Food",
    headline: "흑해 곡물 수출 불안, 가공식품 가격 연쇄 상승",
    description: "곡물 조달 차질이 빵, 면, 외식비로 번지며 생활물가 부담이 커졌다.",
    quantitative_data: {
      lag_months: 2,
      raw_price_change_pct: 65,
      consumer_price_change_pct: 19,
    },
  },
  {
    chain_id: "CHN_003",
    event_id: "EVT_2022_GAS",
    region: "Europe",
    category: "Utilities",
    headline: "천연가스 불안, 전기요금과 난방비에 시차 반영",
    description: "에너지 조달 비용 상승이 공공요금과 겨울철 난방비로 이어졌다.",
    quantitative_data: {
      lag_months: 3,
      raw_price_change_pct: 120,
      consumer_price_change_pct: 26,
    },
  },
  {
    chain_id: "CHN_004",
    event_id: "EVT_2023_SHIPPING",
    region: "Red Sea",
    category: "Logistics",
    headline: "홍해 물류 차질, 운임 상승이 생활 소비재 가격 압박",
    description: "운송 지연과 보험료 상승이 전자제품, 생활용품 가격에 전가되기 시작했다.",
    quantitative_data: {
      lag_months: 2,
      raw_price_change_pct: 34,
      consumer_price_change_pct: 11,
    },
  },
];

function buildSeries(chain) {
  const lagMonths = Math.max(
    0,
    Number(chain?.quantitative_data?.lag_months) || 0,
  );
  const rawChange =
    Number(chain?.quantitative_data?.raw_price_change_pct) || 0;
  const consumerChange =
    Number(chain?.quantitative_data?.consumer_price_change_pct) || 0;

  const rawSeries = monthLabels.map((_, index) => (index >= 1 ? rawChange : 0));
  const consumerJumpIndex = Math.min(6, 1 + lagMonths);
  const consumerSeries = monthLabels.map((_, index) =>
    index >= consumerJumpIndex ? consumerChange : 0,
  );

  return {
    lagMonths,
    rawChange,
    consumerChange,
    rawSeries,
    consumerSeries,
  };
}

function StatPill({ label, value, accent }) {
  return (
    <View
      style={[
        styles.statPill,
        accent === "hot" ? styles.statPillHot : styles.statPillCool,
      ]}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function FilterChip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, active ? styles.filterChipActive : null]}
    >
      <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function App() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Energy", "Food", "Utilities", "Logistics"];

  const filteredChains = useMemo(() => {
    if (activeFilter === "All") {
      return mockChains;
    }

    return mockChains.filter((chain) => chain.category === activeFilter);
  }, [activeFilter]);

  const summary = useMemo(() => {
    const total = filteredChains.length;
    const maxRaw = Math.max(
      ...filteredChains.map(
        (chain) => Number(chain.quantitative_data.raw_price_change_pct) || 0,
      ),
    );
    const maxConsumer = Math.max(
      ...filteredChains.map(
        (chain) =>
          Number(chain.quantitative_data.consumer_price_change_pct) || 0,
      ),
    );

    return {
      total,
      maxRaw,
      maxConsumer,
    };
  }, [filteredChains]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Mock Data MVP</Text>
          <Text style={styles.headerTitle}>CostView</Text>
          <Text style={styles.headerSubtitle}>
            전쟁이 원자재를 거쳐 당신의 지갑까지 도달하는 경로를 가장 빠르게 읽어보세요.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryTitle}>Dashboard Snapshot</Text>
            <Text style={styles.summaryCaption}>Live backend off</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>{summary.total}</Text>
              <Text style={styles.summaryLabel}>impact chains</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>+{summary.maxRaw}%</Text>
              <Text style={styles.summaryLabel}>max raw shock</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryValue}>+{summary.maxConsumer}%</Text>
              <Text style={styles.summaryLabel}>max wallet hit</Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((filter) => (
            <FilterChip
              key={filter}
              label={filter}
              active={filter === activeFilter}
              onPress={() => setActiveFilter(filter)}
            />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Impact Chains</Text>
          <Text style={styles.sectionMeta}>{filteredChains.length} cards</Text>
        </View>

        {filteredChains.map((chain) => {
          const { lagMonths, rawChange, consumerChange, rawSeries, consumerSeries } =
            buildSeries(chain);

          return (
            <View key={chain.chain_id} style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{chain.region}</Text>
                </View>
                <View style={styles.tagMuted}>
                  <Text style={styles.tagMutedText}>{chain.category}</Text>
                </View>
              </View>

              <Text style={styles.cardHeadline}>{chain.headline}</Text>
              <Text style={styles.cardDescription}>{chain.description}</Text>

              <View style={styles.statRow}>
                <StatPill
                  label="원자재 타격"
                  value={`+${rawChange}%`}
                  accent="hot"
                />
                <StatPill
                  label="내 지갑 타격"
                  value={`+${consumerChange}%`}
                  accent="cool"
                />
                <StatPill label="전이 시차" value={`${lagMonths}개월`} />
              </View>

              <LineChart
                data={{
                  labels: monthLabels,
                  datasets: [
                    {
                      data: rawSeries,
                      color: () => "#d14b45",
                      strokeWidth: 3,
                    },
                    {
                      data: consumerSeries,
                      color: () => "#2667ff",
                      strokeWidth: 3,
                    },
                  ],
                  legend: ["원자재 가격", "소비재 가격"],
                }}
                width={chartWidth}
                height={220}
                withInnerLines
                withOuterLines={false}
                withShadow={false}
                fromZero
                yAxisSuffix="%"
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(35, 42, 46, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(95, 107, 114, ${opacity})`,
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#ffffff",
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "",
                    stroke: "#e7e3db",
                  },
                }}
                style={styles.chart}
              />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f1e8",
  },
  container: {
    padding: 18,
    paddingBottom: 36,
  },
  hero: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#9c5f2d",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1f2a2c",
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5f6b72",
  },
  summaryCard: {
    backgroundColor: "#1f2a2c",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f8f3eb",
  },
  summaryCaption: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f0c674",
    textTransform: "uppercase",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  summaryStat: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#b6c0c2",
  },
  filterRow: {
    paddingBottom: 14,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ebe3d6",
  },
  filterChipActive: {
    backgroundColor: "#c56f3a",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b6154",
  },
  filterChipTextActive: {
    color: "#fff8f2",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2a2c",
  },
  sectionMeta: {
    fontSize: 13,
    color: "#7c857c",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "#f8e2c8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9c5f2d",
  },
  tagMuted: {
    backgroundColor: "#edf1f3",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagMutedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#62717a",
  },
  cardHeadline: {
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 27,
    color: "#1f2a2c",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5f6b72",
    marginBottom: 14,
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  statPill: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#eef2f4",
  },
  statPillHot: {
    backgroundColor: "#fff1ef",
  },
  statPillCool: {
    backgroundColor: "#eef4ff",
  },
  statLabel: {
    fontSize: 11,
    color: "#6d7780",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1f2a2c",
  },
  chart: {
    borderRadius: 14,
    marginLeft: -12,
  },
});

export default App;
