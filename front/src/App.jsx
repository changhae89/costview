// App.jsx — Root Navigator (Bottom Tab) + Splash
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import DashboardScreen from './screens/DashboardScreen';
import NewsListScreen from './screens/NewsListScreen';
import PredictionListScreen from './screens/PredictionListScreen';
import RiskScreen from './screens/RiskScreen';
import SettingsScreen from './screens/SettingsScreen';
import { COLORS } from './constants/colors';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

// ── 탭 아이콘 (SVG 없이 텍스트 이모지 + 인디케이터) ──────────
function TabIcon({ label, focused }) {
  const icons = {
    '뉴스': '📰',
    '품목 예측': '📈',
    '대시보드': '📊',
    '리스크': '🕐',
    '설정': '⚙️',
  };
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={[tabStyles.iconText, !focused && tabStyles.iconInactive]}>
        {icons[label] ?? '●'}
      </Text>
      <Text 
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[tabStyles.label, focused ? tabStyles.labelActive : tabStyles.labelInactive]}
      >
        {label}
      </Text>
      {focused && <View style={tabStyles.indicator} />}
    </View>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5초 대기
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <Image 
          source={require('../logo/logo1.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={COLORS.headerBg} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: tabStyles.tabBar,
              tabBarShowLabel: false,
            }}
          >
            <Tab.Screen
              name="News"
              component={NewsListScreen}
              options={{ tabBarIcon: ({ focused }) => <TabIcon label="뉴스" focused={focused} /> }}
            />
            <Tab.Screen
              name="Prediction"
              component={PredictionListScreen}
              options={{ tabBarIcon: ({ focused }) => <TabIcon label="품목 예측" focused={focused} /> }}
            />
            <Tab.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ tabBarIcon: ({ focused }) => <TabIcon label="대시보드" focused={focused} /> }}
            />
            <Tab.Screen
              name="Risk"
              component={RiskScreen}
              options={{ tabBarIcon: ({ focused }) => <TabIcon label="리스크" focused={focused} /> }}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ tabBarIcon: ({ focused }) => <TabIcon label="설정" focused={focused} /> }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});

const tabStyles = StyleSheet.create({
  tabBar: {
    height: 83,
    backgroundColor: COLORS.white,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 4,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    width: 65, // 텍스트 폭 확보
  },
  iconText: {
    fontSize: 22,
    marginBottom: 2,
  },
  iconInactive: {
    opacity: 0.4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    width: '100%',
    textAlign: 'center',
  },
  labelActive: {
    color: COLORS.tabActive,
    fontWeight: '700',
  },
  labelInactive: {
    color: COLORS.tabInactive,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.tabActive,
    marginTop: 3,
  },
});
