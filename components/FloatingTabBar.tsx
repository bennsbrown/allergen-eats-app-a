
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '@/styles/commonStyles';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
  onCustomerPress?: () => void;
  onBusinessPress?: () => void;
}

interface TabItemProps {
  tab: TabBarItem;
  isActive: boolean;
  onPress: () => void;
}

const TabItem = ({ tab, isActive, onPress }: TabItemProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isActive ? 1 : 0.6);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.05 : 1);
    opacity.value = withSpring(isActive ? 1 : 0.6);
  }, [isActive, scale, opacity]);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        <Text
          style={[
            styles.tabLabel,
            isActive && styles.tabLabelActive,
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function FloatingTabBar({
  tabs,
  containerWidth = Dimensions.get('window').width - 32,
  borderRadius = 24,
  bottomMargin = 16,
  onCustomerPress,
  onBusinessPress,
}: FloatingTabBarProps) {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const handleTabPress = (tab: TabBarItem) => {
    console.log('Tab pressed:', tab.name);
    
    // Use custom handlers if provided
    if (tab.name === '(home)' && onCustomerPress) {
      onCustomerPress();
    } else if (tab.name === 'profile' && onBusinessPress) {
      onBusinessPress();
    } else {
      // Default navigation
      router.push(tab.route);
    }
  };

  // Determine which tab is active based on pathname
  const getIsActive = (tabName: string) => {
    console.log('Checking active tab:', tabName, 'pathname:', pathname);
    
    // For home tab, check if we're on the root or home route
    if (tabName === '(home)') {
      return pathname === '/' || pathname.includes('/(home)') || pathname === '/(tabs)/(home)/';
    }
    
    // For other tabs, check if pathname includes the tab name
    return pathname.includes(tabName);
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { marginBottom: bottomMargin }]}
    >
      <BlurView
        intensity={80}
        tint="light"
        style={[
          styles.tabBar,
          {
            width: containerWidth,
            borderRadius: borderRadius,
            backgroundColor: Platform.OS === 'web' ? colors.card : 'transparent',
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = getIsActive(tab.name);
          return (
            <TabItem
              key={tab.name}
              tab={tab}
              isActive={isActive}
              onPress={() => handleTabPress(tab)}
            />
          );
        })}
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    boxShadow: '0px 8px 24px rgba(59, 130, 246, 0.2)',
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
