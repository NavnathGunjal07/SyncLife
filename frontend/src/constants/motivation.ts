import { Ionicons } from '@expo/vector-icons';

import { CoachLanguage, MotivationType, Ringtone } from '../types';

export const COACH_NAME = 'SyncLife Coach';

// ─── Languages ────────────────────────────────────────────────────────────────

export const DEFAULT_LANGUAGE: CoachLanguage = 'en';

export const COACH_LANGUAGES: { id: CoachLanguage; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
  { id: 'mr', label: 'मराठी' }
];

/** BCP-47 locales used for the coach's text-to-speech voice. */
export const SPEECH_LOCALES: Record<CoachLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN'
};

// ─── Ringtones ────────────────────────────────────────────────────────────────
// The bundled WAVs are the Android notification-channel sounds that ring a coach
// call; channels reference them by filename (see app.json expo-notifications sounds).

export const DEFAULT_RINGTONE: Ringtone = 'classic';

export const RINGTONES: { id: Ringtone; label: string; file: string }[] = [
  { id: 'classic', label: 'Classic alarm', file: 'alarm_classic.wav' },
  { id: 'gentle', label: 'Gentle chime', file: 'alarm_gentle.wav' },
  { id: 'digital', label: 'Digital', file: 'alarm_digital.wav' }
];

export function ringtoneFile(ringtone: Ringtone): string {
  return RINGTONES.find((r) => r.id === ringtone)?.file ?? 'alarm_classic.wav';
}

// ─── Notification body (per language) ─────────────────────────────────────────

const CALL_BODY: Record<CoachLanguage, Record<MotivationType, string>> = {
  en: {
    gym: 'Your coach is calling — time to train. Tap to answer 💪',
    work: 'Your coach is calling — time to get to work. Tap to answer 🚀',
    reminder: 'Your coach is calling — quick reminder for you. Tap to answer ⏰',
    sleep: 'Your coach is calling — time to wind down. Tap to answer 🌙'
  },
  hi: {
    gym: 'आपके कोच का कॉल — वर्कआउट का समय हो गया। जवाब देने के लिए टैप करें 💪',
    work: 'आपके कोच का कॉल — काम शुरू करने का समय है। जवाब देने के लिए टैप करें 🚀',
    reminder: 'आपके कोच का कॉल — आपके लिए एक छोटा रिमाइंडर। जवाब देने के लिए टैप करें ⏰',
    sleep: 'आपके कोच का कॉल — अब आराम का समय है। जवाब देने के लिए टैप करें 🌙'
  },
  mr: {
    gym: 'तुमच्या कोचचा कॉल — वर्कआउटची वेळ झाली. उत्तर द्यायला टॅप करा 💪',
    work: 'तुमच्या कोचचा कॉल — कामाला लागायची वेळ झाली. उत्तर द्यायला टॅप करा 🚀',
    reminder: 'तुमच्या कोचचा कॉल — तुमच्यासाठी एक छोटी आठवण. उत्तर द्यायला टॅप करा ⏰',
    sleep: 'तुमच्या कोचचा कॉल — आता आराम करायची वेळ. उत्तर द्यायला टॅप करा 🌙'
  }
};

export function callBody(type: MotivationType, language: CoachLanguage = DEFAULT_LANGUAGE): string {
  return CALL_BODY[language][type];
}

/** UI metadata for each call type (used by the alarms card and call screen). */
export const MOTIVATION_META: Record<MotivationType, { label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }> = {
  gym: { label: 'Gym', subtitle: 'Workout motivation call', icon: 'fitness' },
  work: { label: 'Work', subtitle: 'Work focus call', icon: 'briefcase' },
  reminder: { label: 'Reminder', subtitle: 'Reminder call', icon: 'alarm' },
  sleep: { label: 'Sleep', subtitle: 'Wind-down call', icon: 'moon' }
};

