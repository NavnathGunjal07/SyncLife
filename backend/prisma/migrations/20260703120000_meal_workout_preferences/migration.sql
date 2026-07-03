-- Meal + workout customization: dietary preference (veg/non-veg) and default training prefs.

ALTER TABLE "UserProfile" ADD COLUMN "dietaryPreference" TEXT NOT NULL DEFAULT 'veg';
ALTER TABLE "UserProfile" ADD COLUMN "avoidFoods" TEXT NOT NULL DEFAULT '';
ALTER TABLE "UserProfile" ADD COLUMN "workoutMode" TEXT NOT NULL DEFAULT 'Home';
ALTER TABLE "UserProfile" ADD COLUMN "workoutLevel" TEXT NOT NULL DEFAULT 'Beginner';
