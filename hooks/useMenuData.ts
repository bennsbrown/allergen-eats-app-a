
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

export function useFilteredMenu(menuItems: MenuItem[], selectedFilters: string[]) {
  return useMemo(() => {
    if (selectedFilters.length === 0) {
      return menuItems;
    }

    return menuItems.filter(item => {
      // Check if item is free from all selected allergens
      return selectedFilters.every(filter => {
        // Special cases for vegan and vegetarian
        if (filter === 'vegan') {
          return !item.allergens.includes('dairy') && 
                 !item.allergens.includes('eggs') &&
                 item.category !== 'Mains' || 
                 item.name.toLowerCase().includes('vegan') ||
                 item.name.toLowerCase().includes('buddha');
        }
        if (filter === 'vegetarian') {
          return item.category !== 'Mains' || 
                 !item.name.toLowerCase().includes('beef') &&
                 !item.name.toLowerCase().includes('chicken') &&
                 !item.name.toLowerCase().includes('salmon') &&
                 !item.name.toLowerCase().includes('shrimp');
        }
        // Check if item doesn't contain the allergen
        return !item.allergens.includes(filter);
      });
    });
  }, [menuItems, selectedFilters]);
}
