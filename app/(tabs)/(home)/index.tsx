
import React, { useState } from 'react';
import { Stack } from 'expo-router';
import {
  ScrollView,
  Pressable,
  StyleSheet,
  View,
  Text,
  Platform,
  TextInput,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { ALLERGEN_FILTERS } from '@/types/allergen';
import { useMenuData, useFilteredMenu } from '@/hooks/useMenuData';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
      <IconSymbol name="info.circle" color={colors.text} />
    </Pressable>
  );

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

          {/* Allergen Filter Chips */}
          <View style={styles.filtersSection}>
            <Text style={styles.sectionTitle}>Filter by Dietary Needs</Text>
            <View style={styles.filterChipsContainer}>
              {ALLERGEN_FILTERS.map((filter, index) => {
                const isSelected = selectedFilters.includes(filter.id);
                return (
                  <Animated.View
                    key={filter.id}
                    entering={FadeInDown.delay(index * 50)}
                  >
                    <Pressable
                      style={[
                        styles.filterChip,
                        isSelected && styles.filterChipSelected,
                      ]}
                      onPress={() => toggleFilter(filter.id)}
                    >
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
                Showing {searchFilteredItems.length} dishes free from:{' '}
                {selectedFilters
                  .map(id => ALLERGEN_FILTERS.find(f => f.id === id)?.name)
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
                                {ALLERGEN_FILTERS.find(f => f.id === allergen)?.name || allergen}
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
                  Select your dietary restrictions using the filter chips above
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoBullet}>2.</Text>
                <Text style={styles.infoText}>
                  Browse dishes that are safe for you
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoBullet}>3.</Text>
                <Text style={styles.infoText}>
                  Each dish shows which allergens it contains
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoBullet}>4.</Text>
                <Text style={styles.infoText}>
                  Use the search bar to find specific dishes
                </Text>
              </View>
            </View>
          </View>
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
    paddingTop: 16,
    paddingBottom: 16,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  filtersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterChipTextSelected: {
    color: colors.card,
  },
  activeFiltersSection: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  activeFiltersText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  menuCardContent: {
    gap: 12,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  menuItemCategory: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  allergenBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenBadge: {
    backgroundColor: colors.highlight,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  allergenBadgeText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBullet: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginRight: 12,
    width: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    fontWeight: '500',
  },
  headerButtonContainer: {
    padding: 6,
  },
});
