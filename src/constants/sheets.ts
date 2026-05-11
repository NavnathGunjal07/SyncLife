export const SHEET_HEADERS = {
  Calories: ['Date', 'Meal', 'Type', 'Qty', 'Calories', 'Protein'],
  Workout: ['Date', 'Day', 'Exercises', 'Duration (min)', 'Cal Burned', 'Completed'],
  Water: ['Date', 'Time', 'Amount (ml)', 'Daily Total (ml)', 'Goal (ml)'],
  Money: ['Date', 'Type', 'Category', 'Amount (₹)', 'Notes'],
  Gold: ['Date', 'Category', 'Grams', 'Buy Price (₹/g)', 'Total Cost', 'Current Value', 'P&L'],
  Daily_Summary: ['Date', 'Calories In', 'Calories Burned', 'Net Calories', 'Water', 'Water Goal', 'Spend', 'Workout Done', 'Streak', 'Completion %'],
  Goals: ['Updated At', 'Weight (kg)', 'Height (cm)', 'Fitness Goal', 'Calorie Target', 'Water Goal (ml)', 'Water Goal Mode', 'Monthly Budget'],
  Meal_Plans: ['Date', 'Breakfast', 'Lunch', 'Dinner', 'Snacks']
} as const;

export const SHEET_NAMES = Object.keys(SHEET_HEADERS) as Array<keyof typeof SHEET_HEADERS>;
