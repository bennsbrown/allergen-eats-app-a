
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  allergens: string[];
  price?: number;
  imageUrl?: string;
}

export interface AllergenFilter {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'dietary-needs' | 'preferences';
}

export const ALLERGEN_FILTERS: AllergenFilter[] = [
  // Dietary Needs (Allergens)
  {
    id: 'gluten',
    name: 'Gluten',
    icon: 'circle.slash',
    description: 'Free from wheat, barley, and rye',
    category: 'dietary-needs',
  },
  {
    id: 'crustaceans',
    name: 'Crustaceans',
    icon: 'fish.fill',
    description: 'Free from crustaceans',
    category: 'dietary-needs',
  },
  {
    id: 'eggs',
    name: 'Eggs',
    icon: 'circle.fill',
    description: 'Free from eggs and egg products',
    category: 'dietary-needs',
  },
  {
    id: 'fish',
    name: 'Fish',
    icon: 'fish',
    description: 'Free from fish',
    category: 'dietary-needs',
  },
  {
    id: 'peanuts',
    name: 'Peanuts',
    icon: 'circle.hexagongrid.fill',
    description: 'Free from peanuts',
    category: 'dietary-needs',
  },
  {
    id: 'soybeans',
    name: 'Soybeans',
    icon: 'square.fill',
    description: 'Free from soy and soy products',
    category: 'dietary-needs',
  },
  {
    id: 'milk',
    name: 'Milk',
    icon: 'drop.fill',
    description: 'Free from milk and milk products',
    category: 'dietary-needs',
  },
  {
    id: 'nuts',
    name: 'Nuts',
    icon: 'xmark.circle.fill',
    description: 'Free from all tree nuts',
    category: 'dietary-needs',
  },
  {
    id: 'celery',
    name: 'Celery',
    icon: 'leaf.fill',
    description: 'Free from celery',
    category: 'dietary-needs',
  },
  {
    id: 'mustard',
    name: 'Mustard',
    icon: 'circle.hexagongrid',
    description: 'Free from mustard',
    category: 'dietary-needs',
  },
  {
    id: 'sesame',
    name: 'Sesame seeds',
    icon: 'circle.grid.3x3.fill',
    description: 'Free from sesame seeds',
    category: 'dietary-needs',
  },
  {
    id: 'sulphites',
    name: 'Sulphur dioxide',
    icon: 'cloud.fill',
    description: 'Free from sulphur dioxide and sulphites',
    category: 'dietary-needs',
  },
  {
    id: 'lupin',
    name: 'Lupin',
    icon: 'sparkles',
    description: 'Free from lupin',
    category: 'dietary-needs',
  },
  {
    id: 'molluscs',
    name: 'Molluscs',
    icon: 'circle.hexagongrid.circle',
    description: 'Free from molluscs',
    category: 'dietary-needs',
  },
  // Preferences
  {
    id: 'vegan',
    name: 'Vegan',
    icon: 'heart.fill',
    description: 'Plant-based, no animal products',
    category: 'preferences',
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    icon: 'heart',
    description: 'No meat or fish',
    category: 'preferences',
  },
  {
    id: 'halal',
    name: 'Halal',
    icon: 'star.fill',
    description: 'Prepared according to Islamic law',
    category: 'preferences',
  },
  {
    id: 'kosher',
    name: 'Kosher',
    icon: 'star',
    description: 'Prepared according to Jewish dietary law',
    category: 'preferences',
  },
];

export const DIETARY_NEEDS_FILTERS = ALLERGEN_FILTERS.filter(
  f => f.category === 'dietary-needs'
);

export const PREFERENCES_FILTERS = ALLERGEN_FILTERS.filter(
  f => f.category === 'preferences'
);
