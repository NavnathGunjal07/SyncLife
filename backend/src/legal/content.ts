/**
 * Terms of Service + Privacy Policy — the single source of truth.
 *
 * Served as public HTML by legalRoutes (Play Console needs a public privacy
 * policy URL and an account-deletion URL) and rendered inside the app's
 * LegalScreen via WebView. Bump LEGAL_VERSION whenever the substance changes —
 * the app re-asks existing users to accept when its bundled version differs.
 */

export const LEGAL_VERSION = '2026-10-10';
export const EFFECTIVE_DATE = '10 October 2026';
export const APP_NAME = 'SyncLife';
// Developer / data controller named in the documents (and the Play listing).
export const DEVELOPER_NAME = 'Navnath Gunjal';
// Shown publicly as the privacy / account-deletion contact. The SUPPORT_EMAIL env
// var can override it per deployment.
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'gunjalnavnath50@gmail.com';

export type LegalSection = { heading: string; paragraphs: string[]; bullets?: string[] };
export type LegalDoc = { title: string; intro: string; sections: LegalSection[] };

export const PRIVACY_POLICY: LegalDoc = {
  title: 'Privacy Policy',
  intro: `${APP_NAME} is developed and operated by ${DEVELOPER_NAME} ("we", "us"). This policy explains what ${APP_NAME} collects, why, who it is shared with, and how you can delete it. ${APP_NAME} does not show ads, does not use third-party analytics or tracking SDKs, and never sells your data.`,
  sections: [
    {
      heading: '1. Information you give us',
      paragraphs: ['When you create an account and use the app we store:'],
      bullets: [
        'Account details: your name, username and password (stored only as a one-way bcrypt hash).',
        'Health & fitness data: weight, height, fitness goal, calorie and water targets, dietary preferences and foods you avoid, meals, workouts, water intake, habits and daily summaries.',
        'Financial notes: expenses, monthly budget and gold holdings you enter manually. We never ask for or store bank, card or payment credentials.',
        'AI coach content: messages you send to the in-app coach, its replies, and "memories" the coach saves about your preferences (you can view and remove these in Profile).',
        'Coach call settings: alarm times, ringtone and language.'
      ]
    },
    {
      heading: '2. Information collected from your device',
      paragraphs: ['Only with your permission, and only for the feature that needs it:'],
      bullets: [
        'Physical activity (step counter): used to show your daily step count while the app is open. Steps are stored on your device only and are not uploaded.',
        'Notifications: used for reminders, coach calls and the ongoing progress notification.'
      ],
      // Keep this in sync with app.json — Play reviewers compare the two.
      // (No microphone, camera, location, contacts or storage access is requested.)
    },
    {
      heading: '3. How we use your information',
      paragraphs: [
        'To provide the app’s features: tracking, progress summaries, streaks, reminders, personalised workout and meal suggestions and the AI coach. To keep your account secure. We do not use your data for advertising and do not build profiles for anyone other than you.'
      ]
    },
    {
      heading: '4. Sharing & third-party services',
      paragraphs: ['We share data only with the service providers needed to run the app:'],
      bullets: [
        'Groq (AI model provider): your coach messages and the relevant profile/tracking context are sent to Groq to generate replies and coach-call messages. They are processed to produce a response and are not used by us for any other purpose.',
        'Hosting & database providers: our servers and PostgreSQL database store your account data.',
        'YouTube: exercise demo videos are embedded from YouTube. When you play one, YouTube/Google may collect data under the Google Privacy Policy.'
      ]
    },
    {
      heading: '5. Security',
      paragraphs: [
        'Data is sent over encrypted connections (HTTPS) in production, passwords are hashed, and each request is authenticated with a signed token. No method of storage or transmission is perfectly secure, but we take reasonable measures to protect your data.'
      ]
    },
    {
      heading: '6. Retention & deletion',
      paragraphs: [
        'We keep your data for as long as your account exists. You can delete your account at any time in the app under Profile → Delete account. This permanently deletes your account and all associated personal data (profile, logs, habits, finances, chat history, memories, alarms and reports) from our database immediately. Data stored only on your device is cleared at the same time.',
        'Before deletion we record one anonymous statistics entry that cannot identify you: how many meals, workouts, water and habit entries, expenses and coach messages you logged (counts only — never their contents or amounts), the number of days you were active, your general preferences (fitness goal, diet type, workout location and level, fasting plan), a broad BMI category (e.g. “normal”) instead of your weight or height, your longest streak, and the month you joined and left. It contains no name, username, account ID, exact dates, messages, notes or financial amounts, and is not linked to you in any way. We use it only to understand how the app is used and improve it.',
        `If you can no longer access the app, email ${SUPPORT_EMAIL} from any address with your username and the subject "Delete my account"; we will verify ownership and delete it within 30 days.`
      ]
    },
    {
      heading: '7. Your choices & rights',
      paragraphs: [
        'You can view and edit your data in the app, revoke any permission at any time in Android Settings → Apps → ' +
          APP_NAME +
          ' → Permissions (features that need it will simply stop working), and request a copy or deletion of your data by contacting us. Depending on where you live (for example under GDPR or India’s DPDP Act) you may have additional rights, which we will honour.'
      ]
    },
    {
      heading: '8. Children',
      paragraphs: [
        `${APP_NAME} is not directed at children under 13 and we do not knowingly collect their data. If you believe a child has created an account, contact us and we will delete it.`
      ]
    },
    {
      heading: '9. Changes',
      paragraphs: [
        'If we change this policy we will update the effective date and, for material changes, ask you to review and accept it in the app.'
      ]
    },
    {
      heading: '10. Contact',
      paragraphs: [`${DEVELOPER_NAME} — questions or requests: ${SUPPORT_EMAIL}`]
    }
  ]
};

