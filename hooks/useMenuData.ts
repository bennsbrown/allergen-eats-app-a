
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
        // Special cases for dietary preferences
        if (filter === 'vegan') {
          // Vegan: no animal products (milk, eggs, fish, crustaceans, molluscs)
          return !item.allergens.includes('milk') && 
                 !item.allergens.includes('eggs') &&
                 !item.allergens.includes('fish') &&
                 !item.allergens.includes('crustaceans') &&
                 !item.allergens.includes('molluscs') &&
                 !item.name.toLowerCase().includes('beef') &&
                 !item.name.toLowerCase().includes('chicken') &&
                 !item.name.toLowerCase().includes('salmon') &&
                 !item.name.toLowerCase().includes('shrimp') &&
                 !item.name.toLowerCase().includes('oyster');
        }
        
        if (filter === 'vegetarian') {
          // Vegetarian: no meat or fish, but dairy and eggs are okay
          return !item.allergens.includes('fish') &&
                 !item.allergens.includes('crustaceans') &&
                 !item.allergens.includes('molluscs') &&
                 !item.name.toLowerCase().includes('beef') &&
                 !item.name.toLowerCase().includes('chicken') &&
                 !item.name.toLowerCase().includes('salmon') &&
                 !item.name.toLowerCase().includes('shrimp') &&
                 !item.name.toLowerCase().includes('oyster');
        }
        
        if (filter === 'halal') {
          // Halal: no pork, alcohol, or non-halal meat
          // For this demo, we'll assume all meat is halal-prepared
          // In production, this would be marked in the data
          return !item.name.toLowerCase().includes('pork') &&
                 !item.name.toLowerCase().includes('bacon') &&
                 !item.name.toLowerCase().includes('ham');
        }
        
        if (filter === 'kosher') {
          // Kosher: no pork, shellfish, or mixing meat and dairy
          // For this demo, we'll check for obvious non-kosher items
          return !item.name.toLowerCase().includes('pork') &&
                 !item.name.toLowerCase().includes('bacon') &&
                 !item.name.toLowerCase().includes('ham') &&
                 !item.allergens.includes('crustaceans') &&
                 !item.allergens.includes('molluscs');
        }
        
        // For regular allergen filters, check if item doesn't contain the allergen
        return !item.allergens.includes(filter);
      });
    });
  }, [menuItems, selectedFilters]);
}
