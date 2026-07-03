import { DietaryPreference, Meal, MealDiet } from '../types';

export const MEALS: Meal[] = [
  { id: '1', name: 'Poha', calories: 250, protein: 6, type: 'Breakfast', diet: 'veg' },
  { id: '2', name: 'Idli Sambar', calories: 300, protein: 8, type: 'Breakfast', diet: 'veg' },
  { id: '3', name: 'Upma', calories: 280, protein: 5, type: 'Breakfast', diet: 'veg' },
  { id: '4', name: 'Dal Rice', calories: 450, protein: 12, type: 'Lunch', diet: 'veg' },
  { id: '5', name: 'Paneer Curry + Roti', calories: 650, protein: 28, type: 'Lunch', diet: 'veg' },
  { id: '6', name: 'Chicken Curry + Rice', calories: 700, protein: 40, type: 'Dinner', diet: 'nonveg' },
  { id: '7', name: 'Khichdi', calories: 350, protein: 10, type: 'Dinner', diet: 'veg' },
  { id: '8', name: 'Banana', calories: 120, protein: 1, type: 'Snacks', diet: 'veg' },
  { id: '9', name: 'Peanut Chaat', calories: 200, protein: 9, type: 'Snacks', diet: 'veg' },
  { id: '10', name: 'Egg Bhurji + Toast', calories: 320, protein: 18, type: 'Breakfast', diet: 'egg' },
  { id: '11', name: 'Boiled Eggs (2)', calories: 150, protein: 12, type: 'Snacks', diet: 'egg' },
  { id: '12', name: 'Egg Curry + Rice', calories: 550, protein: 22, type: 'Dinner', diet: 'egg' },
  { id: '13', name: 'Grilled Chicken Salad', calories: 400, protein: 35, type: 'Lunch', diet: 'nonveg' },
  { id: '14', name: 'Fish Curry + Rice', calories: 600, protein: 34, type: 'Dinner', diet: 'nonveg' },
  { id: '15', name: 'Chicken Breast + Veggies', calories: 450, protein: 42, type: 'Lunch', diet: 'nonveg' }
];

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const;

export const DIETARY_PREFERENCES: { value: DietaryPreference; label: string }[] = [
  { value: 'veg', label: 'Veg' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'nonveg', label: 'Non-veg' },
  { value: 'vegan', label: 'Vegan' }
];

// Which meal `diet` tags a given preference is allowed to see. Vegan is treated
// like veg here since the catalog doesn't track dairy separately.
const DIET_ALLOWS: Record<DietaryPreference, MealDiet[]> = {
  veg: ['veg'],
  vegan: ['veg'],
  eggetarian: ['veg', 'egg'],
  nonveg: ['veg', 'egg', 'nonveg']
};

/** True when a meal of `diet` is allowed for someone with `preference`. */
export function dietAllows(preference: DietaryPreference, diet: MealDiet): boolean {
  // Fall back to the most permissive set if an unknown/undefined value slips
  // through (e.g. a legacy profile mid-hydration) rather than crashing.
  return (DIET_ALLOWS[preference] ?? DIET_ALLOWS.nonveg).includes(diet);
}

/** The catalog filtered down to what the user's dietary preference permits. */
export function mealsForPreference(preference: DietaryPreference): Meal[] {
  return MEALS.filter((meal) => dietAllows(preference, meal.diet));
}