export const TERMS_OF_SERVICE: LegalDoc = {
  title: 'Terms of Service',
  intro: `These Terms are an agreement between you and ${DEVELOPER_NAME}, the developer of ${APP_NAME}. By creating an account or using ${APP_NAME} you agree to these Terms and to our Privacy Policy. If you do not agree, please do not use the app.`,
  sections: [
    {
      heading: '1. Eligibility & your account',
      paragraphs: [
        'You must be at least 13 years old (or the minimum age in your country) to use the app. You are responsible for keeping your password secure and for activity on your account. Provide accurate information and do not impersonate anyone.'
      ]
    },
    {
      heading: '2. Not medical or financial advice',
      paragraphs: [
        `${APP_NAME} is a personal tracking and motivation tool. Calorie estimates, workout plans, meal suggestions, water targets and AI coach responses are general information only — they are not medical, nutritional, fitness or financial advice and are not a substitute for a qualified professional. Consult a doctor before starting a new diet or exercise programme, especially if you have a medical condition, are pregnant, or are injured. Stop exercising and seek help if you feel pain, dizziness or shortness of breath. Finance features are for your own record-keeping only.`
      ]
    },
    {
      heading: '3. AI-generated content',
      paragraphs: [
        'The AI coach generates responses automatically. They can be inaccurate, incomplete or inappropriate, so use your own judgement and do not rely on them for important decisions. If you see an offensive or harmful response, long-press it and choose "Report" — we review reports and use them to improve safety.'
      ]
    },
    {
      heading: '4. Acceptable use',
      paragraphs: ['You agree not to:'],
      bullets: [
        'use the app for anything unlawful, or to generate content that is hateful, harassing, sexually explicit, violent, or that promotes self-harm;',
        'attempt to break, overload, reverse-engineer or gain unauthorised access to the app or its servers;',
        'use automated means to access the service or to extract data from it;',
        'use the app to harm yourself or others.'
      ]
    },
    {
      heading: '5. Your content',
      paragraphs: [
        'You own the data you enter. You give us permission to store and process it solely to operate the app for you, as described in the Privacy Policy.'
      ]
    },
    {
      heading: '6. Third-party content',
      paragraphs: [
        'Exercise videos are embedded from YouTube and are subject to YouTube’s Terms of Service. We are not responsible for third-party content.'
      ]
    },
    {
      heading: '7. Availability & changes',
      paragraphs: [
        'The app is provided "as is" and "as available". We may change, suspend or discontinue features at any time. We may update these Terms; for material changes we will ask you to accept the new version in the app.'
      ]
    },
    {
      heading: '8. Termination',
      paragraphs: [
        'You may stop using the app and delete your account at any time from Profile → Delete account. We may suspend accounts that violate these Terms.'
      ]
    },
    {
      heading: '9. Limitation of liability',
      paragraphs: [
        `To the maximum extent permitted by law, ${APP_NAME} and its developer, ${DEVELOPER_NAME}, are not liable for any indirect, incidental or consequential damages, or for any injury, health outcome or financial loss arising from your use of the app or reliance on its content. Nothing in these Terms limits rights you have under applicable consumer-protection law.`
      ]
    },
    {
      heading: '10. Contact',
      paragraphs: [`${DEVELOPER_NAME} — questions about these Terms: ${SUPPORT_EMAIL}`]
    }
  ]
};

export const DELETE_ACCOUNT_PAGE: LegalDoc = {
  title: `Delete your ${APP_NAME} account`,
  intro: `You can permanently delete your ${APP_NAME} account and all its data at any time.`,
  sections: [
    {
      heading: 'In the app (fastest)',
      paragraphs: ['Open SyncLife → Profile tab → scroll to "Legal & privacy" → Delete account, then confirm with your password. Deletion is immediate.']
    },
    {
      heading: 'Without the app',
      paragraphs: [
        `Email ${SUPPORT_EMAIL} with the subject "Delete my account" and include your username. We will verify that you own the account and delete it within 30 days.`
      ]
    },
    {
      heading: 'What gets deleted',
      paragraphs: [
        'All personal data: your account, name, username and password, profile and goals, meal/workout/water/habit logs, expenses and gold entries, daily summaries, coach alarms, AI chat history and saved memories, and any content reports you submitted.'
      ]
    },
    {
      heading: 'What is kept (anonymous only)',
      paragraphs: ['Before deletion we record one anonymous statistics entry that cannot identify you: how many meals, workouts, water and habit entries, expenses and coach messages you logged (counts only — never their contents or amounts), the number of days you were active, your general preferences (fitness goal, diet type, workout location and level, fasting plan), a broad BMI category (e.g. “normal”) instead of your weight or height, your longest streak, and the month you joined and left. It contains no name, username, account ID, exact dates, messages, notes or financial amounts, and is not linked to you in any way. We use it only to understand how the app is used and improve it.']
    }
  ]
};
