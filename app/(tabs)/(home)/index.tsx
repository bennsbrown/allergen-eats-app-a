
import React, { useState } from 'react';
import Animated, { 
  FadeInDown,
} from 'react-native-reanimated';
import { Stack, router } from 'expo-router';
import {
  ScrollView,
  Pressable,
  StyleSheet,
  View,
  Text,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useMenuData, useFilteredMenu } from '@/hooks/useMenuData';
import { DIETARY_NEEDS_FILTERS, PREFERENCES_FILTERS } from '@/types/allergen';
import { colors } from '@/styles/commonStyles';

export default function HomeScreen() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { menuItems, loading } = useMenuData();
  const filteredItems = useFilteredMenu(menuItems, selectedFilters);

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(id => id !== filterId);
      }
      return [...prev, filterId];
    });
  };

  const searchFilteredItems = filteredItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => {
        console.log('Info button pressed');
      }}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="info.circle" color={colors.primary} />
    </Pressable>
  );

  const handleNavigateToTerms = () => {
    console.log('Navigating to Terms & Conditions from customer dashboard');
    router.push('/terms-acceptance');
  };

  const allFilters = [...DIETARY_NEEDS_FILTERS, ...PREFERENCES_FILTERS];

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Allergen Menu',
            headerRight: renderHeaderRight,
          }}
        />
      )}
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section - Reduced size */}
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop' }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Welcome Section - Removed heart */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome!</Text>
            <Text style={styles.welcomeText}>
              Find dishes that match your dietary needs. Select your preferences below.
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" color={colors.textSecondary} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search dishes..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Preferences Filter Section - MOVED ABOVE with background box */}
          <View style={styles.preferencesBox}>
            <View style={styles.filtersSection}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              <Text style={styles.sectionSubtitle}>Select dietary preferences</Text>
              <View style={styles.filterChipsContainer}>
                {PREFERENCES_FILTERS.map((filter, index) => {
                  const isSelected = selectedFilters.includes(filter.id);
                  return (
                    <Animated.View
                      key={filter.id}
                      entering={FadeInDown.delay(index * 30)}
                    >
                      <Pressable
                        style={[
                          styles.filterChip,
                          isSelected && styles.filterChipSelected,
                        ]}
                        onPress={() => toggleFilter(filter.id)}
                      >
                        <IconSymbol
                          name={filter.icon as any}
                          color={isSelected ? colors.card : colors.primary}
                          size={18}
                        />
                        <Text
                          style={[
                            styles.filterChipText,
                            isSelected && styles.filterChipTextSelected,
                          ]}
                        >
                          {filter.name}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Dietary Needs Filter Section */}
          <View style={styles.filtersSection}>
            <Text style={styles.sectionTitle}>Dietary Needs</Text>
            <Text style={styles.sectionSubtitle}>Select allergens to avoid</Text>
            <View style={styles.filterChipsContainer}>
              {DIETARY_NEEDS_FILTERS.map((filter, index) => {
                const isSelected = selectedFilters.includes(filter.id);
                return (
                  <Animated.View
                    key={filter.id}
                    entering={FadeInDown.delay((PREFERENCES_FILTERS.length + index) * 30)}
                  >
                    <Pressable
                      style={[
                        styles.filterChip,
                        isSelected && styles.filterChipSelected,
                      ]}
                      onPress={() => toggleFilter(filter.id)}
                    >
                      <IconSymbol
                        name={filter.icon as any}
                        color={isSelected ? colors.card : colors.primary}
                        size={18}
                      />
                      <Text
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextSelected,
                        ]}
                      >
                        {filter.name}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          {/* Active Filters Display */}
          {selectedFilters.length > 0 && (
            <View style={styles.activeFiltersSection}>
              <Text style={styles.activeFiltersText}>
                Showing {searchFilteredItems.length} dishes matching your filters:{' '}
                {selectedFilters
                  .map(id => allFilters.find(f => f.id === id)?.name)
                  .join(', ')}
              </Text>
              <Pressable onPress={() => setSelectedFilters([])}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </Pressable>
            </View>
          )}

          {/* Menu Items */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>
              {selectedFilters.length > 0 ? 'Safe for You' : 'All Dishes'}
            </Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading menu...</Text>
              </View>
            ) : searchFilteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="exclamationmark.triangle" color={colors.textSecondary} size={48} />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'No dishes match your search'
                    : 'No dishes match your dietary requirements'}
                </Text>
                <Text style={styles.emptySubtext}>
                  Try adjusting your filters or search
                </Text>
              </View>
            ) : (
              searchFilteredItems.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(index * 50)}
                >
                  <View style={styles.menuCard}>
                    <View style={styles.menuCardContent}>
                      <View style={styles.menuItemHeader}>
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.menuItemCategory}>{item.category}</Text>
                        </View>
                      </View>
                      {item.allergens.length > 0 && (
                        <View style={styles.allergenBadgesContainer}>
                          {item.allergens.map(allergen => (
                            <View key={allergen} style={styles.allergenBadge}>
                              <Text style={styles.allergenBadgeText}>
                                {allFilters.find(f => f.id === allergen)?.name || allergen}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How to Use</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoBullet}>1.</Text>
                <Text style={styles.infoText}>
                  Select dietary preferences like Vegan, Vegetarian, Halal, or Kosher
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoBullet}>2.</Text>
                <Text style={styles.infoText}>
                  Select allergens to avoid in the &quot;Dietary Needs&quot; section
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoBullet}>3.</Text>
                <Text style={styles.infoText}>
                  Browse dishes that are safe for you
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoBullet}>4.</Text>
                <Text style={styles.infoText}>
                  Each dish shows which allergens it contains
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoBullet}>5.</Text>
                <Text style={styles.infoText}>
                  Use the search bar to find specific dishes
                </Text>
              </View>
            </View>
          </View>

          {/* Terms & Conditions Button */}
          <Pressable style={styles.termsButton} onPress={handleNavigateToTerms}>
            <IconSymbol name="doc.text.fill" color={colors.primary} size={20} />
            <Text style={styles.termsButtonText}>Terms & Conditions</Text>
            <IconSymbol name="chevron.right" color={colors.primary} size={18} />
          </Pressable>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  welcomeSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.text,
  },
  preferencesBox: {
    backgroundColor: colors.highlight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  filtersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterChipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  filterChipTextSelected: {
    color: colors.card,
  },
  activeFiltersSection: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  activeFiltersText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  clearFiltersText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '800',
  },
  menuSection: {
    marginBottom: 16,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  menuCardContent: {
    gap: 10,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  menuItemCategory: {
    fontSize: 10,
    color: colors.card,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  allergenBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allergenBadge: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  allergenBadgeText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.card,
    marginBottom: 14,
  },
  infoList: {
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBullet: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.card,
    marginRight: 10,
    width: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.card,
    lineHeight: 20,
    fontWeight: '500',
  },
  headerButtonContainer: {
    padding: 6,
  },
  termsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 10,
    borderWidth: 2,
    borderColor: colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  termsButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    flex: 1,
  },
});
