import React, { useEffect, useMemo, useState } from 'react';
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
import { DIETARY_NEEDS_FILTERS, PREFERENCES_FILTERS } from '@/types/allergen';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';

interface Business {
  id: number;
  name: string;
  unique_identifier?: string | null;
  qr_slug?: string | null;
}

// Raw shape returned by Supabase (with join tables)
type RawMenuItem = {
  id: number;
  name: string;
  category?: string | null;
  menu_item_allergens?: Array<{
    allergens?: { id: number; name: string } | null;
  }> | null;
  menu_item_preferences?: Array<{
    preferences?: { id: number; name: string } | null;
  }> | null;
};

// Flattened shape used by UI + filters
type MenuItem = {
  id: number;
  name: string;
  category?: string | null;
  allergens: string[];
  preferences: string[];
};

const token = (v: unknown) => String(v ?? '').toLowerCase().trim();
const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

function flattenItem(raw: RawMenuItem): MenuItem {
  const allergenRows = Array.isArray(raw.menu_item_allergens)
    ? raw.menu_item_allergens
    : [];

  const preferenceRows = Array.isArray(raw.menu_item_preferences)
    ? raw.menu_item_preferences
    : [];

  const allergens = allergenRows.map(x => token(x?.allergens?.name));
  const preferences = preferenceRows.map(x => token(x?.preferences?.name));

  return {
    id: raw.id,
    name: raw.name,
    category: raw.category ?? null,
    allergens: uniq(allergens),
    preferences: uniq(preferences),
  };
}


