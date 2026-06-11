// ─── Domain Types ────────────────────────────────────────────────────────────

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type Level = 'Beginner' | 'Intermediate' | 'Advanced';
export type WorkoutMode = 'Home' | 'Gym';
export type TransactionType = 'expense' | 'income';
export type GoldCategory = 'Jewellery' | 'Coins' | 'Digital Gold' | 'SIP';

// ─── Log Payloads ─────────────────────────────────────────────────────────────

export interface MealLog {
  mealId: string;
  quantity: number;
  date: string;
  totalCalories: number;
  totalProtein: number;
}

export interface WorkoutLog {
  date: string;
  day: WeekDay;
  exercises: string[];
  durationMin: number;
  caloriesBurned: number;
  completed: boolean;
}

export interface WaterLog {
  date: string;
  time: string;
  amountMl: number;
  dailyTotalMl?: number;
  goalMl?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  notes: string;
  date: string;
}

export interface GoldEntry {
  id: string;
  category: GoldCategory;
  grams: number;
  buyPrice: number;
  date: string;
}

// ─── Summary & Profile ────────────────────────────────────────────────────────

export interface DailySummary {
  date: string;
  caloriesConsumed: number;
  caloriesBurned: number;
  netCalories: number;
  waterMl: number;
  waterGoalMl: number;
  spend: number;
  workoutCompleted: boolean;
  streak: number;
  completionPercent: number;
}

export interface UserProfile {
  weightKg: number;
  heightCm: number;
  fitnessGoal: 'Lose weight' | 'Maintain' | 'Build muscle';
  calorieTarget: number;
  waterGoalMl: number;
  waterGoalMode: 'auto' | 'manual';
  monthlyBudget: number;
}

// ─── Queue ────────────────────────────────────────────────────────────────────

export interface QueuedWrite {
  id: string;
  type: 'meal' | 'workout' | 'water' | 'transaction' | 'gold' | 'summary' | 'goals';
  payload: MealLog | WorkoutLog | WaterLog | Transaction | GoldEntry | DailySummary;
  createdAt: string;
  attempts: number;
}

// ─── Sheet names ──────────────────────────────────────────────────────────────

export type SheetName =
  | 'Calories'
  | 'Workout'
  | 'Water'
  | 'Money'
  | 'Gold'
  | 'Daily_Summary'
  | 'Goals'
  | 'Meal_Plans';
