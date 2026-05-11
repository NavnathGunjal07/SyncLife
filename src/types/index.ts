export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type Level = 'Beginner' | 'Intermediate' | 'Advanced';
export type WorkoutMode = 'Home' | 'Gym';
export type TransactionType = 'expense' | 'income';
export type GoldCategory = 'Jewellery' | 'Coins' | 'Digital Gold' | 'SIP';

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  type: MealType;
}

export interface MealLog {
  mealId: string;
  quantity: number;
  date: string;
  totalCalories: number;
  totalProtein: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  durationSec?: number;
  homeAlt?: string;
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

export interface GoldHolding {
  category: GoldCategory;
  totalGrams: number;
  avgBuyPrice: number;
  currentValue: number;
  pnl: number;
}

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

export interface DayLogs {
  meals: MealLog[];
  workouts: WorkoutLog[];
  water: WaterLog[];
  transactions: Transaction[];
  gold: GoldEntry[];
  profile: UserProfile;
  streak: number;
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

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
}

export interface QueuedWrite {
  id: string;
  type: 'meal' | 'workout' | 'water' | 'transaction' | 'gold' | 'summary';
  payload: MealLog | WorkoutLog | WaterLog | Transaction | GoldEntry | DailySummary;
  createdAt: string;
  attempts: number;
}

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignIn: undefined;
  SheetSetup: undefined;
  AppTabs: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Meals: undefined;
  Workout: undefined;
  Finance: undefined;
  Profile: undefined;
};
