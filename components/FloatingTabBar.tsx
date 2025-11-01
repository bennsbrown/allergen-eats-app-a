
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import React from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
}

interface TabItemProps {
  tab: TabBarItem;
  isActive: boolean;
  onPress: () => void;
}

function TabItem({ tab, isActive, onPress }: TabItemProps) {
  const scale = useSharedValue(isActive ? 1 : 0.9);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(scale.value) }],
    };
  });

  React.useEffect(() => {
    scale.value = isActive ? 1 : 0.9;
  }, [isActive, scale]);

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        <View
          style={[
            styles.iconContainer,
            isActive && {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <IconSymbol
            name={tab.icon as any}
            color={isActive ? colors.card : colors.text}
            size={24}
          />
        </View>
        <Text
          style={[
            styles.label,
            {
              color: isActive ? colors.primary : colors.textSecondary,
            },
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function FloatingTabBar({
  tabs,
  containerWidth = Dimensions.get('window').width - 32,
  borderRadius = 24,
  bottomMargin = 16,
}: FloatingTabBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { marginBottom: bottomMargin }]}
      edges={['bottom']}
    >
      <View style={[styles.container, { width: containerWidth }]}>
        <BlurView
          intensity={80}
          tint={theme.dark ? 'dark' : 'light'}
          style={[
            styles.blurContainer,
            { borderRadius },
            Platform.OS !== 'ios' && {
              backgroundColor: colors.card,
            },
          ]}
        >
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => {
              const isActive = pathname.includes(tab.name);
              return (
                <TabItem
                  key={tab.name}
                  tab={tab}
                  isActive={isActive}
                  onPress={() => handleTabPress(tab.route)}
                />
              );
            })}
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurContainer: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.secondary,
    boxShadow: '0px 4px 16px rgba(190, 22, 34, 0.3)',
    elevation: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
