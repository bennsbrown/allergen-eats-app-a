
import React, { useState, useMemo, useEffect } from 'react';
import Animated, { 
  FadeInDown,
} from 'react-native-reanimated';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  ScrollView,
  Pressable,
  StyleSheet,
  View,
  Text,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useMenuData, useFilteredMenu } from '@/hooks/useMenuData';
import { DIETARY_NEEDS_FILTERS, PREFERENCES_FILTERS } from '@/types/allergen';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';

export default function HomeScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for QR code-based menu loading
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load menu data based on QR code
  useEffect(() => {
    const loadMenu = async () => {
      let effectiveCode = code;
      if (!effectiveCode) {
        console.warn('No code param provided — falling back to first business');
        try {
          const { data: firstBusiness } = await supabase.from('business').select('id, name, unique_identifier').limit(1).maybeSingle();
          if (firstBusiness) {
            effectiveCode = firstBusiness.qr_slug ?? firstBusiness.unique_identifier ?? String(firstBusiness.id);
            console.log('Falling back to business id:', firstBusiness.id, 'name:', firstBusiness.name);
          }
        } catch (err) {
          console.warn('Error fetching fallback business:', err);
        }
      }

      console.log('Loading menu for code:', effectiveCode);

      try {
      // Fetch business by qr_slug first, then fall back to unique_identifier (legacy)
let business: { id: number; name: string; unique_identifier?: string } | null = null;

// 1) Try qr_slug = code
const { data: bySlug, error: slugErr } = await supabase
  .from('business')
  .select('id, name, unique_identifier')
  .eq('qr_slug', code)
  .maybeSingle();

if (slugErr) {
  console.error('Error fetching business by qr_slug:', slugErr);
}

// 2) If not found, try unique_identifier = code (legacy QR codes)
if (!bySlug) {
  const { data: byUnique, error: uniqueErr } = await supabase
    .from('business')
    .select('id, name, unique_identifier')
    .eq('unique_identifier', code)
    .maybeSingle();

  if (uniqueErr) {
    console.error('Error fetching business by unique_identifier:', uniqueErr);
  }

  business = byUnique ?? null;
} else {
  business = bySlug;
}

if (!business) {
  console.log('No business found for code:', code);
  setError('Menu link is invalid. Please check the QR code and try again.');
  setLoading(false);
  return;
}

setBusinessName(business.name);

        // 2) Fetch menu items for this business
        try {
          const { data: menuItems, error: menuErr } = await supabase
            .from('menu_item')
            .select('id, name, category')
            .eq('business_id', business.id)
            .order('category', { ascending: true });

          if (menuErr) {
            console.error('Error fetching menu items:', menuErr);
            setError('Failed to load menu items.');
            setItems([]);
          } else {
            // Ensure allergens is an array for each item and normalize to lowercase
            const normalized = (menuItems || []).map((it: any) => ({
              ...it,
              allergens: (Array.isArray(it?.allergens) ? it.allergens : (it?.allergens ? String(it.allergens).split(',').map((s: string) => s.trim()) : [])).map((a: string) => (a || '').toString().toLowerCase().trim()),
            }));
            setItems(normalized);
          }
        } catch (err) {
          console.error('Unexpected error fetching menu items:', err);
          setError('Failed to load menu items.');
          setItems([]);
        }
      } catch (err: any) {
        console.error('Error loading menu:', err);
        setError('Failed to load menu. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [code]);

  // Apply search filter
  const searchFilteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      (item.category && item.category.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  // Apply dietary / preferences filters (live) — enable debug to surface missing fields and decisions
  const filteredItems = useFilteredMenu(searchFilteredItems, selectedFilters, true);

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(id => id !== filterId);
      }
      return [...prev, filterId];
    });
  };

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

  // Loading state
  if (loading) {
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
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading menu...</Text>
          </View>
        </View>
      </>
    );
  }

  // NOTE: Removed full-screen error state so the customer menu always renders.
  // Any load errors will now show an inline banner in the main menu view.

  // Empty menu state
  if (items.length === 0) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen
            options={{
              title: businessName || 'Allergen Menu',
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
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: 'https://i.postimg.cc/W1WRMMdY/eaze-06.jpg' }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>{businessName || 'Restaurant'}</Text>
              <Text style={styles.welcomeText}>
                This restaurant hasn&apos;t added any menu items yet. Please check back later.
              </Text>
            </View>

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

  // Main menu display
  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: businessName || 'Allergen Menu',
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
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://i.postimg.cc/W1WRMMdY/eaze-06.jpg' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>  

          {/* Inline error banner (shows if there was a non-fatal error loading menu) */}
          {error ? (
            <View style={styles.inlineError}>
              <IconSymbol name="exclamationmark.triangle.fill" color={colors.secondary} size={16} />
              <Text style={styles.inlineErrorText}>{error}</Text>
            </View>
          ) : null}

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome to {businessName}!</Text>
            <Text style={styles.welcomeText}>
              Browse our menu below. Use the search bar to find specific dishes.
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
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" color={colors.textSecondary} size={20} />
              </Pressable>
            )}
          </View>

          {/* Filters */}
          <View style={styles.preferencesCard}>
            <Text style={[styles.preferencesHeading, styles.preferencesHeadingInner]}>Preferences</Text>
            <Text style={[styles.preferencesSubtitle, styles.preferencesSubtitleInner]}>Select dietary preferences</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.preferencesRow}
              >
              {PREFERENCES_FILTERS.map(f => {
                const active = selectedFilters.includes(f.id);
                return (
                  <Pressable
                    key={f.id}
                    style={({ pressed }) => [styles.chip, (active || pressed) && styles.chipActive]}
                    onPress={() => toggleFilter(f.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {({ pressed }) => (
                      <>
                        <IconSymbol name={f.icon as any} color={active || pressed ? colors.card : colors.primary} size={14} style={styles.chipIconInline} />
                        <Text style={[styles.chipText, (active || pressed) && styles.chipTextActive]}>{f.name}</Text>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Dietary Needs (no pale background) */}
          <View style={styles.dietaryContainer}>
            <Text style={[styles.preferencesHeading, styles.headingAligned]}>Dietary Needs</Text>
            <Text style={[styles.preferencesSubtitleSmall, styles.subHeadingAligned]}>Select allergens to avoid</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dietaryRow}
            >
              {DIETARY_NEEDS_FILTERS.map(f => {
                const active = selectedFilters.includes(f.id);
                return (
                  <Pressable
                    key={f.id}
                    style={({ pressed }) => [styles.chip, (active || pressed) && styles.chipActive, styles.chipNoIcon]}
                    onPress={() => toggleFilter(f.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {({ pressed }) => (
                      <Text style={[styles.chipText, (active || pressed) && styles.chipTextActive]}>{f.name}</Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'Search Results' : 'Menu'}
            </Text>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="exclamationmark.triangle" color={colors.textSecondary} size={48} />
                <Text style={styles.emptyText}>
                  No dishes match your search or selected filters
                </Text>
                <Text style={styles.emptySubtext}>
                  Try a different search term or unselect a filter
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredItems}
                keyExtractor={(item) => String(item.id)}
                scrollEnabled={true}
                renderItem={({ item }) => (
                  <View style={styles.menuCard}>
                    <View style={styles.menuCardContent}>
                      <View style={styles.menuItemHeader}>
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        {item.category && (
                          <View style={styles.categoryBadge}>
                            <Text style={styles.menuItemCategory}>{item.category}</Text>
                          </View>
                        )}
                      </View>
                      {/* Allergens shown as chips — tappable to toggle filters */}
                      {Array.isArray(item.allergens) && item.allergens.length > 0 ? (
                        <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
                          {item.allergens.map((a: string) => {
                            const id = String(a).toLowerCase();
                            const active = selectedFilters.includes(id);
                            return (
                              <Pressable
                                key={id}
                                onPress={() => toggleFilter(id)}
                                style={({ pressed }) => [styles.chip, (active || pressed) && styles.chipActive, styles.chipNoIcon]}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                {({ pressed }) => (
                                  <Text style={[styles.chipText, (active || pressed) && styles.chipTextActive]}>{id.charAt(0).toUpperCase() + id.slice(1)}</Text>
                                )}
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : null}
                    </View>
                  </View>
                )}
              />
            )}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>About This Menu</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoBullet}>•</Text>
                <Text style={styles.infoText}>
                  Use the search bar to quickly find specific dishes
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoBullet}>•</Text>
                <Text style={styles.infoText}>
                  All menu items are provided by {businessName}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoBullet}>•</Text>
                <Text style={styles.infoText}>
                  For allergen information, please ask your server
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 16,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '500',
  },
  errorButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    boxShadow: '0px 4px 12px rgba(56, 189, 248, 0.3)',
    elevation: 3,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.card,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  logoImage: {
    width: 240,
    height: 100,
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
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  menuSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    marginLeft: 20, // align the "Menu" title with the Welcome card content
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
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  inlineErrorText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  /* Filters */
  preferencesCard: {
    backgroundColor: colors.highlight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  preferencesHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  preferencesSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
    fontWeight: '600',
  },
  preferencesSubtitleSmall: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
    fontWeight: '600',
  },
  preferencesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    paddingLeft: 6, // align chips with preferences heading inside the card
    marginBottom: 8,
  },
  dietaryContainer: {
    marginBottom: 16,
  },
  dietaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    paddingLeft: 20, // align dietary chips with the welcome content
  },
  /* alignment helpers to match welcome left inset */
  headingAligned: {
    marginLeft: 20,
  },
  subHeadingAligned: {
    marginLeft: 20,
  },
  preferencesHeadingInner: {
    marginLeft: 6,
  },
  preferencesSubtitleInner: {
    marginLeft: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  chipTextActive: {
    color: colors.card,
  },
  chipNoIcon: {
    paddingHorizontal: 16,
  },
  chipIconInline: {
    marginRight: 8,
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
