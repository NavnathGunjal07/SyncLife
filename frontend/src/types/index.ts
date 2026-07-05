export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type Level = 'Beginner' | 'Intermediate' | 'Advanced';
export type WorkoutMode = 'Home' | 'Gym';
// A muscle-group / training focus the user can pick for a session.
export type WorkoutFocus = 'Push' | 'Pull' | 'Legs' | 'Shoulders & Core' | 'Full Body' | 'Cardio';
export type TransactionType = 'expense' | 'income';
export type GoldCategory = 'Jewellery' | 'Coins' | 'Digital Gold' | 'SIP';

// What a catalog meal contains. The user's DietaryPreference decides which of
// these tags they're shown (see mealsForPreference).
export type MealDiet = 'veg' | 'egg' | 'nonveg';
export type DietaryPreference = 'veg' | 'eggetarian' | 'nonveg' | 'vegan';

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  type: MealType;
  diet: MealDiet;
}

export interface MealLog {
  mealId: string;
  quantity: number;
  date: string;
  totalCalories: number;
  totalProtein: number;
}

// AI-parsed free-text meal, before the user confirms/saves it.
export interface ParsedMeal {
  name: string;
  mealType: string;
  calories: number;
  protein: number;
  quantity: number;
  estimated: boolean;
}

// A persisted meal row (includes name/type) for the History view.
export interface MealHistoryItem {
  id: string;
  mealName: string;
  mealType: string;
  quantity: number;
  totalCalories: number;
  totalProtein: number;
  date: string;
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
  // Meal + workout customization.
  dietaryPreference: DietaryPreference;
  avoidFoods: string;
  workoutMode: WorkoutMode;
  workoutLevel: Level;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
}

// ─── Habit tracker ────────────────────────────────────────────────────────────

export type HabitSource = 'manual' | 'water' | 'meals' | 'workout' | 'sleep' | 'walking';

export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  source: HabitSource;
  /** Day-of-month numbers completed this month (from the server, auto-derived). */
  days: number[];
}

export interface HabitMonth {
  month: string; // YYYY-MM
  daysInMonth: number;
  habits: Habit[];
}

export interface QueuedWrite {
  id: string;
  type: 'meal' | 'workout' | 'water' | 'transaction' | 'gold' | 'summary' | 'goals';
  payload: MealLog | WorkoutLog | WaterLog | Transaction | GoldEntry | DailySummary;
  createdAt: string;
  attempts: number;
}

export type MotivationType = 'gym' | 'work' | 'reminder' | 'sleep';

/** Built-in coach-call ringtones (bundled WAVs in assets/sounds). */
export type Ringtone = 'classic' | 'gentle' | 'digital';

export interface MotivationAlarm {
  id: string;
  type: MotivationType;
  hour: number;
  minute: number;
  enabled: boolean;
}

// ─── AI Assistant chat ──────────────────────────────────────────────────────

export type ChatCard =
  | { type: 'meal_logged'; name: string; mealType: string; calories: number; protein: number; quantity: number }
  | { type: 'exercise'; name: string; detail: string }
  | { type: 'workout_complete'; exercises: string[]; caloriesBurned: number; durationMin: number }
  | { type: 'water_logged'; amountMl: number; totalMl: number }
  | { type: 'transaction'; txType: string; category: string; amount: number }
  | { type: 'gold'; category: string; grams: number; buyPrice: number }
  | { type: 'profile_updated'; fields: Record<string, unknown> }
  | { type: 'plan'; bmi: number; goal: string; fastingPlan: string; summary: string }
  | { type: 'memory_prompt'; id: string; content: string };

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  cards: ChatCard[];
  options: string[];
  /** Client-only proactive greeting; shown on open, not persisted to the DB. */
  ephemeral?: boolean;
}

export interface ChatTurnResult {
  message: string;
  cards: ChatCard[];
  options: string[];
  refresh: string[];
}

export interface ChatSession {
  setupComplete: boolean;
  message: string;
  options: string[];
  cards: ChatCard[];
}

export interface SavedMemory {
  id: string;
  content: string;
  category: string;
  frequency: number;
}

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  AppTabs: undefined;
  MotivationCall: { alarmType: MotivationType; notificationId?: string };
};

export type AppTabParamList = {
  Home: undefined;
  Meals: undefined;
  Assistant: undefined;
  Workout: undefined;
  Profile: undefined;
};
