export type MotivationRequest = {
  type: 'gym' | 'work';
  name?: string;
  streakDays?: number;
  workoutDoneToday?: boolean;
  /** Hour of day (0-23) on the user's device */
  timeOfDay?: number;
};

export type MotivationResult = {
  message: string;
  source: 'ai' | 'bank';
};

// ─── Groq config ──────────────────────────────────────────────────────────────
// Groq exposes an OpenAI-compatible Chat Completions endpoint. The API key is
// read from ANTHROPIC_API_KEY (kept as-is so existing deployments need no env
// rename) — put your Groq Cloud key in that variable.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';

// ─── Fallback message bank (used when ANTHROPIC_API_KEY is not configured) ────

const MESSAGE_BANK: Record<MotivationRequest['type'], string[]> = {
  gym: [
    'This is your coach speaking. The gym is waiting and your future self is watching. Lace up and give me one great session — you never regret the workout you finished.',
    'Discipline beats motivation, and you only need ten seconds of discipline to walk out the door. Move now, think later. Your streak is on the line.',
    'One workout will not change your body, but skipping one will change your momentum. Protect the streak. Shoes on, water bottle filled, let us go.',
    'The hardest rep is leaving the house. Win that one rep and the whole workout is yours. I believe in you — now move.'
  ],
  work: [
    'This is your coach. The work will not do itself, and future you is begging present you to start. Open the task, set a timer for twenty five minutes, and go.',
    'Discipline is choosing what you want most over what you want now. What you want most is progress. Start the work — momentum will carry you.',
    'You are one focused session away from feeling on top of your day. Phone face down, one task on screen, timer on. Let us go.',
    'Your goals do not care about your mood, but they respond beautifully to your actions. Take action now — start the most important task on your list.'
  ]
};

const SYSTEM_PROMPT = `You are "SyncLife Coach", an energetic but warm personal coach making a phone call to motivate the user right now.
Rules:
- Write 60-90 words of plain spoken text — it is read aloud by text-to-speech on a phone call.
- No emojis, no markdown, no lists, no stage directions. Just the words the coach says.
- Be direct, personal, and end with one concrete immediate action (e.g. "put your shoes on now" or "set a 25 minute timer").
- For "gym" calls, motivate the user to work out; for "work" calls, motivate them to start focused work.
- Use the user's first name and streak if provided. Never invent facts you were not given.`;

function pickFromBank(type: MotivationRequest['type'], name?: string, streakDays?: number): string {
  const bank = MESSAGE_BANK[type];
  const base = bank[Math.floor(Math.random() * bank.length)];
  const greeting = name ? `${name.split(' ')[0]}, ` : '';
  const streakLine = streakDays && streakDays > 1 ? ` You are on a ${streakDays} day streak — do not break it today.` : '';
  return `${greeting}${base}${streakLine}`;
}

type GroqChatResponse = {
  choices?: { message?: { content?: string } }[];
};

/**
 * Generates a motivational call script. Uses Groq when ANTHROPIC_API_KEY is
 * configured; otherwise (or on any API failure) falls back to the message bank
 * so the call always connects.
 */
export async function generateMotivation(request: MotivationRequest): Promise<MotivationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const context = [
        `Call type: ${request.type}`,
        request.name ? `User first name: ${request.name.split(' ')[0]}` : null,
        typeof request.streakDays === 'number' ? `Current daily streak: ${request.streakDays} days` : null,
        typeof request.workoutDoneToday === 'boolean' ? `Workout already completed today: ${request.workoutDoneToday ? 'yes' : 'no'}` : null,
        typeof request.timeOfDay === 'number' ? `Local hour of day: ${request.timeOfDay}` : null
      ]
        .filter(Boolean)
        .join('\n');

      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: 300,
          temperature: 0.9,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Make the motivation call now.\n${context}` }
          ]
        })
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Groq API error ${response.status}: ${detail}`);
      }

      const data = (await response.json()) as GroqChatResponse;
      const text = data.choices?.[0]?.message?.content?.trim();

      if (text) {
        return { message: text, source: 'ai' };
      }
    } catch (error) {
      console.error('[SyncLife API] Groq motivation request failed, falling back to bank:', error);
    }
  }

  return { message: pickFromBank(request.type, request.name, request.streakDays), source: 'bank' };
}
