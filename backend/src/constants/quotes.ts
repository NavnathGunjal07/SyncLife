// A compact motivation bank for the chat coach: grounds the AI with real quotes
// to weave into conversational replies, and powers a friendly fallback reply when
// the AI provider is unavailable.

export interface Quote {
  text: string;
  author: string;
}

export const MOTIVATION_QUOTES: Quote[] = [
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Motivation gets you started. Habit keeps you going.', author: 'Jim Ryun' },
  { text: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
  { text: 'You do not have to be extreme, just consistent.', author: 'Unknown' },
  { text: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Do something today that your future self will thank you for.', author: 'Sean Patrick Flanery' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb' },
  { text: 'Energy and persistence conquer all things.', author: 'Benjamin Franklin' },
  { text: 'The pain you feel today will be the strength you feel tomorrow.', author: 'Unknown' },
  { text: 'Consistency is what transforms average into excellence.', author: 'Unknown' },
  { text: 'A little progress each day adds up to big results.', author: 'Unknown' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'You are one workout away from a good mood.', author: 'Unknown' },
  { text: 'Be stronger than your strongest excuse.', author: 'Unknown' },
  { text: 'Hard work beats talent when talent does not work hard.', author: 'Tim Notke' },
  { text: 'Your future is created by what you do today, not tomorrow.', author: 'Robert Kiyosaki' },
  { text: 'Do not stop when you are tired. Stop when you are done.', author: 'Unknown' },
  { text: 'Progress, not perfection.', author: 'Unknown' },
  { text: 'You will never always be motivated. You have to learn to be disciplined.', author: 'Unknown' },
  { text: 'One day or day one. You decide.', author: 'Unknown' },
  { text: 'Dripping water hollows out stone, not through force but through persistence.', author: 'Ovid' },
  { text: 'What you do every day matters more than what you do once in a while.', author: 'Gretchen Rubin' },
  { text: 'Your body can stand almost anything. It is your mind you have to convince.', author: 'Unknown' },
  { text: 'When you feel like quitting, think about why you started.', author: 'Unknown' },
  { text: 'Habits are the compound interest of self-improvement.', author: 'James Clear' },
  { text: 'Every action you take is a vote for the person you wish to become.', author: 'James Clear' },
  { text: 'Be so consistent that quitting is not an option.', author: 'Unknown' },
  { text: 'Persistence guarantees that results are inevitable.', author: 'Paramahansa Yogananda' },
  { text: 'Believe you can and you are halfway there.', author: 'Theodore Roosevelt' },
  { text: 'You are not going to master the rest of your life in one day. Just master the day.', author: 'Unknown' },
  { text: 'A goal without consistency is just a wish.', author: 'Unknown' },
  { text: 'Little by little, a little becomes a lot.', author: 'Tanzanian Proverb' },
  { text: 'Your only competition is who you were yesterday.', author: 'Unknown' },
  { text: 'You have survived 100% of your hardest days. Keep going.', author: 'Unknown' },
  { text: 'Trust the process and keep stacking days.', author: 'Unknown' }
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

export const getRandomQuote = (): Quote => MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)] as Quote;

export const getRandomQuotes = (n: number): Quote[] => shuffle(MOTIVATION_QUOTES).slice(0, n);