// Turn any thrown thing into a readable message
function toErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export default function HomeScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const prefIdSet = useMemo(() => new Set(PREFERENCES_FILTERS.map(f => token(f.id))), []);
  const allergenIdSet = useMemo(() => new Set(DIETARY_NEEDS_FILTERS.map(f => token(f.id))), []);

  const toggleFilter = (filterId: string) => {
    const id = token(filterId);
    setSelectedFilters(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const clearFilters = () => setSelectedFilters([]);

  useEffect(() => {
    let cancelled = false;

    const loadMenu = async () => {
      setLoading(true);
      setError(null);

      try {
        let effectiveCode = code;

        // DEV fallback: if no QR param, just load the first business
        if (!effectiveCode) {
          const { data: firstBusiness, error: firstBizErr } = await supabase
            .from('business')
            .select('id, name, unique_identifier, qr_slug')
            .limit(1)
            .maybeSingle<Business>();

          if (firstBizErr) {
            console.log('FIRST BUSINESS LOOKUP ERROR:', firstBizErr);
          }

          if (firstBusiness) {
            effectiveCode =
              firstBusiness.qr_slug ??
              firstBusiness.unique_identifier ??
              String(firstBusiness.id);
          }
        }

        if (!effectiveCode) {
          if (!cancelled) {
            setError('No menu code provided.');
            setItems([]);
            setBusinessName(null);
          }
          return;
        }

        // Business lookup: qr_slug first, then legacy unique_identifier
        let business: Business | null = null;

        const { data: bySlug, error: bySlugErr } = await supabase
          .from('business')
          .select('id, name, unique_identifier, qr_slug')
          .eq('qr_slug', effectiveCode)
          .maybeSingle<Business>();

        if (bySlugErr) console.log('BUSINESS LOOKUP (slug) ERROR:', bySlugErr);
        business = bySlug ?? null;

        if (!business) {
          const { data: byUnique, error: byUniqueErr } = await supabase
            .from('business')
            .select('id, name, unique_identifier, qr_slug')
            .eq('unique_identifier', effectiveCode)
            .maybeSingle<Business>();

          if (byUniqueErr) console.log('BUSINESS LOOKUP (unique_identifier) ERROR:', byUniqueErr);
          business = byUnique ?? null;
        }

        if (!business) {
          if (!cancelled) {
            setError('Menu link is invalid. Please check the QR code and try again.');
            setItems([]);
            setBusinessName(null);
          }
          return;
        }

        if (!cancelled) setBusinessName(business.name);

        // Fetch joined allergens + preferences via join tables
        const { data: rawItems, error: menuErr } = await supabase
          .from('menu_item')
          .select(
            `
            id,
            name,
            category,
            menu_item_allergens (
              allergens ( id, name )
            ),
            menu_item_preferences (
              preferences ( id, name )
            )
          `
          )
          .eq('business_id', business.id)
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (menuErr) {
          console.log('MENU QUERY ERROR (full):', menuErr);

          const msg =
            menuErr.message +
            (menuErr.details ? ` | details: ${menuErr.details}` : '') +
            (menuErr.hint ? ` | hint: ${menuErr.hint}` : '');

          if (!cancelled) {
            setError(`Failed to load menu items: ${msg}`);
            setItems([]);
          }
          return;
        }

        const flattened = ((rawItems as RawMenuItem[]) ?? []).map(flattenItem);
        if (!cancelled) setItems(flattened);
      } catch (e) {
        // THIS is what your screenshot is currently showing.
        // So make it display the actual error.
        console.log('LOAD MENU THREW:', e);

        if (!cancelled) {
          setError(`Failed to load menu: ${toErrorMessage(e)}`);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMenu();
    return () => {
      cancelled = true;
    };
  }, [code]);

  // Search first
  const searchFilteredItems = useMemo(() => {
    const q = token(searchQuery);
    if (!q) return items;

    return items.filter(it => {
      const name = token(it.name);
      const cat = token(it.category);
      return name.includes(q) || cat.includes(q);
    });
  }, [items, searchQuery]);

  // Then apply filters (multiple allowed)
  const filteredItems = useMemo(() => {
    const selectedPrefs = selectedFilters.filter(id => prefIdSet.has(id));
    const selectedAvoidAllergens = selectedFilters.filter(id => allergenIdSet.has(id));

    return searchFilteredItems.filter(item => {
      for (const a of selectedAvoidAllergens) {
        if (item.allergens.includes(a)) return false;
      }
      for (const p of selectedPrefs) {
        if (!item.preferences.includes(p)) return false;
      }
      return true;
    });
  }, [searchFilteredItems, selectedFilters, prefIdSet, allergenIdSet]);

  const renderHeaderRight = () => (
    <Pressable onPress={() => console.log('Info button pressed')} style={styles.headerButtonContainer}>
      <IconSymbol name="info.circle" color={colors.primary} />
    </Pressable>
  );

  const handleNavigateToTerms = () => {
    router.push('/terms-acceptance');
  };

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

  // Empty menu state (after load)
  if (items.length === 0) {
    const emptyMessage = error
      ? "We couldn't load this menu right now. Please try again."
      : "This restaurant hasn't added any menu items yet. Please check back later.";

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

            {error ? (
              <View style={styles.inlineError}>
                <IconSymbol name="exclamationmark.triangle.fill" color={colors.secondary} size={16} />
                <Text style={styles.inlineErrorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>{businessName || 'Restaurant'}</Text>
              <Text style={styles.welcomeText}>{emptyMessage}</Text>
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
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://i.postimg.cc/W1WRMMdY/eaze-06.jpg' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {error ? (
            <View style={styles.inlineError}>
              <IconSymbol name="exclamationmark.triangle.fill" color={colors.secondary} size={16} />
              <Text style={styles.inlineErrorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome to {businessName}!</Text>
            <Text style={styles.welcomeText}>
              Browse our menu below. Use the search bar to find specific dishes.
            </Text>
          </View>

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

          {selectedFilters.length > 0 ? (
            <Pressable onPress={clearFilters} style={{ alignSelf: 'flex-end', marginBottom: 10 }}>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>Clear filters</Text>
            </Pressable>
          ) : null}

          <View style={styles.preferencesCard}>
            <Text style={[styles.preferencesHeading, styles.preferencesHeadingInner]}>Preferences</Text>
            <Text style={[styles.preferencesSubtitle, styles.preferencesSubtitleInner]}>
              Select dietary preferences
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.preferencesRow}>
              {PREFERENCES_FILTERS.map(f => {
                const id = token(f.id);
                const active = selectedFilters.includes(id);
                return (
                  <Pressable
                    key={f.id}
                    style={({ pressed }) => [styles.chip, (active || pressed) && styles.chipActive]}
                    onPress={() => toggleFilter(id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {({ pressed }) => (
                      <>
                        <IconSymbol
                          name={f.icon as any}
                          color={active || pressed ? colors.card : colors.primary}
                          size={14}
                          style={styles.chipIconInline}
                        />
                        <Text style={[styles.chipText, (active || pressed) && styles.chipTextActive]}>
                          {f.name}
                        </Text>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.dietaryContainer}>
            <Text style={[styles.preferencesHeading, styles.headingAligned]}>Dietary Needs</Text>
            <Text style={[styles.preferencesSubtitleSmall, styles.subHeadingAligned]}>
              Select allergens to avoid
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dietaryRow}>
              {DIETARY_NEEDS_FILTERS.map(f => {
                const id = token(f.id);
                const active = selectedFilters.includes(id);
                return (
                  <Pressable
                    key={f.id}
                    style={({ pressed }) => [styles.chip, (active || pressed) && styles.chipActive, styles.chipNoIcon]}
                    onPress={() => toggleFilter(id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {({ pressed }) => (
                      <Text style={[styles.chipText, (active || pressed) && styles.chipTextActive]}>
                        {f.name}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{searchQuery ? 'Search Results' : 'Menu'}</Text>

            {filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="exclamationmark.triangle" color={colors.textSecondary} size={48} />
                <Text style={styles.emptyText}>No dishes match your search or selected filters</Text>
                <Text style={styles.emptySubtext}>Try a different search term or unselect a filter</Text>
              </View>
            ) : (
              <FlatList
                data={filteredItems}
                keyExtractor={item => String(item.id)}
                scrollEnabled={false}
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

                      {item.allergens.length > 0 ? (
                        <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
                          {item.allergens.map(a => {
                            const id = token(a);
                            const active = selectedFilters.includes(id);
                            return (
                              <Pressable
                                key={`${item.id}-${id}`}
                                onPress={() => toggleFilter(id)}
                                style={({ pressed }) => [
                                  styles.chip,
                                  (active || pressed) && styles.chipActive,
                                  styles.chipNoIcon,
                                ]}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                {({ pressed }) => (
                                  <Text style={[styles.chipText, (active || pressed) && styles.chipTextActive]}>
                                    {id.charAt(0).toUpperCase() + id.slice(1)}
                                  </Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  scrollContentWithTabBar: { paddingBottom: 100 },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingText: { fontSize: 16, color: colors.text, marginTop: 16, fontWeight: '600' },

  logoContainer: { alignItems: 'center', marginBottom: 20, paddingVertical: 12 },
  logoImage: { width: 240, height: 100 },

  welcomeSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 6 },
  welcomeText: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, fontWeight: '500' },

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
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '600' },

  menuSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 12, marginLeft: 20 },

  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  menuCardContent: { gap: 10 },
  menuItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  menuItemName: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1 },

  categoryBadge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  menuItemCategory: { fontSize: 10, color: colors.card, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 12, textAlign: 'center' },
  emptySubtext: { fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center', fontWeight: '500' },

  headerButtonContainer: { padding: 6 },

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
  // IMPORTANT: flex: 1 stops long errors being clipped on one line
  inlineErrorText: { color: colors.text, fontSize: 13, fontWeight: '600', flex: 1 },

  preferencesCard: {
    backgroundColor: colors.highlight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  preferencesHeading: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 6 },
  preferencesSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 10, fontWeight: '600' },
  preferencesSubtitleSmall: { fontSize: 12, color: colors.textSecondary, marginBottom: 10, fontWeight: '600' },

  preferencesRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 8, paddingLeft: 6, marginBottom: 8 },
  dietaryContainer: { marginBottom: 16 },
  dietaryRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 8, paddingLeft: 20 },

  headingAligned: { marginLeft: 20 },
  subHeadingAligned: { marginLeft: 20 },
  preferencesHeadingInner: { marginLeft: 6 },
  preferencesSubtitleInner: { marginLeft: 6 },

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
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.card },
  chipNoIcon: { paddingHorizontal: 16 },
  chipIconInline: { marginRight: 8 },

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
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  termsButtonText: { fontSize: 16, fontWeight: '800', color: colors.primary, flex: 1 },
});

