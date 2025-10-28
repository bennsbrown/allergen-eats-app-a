
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
}

export const ALLERGEN_FILTERS: AllergenFilter[] = [
  {
    id: 'nuts',
    name: 'No Nuts',
    icon: 'leaf.fill',
    description: 'Free from all tree nuts and peanuts',
  },
  {
    id: 'gluten',
    name: 'Gluten-Free',
    icon: 'circle.slash',
    description: 'Free from wheat, barley, and rye',
  },
  {
    id: 'dairy',
    name: 'Dairy-Free',
    icon: 'drop.fill',
    description: 'Free from milk and milk products',
  },
  {
    id: 'eggs',
    name: 'Egg-Free',
    icon: 'circle.fill',
    description: 'Free from eggs and egg products',
  },
  {
    id: 'soy',
    name: 'Soy-Free',
    icon: 'leaf',
    description: 'Free from soy and soy products',
  },
  {
    id: 'shellfish',
    name: 'No Shellfish',
    icon: 'fish.fill',
    description: 'Free from shellfish and crustaceans',
  },
  {
    id: 'vegan',
    name: 'Vegan',
    icon: 'heart.fill',
    description: 'Plant-based, no animal products',
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    icon: 'heart',
    description: 'No meat or fish',
  },
];
