export type MotivationType = 'gym' | 'work' | 'reminder' | 'sleep';

export type MotivationRequest = {
  type: MotivationType;
  name?: string;
  streakDays?: number;
  workoutDoneToday?: boolean;
  /** Hour of day (0-23) on the user's device */
  timeOfDay?: number;
};

/** A single turn in the back-and-forth call conversation. */
export type CallTurn = {
  role: 'assistant' | 'user';
  content: string;
};

export type MotivationReplyRequest = MotivationRequest & {
  /** Full conversation so far (oldest first), including the opening coach line. */
  history: CallTurn[];
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

const MESSAGE_BANK: Record<MotivationType, string[]> = {
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
  ],
  reminder: [
    'This is your coach with a quick nudge. You set this reminder for a reason — that reason still matters. Take two minutes and handle it now before it slips away.',
    'Hey, this is the thing you promised yourself you would do. Future you is counting on present you. Knock it out now and feel the weight lift.',
    'Small tasks become big stress when we wait. This one is small. Do it right now while it is in front of you, and you are done.',
    'You asked me to remind you, so here I am. One quick action closes this loop. Let us take care of it together — start now.'
  ],
  sleep: [
    'This is your coach. The most powerful thing you can do for tomorrow is rest tonight. Screens down, lights low, and let your body recover. Sleep is training too.',
    'Champions are made in recovery as much as effort. Wind down now — put the phone on charge across the room and give yourself a full night.',
    'Your brain and muscles repair while you sleep. Skipping it steals from tomorrow. Close the day proud, breathe slow, and head to bed now.',
    'The day is done and you showed up. Now protect your energy for tomorrow. Dim the lights, set your alarm, and let yourself rest.'
  ]
};

const TYPE_GOAL: Record<MotivationType, string> = {
  gym: 'motivate the user to get up and work out right now',
  work: 'motivate the user to start a focused work session right now',
  reminder: 'remind and nudge the user to complete the task they set this reminder for',
  sleep: 'encourage the user to wind down and go to sleep so they recover well'
};

const SYSTEM_PROMPT = `You are "SyncLife Coach", an energetic but warm personal coach on a live phone call with the user right now.
Rules:
- Write 50-90 words of plain spoken text — it is read aloud by text-to-speech on a phone call.
- No emojis, no markdown, no lists, no stage directions. Just the words the coach says out loud.
- Be direct, personal, and end with one concrete immediate action.
- Use the user's first name and streak if provided. Never invent facts you were not given.
- For "gym" calls motivate a workout; "work" calls motivate focused work; "reminder" calls nudge them to do the task they set; "sleep" calls help them wind down and rest.`;

const REPLY_SYSTEM_PROMPT = `You are "SyncLife Coach" on a live, two-way phone call with the user. You opened the call to ${'{goal}'}.
The user is now replying — they might be making excuses, asking a question, negotiating, or agreeing. Respond like a real coach who is actually listening.
Rules:
- Reply in 25-60 words of plain spoken text — it is read aloud by text-to-speech, so no emojis, markdown, lists, or stage directions.
- Directly address what the user just said. If they make an excuse, acknowledge it warmly, then re-motivate and give one small concrete next step.
- If they agree or commit, hype them up briefly and confirm the action.
- If they push back hard, stay supportive — even a tiny step counts. Never shame them.
- Use the user's first name and streak only if provided. Keep it conversational, like a caring coach on the phone.`;

function pickFromBank(type: MotivationType, name?: string, streakDays?: number): string {
  const bank = MESSAGE_BANK[type];
  const base = bank[Math.floor(Math.random() * bank.length)];
  const greeting = name ? `${name.split(' ')[0]}, ` : '';
  const streakLine = streakDays && streakDays > 1 ? ` You are on a ${streakDays} day streak — do not break it today.` : '';
  return `${greeting}${base}${streakLine}`;
}

/** Encouraging, on-topic canned reply used when the AI provider is unavailable. */
function pickReplyFromBank(type: MotivationType, name?: string): string {
  const greeting = name ? `${name.split(' ')[0]}, ` : '';
  const lines: Record<MotivationType, string> = {
    gym: `${greeting}I hear you — but you do not have to feel ready, you just have to start. Do the first five minutes and let momentum take over. Shoes on, let us go.`,
    work: `${greeting}totally fair. Forget the whole thing — just open it and set a five minute timer. Starting is the hard part, and you are about to win it.`,
    reminder: `${greeting}I get it, life is busy. This one is quick though. Take two minutes right now and close the loop — you will feel lighter the moment it is done.`,
    sleep: `${greeting}I know it is tempting to push on, but rest is how you win tomorrow. Put the screen down, dim the lights, and give yourself a proper night.`
  };
  return lines[type];
}

type GroqChatResponse = {
  choices?: { message?: { content?: string } }[];
};

function buildContext(request: MotivationRequest): string {
  return [
    `Call type: ${request.type}`,
    request.name ? `User first name: ${request.name.split(' ')[0]}` : null,
    typeof request.streakDays === 'number' ? `Current daily streak: ${request.streakDays} days` : null,
    typeof request.workoutDoneToday === 'boolean' ? `Workout already completed today: ${request.workoutDoneToday ? 'yes' : 'no'}` : null,
    typeof request.timeOfDay === 'number' ? `Local hour of day: ${request.timeOfDay}` : null
  ]
    .filter(Boolean)
    .join('\n');
}

async function callGroq(apiKey: string, messages: { role: string; content: string }[], temperature: number): Promise<string | null> {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 300,
      temperature,
      messages
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Groq API error ${response.status}: ${detail}`);
  }

  const data = (await response.json()) as GroqChatResponse;
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

/**
 * Generates the OPENING motivational call line. Uses Groq when ANTHROPIC_API_KEY
 * is configured; otherwise (or on any API failure) falls back to the message bank
 * so the call always connects.
 */
export async function generateMotivation(request: MotivationRequest): Promise<MotivationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const text = await callGroq(
        apiKey,
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Make the motivation call now.\n${buildContext(request)}` }
        ],
        0.9
      );
      if (text) {
        return { message: text, source: 'ai' };
      }
    } catch (error) {
      console.error('[SyncLife API] Groq motivation request failed, falling back to bank:', error);
    }
  }

  return { message: pickFromBank(request.type, request.name, request.streakDays), source: 'bank' };
}

/**
 * Generates the coach's REPLY to whatever the user just said on the call,
 * keeping the conversation two-way. Falls back to an encouraging canned reply
 * when the AI provider is unavailable or errors.
 */
export async function continueMotivation(request: MotivationReplyRequest): Promise<MotivationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  // Trim runaway histories — only the recent turns matter for a short call.
  const history = request.history.slice(-12);

  if (apiKey) {
    try {
      const system = REPLY_SYSTEM_PROMPT.replace('{goal}', TYPE_GOAL[request.type]);
      const messages = [
        { role: 'system', content: `${system}\n\nCall context:\n${buildContext(request)}` },
        ...history.map((turn) => ({ role: turn.role, content: turn.content }))
      ];
      const text = await callGroq(apiKey, messages, 0.8);
      if (text) {
        return { message: text, source: 'ai' };
      }
    } catch (error) {
      console.error('[SyncLife API] Groq motivation reply failed, falling back to bank:', error);
    }
  }

  return { message: pickReplyFromBank(request.type, request.name), source: 'bank' };
}
