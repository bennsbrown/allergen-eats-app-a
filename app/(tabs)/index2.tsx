import React, { useEffect, useMemo, useState } from 'react';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { DIETARY_NEEDS_FILTERS, PREFERENCES_FILTERS } from '@/types/allergen';

interface Business {
  id: number;
  name: string;
  unique_identifier?: string | null;
  qr_slug?: string | null;
}

/**
 * Supabase returns nested relation objects for join tables.
 * We flatten them into simple arrays for easy filtering & display.
 */
type RawMenuItem = {
  id: number;
  name: string;
  category?: string | null;

  menu_item_allergens?: Array<{
    allergens?: {
      id: number;
      name: string;
    } | null;
  }> | null;

  menu_item_preferences?: Array<{
    preferences?: {
      id: number;
      name: string;
    } | null;
  }> | null;
};

type MenuItem = {
  id: number;
  name: string;
  category?: string | null;
  allergens: string[]; // lowercased names
  preferences: string[]; // lowercased names
};

function toToken(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .trim();
}

function uniqueTokens(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

function flattenMenuItem(raw: RawMenuItem): MenuItem {
  const allergens =
    raw.menu_item_allergens?.map(x => toToken(x?.allergens?.name)) ?? [];
  const preferences =
    raw.menu_item_preferences?.map(x => toToken(x?.preferences?.name)) ?? [];

  return {
    id: raw.id,
    name: raw.name,
    category: raw.category ?? null,
    allergens: uniqueTokens(allergens),
    preferences: uniqueTokens(preferences),
  };
}

export default function IndexScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState<string>('Allergen Menu');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Build sets so we can tell which selected filters are "preferences" vs "allergens to avoid"
  const preferenceFilterIdSet = useMemo(
    () => new Set(PREFERENCES_FILTERS.map(f => toToken(f.id))),
    []
  );
  const dietaryFilterIdSet = useMemo(
    () => new Set(DIETARY_NEEDS_FILTERS.map(f => toToken(f.id))),
    []
  );

  // Optional: help map filter IDs to display names (if needed later)
  const preferenceNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of PREFERENCES_FILTERS) m.set(toToken(f.id), f.name);
    return m;
  }, []);
  const dietaryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of DIETARY_NEEDS_FILTERS) m.set(toToken(f.id), f.name);
    return m;
  }, []);

  const toggleFilter = (id: string) => {
    const token = toToken(id);
    setSelectedFilters(prev =>
      prev.includes(token) ? prev.filter(x => x !== token) : [...prev, token]
    );
  };

  const clearFilters = () => setSelectedFilters([]);

  const headerRight = () => (
    <Pressable onPress={() => console.log('Info pressed')} style={{ padding: 6 }}>
      <IconSymbol name="info.circle" color={colors.primary} />
    </Pressable>
  );

  const goToTerms = () => router.push('/terms-acceptance');

  // ============ LOAD DATA (QR -> business -> menu) ============
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) Determine effective code
        let effectiveCode = code;

        // DEV fallback: if no code, show first business.
        // (You may remove this in production so invalid links don't show random menus.)
        if (!effectiveCode) {
          const { data: firstBusiness } = await supabase
            .from('business')
            .select('id, name, unique_identifier, qr_slug')
            .limit(1)
            .maybeSingle<Business>();

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
          }
          return;
        }

        // 2) Fetch business by qr_slug, then by unique_identifier (legacy)
        let business: Business | null = null;

        const { data: bySlug } = await supabase
          .from('business')
          .select('id, name, unique_identifier, qr_slug')
          .eq('qr_slug', effectiveCode)
          .maybeSingle<Business>();

        if (bySlug) business = bySlug;

        if (!business) {
          const { data: byUnique } = await supabase
            .from('business')
            .select('id, name, unique_identifier, qr_slug')
            .eq('unique_identifier', effectiveCode)
            .maybeSingle<Business>();

          if (byUnique) business = byUnique;
        }

        if (!business) {
          if (!cancelled) {
            setError('Menu link is invalid. Please check the QR code and try again.');
            setItems([]);
          }
          return;
        }

        if (!cancelled) setBusinessName(business.name);

        // 3) Fetch menu items WITH allergens & preferences via join tables
        // This is the key fix based on your schema.
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
          if (!cancelled) {
            setError('Failed to load menu items.');
            setItems([]);
          }
          return;
        }

        const flattened = (rawItems as RawMenuItem[] | null)?.map(flattenMenuItem) ?? [];

        if (!cancelled) {
          setItems(flattened);
        }
      } catch (e) {
        console.warn('Load error:', e);
        if (!cancelled) {
          setError('Failed to load menu. Please try again later.');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  // ============ FILTERING ============
  const filteredItems = useMemo(() => {
    const q = toToken(searchQuery);

    // Split selected filters into preference filters vs allergen-avoid filters
    const selectedPreferences = selectedFilters.filter(id => preferenceFilterIdSet.has(id));
    const selectedAvoidAllergens = selectedFilters.filter(id => dietaryFilterIdSet.has(id));

    return items.filter(item => {
      // Search
      if (q) {
        const nameMatch = toToken(item.name).includes(q);
        const catMatch = toToken(item.category).includes(q);
        if (!nameMatch && !catMatch) return false;
      }

      // Allergens to avoid = EXCLUDE if item contains any selected allergen
      // (If user selects "milk", hide items containing milk)
      for (const a of selectedAvoidAllergens) {
        if (item.allergens.includes(a)) return false;
      }

      // Preferences = INCLUDE only if item matches ALL selected preferences
      // (If user selects Vegan + Halal, require both tags on the item)
      for (const p of selectedPreferences) {
        if (!item.preferences.includes(p)) return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedFilters, preferenceFilterIdSet, dietaryFilterIdSet]);

  // ============ UI ============
  if (loading) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen options={{ title: 'Allergen Menu', headerRight }} />
        )}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </>
    );
  }

  const ListHeader = (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen options={{ title: businessName, headerRight }} />
      )}

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
          Browse the menu. Use search and filters to find what suits you.
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

      {/* Preferences filters */}
      <View style={styles.filtersCard}>
        <View style={styles.filtersTopRow}>
          <Text style={styles.filtersTitle}>Preferences</Text>
          {selectedFilters.length > 0 ? (
            <Pressable onPress={clearFilters} hitSlop={10}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.filtersSubtitle}>Select dietary preferences</Text>

        <View style={styles.horizontalRow}>
          {PREFERENCES_FILTERS.map(f => {
            const id = toToken(f.id);
            const active = selectedFilters.includes(id);

            return (
              <Pressable
                key={f.id}
                onPress={() => toggleFilter(id)}
                style={({ pressed }) => [styles.chip, (active || pressed) && styles.chipActive]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {({ pressed }) => (
                  <>
                    <IconSymbol
                      name={f.icon as any}
                      color={active || pressed ? colors.card : colors.primary}
                      size={14}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.chipText, (active || pressed) && styles.chipTextActive]}>
                      {f.name}
                    </Text>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Dietary needs (allergens to avoid) */}
      <View style={{ marginBottom: 10 }}>
        <Text style={styles.sectionTitle}>Dietary Needs</Text>
        <Text style={styles.sectionSubtitle}>Select allergens to avoid</Text>

        <View style={[styles.horizontalRow, { paddingLeft: 16 }]}>
          {DIETARY_NEEDS_FILTERS.map(f => {
            const id = toToken(f.id);
            const active = selectedFilters.includes(id);

            return (
              <Pressable
                key={f.id}
                onPress={() => toggleFilter(id)}
                style={({ pressed }) => [
                  styles.chip,
                  (active || pressed) && styles.chipActive,
                  { paddingHorizontal: 16 },
                ]}
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
        </View>
      </View>

      <Text style={styles.menuHeading}>{searchQuery ? 'Search Results' : 'Menu'}</Text>
    </>
  );

  const ListFooter = (
    <>
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>About This Menu</Text>
        <Text style={styles.infoText}>• Use search to quickly find dishes</Text>
        <Text style={styles.infoText}>• Menu items are provided by {businessName}</Text>
        <Text style={styles.infoText}>• For allergen advice, please ask your server</Text>
      </View>

      <Pressable style={styles.termsButton} onPress={goToTerms}>
        <IconSymbol name="doc.text.fill" color={colors.primary} size={20} />
        <Text style={styles.termsButtonText}>Terms & Conditions</Text>
        <IconSymbol name="chevron.right" color={colors.primary} size={18} />
      </Pressable>

      <View style={{ height: 24 }} />
    </>
  );

  // Empty menu (no items at all)
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        {ListHeader}
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{businessName}</Text>
          <Text style={styles.emptyText}>
            This restaurant hasn’t added any menu items yet. Please check back later.
          </Text>
        </View>
        {ListFooter}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => {
          return (
            <View style={styles.menuCard}>
              <View style={styles.menuItemHeader}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                {item.category ? (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.menuItemCategory}>{toToken(item.category).toUpperCase()}</Text>
                  </View>
                ) : null}
              </View>

              {/* Preferences tags (optional to display) */}
              {item.preferences.length > 0 ? (
                <View style={styles.tagWrap}>
                  {item.preferences.map(p => (
                    <View key={`${item.id}-pref-${p}`} style={styles.tagPill}>
                      <Text style={styles.tagText}>
                        {preferenceNameById.get(p) ?? p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Allergen chips (tappable: they toggle allergen filters) */}
              {item.allergens.length > 0 ? (
                <View style={styles.allergenWrap}>
                  {item.allergens.map(a => {
                    const active = selectedFilters.includes(a);

                    // If your allergen names don’t match DIETARY_NEEDS_FILTERS ids exactly,
                    // you’ll want to map them. For now this assumes they match (e.g. "milk", "gluten").
                    const label = dietaryNameById.get(a) ?? a.charAt(0).toUpperCase() + a.slice(1);

                    return (
                      <Pressable
                        key={`${item.id}-alg-${a}`}
                        onPress={() => toggleFilter(a)}
                        style={({ pressed }) => [
                          styles.chip,
                          (active || pressed) && styles.chipActive,
                          { paddingHorizontal: 16 },
                        ]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {({ pressed }) => (
                          <Text style={[styles.chipText, (active || pressed) && styles.chipTextActive]}>
                            {label}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyText}>Try removing a filter or changing your search.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.text },

  logoContainer: { alignItems: 'center', paddingVertical: 12, marginBottom: 6 },
  logoImage: { width: 240, height: 100 },

  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  inlineErrorText: { color: colors.text, fontSize: 13, fontWeight: '600', flex: 1 },

  welcomeSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  welcomeTitle: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 6 },
  welcomeText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary, lineHeight: 22 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.accent,
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },

  filtersCard: {
    backgroundColor: colors.highlight,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  filtersTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filtersTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  clearText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  filtersSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 6, marginBottom: 10, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginLeft: 16, marginBottom: 6 },
  sectionSubtitle: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginLeft: 16, marginBottom: 10 },

  horizontalRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },

  menuHeading: { fontSize: 20, fontWeight: '800', color: colors.text, marginLeft: 16, marginBottom: 10, marginTop: 6 },

  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  menuItemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  menuItemName: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1 },
  categoryBadge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  menuItemCategory: { fontSize: 10, color: colors.card, fontWeight: '800', letterSpacing: 0.5 },

  tagWrap: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap' },
  tagPill: {
    backgroundColor: colors.highlight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  tagText: { fontSize: 12, fontWeight: '700', color: colors.text },

  allergenWrap: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap' },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.card },

  infoSection: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  infoTitle: { fontSize: 18, fontWeight: '800', color: colors.card, marginBottom: 14 },
  infoText: { fontSize: 14, fontWeight: '500', color: colors.card, lineHeight: 20 },

  termsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
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

  emptyWrap: { padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
  emptyText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
