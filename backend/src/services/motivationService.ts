export type MotivationType = 'gym' | 'work' | 'reminder' | 'sleep';

export type CoachLanguage = 'en' | 'hi' | 'mr';

export type MotivationRequest = {
  type: MotivationType;
  name?: string;
  streakDays?: number;
  workoutDoneToday?: boolean;
  /** Hour of day (0-23) on the user's device */
  timeOfDay?: number;
  /** Language the coach should speak in. Defaults to English. */
  language?: CoachLanguage;
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

// Appended to the system prompts so the model speaks the user's language.
// Text is read aloud by device TTS (hi-IN / mr-IN voices), hence Devanagari.
const LANGUAGE_RULE: Record<CoachLanguage, string> = {
  en: '',
  hi: '\n- IMPORTANT: Reply ONLY in natural, conversational Hindi written in Devanagari script — the way a friendly Indian coach talks on the phone. Common English words like gym, workout, timer, streak may stay in English if that sounds natural.',
  mr: '\n- IMPORTANT: Reply ONLY in natural, conversational Marathi written in Devanagari script — the way a friendly Marathi-speaking coach talks on the phone. Common English words like gym, workout, timer, streak may stay in English if that sounds natural.'
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

// Compact Hindi/Marathi banks for when the AI provider is unavailable.
const MESSAGE_BANK_HI: Record<MotivationType, string[]> = {
  gym: [
    'आपका कोच बोल रहा हूँ। जिम आपका इंतज़ार कर रहा है और आने वाला कल आपको देख रहा है। उठिए, जूते पहनिए, और एक शानदार वर्कआउट कीजिए। पूरा किया हुआ वर्कआउट कभी पछतावा नहीं देता।',
    'मोटिवेशन से ज़्यादा अनुशासन काम आता है, और दरवाज़े से बाहर निकलने के लिए बस दस सेकंड का अनुशासन चाहिए। पहले कदम उठाइए, सोचिए बाद में। आपकी स्ट्रीक दांव पर है।',
    'चैंपियन, फैसले का समय है। एक घंटा फोन स्क्रॉल कीजिए, या पैंतालीस मिनट ट्रेनिंग करके पूरे दिन जोश में रहिए। सामान उठाइए — अभी शुरू करते हैं।'
  ],
  work: [
    'आपका कोच बोल रहा हूँ। काम खुद नहीं होगा, और आने वाला आप आज के आप से शुरू करने की गुज़ारिश कर रहा है। टास्क खोलिए, पच्चीस मिनट का टाइमर लगाइए, और शुरू हो जाइए।',
    'गहरी सांस लीजिए। सब कुछ खत्म नहीं करना है — बस एक चीज़ शुरू करनी है। सबसे ज़रूरी काम चुनिए और अभी पूरा ध्यान लगाइए।',
    'आप बस एक फोकस सेशन दूर हैं अपने दिन पर कब्ज़ा करने से। फोन उल्टा रखिए, स्क्रीन पर एक टास्क, टाइमर चालू। चलिए।'
  ],
  reminder: [
    'कोच की तरफ से एक छोटी याद। आपने यह रिमाइंडर किसी वजह से लगाया था, और वह वजह अभी भी मायने रखती है। दो मिनट निकालिए और अभी निपटा दीजिए।',
    'यह वही काम है जो आपने खुद से वादा किया था। आने वाला आप आज के आप पर भरोसा कर रहा है। अभी कर डालिए और हल्का महसूस कीजिए।'
  ],
  sleep: [
    'आपका कोच बोल रहा हूँ। कल के लिए सबसे ताक़तवर चीज़ है आज रात का आराम। स्क्रीन बंद, रोशनी धीमी, और शरीर को रिकवर होने दीजिए। नींद भी ट्रेनिंग है।',
    'दिन खत्म हुआ और आपने पूरा साथ निभाया। अब कल की ऊर्जा बचाइए। रोशनी धीमी कीजिए, अलार्म लगाइए, और सो जाइए।'
  ]
};

const MESSAGE_BANK_MR: Record<MotivationType, string[]> = {
  gym: [
    'मी तुमचा कोच बोलतोय. जिम तुमची वाट पाहतंय आणि उद्याचे तुम्ही आजच्या तुम्हाला बघताय. उठा, बूट घाला, आणि एक जबरदस्त वर्कआउट करा. पूर्ण केलेल्या वर्कआउटचा कधीच पश्चाताप होत नाही.',
    'मोटिव्हेशनपेक्षा शिस्त महत्त्वाची, आणि दारातून बाहेर पडायला फक्त दहा सेकंदांची शिस्त लागते. आधी निघा, विचार नंतर करा. तुमची स्ट्रीक पणाला लागली आहे.',
    'चॅम्पियन, निर्णयाची वेळ आली. तासभर फोन स्क्रोल करा, किंवा पंचेचाळीस मिनिटं ट्रेनिंग करून दिवसभर जोशात राहा. सामान उचला — आत्ता सुरुवात करू.'
  ],
  work: [
    'मी तुमचा कोच. काम आपोआप होणार नाही, आणि उद्याचे तुम्ही आजच्या तुम्हाला सुरुवात करायची विनंती करताय. टास्क उघडा, पंचवीस मिनिटांचा टायमर लावा, आणि सुरू करा.',
    'दीर्घ श्वास घ्या. सगळं संपवायचं नाहीये — फक्त एक गोष्ट सुरू करायची आहे. सगळ्यात महत्त्वाचं काम निवडा आणि आत्ता पूर्ण लक्ष द्या.',
    'दिवसावर ताबा मिळवण्यापासून तुम्ही फक्त एक फोकस सेशन दूर आहात. फोन उलटा ठेवा, स्क्रीनवर एकच टास्क, टायमर सुरू. चला.'
  ],
  reminder: [
    'कोचकडून एक छोटी आठवण. तुम्ही हा रिमाइंडर एका कारणासाठी लावला होता, आणि ते कारण अजूनही महत्त्वाचं आहे. दोन मिनिटं काढा आणि आत्ताच उरकून टाका.',
    'हेच ते काम जे तुम्ही स्वतःला कबूल केलं होतं. उद्याचे तुम्ही आजच्या तुमच्यावर विश्वास ठेवून आहेत. आत्ता करून टाका आणि हलकं वाटून घ्या.'
  ],
  sleep: [
    'मी तुमचा कोच. उद्यासाठी सगळ्यात ताकदीची गोष्ट म्हणजे आज रात्रीची विश्रांती. स्क्रीन बंद, दिवे मंद, आणि शरीराला रिकव्हर होऊ द्या. झोपसुद्धा ट्रेनिंगच आहे.',
    'दिवस संपला आणि तुम्ही पूर्ण साथ दिली. आता उद्याची ऊर्जा जपा. दिवे मंद करा, अलार्म लावा, आणि झोपी जा.'
  ]
};

const BANKS: Record<CoachLanguage, Record<MotivationType, string[]>> = {
  en: MESSAGE_BANK,
  hi: MESSAGE_BANK_HI,
  mr: MESSAGE_BANK_MR
};

const STREAK_LINE: Record<CoachLanguage, (days: number) => string> = {
  en: (days) => ` You are on a ${days} day streak — do not break it today.`,
  hi: (days) => ` आपकी ${days} दिन की स्ट्रीक चल रही है — आज इसे मत तोड़िए।`,
  mr: (days) => ` तुमची ${days} दिवसांची स्ट्रीक सुरू आहे — आज ती तोडू नका.`
};

function pickFromBank(type: MotivationType, name?: string, streakDays?: number, language: CoachLanguage = 'en'): string {
  const bank = BANKS[language][type];
  const base = bank[Math.floor(Math.random() * bank.length)];
  const greeting = name ? `${name.split(' ')[0]}, ` : '';
  const streakLine = streakDays && streakDays > 1 ? STREAK_LINE[language](streakDays) : '';
  return `${greeting}${base}${streakLine}`;
}

/** Encouraging, on-topic canned reply used when the AI provider is unavailable. */
function pickReplyFromBank(type: MotivationType, name?: string, language: CoachLanguage = 'en'): string {
  const greeting = name ? `${name.split(' ')[0]}, ` : '';
  const lines: Record<CoachLanguage, Record<MotivationType, string>> = {
    en: {
      gym: `${greeting}I hear you — but you do not have to feel ready, you just have to start. Do the first five minutes and let momentum take over. Shoes on, let us go.`,
      work: `${greeting}totally fair. Forget the whole thing — just open it and set a five minute timer. Starting is the hard part, and you are about to win it.`,
      reminder: `${greeting}I get it, life is busy. This one is quick though. Take two minutes right now and close the loop — you will feel lighter the moment it is done.`,
      sleep: `${greeting}I know it is tempting to push on, but rest is how you win tomorrow. Put the screen down, dim the lights, and give yourself a proper night.`
    },
    hi: {
      gym: `${greeting}समझ रहा हूँ — लेकिन तैयार महसूस करना ज़रूरी नहीं, बस शुरुआत करनी है। पहले पाँच मिनट कीजिए, बाकी जोश खुद आएगा। जूते पहनिए, चलिए।`,
      work: `${greeting}बिल्कुल जायज़ बात है। पूरा काम भूल जाइए — बस उसे खोलिए और पाँच मिनट का टाइमर लगाइए। शुरुआत ही सबसे मुश्किल है, और वह आप अभी जीतने वाले हैं।`,
      reminder: `${greeting}समझता हूँ, ज़िंदगी व्यस्त है। पर यह काम छोटा है। अभी दो मिनट निकालिए और निपटा दीजिए — पूरा होते ही हल्का महसूस होगा।`,
      sleep: `${greeting}जानता हूँ आगे बढ़ते रहने का मन है, पर आराम ही कल की जीत है। स्क्रीन नीचे रखिए, रोशनी धीमी कीजिए, और अच्छी नींद लीजिए।`
    },
    mr: {
      gym: `${greeting}समजतंय — पण तयार वाटायची गरज नाही, फक्त सुरुवात करायची आहे. पहिली पाच मिनिटं करा, पुढचा जोश आपोआप येईल. बूट घाला, चला.`,
      work: `${greeting}अगदी बरोबर आहे. पूर्ण काम विसरा — फक्त ते उघडा आणि पाच मिनिटांचा टायमर लावा. सुरुवात हीच सगळ्यात अवघड असते, आणि ती तुम्ही आत्ता जिंकणार आहात.`,
      reminder: `${greeting}समजतं, आयुष्य व्यस्त आहे. पण हे काम छोटं आहे. आत्ता दोन मिनिटं काढा आणि उरकून टाका — झाल्यावर हलकं वाटेल.`,
      sleep: `${greeting}माहितीये अजून जागं राहावंसं वाटतंय, पण विश्रांती हीच उद्याची जीत आहे. स्क्रीन बाजूला ठेवा, दिवे मंद करा, आणि शांत झोप घ्या.`
    }
  };
  return lines[language][type];
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
  const language = request.language ?? 'en';
  if (apiKey) {
    try {
      const text = await callGroq(
        apiKey,
        [
          { role: 'system', content: SYSTEM_PROMPT + LANGUAGE_RULE[language] },
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

  return { message: pickFromBank(request.type, request.name, request.streakDays, language), source: 'bank' };
}

/**
 * Generates the coach's REPLY to whatever the user just said on the call,
 * keeping the conversation two-way. Falls back to an encouraging canned reply
 * when the AI provider is unavailable or errors.
 */
export async function continueMotivation(request: MotivationReplyRequest): Promise<MotivationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const language = request.language ?? 'en';
  // Trim runaway histories — only the recent turns matter for a short call.
  const history = request.history.slice(-12);

  if (apiKey) {
    try {
      const system = REPLY_SYSTEM_PROMPT.replace('{goal}', TYPE_GOAL[request.type]) + LANGUAGE_RULE[language];
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

  return { message: pickReplyFromBank(request.type, request.name, language), source: 'bank' };
}