// ─── Offline / no-backend fallback messages (per language) ────────────────────
// Spoken by the coach on the call screen when the AI backend is unreachable.

const MOTIVATION_BANK: Record<CoachLanguage, Record<MotivationType, string[]>> = {
  en: {
    gym: [
      'This is your coach speaking. The gym is waiting and your future self is watching. Get up, lace your shoes, and give me one great session. You never regret the workout you finished.',
      'Hey champion, decision time. You can scroll for an hour, or you can train for forty five minutes and feel unstoppable all day. Grab your gear — we start now.',
      'Discipline beats motivation, and you only need ten seconds of discipline to walk out the door. Move now, think later. Your streak is on the line.',
      'Remember why you started. Stronger body, calmer mind, better life. None of that happens on the couch. Stand up right now and let us get this workout done.',
      'One workout will not change your body, but skipping one will change your momentum. Protect the streak. Shoes on, water bottle filled, let us go.',
      'Your muscles do not know what day it is — they only know whether you showed up. Show up today. Even a short session counts. Start with one set and the rest will follow.',
      'You have trained on harder days than this. Today is easy mode. Get to the gym, do the work, and come back proud of yourself.',
      'The hardest rep is leaving the house. Win that one rep and the whole workout is yours. I believe in you — now move.'
    ],
    work: [
      'This is your coach. The work will not do itself, and future you is begging present you to start. Open the task, set a timer for twenty five minutes, and go.',
      'Deep breath. You do not need to finish everything — you only need to start one thing. Pick the most important task and give it your full focus right now.',
      'Every successful day starts with one decisive moment. This is it. Close the distractions, open your work, and make the next hour count.',
      'Discipline is choosing what you want most over what you want now. What you want most is progress. Start the work — momentum will carry you.',
      'You are one focused session away from feeling on top of your day. Phone face down, one task on screen, timer on. Let us go.',
      'Procrastination is just fear in comfortable clothes. You are more capable than the task is hard. Start small, start now.',
      'Imagine ending today knowing you did the hard thing first. That feeling is twenty five focused minutes away. Begin.',
      'Your goals do not care about your mood, but they respond beautifully to your actions. Take action now — start the most important task on your list.'
    ],
    reminder: [
      'This is your coach with a quick nudge. You set this reminder for a reason, and that reason still matters. Take two minutes and handle it now before it slips away.',
      'Hey, this is the thing you promised yourself you would do. Future you is counting on present you. Knock it out now and feel the weight lift off your shoulders.',
      'Small tasks become big stress when we wait. This one is small. Do it right now while it is in front of you, and you will be done before you know it.',
      'You asked me to remind you, so here I am. One quick action closes this loop. Let us take care of it together — start now.'
    ],
    sleep: [
      'This is your coach. The most powerful thing you can do for tomorrow is rest tonight. Screens down, lights low, and let your body recover. Sleep is training too.',
      'Champions are made in recovery as much as in effort. Wind down now — put the phone on charge across the room and give yourself a full night of sleep.',
      'Your brain and muscles repair while you sleep. Skipping it steals from tomorrow. Close the day proud, breathe slow, and head to bed now.',
      'The day is done and you showed up. Now protect your energy for tomorrow. Dim the lights, set your alarm, and let yourself rest.'
    ]
  },
  hi: {
    gym: [
      'आपका कोच बोल रहा हूँ। जिम आपका इंतज़ार कर रहा है और आने वाला कल आपको देख रहा है। उठिए, जूते पहनिए, और एक शानदार वर्कआउट कीजिए। पूरा किया हुआ वर्कआउट कभी पछतावा नहीं देता।',
      'चैंपियन, फैसले का समय है। एक घंटा फोन स्क्रॉल कीजिए, या पैंतालीस मिनट ट्रेनिंग करके पूरे दिन जोश में रहिए। सामान उठाइए — अभी शुरू करते हैं।',
      'मोटिवेशन से ज़्यादा अनुशासन काम आता है, और दरवाज़े से बाहर निकलने के लिए बस दस सेकंड का अनुशासन चाहिए। पहले कदम उठाइए, सोचिए बाद में। आपकी स्ट्रीक दांव पर है।',
      'याद कीजिए आपने शुरुआत क्यों की थी। मज़बूत शरीर, शांत मन, बेहतर ज़िंदगी। यह सब सोफे पर नहीं होगा। अभी उठिए और यह वर्कआउट पूरा करते हैं।'
    ],
    work: [
      'आपका कोच बोल रहा हूँ। काम खुद नहीं होगा, और आने वाला आप आज के आप से शुरू करने की गुज़ारिश कर रहा है। टास्क खोलिए, पच्चीस मिनट का टाइमर लगाइए, और शुरू हो जाइए।',
      'गहरी सांस लीजिए। सब कुछ खत्म नहीं करना है — बस एक चीज़ शुरू करनी है। सबसे ज़रूरी काम चुनिए और अभी पूरा ध्यान लगाइए।',
      'आप बस एक फोकस सेशन दूर हैं अपने दिन पर कब्ज़ा करने से। फोन उल्टा रखिए, स्क्रीन पर एक टास्क, टाइमर चालू। चलिए।',
      'टालमटोल आरामदायक कपड़ों में छिपा डर है। काम जितना मुश्किल है, आप उससे ज़्यादा काबिल हैं। छोटी शुरुआत कीजिए, अभी कीजिए।'
    ],
    reminder: [
      'कोच की तरफ से एक छोटी याद। आपने यह रिमाइंडर किसी वजह से लगाया था, और वह वजह अभी भी मायने रखती है। दो मिनट निकालिए और अभी निपटा दीजिए।',
      'यह वही काम है जो आपने खुद से वादा किया था। आने वाला आप आज के आप पर भरोसा कर रहा है। अभी कर डालिए और हल्का महसूस कीजिए।',
      'छोटे काम टालने पर बड़ा तनाव बन जाते हैं। यह छोटा है। सामने है तभी निपटा दीजिए — पता भी नहीं चलेगा कब हो गया।'
    ],
    sleep: [
      'आपका कोच बोल रहा हूँ। कल के लिए सबसे ताक़तवर चीज़ है आज रात का आराम। स्क्रीन बंद, रोशनी धीमी, और शरीर को रिकवर होने दीजिए। नींद भी ट्रेनिंग है।',
      'चैंपियन मेहनत जितना ही रिकवरी से बनते हैं। अब आराम कीजिए — फोन दूर चार्ज पर लगाइए और पूरी नींद लीजिए।',
      'दिन खत्म हुआ और आपने पूरा साथ निभाया। अब कल की ऊर्जा बचाइए। रोशनी धीमी कीजिए, अलार्म लगाइए, और सो जाइए।'
    ]
  },
  mr: {
    gym: [
      'मी तुमचा कोच बोलतोय. जिम तुमची वाट पाहतंय आणि उद्याचे तुम्ही आजच्या तुम्हाला बघताय. उठा, बूट घाला, आणि एक जबरदस्त वर्कआउट करा. पूर्ण केलेल्या वर्कआउटचा कधीच पश्चाताप होत नाही.',
      'चॅम्पियन, निर्णयाची वेळ आली. तासभर फोन स्क्रोल करा, किंवा पंचेचाळीस मिनिटं ट्रेनिंग करून दिवसभर जोशात राहा. सामान उचला — आत्ता सुरुवात करू.',
      'मोटिव्हेशनपेक्षा शिस्त महत्त्वाची, आणि दारातून बाहेर पडायला फक्त दहा सेकंदांची शिस्त लागते. आधी निघा, विचार नंतर करा. तुमची स्ट्रीक पणाला लागली आहे.',
      'तुम्ही सुरुवात का केली ते आठवा. बळकट शरीर, शांत मन, चांगलं आयुष्य. हे सोफ्यावर बसून होणार नाही. आत्ता उठा आणि हे वर्कआउट पूर्ण करू.'
    ],
    work: [
      'मी तुमचा कोच. काम आपोआप होणार नाही, आणि उद्याचे तुम्ही आजच्या तुम्हाला सुरुवात करायची विनंती करताय. टास्क उघडा, पंचवीस मिनिटांचा टायमर लावा, आणि सुरू करा.',
      'दीर्घ श्वास घ्या. सगळं संपवायचं नाहीये — फक्त एक गोष्ट सुरू करायची आहे. सगळ्यात महत्त्वाचं काम निवडा आणि आत्ता पूर्ण लक्ष द्या.',
      'दिवसावर ताबा मिळवण्यापासून तुम्ही फक्त एक फोकस सेशन दूर आहात. फोन उलटा ठेवा, स्क्रीनवर एकच टास्क, टायमर सुरू. चला.',
      'चालढकल म्हणजे आरामदायक कपड्यांतली भीती. काम जितकं अवघड आहे त्यापेक्षा तुम्ही जास्त सक्षम आहात. छोटी सुरुवात करा, आत्ता करा.'
    ],
    reminder: [
      'कोचकडून एक छोटी आठवण. तुम्ही हा रिमाइंडर एका कारणासाठी लावला होता, आणि ते कारण अजूनही महत्त्वाचं आहे. दोन मिनिटं काढा आणि आत्ताच उरकून टाका.',
      'हेच ते काम जे तुम्ही स्वतःला कबूल केलं होतं. उद्याचे तुम्ही आजच्या तुमच्यावर विश्वास ठेवून आहेत. आत्ता करून टाका आणि हलकं वाटून घ्या.',
      'छोटी कामं पुढे ढकलली की मोठा ताण होतो. हे छोटं आहे. समोर आहे तोवरच उरकून टाका.'
    ],
    sleep: [
      'मी तुमचा कोच. उद्यासाठी सगळ्यात ताकदीची गोष्ट म्हणजे आज रात्रीची विश्रांती. स्क्रीन बंद, दिवे मंद, आणि शरीराला रिकव्हर होऊ द्या. झोपसुद्धा ट्रेनिंगच आहे.',
      'चॅम्पियन मेहनतीइतकेच रिकव्हरीतून घडतात. आता शांत व्हा — फोन लांब चार्जला लावा आणि पूर्ण झोप घ्या.',
      'दिवस संपला आणि तुम्ही पूर्ण साथ दिली. आता उद्याची ऊर्जा जपा. दिवे मंद करा, अलार्म लावा, आणि झोपी जा.'
    ]
  }
};

const STREAK_LINE: Record<CoachLanguage, (days: number) => string> = {
  en: (days) => ` You are on a ${days} day streak — do not break it today.`,
  hi: (days) => ` आपकी ${days} दिन की स्ट्रीक चल रही है — आज इसे मत तोड़िए।`,
  mr: (days) => ` तुमची ${days} दिवसांची स्ट्रीक सुरू आहे — आज ती तोडू नका.`
};

export function pickLocalMessage(
  type: MotivationType,
  name?: string,
  streakDays?: number,
  language: CoachLanguage = DEFAULT_LANGUAGE
): string {
  const bank = MOTIVATION_BANK[language][type];
  const base = bank[Math.floor(Math.random() * bank.length)];
  const greeting = name ? `${name.split(' ')[0]}, ` : '';
  const streakLine = streakDays && streakDays > 1 ? STREAK_LINE[language](streakDays) : '';
  return `${greeting}${base}${streakLine}`;
}

/** Encouraging local reply when the user talks back and the backend is unreachable. */
export function pickLocalReply(
  type: MotivationType,
  name?: string,
  language: CoachLanguage = DEFAULT_LANGUAGE
): string {
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
