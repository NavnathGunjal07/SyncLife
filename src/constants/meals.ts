import { Meal } from '../types';

export const MEALS: Meal[] = [
  { id: '1', name: 'Poha', calories: 250, protein: 6, type: 'Breakfast' },
  { id: '2', name: 'Idli Sambar', calories: 300, protein: 8, type: 'Breakfast' },
  { id: '3', name: 'Upma', calories: 280, protein: 5, type: 'Breakfast' },
  { id: '4', name: 'Dal Rice', calories: 450, protein: 12, type: 'Lunch' },
  { id: '5', name: 'Paneer Curry + Roti', calories: 650, protein: 28, type: 'Lunch' },
  { id: '6', name: 'Chicken Curry + Rice', calories: 700, protein: 40, type: 'Dinner' },
  { id: '7', name: 'Khichdi', calories: 350, protein: 10, type: 'Dinner' },
  { id: '8', name: 'Banana', calories: 120, protein: 1, type: 'Snacks' },
  { id: '9', name: 'Peanut Chaat', calories: 200, protein: 9, type: 'Snacks' }
];

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const;
