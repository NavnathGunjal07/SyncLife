/**
 * SyncLife AI Assistant — Groq tool-calling chat engine.
 *
 * Free-text → context-rich system prompt + tool schemas → Groq decides which
 * tools to run → we execute them against the DB (zod-validated) → loop tool
 * results back to the model for a final spoken reply. The model can also call
 * `ask_user` to present tappable option chips (Claude-style multiple choice).
 *
 * Robustness rules: every tool's args are zod-validated before any write; the
 * tool loop is capped; any Groq/tool failure degrades to a plain text reply.
 */
import { z } from 'zod';

import { getRandomQuote, getRandomQuotes } from '../constants/quotes.js';
import {
  createMealLog,
  createWorkoutLog,
  createWaterLog,
  createTransaction,
  createGoldEntry,
  patchUserProfile,
  proposeMemory,
  getUserProfile,
  getSavedMemories,
  getTodayTotals,
  getWorkoutHistory,
  createChatMessage,
  getRecentChatMessages
} from './dbService.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
const MAX_TOOL_ITERATIONS = 3;

// ─── Small server-side catalogs (kept tiny; the rich exercise GIF library lives
// on the client and is resolved there by name) ───────────────────────────────

const MEAL_CATALOG = [
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

// Canonical exercise names the client can render a GIF for (keys of the client
// EXERCISE_LIBRARY). The model is told to use these names with show_exercise.
const EXERCISE_NAMES = [
  'pushups', 'bench press', 'chest fly', 'tricep pushdown', 'pullups', 'barbell row',
  'lat pulldown', 'bicep curl', 'squats', 'leg press', 'lunges', 'calf raises',
  'shoulder press', 'lateral raise', 'plank', 'crunches', 'full body hiit', 'running',
  'cycling', 'stretching', 'decline pushups', 'chair dips'
];

const MET_VALUES: Record<string, number> = {
  running: 9.8, cycling: 7.5, hiit: 8, squat: 5, plank: 3.3, stretch: 2.3, default: 5.5
};

function estimateCaloriesBurned(exercises: string[], durationMin: number, weightKg: number): number {
  if (durationMin <= 0 || exercises.length === 0 || weightKg <= 0) return 0;
  const avgMet =
    exercises.reduce((sum, name) => {
      const key = Object.keys(MET_VALUES).find((k) => name.toLowerCase().includes(k));
      return sum + (key ? MET_VALUES[key] ?? 5.5 : 5.5);
    }, 0) / exercises.length;
  return Math.round(((avgMet * 3.5 * weightKg) / 200) * durationMin);
}

function weekdayName(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
}

// ─── Card contract (rendered by the client) ──────────────────────────────────

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

export interface ChatTurnResult {
  message: string;
  cards: ChatCard[];
  options: string[];
  refresh: string[];
}

// ─── Tool schemas (Groq / OpenAI function-calling format) ─────────────────────

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'ask_user',
      description:
        'Present the user a short question with 2-4 tappable options when you need a choice or confirmation before acting. Use this instead of asking in free text when options are discrete.',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 }
        },
        required: ['question', 'options']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'log_meal',
      description: 'Log a meal the user ate. Use catalog calories when the meal matches; otherwise pass your best estimate.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          mealType: { type: 'string', enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] },
          calories: { type: 'number' },
          protein: { type: 'number' },
          quantity: { type: 'number', description: 'servings, default 1' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggest_meals',
      description: 'Suggest meals from the catalog, optionally filtered by type and a calorie ceiling. Read-only.',
      parameters: {
        type: 'object',
        properties: {
          mealType: { type: 'string', enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] },
          maxCalories: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'mark_workout_complete',
      description: "Mark today's workout complete. Pass the exercises the user actually did if known.",
      parameters: {
        type: 'object',
        properties: {
          exercises: { type: 'array', items: { type: 'string' } },
          durationMin: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'show_exercise',
      description: `Show an exercise demo card (animated GIF + how-to) to the user. name must be one of: ${EXERCISE_NAMES.join(', ')}.`,
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          detail: { type: 'string', description: 'e.g. "3 sets x 12 reps"' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_water',
      description: 'Log water intake in millilitres.',
      parameters: {
        type: 'object',
        properties: { amountMl: { type: 'number' } },
        required: ['amountMl']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_transaction',
      description: 'Record a finance transaction (expense or income).',
      parameters: {
        type: 'object',
        properties: {
          txType: { type: 'string', enum: ['expense', 'income'] },
          category: { type: 'string' },
          amount: { type: 'number' },
          notes: { type: 'string' }
        },
        required: ['txType', 'category', 'amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_gold',
      description: 'Record a gold investment entry.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['Jewellery', 'Coins', 'Digital Gold', 'SIP'] },
          grams: { type: 'number' },
          buyPrice: { type: 'number', description: 'price per gram' }
        },
        required: ['category', 'grams', 'buyPrice']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_profile',
      description: 'Update profile/goal fields the user mentions.',
      parameters: {
        type: 'object',
        properties: {
          weightKg: { type: 'number' },
          heightCm: { type: 'number' },
          fitnessGoal: { type: 'string', enum: ['Lose weight', 'Maintain', 'Build muscle'] },
          calorieTarget: { type: 'number' },
          waterGoalMl: { type: 'number' },
          monthlyBudget: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_routine',
      description: 'Set daily routine times (24h "HH:MM"). Any subset.',
      parameters: {
        type: 'object',
        properties: {
          sleepTime: { type: 'string' },
          gymTime: { type: 'string' },
          runningTime: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_fasting_plan',
      description: 'Set an intermittent-fasting plan, e.g. "16:8", "18:6", or "none".',
      parameters: {
        type: 'object',
        properties: { plan: { type: 'string' } },
        required: ['plan']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'recommend_plan_from_bmi',
      description:
        'Compute BMI from weight+height, derive the fitness goal and a fasting plan, persist them, and return a plan summary. Use during setup once you have weight and height.',
      parameters: {
        type: 'object',
        properties: {
          weightKg: { type: 'number' },
          heightCm: { type: 'number' }
        },
        required: ['weightKg', 'heightCm']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'propose_memory',
      description:
        'Remember a durable fact/preference about the user (e.g. "is vegetarian", "runs at 6am"). Frequent facts auto-save; new ones ask the user to confirm. Do NOT use for one-off logs.',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          category: { type: 'string' }
        },
        required: ['content']
      }
    }
  }
];

// ─── Tool executors (zod-validated) ───────────────────────────────────────────

type ExecResult = { result: unknown; card?: ChatCard; refresh?: string; terminal?: { question: string; options: string[] } };

async function executeTool(userId: string, name: string, args: unknown, date: string): Promise<ExecResult> {
  switch (name) {
    case 'ask_user': {
      const a = z.object({ question: z.string(), options: z.array(z.string()).min(1).max(4) }).parse(args);
      return { result: { presented: true }, terminal: { question: a.question, options: a.options } };
    }

    case 'log_meal': {
      const a = z
        .object({
          name: z.string().min(1),
          mealType: z.string().optional(),
          calories: z.number().nonnegative().optional(),
          protein: z.number().nonnegative().optional(),
          quantity: z.number().positive().optional()
        })
        .parse(args);
      const match = MEAL_CATALOG.find((m) => m.name.toLowerCase() === a.name.toLowerCase());
      const quantity = a.quantity ?? 1;
      const calories = Math.round((a.calories ?? match?.calories ?? 0) * quantity);
      const protein = Math.round((a.protein ?? match?.protein ?? 0) * quantity);
      const mealType = a.mealType ?? match?.type ?? '';
      await createMealLog(userId, {
        mealId: match?.id ?? 'custom',
        mealName: match?.name ?? a.name,
        mealType,
        quantity,
        date,
        totalCalories: calories,
        totalProtein: protein
      });
      return {
        result: { logged: true, name: match?.name ?? a.name, calories, protein },
        card: { type: 'meal_logged', name: match?.name ?? a.name, mealType, calories, protein, quantity },
        refresh: 'meals'
      };
    }

    case 'suggest_meals': {
      const a = z.object({ mealType: z.string().optional(), maxCalories: z.number().optional() }).parse(args);
      let list = MEAL_CATALOG;
      if (a.mealType) list = list.filter((m) => m.type.toLowerCase() === a.mealType!.toLowerCase());
      if (a.maxCalories) list = list.filter((m) => m.calories <= a.maxCalories!);
      list = [...list].sort((x, y) => y.protein - x.protein).slice(0, 5);
      return { result: { suggestions: list } };
    }

    case 'mark_workout_complete': {
      const a = z.object({ exercises: z.array(z.string()).optional(), durationMin: z.number().positive().optional() }).parse(args);
      const profile = await getUserProfile(userId);
      const exercises = a.exercises?.length ? a.exercises : ['full body workout'];
      const durationMin = a.durationMin ?? 30;
      const caloriesBurned = estimateCaloriesBurned(exercises, durationMin, profile?.weightKg ?? 70);
      await createWorkoutLog(userId, {
        date,
        day: weekdayName(date),
        exercises,
        durationMin,
        caloriesBurned,
        completed: true
      });
      return {
        result: { completed: true, exercises, caloriesBurned },
        card: { type: 'workout_complete', exercises, caloriesBurned, durationMin },
        refresh: 'workout'
      };
    }

    case 'show_exercise': {
      const a = z.object({ name: z.string().min(1), detail: z.string().optional() }).parse(args);
      return {
        result: { shown: a.name },
        card: { type: 'exercise', name: a.name, detail: a.detail ?? '' }
      };
    }

    case 'add_water': {
      const a = z.object({ amountMl: z.number().positive() }).parse(args);
      const totals = await getTodayTotals(userId, date);
      const totalMl = totals.waterMl + a.amountMl;
      await createWaterLog(userId, {
        date,
        time: new Date().toISOString().slice(11, 16),
        amountMl: a.amountMl,
        dailyTotalMl: totalMl
      });
      return {
        result: { logged: true, totalMl },
        card: { type: 'water_logged', amountMl: a.amountMl, totalMl },
        refresh: 'water'
      };
    }

    case 'add_transaction': {
      const a = z
        .object({
          txType: z.enum(['expense', 'income']),
          category: z.string().min(1),
          amount: z.number().positive(),
          notes: z.string().optional()
        })
        .parse(args);
      await createTransaction(userId, {
        id: `chat_${Date.now()}`,
        type: a.txType,
        category: a.category,
        amount: a.amount,
        notes: a.notes ?? '',
        date
      });
      return {
        result: { logged: true },
        card: { type: 'transaction', txType: a.txType, category: a.category, amount: a.amount },
        refresh: 'finance'
      };
    }

    case 'add_gold': {
      const a = z
        .object({
          category: z.enum(['Jewellery', 'Coins', 'Digital Gold', 'SIP']),
          grams: z.number().positive(),
          buyPrice: z.number().positive()
        })
        .parse(args);
      await createGoldEntry(userId, { id: `chat_${Date.now()}`, category: a.category, grams: a.grams, buyPrice: a.buyPrice, date });
      return {
        result: { logged: true },
        card: { type: 'gold', category: a.category, grams: a.grams, buyPrice: a.buyPrice },
        refresh: 'gold'
      };
    }

    case 'update_profile': {
      const a = z
        .object({
          weightKg: z.number().positive().optional(),
          heightCm: z.number().positive().optional(),
          fitnessGoal: z.enum(['Lose weight', 'Maintain', 'Build muscle']).optional(),
          calorieTarget: z.number().positive().optional(),
          waterGoalMl: z.number().positive().optional(),
          monthlyBudget: z.number().nonnegative().optional()
        })
        .parse(args);
      if (Object.keys(a).length === 0) return { result: { updated: false } };
      await patchUserProfile(userId, a);
      return { result: { updated: true, fields: a }, card: { type: 'profile_updated', fields: a }, refresh: 'profile' };
    }

    case 'set_routine': {
      const time = z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/);
      const a = z
        .object({ sleepTime: time.optional(), gymTime: time.optional(), runningTime: time.optional() })
        .parse(args);
      if (Object.keys(a).length === 0) return { result: { updated: false } };
      await patchUserProfile(userId, a);
      return { result: { updated: true, fields: a }, card: { type: 'profile_updated', fields: a }, refresh: 'profile' };
    }

    case 'set_fasting_plan': {
      const a = z.object({ plan: z.string().min(1) }).parse(args);
      await patchUserProfile(userId, { fastingPlan: a.plan });
      return { result: { updated: true }, card: { type: 'profile_updated', fields: { fastingPlan: a.plan } }, refresh: 'profile' };
    }

    case 'recommend_plan_from_bmi': {
      const a = z.object({ weightKg: z.number().positive(), heightCm: z.number().positive() }).parse(args);
      const h = a.heightCm / 100;
      const bmi = Math.round((a.weightKg / (h * h)) * 10) / 10;
      let goal = 'Maintain';
      let fastingPlan = 'none';
      let summary = '';
      if (bmi < 18.5) {
        goal = 'Build muscle';
        fastingPlan = 'none';
        summary = `BMI ${bmi} (underweight). Focus on a calorie surplus and strength work; no fasting for now.`;
      } else if (bmi < 25) {
        goal = 'Maintain';
        fastingPlan = '14:10';
        summary = `BMI ${bmi} (healthy). Maintain with balanced meals and a gentle 14:10 eating window.`;
      } else {
        goal = 'Lose weight';
        fastingPlan = '16:8';
        summary = `BMI ${bmi} (overweight). A 16:8 fasting window plus regular cardio will help you lose weight steadily.`;
      }
      await patchUserProfile(userId, { weightKg: a.weightKg, heightCm: a.heightCm, bmi, fitnessGoal: goal, fastingPlan, setupComplete: true });
      return {
        result: { bmi, goal, fastingPlan, summary },
        card: { type: 'plan', bmi, goal, fastingPlan, summary },
        refresh: 'profile'
      };
    }

    case 'propose_memory': {
      const a = z.object({ content: z.string().min(1), category: z.string().optional() }).parse(args);
      const res = await proposeMemory(userId, a.content, a.category);
      if (res.saved) {
        return { result: { saved: true, autoSaved: res.autoSaved } };
      }
      // New candidate — ask the user to confirm via a memory prompt card.
      return {
        result: { saved: false, awaitingConfirmation: true },
        card: { type: 'memory_prompt', id: res.memory.id, content: res.memory.content }
      };
    }

    default:
      return { result: { error: `Unknown tool: ${name}` } };
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

interface ChatContext {
  name: string;
  setupComplete: boolean;
  profile: Awaited<ReturnType<typeof getUserProfile>>;
  totals: Awaited<ReturnType<typeof getTodayTotals>>;
  streak: number;
  recentWorkouts: string[];
  memories: string[];
}

function buildSystemPrompt(ctx: ChatContext): string {
  const p = ctx.profile;
  const lines = [
    'You are "SyncLife Coach", a warm, motivating health and life assistant inside the SyncLife app.',
    'You help the user track meals, workouts, water, finance, gold, profile/goals and routines — and you actually DO it by calling tools.',
    '',
    'Behaviour rules:',
    '- Keep replies short, friendly and encouraging. Nudge toward healthier choices.',
    '- Regularly remind the user that consistency and small daily actions compound — protecting their streak matters more than any single perfect day. When it fits, end with a short one-line motivational nudge.',
    '- To perform ANY action (log a meal, mark a workout, add water/expense, update profile, set routine), you MUST call the matching tool. Never claim you did something without calling its tool.',
    '- When you need the user to choose or confirm, call ask_user with 2-4 concise options instead of writing the question as plain text.',
    '- Use show_exercise to display an exercise demo when the user asks how to do one or when suggesting workouts.',
    '- Only call propose_memory for durable facts/preferences, not one-off logs.',
    '- Never invent the user\'s data; rely on the context below or ask.',
    '- If the user is just chatting, venting, greeting, or asking a general or advice question that no tool covers, do NOT force a tool — reply naturally and warmly like a supportive friend and coach, and weave in ONE short motivational quote (with its author) that fits the moment.'
  ];

  if (!ctx.setupComplete) {
    lines.push(
      '',
      'SETUP MODE: this user has not finished setup. Warmly collect their weight and height (ask_user or free text, each skippable), then call recommend_plan_from_bmi to set their goal, suggested plan and fasting window. Keep it to a couple of quick questions.'
    );
  } else {
    lines.push('', 'The user is set up. Greet them, ask how their day is going, and log whatever they share.');
  }

  lines.push(
    '',
    'Current context:',
    `- Name: ${ctx.name || 'unknown'}`,
    p ? `- Weight ${p.weightKg}kg, Height ${p.heightCm}cm${p.bmi ? `, BMI ${p.bmi}` : ''}, Goal ${p.fitnessGoal}` : '- Profile: not set',
    p ? `- Calorie target ${p.calorieTarget}, Water goal ${p.waterGoalMl}ml, Fasting ${p.fastingPlan}` : '',
    `- Today: ${Math.round(ctx.totals.caloriesConsumed)} kcal eaten, ${Math.round(ctx.totals.waterMl)}ml water, workout ${ctx.totals.workoutCompleted ? 'done' : 'not done'}`,
    `- Daily streak: ${ctx.streak} days`,
    ctx.recentWorkouts.length ? `- Recent workouts: ${ctx.recentWorkouts.join('; ')}` : '',
    ctx.memories.length ? `- Remembered about the user: ${ctx.memories.join('; ')}` : ''
  );

  // Ground the model with a few real quotes it can weave into casual replies.
  lines.push(
    '',
    'Motivational quotes you may use (attribute correctly, or pick your own):',
    ...getRandomQuotes(5).map((q) => `- "${q.text}" — ${q.author}`)
  );

  return lines.filter((l) => l !== '').join('\n');
}

// ─── Groq plumbing ────────────────────────────────────────────────────────────

interface GroqToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}
interface GroqMessage {
  role: string;
  content: string | null;
  tool_calls?: GroqToolCall[];
  tool_call_id?: string;
  name?: string;
}
interface GroqResponse {
  choices?: { message?: GroqMessage }[];
}

async function callGroq(apiKey: string, messages: GroqMessage[]): Promise<GroqMessage> {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.5,
      max_tokens: 800,
      tools: TOOLS,
      tool_choice: 'auto',
      messages
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Groq API error ${response.status}: ${detail}`);
  }
  const data = (await response.json()) as GroqResponse;
  const msg = data.choices?.[0]?.message;
  if (!msg) throw new Error('Groq returned no message');
  return msg;
}

// ─── Public entry point ───────────────────────────────────────────────────────

// A friendly, conversational reply used when the AI provider is unavailable
// (no key / error) so casual chat still feels alive — always carries a quote.
function conversationalFallback(message: string): string {
  const q = getRandomQuote();
  const m = message.toLowerCase();
  let lead: string;
  if (/\b(hi|hello|hey|yo|hii|hiya|namaste)\b/.test(m)) {
    lead = "Hey! Good to see you. I'm your SyncLife coach — here to keep you moving.";
  } else if (m.includes('how are you') || m.includes('how r u')) {
    lead = "I'm fired up and ready to help you make today count!";
  } else if (/(tired|lazy|unmotivat|exhaust|can'?t|cant|give up|quit|skip|don'?t feel)/.test(m)) {
    lead = "I hear you — some days feel heavy. Showing up even a little still moves you forward.";
  } else if (m.includes('thank')) {
    lead = "Anytime! You're putting in the work — I'm just your hype crew.";
  } else if (m.includes('?')) {
    lead = "Good question! I'm in lightweight mode right now, but I've got your back — and you can always ask me to log meals, workouts, water or expenses.";
  } else {
    lead = "I'm here for you. Tell me what you ate, your workout, water or spending and I'll track it — or we can just talk it out.";
  }
  return `${lead}\n\n“${q.text}” — ${q.author}`;
}

export async function runChatTurn(userId: string, userMessage: string, date: string): Promise<ChatTurnResult> {
  // Persist the user's message immediately.
  await createChatMessage(userId, { role: 'user', content: userMessage });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const cards: ChatCard[] = [];
  const refresh = new Set<string>();
  let options: string[] = [];

  const finish = async (message: string): Promise<ChatTurnResult> => {
    const kind = options.length ? 'options' : cards.length ? 'cards' : 'text';
    await createChatMessage(userId, { role: 'assistant', content: message, kind, data: { cards, options } });
    return { message, cards, options, refresh: [...refresh] };
  };

  if (!apiKey) {
    return finish(conversationalFallback(userMessage));
  }

  // Gather context.
  const [profile, totals, history, memoryRows, recent] = await Promise.all([
    getUserProfile(userId),
    getTodayTotals(userId, date),
    getRecentChatMessages(userId, 16),
    getSavedMemories(userId),
    getWorkoutHistory(userId, 5)
  ]);

  const ctx: ChatContext = {
    name: '',
    setupComplete: profile?.setupComplete ?? false,
    profile,
    totals,
    streak: profile?.streak ?? 0,
    recentWorkouts: recent.map((w) => `${w.date} (${(JSON.parse(w.exercises) as string[]).slice(0, 3).join(', ')})`),
    memories: memoryRows.map((m) => m.content)
  };

  const messages: GroqMessage[] = [{ role: 'system', content: buildSystemPrompt(ctx) }];
  // Replay prior turn text (exclude the message we just stored, which is last).
  for (const m of history.slice(0, -1)) {
    if (m.role === 'user' || m.role === 'assistant') {
      messages.push({ role: m.role, content: m.content });
    }
  }
  messages.push({ role: 'user', content: userMessage });

  try {
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const msg = await callGroq(apiKey, messages);

      if (!msg.tool_calls?.length) {
        return finish(msg.content?.trim() || 'Done.');
      }

      // Echo the assistant tool-call message back into the thread.
      messages.push({ role: 'assistant', content: msg.content ?? '', tool_calls: msg.tool_calls });

      let terminal: { question: string; options: string[] } | null = null;
      for (const tc of msg.tool_calls) {
        let exec: ExecResult;
        try {
          const parsedArgs = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          exec = await executeTool(userId, tc.function.name, parsedArgs, date);
        } catch (err) {
          exec = { result: { error: err instanceof Error ? err.message : 'tool failed' } };
        }
        if (exec.card) cards.push(exec.card);
        if (exec.refresh) refresh.add(exec.refresh);
        if (exec.terminal) terminal = exec.terminal;
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(exec.result) });
      }

      // ask_user is terminal: return its question + options as this turn.
      if (terminal) {
        options = terminal.options;
        return finish(terminal.question);
      }
    }

    // Hit the iteration cap — ask the model for a closing summary without tools.
    const closing = await callGroq(apiKey, [
      ...messages,
      { role: 'system', content: 'Summarise what you did in one or two friendly sentences. Do not call tools.' }
    ]);
    return finish(closing.content?.trim() || 'All set.');
  } catch (error) {
    console.error('[SyncLife API] chat turn failed:', error);
    // Degrade gracefully — anything already executed is preserved in `cards`.
    const fallback = cards.length
      ? 'Done! (I had a hiccup writing my reply, but your update went through.)'
      : conversationalFallback(userMessage);
    return finish(fallback);
  }
}

// ─── Opening turn (setup vs daily check-in) ───────────────────────────────────

export async function getChatSession(userId: string, date: string) {
  const [profile, totals] = await Promise.all([getUserProfile(userId), getTodayTotals(userId, date)]);
  const setupComplete = profile?.setupComplete ?? false;

  // Note: the opener is NOT persisted — the client shows it as a fresh,
  // ephemeral greeting each time the chat opens (so it can carry a new quote).
  if (!setupComplete) {
    const message =
      "Hi! I'm your SyncLife coach 👋 Let's set you up in a few seconds. To tailor your meals and workouts, what's your current weight and height? (You can skip if you'd rather not.)";
    return { setupComplete, message, options: ['Enter weight & height', 'Skip for now'], cards: [] as ChatCard[] };
  }

  const greeting = `Welcome back! Today you've had ${Math.round(totals.caloriesConsumed)} kcal and ${Math.round(
    totals.waterMl
  )}ml of water, and your workout is ${totals.workoutCompleted ? 'done ✅' : 'still pending'}. How's your day going?`;
  const options = ['Log a meal', 'Mark workout done', 'Add water', 'Add an expense'];
  return { setupComplete, message: greeting, options, cards: [] as ChatCard[] };
}

// ─── Free-text meal parsing (used by the Meals screen "add anything" box) ─────

export interface ParsedMeal {
  name: string;
  mealType: string;
  calories: number;
  protein: number;
  quantity: number;
  /** true when calories came from the AI/catalog, false when we couldn't estimate */
  estimated: boolean;
}

function fallbackParseMeal(text: string): ParsedMeal {
  const match = MEAL_CATALOG.find((m) => text.toLowerCase().includes(m.name.toLowerCase()));
  if (match) {
    return { name: match.name, mealType: match.type, calories: match.calories, protein: match.protein, quantity: 1, estimated: true };
  }
  const hour = new Date().getHours();
  const mealType = hour < 11 ? 'Breakfast' : hour < 16 ? 'Lunch' : hour < 21 ? 'Dinner' : 'Snacks';
  return { name: text.trim().slice(0, 60) || 'Meal', mealType, calories: 0, protein: 0, quantity: 1, estimated: false };
}

const PARSE_SYSTEM_PROMPT = `You convert a short free-text description of food the user ate into one structured meal log.
Respond with ONLY a JSON object, no prose, with exactly these keys:
{"name": string, "mealType": "Breakfast"|"Lunch"|"Dinner"|"Snacks", "calories": number, "protein": number, "quantity": number}
- calories and protein are the TOTAL for the whole described portion (not per serving). protein is in grams.
- Estimate realistic values for typical Indian portions when amounts are vague.
- quantity is the number of servings the user described (default 1).
- Infer mealType from the food/time if the user didn't say.`;

interface GroqContentResponse {
  choices?: { message?: { content?: string } }[];
}

/** Parse a free-text meal into a structured, savable log. Falls back to a
 * catalog match / heuristic when the AI key is missing or the call fails. */
export async function parseMeal(text: string): Promise<ParsedMeal> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackParseMeal(text);

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: PARSE_SYSTEM_PROMPT },
          { role: 'user', content: text }
        ]
      })
    });
    if (!response.ok) throw new Error(`Groq parse error ${response.status}`);
    const data = (await response.json()) as GroqContentResponse;
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error('empty parse response');

    const parsed = z
      .object({
        name: z.string().min(1),
        mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snacks']),
        calories: z.number().nonnegative(),
        protein: z.number().nonnegative(),
        quantity: z.number().positive()
      })
      .parse(JSON.parse(raw));

    return {
      name: parsed.name.slice(0, 80),
      mealType: parsed.mealType,
      calories: Math.round(parsed.calories),
      protein: Math.round(parsed.protein),
      quantity: parsed.quantity,
      estimated: true
    };
  } catch (error) {
    console.error('[SyncLife API] meal parse failed, using fallback:', error);
    return fallbackParseMeal(text);
  }
}
