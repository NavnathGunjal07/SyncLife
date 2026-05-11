# LifeTracker AI

AI-powered self tracking mobile app built with React Native + Expo.

Track:

* Calories
* Indian meals
* Workout
* Water intake
* Money
* Gold investments

All data is synced automatically with Google Sheets.

---

# Features

## Health Tracking

* Auto calorie calculation
* Protein tracking
* Indian meal suggestions
* Water intake tracking
* Daily health goals

## Workout System

* 6-day workout split
* 1 rest day
* Home and gym workouts
* Calories burned tracking
* Workout reminders

## Finance Tracking

* Expense tracking
* Income tracking
* Budget monitoring
* Gold investment tracking

## AI Features

* Daily meal suggestions
* Daily workout recommendations
* Smart calorie goals
* Daily summaries

## Cloud Sync

* Google Login
* Google Sheets integration
* Google Drive backup

---

# Tech Stack

## Frontend

* React Native
* Expo
* TypeScript

## Backend

* Firebase Authentication
* Firebase Firestore

## APIs

* Google Sheets API
* Google Drive API

## State Management

* Zustand / Redux Toolkit

## UI

* React Native Paper
* NativeWind / Tailwind

---

# Folder Structure

```bash
/src
  /components
  /screens
  /navigation
  /services
  /hooks
  /constants
  /types
  /utils
  /assets
```

---

# Installation

## 1. Clone Repository

```bash
git clone https://github.com/yourusername/lifetracker-ai.git

cd lifetracker-ai
```

---

## 2. Install Dependencies

```bash
npm install
```

or

```bash
yarn install
```

---

# Install Expo CLI

```bash
npm install -g expo-cli
```

---

# Start Development Server

```bash
npx expo start
```

---

# Run on Android

```bash
npx expo run:android
```

---

# Run on iOS

```bash
npx expo run:ios
```

---

# Environment Variables

Create `.env` file in root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
```

---

# Firebase Setup

## Step 1

Create Firebase project:
https://console.firebase.google.com/

---

## Step 2

Enable:

* Authentication
* Firestore Database

---

## Step 3

Enable Google Authentication:
Authentication → Sign-in Method → Google

---

## Step 4

Copy Firebase config into `.env`

---

# Google Sheets API Setup

## Step 1

Open:
https://console.cloud.google.com/

---

## Step 2

Enable APIs:

* Google Sheets API
* Google Drive API

---

## Step 3

Create OAuth Credentials

---

## Step 4

Add OAuth Client IDs into `.env`

---

# App Flow

## First Launch

1. User signs in with Google
2. App requests Sheets permissions
3. App automatically creates sheets:

   * Calories
   * Workout
   * Water
   * Money
   * Gold
   * Goals
   * Daily Summary

---

# Main Screens

## Dashboard

Shows:

* Calories remaining
* Workout progress
* Water progress
* Expenses
* Gold value
* Daily streak

---

## Meals Screen

Features:

* Indian meal database
* Auto calorie calculation
* Protein tracking

Hardcoded meal examples:

```ts
const meals = [
  {
    name: "Poha",
    calories: 250,
    protein: 6
  },
  {
    name: "Dal Rice",
    calories: 450,
    protein: 12
  },
  {
    name: "Chicken Curry",
    calories: 700,
    protein: 40
  }
]
```

---

## Workout Screen

Weekly split:

### Monday

Chest + Triceps

### Tuesday

Back + Biceps

### Wednesday

Legs

### Thursday

Shoulders + Abs

### Friday

Full Body

### Saturday

Cardio

### Sunday

Rest

Hardcoded workout example:

```ts
const mondayWorkout = [
  "Bench Press",
  "Pushups",
  "Chest Fly",
  "Tricep Pushdown"
]
```

---

## Water Tracker

Features:

* Daily water goals
* Quick add buttons
* Notifications

Formula:

```ts
waterGoal = weight * 35
```

---

## Money Tracker

Expense categories:

* Food
* Travel
* Bills
* Shopping
* EMI

Income categories:

* Salary
* Freelance
* Investment

---

## Gold Tracker

Track:

* Gold bought
* Gold sold
* Digital gold
* SIP investments

Fields:

* Grams
* Buy price
* Current value

---

# Google Sheets Structure

## Calories Sheet

| Date | Meal | Calories | Protein |
| ---- | ---- | -------- | ------- |

---

## Workout Sheet

| Date | Workout | Duration | Calories Burned |
| ---- | ------- | -------- | --------------- |

---

## Water Sheet

| Date | Intake | Goal |
| ---- | ------ | ---- |

---

## Money Sheet

| Date | Category | Amount | Type |
| ---- | -------- | ------ | ---- |

---

## Gold Sheet

| Date | Type | Grams | Value |
| ---- | ---- | ----- | ----- |

---

# Notifications

Daily reminders:

* Drink water
* Log meals
* Complete workout
* Update expenses

Night reminder:
“Complete today’s tracking.”

---

# Future Features

* AI Coach
* Food image scanner
* Voice logging
* Sleep tracking
* Smartwatch sync
* Barcode scanner
* Live gold prices

---

# Recommended Packages

```bash
npm install react-native-paper
npm install @react-navigation/native
npm install react-native-reanimated
npm install zustand
npm install firebase
npm install expo-auth-session
npm install react-native-chart-kit
npm install react-native-svg
```

---

# Build APK

```bash
eas build -p android
```

---

# Build iOS

```bash
eas build -p ios
```

---

# License

MIT License

---

# App Vision

LifeTracker AI is designed to become an all-in-one personal operating system for:

* Fitness
* Nutrition
* Finance
* Investments
* Daily discipline

Built for simplicity, consistency, and long-term self improvement.
