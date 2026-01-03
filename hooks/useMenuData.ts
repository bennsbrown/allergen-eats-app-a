
import { useState, useEffect, useMemo } from 'react';
import { MenuItem } from '@/types/allergen';
import { SAMPLE_MENU_DATA } from '@/data/sampleMenuData';

export function useMenuData() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data from Google Sheets
    // In production, this would fetch from Google Sheets API
    const loadData = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setMenuItems(SAMPLE_MENU_DATA);
      } catch (error) {
        console.log('Error loading menu data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { menuItems, loading };
}

export function useFilteredMenu(menuItems: MenuItem[], selectedFilters: string[], debug = false) {
  return useMemo(() => {
    if (selectedFilters.length === 0) {
      return menuItems;
    }

    if (debug) {
      try {
        console.groupCollapsed('useFilteredMenu debug');
        console.log('selectedFilters:', selectedFilters);
        console.log('menuItems count:', menuItems?.length ?? 0);
        const missingName = (menuItems || []).filter(i => !i || !i.name).map(i => i?.id ?? '<no-id>');
        const missingAllergens = (menuItems || []).filter(i => !Array.isArray(i.allergens)).map(i => i?.id ?? '<no-id>');
        if (missingName.length) console.warn('Items missing name:', missingName);
        if (missingAllergens.length) console.warn('Items with missing or invalid `allergens` array:', missingAllergens);
      } catch (err) {
        console.warn('Debug logging error in useFilteredMenu:', err);
      } finally {
        console.groupEnd();
      }
    }

    return menuItems.filter(item => {
      // Check if item is free from all selected allergens
      return selectedFilters.every(filter => {
        // Defensive accessors — some items (from Supabase) may not include `allergens` or `name`
        const name = (item?.name || '').toString().toLowerCase();
        const allergens = (Array.isArray(item?.allergens) ? item.allergens : []).map(a => (a || '').toString().toLowerCase());
        const fid = (filter || '').toString().toLowerCase();

        // Special cases for dietary preferences
        if (fid === 'vegan') {
          // Vegan: no animal products (milk, eggs, fish, crustaceans, molluscs)
          return !allergens.includes('milk') &&
                 !allergens.includes('eggs') &&
                 !allergens.includes('fish') &&
                 !allergens.includes('crustaceans') &&
                 !allergens.includes('molluscs') &&
                 !name.includes('beef') &&
                 !name.includes('chicken') &&
                 !name.includes('salmon') &&
                 !name.includes('shrimp') &&
                 !name.includes('oyster');
        }

        if (fid === 'vegetarian') {
          // Vegetarian: no meat or fish, but dairy and eggs are okay
          return !allergens.includes('fish') &&
                 !allergens.includes('crustaceans') &&
                 !allergens.includes('molluscs') &&
                 !name.includes('beef') &&
                 !name.includes('chicken') &&
                 !name.includes('salmon') &&
                 !name.includes('shrimp') &&
                 !name.includes('oyster');
        }

        if (fid === 'halal') {
          // Halal: crude heuristics — no pork, bacon, or ham
          return !name.includes('pork') &&
                 !name.includes('bacon') &&
                 !name.includes('ham');
        }

        if (fid === 'kosher') {
          // Kosher: crude heuristics — no pork, bacon, ham, shellfish
          return !name.includes('pork') &&
                 !name.includes('bacon') &&
                 !name.includes('ham') &&
                 !allergens.includes('crustaceans') &&
                 !allergens.includes('molluscs');
        }

        // For regular allergen filters, check if item doesn't contain the allergen
        const result = !allergens.includes(fid);
        if (debug) {
          // Log decision for this item/filter pair (sparse to avoid huge logs)
          try {
            console.log(`filter:${fid} item:${item?.id ?? '<no-id>'} -> allowed: ${result}`);
          } catch (e) {
            // ignore
          }
        }
        return result;
      });
    });
  }, [menuItems, selectedFilters]);
}
