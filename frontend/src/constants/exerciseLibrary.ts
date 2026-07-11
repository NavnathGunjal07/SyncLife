// Exercise metadata (name, target, equipment, step-by-step instructions).
// Media intentionally omitted: the ExerciseDB GIFs are not free to redistribute.

export type ExerciseInfo = {
  id: string;
  name: string;
  target: string;
  equipment: string;
  steps: string[];
};

export const EXERCISE_LIBRARY: Record<string, ExerciseInfo> = {
  "bench press": {
    id: "0025",
    name: "Barbell Bench Press",
    target: "Pectorals",
    equipment: "Barbell",
    steps: ["Lie flat on a bench with your feet flat on the ground and your back pressed against the bench.","Grasp the barbell with an overhand grip slightly wider than shoulder-width apart.","Lift the barbell off the rack and hold it directly above your chest with your arms fully extended.","Lower the barbell slowly towards your chest, keeping your elbows tucked in.","Pause for a moment when the barbell touches your chest.","Push the barbell back up to the starting position by extending your arms.","Repeat for the desired number of repetitions."]
  },
  "pushups": {
    id: "0662",
    name: "Push-Up",
    target: "Pectorals",
    equipment: "Body Weight",
    steps: ["Start in a high plank position with your hands slightly wider than shoulder-width apart and your feet together.","Engage your core and lower your body towards the ground by bending your elbows, keeping your body in a straight line.","Pause for a moment when your chest is just above the ground, then push yourself back up to the starting position by straightening your arms.","Repeat for the desired number of repetitions."]
  },
  "chest fly": {
    id: "0308",
    name: "Dumbbell Fly",
    target: "Pectorals",
    equipment: "Dumbbell",
    steps: ["Lie flat on a bench with a dumbbell in each hand, palms facing each other.","Extend your arms straight up over your chest, with a slight bend in your elbows.","Keeping a slight bend in your elbows, lower your arms out to the sides in a wide arc until you feel a stretch in your chest.","Pause for a moment, then reverse the movement and bring the dumbbells back up to the starting position.","Repeat for the desired number of repetitions."]
  },
  "tricep pushdown": {
    id: "0241",
    name: "Cable Triceps Pushdown (V-Bar)",
    target: "Triceps",
    equipment: "Cable",
    steps: ["Attach a v-bar attachment to the cable machine at the highest setting.","Stand facing the cable machine with your feet shoulder-width apart.","Grasp the v-bar with an overhand grip, palms facing down, and your hands shoulder-width apart.","Keep your elbows close to your sides and your upper arms stationary throughout the exercise.","Engage your triceps and exhale as you push the v-bar down until your arms are fully extended.","Pause for a moment at the bottom of the movement, squeezing your triceps.","Inhale as you slowly return the v-bar to the starting position, maintaining control.","Repeat for the desired number of repetitions."]
  },
  "pullups": {
    id: "0651",
    name: "Pull Up (Neutral Grip)",
    target: "Lats",
    equipment: "Body Weight",
    steps: ["Hang from a pull-up bar with a neutral grip (palms facing each other) and your arms fully extended.","Engage your core and squeeze your shoulder blades together.","Pull your body up towards the bar by bending your elbows and driving your elbows down towards your hips.","Continue pulling until your chin is above the bar.","Pause for a moment at the top, then slowly lower your body back down to the starting position with control.","Repeat for the desired number of repetitions."]
  },
  "barbell row": {
    id: "0027",
    name: "Barbell Bent Over Row",
    target: "Upper Back",
    equipment: "Barbell",
    steps: ["Stand with your feet shoulder-width apart and knees slightly bent.","Bend forward at the hips while keeping your back straight and chest up.","Grasp the barbell with an overhand grip, hands slightly wider than shoulder-width apart.","Pull the barbell towards your lower chest by retracting your shoulder blades and squeezing your back muscles.","Pause for a moment at the top, then slowly lower the barbell back to the starting position.","Repeat for the desired number of repetitions."]
  },
  "lat pulldown": {
    id: "2330",
    name: "Cable Lat Pulldown Full Range Of Motion",
    target: "Lats",
    equipment: "Cable",
    steps: ["Sit on the lat pulldown machine with your knees positioned under the pads.","Grasp the cable bar with an overhand grip, slightly wider than shoulder-width apart.","Lean back slightly and keep your chest up, maintaining a slight arch in your lower back.","Pull the bar down towards your upper chest, squeezing your shoulder blades together.","Pause for a moment at the bottom of the movement, then slowly release the bar back to the starting position.","Repeat for the desired number of repetitions."]
  },
  "bicep curl": {
    id: "0294",
    name: "Dumbbell Biceps Curl",
    target: "Biceps",
    equipment: "Dumbbell",
    steps: ["Stand up straight with a dumbbell in each hand, palms facing forward and arms fully extended.","Keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.","Continue to raise the weights until your biceps are fully contracted and the dumbbells are at shoulder level.","Hold the contracted position for a brief pause as you squeeze your biceps.","Inhale and slowly begin to lower the dumbbells back to the starting position.","Repeat for the desired number of repetitions."]
  },
  "squats": {
    id: "0043",
    name: "Barbell Full Squat",
    target: "Glutes",
    equipment: "Barbell",
    steps: ["Stand with your feet shoulder-width apart, toes slightly turned out.","Hold the barbell across your upper back, resting it on your traps or rear delts.","Engage your core and keep your chest up as you begin to lower your body down.","Bend at the knees and hips, pushing your hips back and down as if sitting into a chair.","Lower yourself until your thighs are parallel to the ground or slightly below.","Keep your knees in line with your toes and your weight in your heels.","Drive through your heels to stand back up, extending your hips and knees.","Repeat for the desired number of repetitions."]
  },
  "leg press": {
    id: "2287",
    name: "Lever Alternate Leg Press",
    target: "Quads",
    equipment: "Leverage Machine",
    steps: ["Adjust the seat and foot platform of the leverage machine to your desired position.","Sit on the machine with your back against the backrest and your feet on the foot platform.","Place your hands on the handles or sides of the machine for stability.","Push one foot against the foot platform, extending your leg until it is almost fully straight.","Pause for a moment, then slowly bend your leg and return to the starting position.","Repeat with the other leg.","Continue alternating legs for the desired number of repetitions."]
  },
  "lunges": {
    id: "1460",
    name: "Walking Lunge",
    target: "Glutes",
    equipment: "Body Weight",
    steps: ["Stand with your feet shoulder-width apart.","Take a step forward with your right leg, lowering your body into a lunge position.","Keep your torso upright and your front knee aligned with your ankle.","Push off with your right foot and bring your left foot forward, stepping into a lunge position with your left leg.","Continue alternating legs and walking forward, maintaining a controlled and steady pace.","Repeat for the desired number of repetitions."]
  },
  "calf raises": {
    id: "1373",
    name: "Bodyweight Standing Calf Raise",
    target: "Calves",
    equipment: "Body Weight",
    steps: ["Stand with your feet shoulder-width apart, toes pointing forward.","Place your hands on a wall or stable surface for balance.","Slowly raise your heels off the ground, lifting your body weight onto the balls of your feet.","Pause for a moment at the top, then slowly lower your heels back down to the starting position.","Repeat for the desired number of repetitions."]
  },
  "shoulder press": {
    id: "0405",
    name: "Dumbbell Seated Shoulder Press",
    target: "Delts",
    equipment: "Dumbbell",
    steps: ["Sit on a bench with a dumbbell in each hand, resting on your thighs.","Raise the dumbbells to shoulder height, palms facing forward.","Press the dumbbells upward until your arms are fully extended overhead.","Pause for a moment at the top, then slowly lower the dumbbells back to shoulder height.","Repeat for the desired number of repetitions."]
  },
  "lateral raise": {
    id: "0334",
    name: "Dumbbell Lateral Raise",
    target: "Delts",
    equipment: "Dumbbell",
    steps: ["Stand with your feet shoulder-width apart and hold a dumbbell in each hand, palms facing your body.","Keep your back straight and engage your core.","Raise your arms out to the sides until they are parallel to the floor, keeping a slight bend in your elbows.","Pause for a moment at the top, then slowly lower your arms back down to the starting position.","Repeat for the desired number of repetitions."]
  },
  "plank": {
    id: "0464",
    name: "Front Plank With Twist",
    target: "Abs",
    equipment: "Body Weight",
    steps: ["Start in a high plank position with your hands directly under your shoulders and your body in a straight line from head to toe.","Engage your core and glutes to maintain a stable position.","Rotate your torso to the right, lifting your right arm and extending it towards the ceiling.","Keep your hips and legs stable as you twist.","Hold for a moment, then return to the starting position.","Repeat the twist on the left side.","Continue alternating sides for the desired number of repetitions."]
  },
  "crunches": {
    id: "0274",
    name: "Crunch Floor",
    target: "Abs",
    equipment: "Body Weight",
    steps: ["Lie flat on your back with your knees bent and feet flat on the ground.","Place your hands behind your head with your elbows pointing outwards.","Engage your abs and lift your shoulders off the ground, curling forward towards your knees.","Pause for a moment at the top, then slowly lower your shoulders back down to the starting position.","Repeat for the desired number of repetitions."]
  },
  "full body hiit": {
    id: "1160",
    name: "Burpee",
    target: "Cardiovascular System",
    equipment: "Body Weight",
    steps: ["Start in a standing position with your feet shoulder-width apart.","Lower your body into a squat position by bending your knees and placing your hands on the floor in front of you.","Kick your feet back into a push-up position.","Perform a push-up, keeping your body in a straight line.","Jump your feet back into the squat position.","Jump up explosively, reaching your arms overhead.","Land softly and immediately lower back into a squat position to begin the next repetition."]
  },
  "running": {
    id: "3666",
    name: "Walking On Incline Treadmill",
    target: "Cardiovascular System",
    equipment: "Leverage Machine",
    steps: ["Adjust the incline level on the treadmill to your desired intensity.","Stand on the treadmill with your feet shoulder-width apart.","Start walking at a comfortable pace, ensuring that you maintain proper form.","Engage your core muscles and keep your back straight throughout the exercise.","Continue walking on the incline treadmill for the desired duration of your cardio workout.","Gradually decrease the incline and speed of the treadmill to cool down before stopping."]
  },
  "cycling": {
    id: "2331",
    name: "Cycle Cross Trainer",
    target: "Cardiovascular System",
    equipment: "Leverage Machine",
    steps: ["Adjust the seat height and position yourself on the cycle cross trainer.","Place your feet on the pedals and grip the handlebars.","Start pedaling in a smooth and controlled motion.","Maintain a steady pace and increase the resistance if desired.","Continue pedaling for the desired duration of your cardio workout."]
  },
  "stretching": {
    id: "1511",
    name: "Hamstring Stretch",
    target: "Hamstrings",
    equipment: "Body Weight",
    steps: ["Stand with your feet shoulder-width apart.","Step forward with your right foot and shift your weight onto your right leg.","Keeping your back straight, slowly bend forward at the hips, reaching towards your right foot with both hands.","Hold the stretch for 20-30 seconds, then return to the starting position.","Repeat on the other side."]
  },
  "decline pushups": {
    id: "0279",
    name: "Decline Push-Up",
    target: "Pectorals",
    equipment: "Body Weight",
    steps: ["Place your hands on the ground slightly wider than shoulder-width apart, with your feet elevated on a stable surface.","Keep your body in a straight line from head to toe, engaging your core muscles.","Lower your chest towards the ground by bending your elbows, keeping them close to your body.","Push through your palms to extend your arms and return to the starting position.","Repeat for the desired number of repetitions."]
  },
  "floor fly": {
    id: "0308",
    name: "Dumbbell Fly",
    target: "Pectorals",
    equipment: "Dumbbell",
    steps: ["Lie flat on a bench with a dumbbell in each hand, palms facing each other.","Extend your arms straight up over your chest, with a slight bend in your elbows.","Keeping a slight bend in your elbows, lower your arms out to the sides in a wide arc until you feel a stretch in your chest.","Pause for a moment, then reverse the movement and bring the dumbbells back up to the starting position.","Repeat for the desired number of repetitions."]
  },
  "chair dips": {
    id: "0129",
    name: "Bench Dip (Knees Bent)",
    target: "Triceps",
    equipment: "Body Weight",
    steps: ["Sit on the edge of a bench or chair with your hands gripping the edge next to your hips.","Slide your butt off the bench and straighten your legs in front of you, keeping your heels on the ground.","Bend your elbows and lower your body towards the ground, keeping your back close to the bench.","Pause for a moment at the bottom, then push yourself back up to the starting position.","Repeat for the desired number of repetitions."]
  },
  "towel rows": {
    id: "0499",
    name: "Inverted Row",
    target: "Upper Back",
    equipment: "Body Weight",
    steps: ["Set up a bar at waist height or use a suspension trainer.","Stand facing the bar or suspension trainer, with your feet shoulder-width apart.","Grab the bar or handles with an overhand grip, slightly wider than shoulder-width apart.","Lean back, keeping your body straight and your heels on the ground.","Pull your chest towards the bar or handles, squeezing your shoulder blades together.","Pause for a moment at the top, then slowly lower yourself back to the starting position.","Repeat for the desired number of repetitions."]
  },
  "backpack row": {
    id: "0293",
    name: "Dumbbell Bent Over Row",
    target: "Upper Back",
    equipment: "Dumbbell",
    steps: ["Stand with your feet shoulder-width apart, knees slightly bent, and hold a dumbbell in each hand with your palms facing your body.","Bend forward at the hips, keeping your back straight and your core engaged.","Let your arms hang straight down towards the floor, with your elbows slightly bent.","Pull the dumbbells up towards your chest, squeezing your shoulder blades together.","Pause for a moment at the top, then slowly lower the dumbbells back down to the starting position.","Repeat for the desired number of repetitions."]
  },
  "band pulldown": {
    id: "2330",
    name: "Cable Lat Pulldown Full Range Of Motion",
    target: "Lats",
    equipment: "Cable",
    steps: ["Sit on the lat pulldown machine with your knees positioned under the pads.","Grasp the cable bar with an overhand grip, slightly wider than shoulder-width apart.","Lean back slightly and keep your chest up, maintaining a slight arch in your lower back.","Pull the bar down towards your upper chest, squeezing your shoulder blades together.","Pause for a moment at the bottom of the movement, then slowly release the bar back to the starting position.","Repeat for the desired number of repetitions."]
  },
  "backpack curl": {
    id: "0294",
    name: "Dumbbell Biceps Curl",
    target: "Biceps",
    equipment: "Dumbbell",
    steps: ["Stand up straight with a dumbbell in each hand, palms facing forward and arms fully extended.","Keeping your upper arms stationary, exhale and curl the weights while contracting your biceps.","Continue to raise the weights until your biceps are fully contracted and the dumbbells are at shoulder level.","Hold the contracted position for a brief pause as you squeeze your biceps.","Inhale and slowly begin to lower the dumbbells back to the starting position.","Repeat for the desired number of repetitions."]
  },
  "bodyweight squats": {
    id: "0043",
    name: "Barbell Full Squat",
    target: "Glutes",
    equipment: "Barbell",
    steps: ["Stand with your feet shoulder-width apart, toes slightly turned out.","Hold the barbell across your upper back, resting it on your traps or rear delts.","Engage your core and keep your chest up as you begin to lower your body down.","Bend at the knees and hips, pushing your hips back and down as if sitting into a chair.","Lower yourself until your thighs are parallel to the ground or slightly below.","Keep your knees in line with your toes and your weight in your heels.","Drive through your heels to stand back up, extending your hips and knees.","Repeat for the desired number of repetitions."]
  },
  "pike pushups": {
    id: "3662",
    name: "Pike-To-Cobra Push-Up",
    target: "Glutes",
    equipment: "Body Weight",
    steps: ["Start in a push-up position with your hands slightly wider than shoulder-width apart and your feet together.","Engage your core and lift your hips up towards the ceiling, forming an inverted V shape with your body.","Lower your upper body towards the ground by bending your elbows, keeping them close to your body.","As you lower down, shift your weight forward and transition into a cobra pose by straightening your arms and lifting your chest up.","Reverse the movement by bending your elbows and lowering your chest back down towards the ground.","Push through your hands to return to the inverted V position.","Continue the movement by lowering your hips back down towards the ground, returning to the starting push-up position.","Repeat for the desired number of repetitions."]
  },
  "water bottle raise": {
    id: "0334",
    name: "Dumbbell Lateral Raise",
    target: "Delts",
    equipment: "Dumbbell",
    steps: ["Stand with your feet shoulder-width apart and hold a dumbbell in each hand, palms facing your body.","Keep your back straight and engage your core.","Raise your arms out to the sides until they are parallel to the floor, keeping a slight bend in your elbows.","Pause for a moment at the top, then slowly lower your arms back down to the starting position.","Repeat for the desired number of repetitions."]
  },
  "wall sit": {
    id: "c001",
    name: "Wall Sit",
    target: "Quads",
    equipment: "Body Weight",
    steps: ["Stand with your back flat against a wall and your feet about two feet in front of you, shoulder-width apart.","Slide down the wall until your thighs are parallel to the floor, knees at roughly ninety degrees.","Keep your back pressed into the wall and your weight in your heels.","Hold the position for the target time, breathing steadily.","Push through your heels to slide back up and rest."]
  },
  "incline dumbbell press": {
    id: "c002",
    name: "Incline Dumbbell Press",
    target: "Upper Chest",
    equipment: "Dumbbell",
    steps: ["Set a bench to a thirty to forty-five degree incline and sit back with a dumbbell in each hand at shoulder level.","Plant your feet and press your back into the bench.","Press the dumbbells up and slightly together until your arms are extended.","Pause briefly at the top, then lower the dumbbells back to shoulder level with control.","Repeat for the desired number of repetitions."]
  },
  "wide pushups": {
    id: "c003",
    name: "Wide Push-Up",
    target: "Pectorals",
    equipment: "Body Weight",
    steps: ["Start in a high plank with your hands placed noticeably wider than shoulder-width.","Keep your body in a straight line from head to heels and brace your core.","Lower your chest towards the floor by bending your elbows out to the sides.","Pause just above the floor, then press back up to the start.","Repeat for the desired number of repetitions."]
  },
  "overhead tricep extension": {
    id: "c004",
    name: "Dumbbell Overhead Triceps Extension",
    target: "Triceps",
    equipment: "Dumbbell",
    steps: ["Sit or stand tall holding one dumbbell with both hands overhead, arms extended.","Keep your elbows close to your head and pointing forward.","Lower the dumbbell behind your head by bending your elbows.","Pause when your forearms go just past parallel, then extend your arms back to the top.","Repeat for the desired number of repetitions."]
  },
  "diamond pushups": {
    id: "c005",
    name: "Diamond Push-Up",
    target: "Triceps",
    equipment: "Body Weight",
    steps: ["Start in a high plank with your hands together under your chest, thumbs and index fingers forming a diamond.","Keep your elbows tucked close to your body and your core braced.","Lower your chest towards your hands with control.","Press back up to the starting position without flaring your elbows.","Repeat for the desired number of repetitions."]
  },
  "deadlift": {
    id: "c006",
    name: "Barbell Deadlift",
    target: "Posterior Chain",
    equipment: "Barbell",
    steps: ["Stand with your mid-foot under the barbell, feet hip-width apart.","Hinge at the hips and grip the bar just outside your knees, back flat and chest up.","Take a breath, brace your core, and pull your slack out of the bar.","Drive through your heels and stand up, keeping the bar close to your body.","Lock out with hips and knees extended, then lower the bar back down with a controlled hinge.","Repeat for the desired number of repetitions."]
  },
  "backpack deadlift": {
    id: "c007",
    name: "Backpack Deadlift",
    target: "Posterior Chain",
    equipment: "Loaded Backpack",
    steps: ["Load a backpack with books or bottles and place it between your feet.","Hinge at the hips with a flat back and grip the backpack handle with both hands.","Brace your core and drive through your heels to stand tall.","Squeeze your glutes at the top, then lower the backpack back down with a controlled hinge.","Repeat for the desired number of repetitions."]
  },
  "hammer curl": {
    id: "c008",
    name: "Dumbbell Hammer Curl",
    target: "Biceps",
    equipment: "Dumbbell",
    steps: ["Stand tall with a dumbbell in each hand, palms facing your body (neutral grip).","Keep your elbows pinned to your sides.","Curl the weights up towards your shoulders without rotating your wrists.","Squeeze at the top, then lower back down slowly.","Repeat for the desired number of repetitions."]
  },
  "backpack hammer curl": {
    id: "c009",
    name: "Backpack Hammer Curl",
    target: "Biceps",
    equipment: "Loaded Backpack",
    steps: ["Hold a loaded backpack by its top handle with one or both hands, palm facing inward.","Keep your elbows pinned to your sides.","Curl the backpack up towards your shoulder without swinging.","Squeeze at the top, then lower back down slowly.","Repeat for the desired number of repetitions."]
  },
  "romanian deadlift": {
    id: "c010",
    name: "Romanian Deadlift",
    target: "Hamstrings",
    equipment: "Barbell",
    steps: ["Stand tall holding a barbell or dumbbells in front of your thighs.","With a slight bend in your knees, push your hips back and lower the weight down your legs.","Keep your back flat and the weight close to your body.","Lower until you feel a deep stretch in your hamstrings, around mid-shin.","Drive your hips forward to return to standing, squeezing your glutes at the top.","Repeat for the desired number of repetitions."]
  },
  "backpack rdl": {
    id: "c011",
    name: "Backpack Romanian Deadlift",
    target: "Hamstrings",
    equipment: "Loaded Backpack",
    steps: ["Stand tall holding a loaded backpack in front of your thighs.","With a slight bend in your knees, push your hips back and lower the backpack down your legs.","Keep your back flat and the load close to your body.","Lower until you feel a deep hamstring stretch, then drive your hips forward to stand.","Repeat for the desired number of repetitions."]
  },
  "glute bridge": {
    id: "c012",
    name: "Glute Bridge",
    target: "Glutes",
    equipment: "Body Weight",
    steps: ["Lie on your back with your knees bent and feet flat on the floor, hip-width apart.","Place your arms at your sides, palms down.","Drive through your heels and lift your hips until your body forms a straight line from shoulders to knees.","Squeeze your glutes hard at the top for a second.","Lower your hips back down with control.","Repeat for the desired number of repetitions."]
  },
  "step ups": {
    id: "c013",
    name: "Step-Up",
    target: "Quads",
    equipment: "Body Weight",
    steps: ["Stand facing a sturdy bench, box, or stair.","Place your right foot fully on the surface.","Drive through your right heel to lift your body up until the right leg is straight.","Step back down with control and repeat on the left leg.","Continue alternating legs for the desired number of repetitions."]
  },
  "front raise": {
    id: "c014",
    name: "Dumbbell Front Raise",
    target: "Front Delts",
    equipment: "Dumbbell",
    steps: ["Stand with a dumbbell in each hand resting in front of your thighs, palms facing you.","Keep a slight bend in your elbows and your core braced.","Raise one or both arms straight in front of you to shoulder height.","Pause briefly, then lower back down with control.","Repeat for the desired number of repetitions."]
  },
  "water bottle front raise": {
    id: "c015",
    name: "Water Bottle Front Raise",
    target: "Front Delts",
    equipment: "Water Bottles",
    steps: ["Stand with a filled water bottle in each hand resting in front of your thighs.","Keep a slight bend in your elbows and your core braced.","Raise your arms straight in front of you to shoulder height.","Pause briefly, then lower back down with control.","Repeat for the desired number of repetitions."]
  },
  "rear delt fly": {
    id: "c016",
    name: "Dumbbell Rear Delt Fly",
    target: "Rear Delts",
    equipment: "Dumbbell",
    steps: ["Hold a dumbbell in each hand and hinge forward at the hips until your chest is nearly parallel to the floor.","Let your arms hang down with a slight bend in your elbows, palms facing each other.","Raise your arms out to the sides, squeezing your shoulder blades together.","Pause at the top, then lower back down with control.","Repeat for the desired number of repetitions."]
  },
  "water bottle rear fly": {
    id: "c017",
    name: "Water Bottle Rear Fly",
    target: "Rear Delts",
    equipment: "Water Bottles",
    steps: ["Hold a filled water bottle in each hand and hinge forward at the hips, back flat.","Let your arms hang down with a slight bend in your elbows.","Raise your arms out to the sides, squeezing your shoulder blades together.","Pause at the top, then lower back down with control.","Repeat for the desired number of repetitions."]
  },
  "russian twists": {
    id: "c018",
    name: "Russian Twist",
    target: "Obliques",
    equipment: "Body Weight",
    steps: ["Sit on the floor with your knees bent and heels lightly touching the ground.","Lean back slightly so your torso is at about forty-five degrees, core braced.","Clasp your hands (or hold a weight) in front of your chest.","Rotate your torso to the right, then to the left — that is one repetition.","Keep the movement controlled and your chest up throughout.","Repeat for the desired number of repetitions."]
  },
  "leg raises": {
    id: "c019",
    name: "Lying Leg Raise",
    target: "Lower Abs",
    equipment: "Body Weight",
    steps: ["Lie flat on your back with your legs straight and hands under your hips for support.","Press your lower back into the floor and brace your core.","Raise your legs together until they point at the ceiling.","Lower them slowly until they hover just above the floor without arching your back.","Repeat for the desired number of repetitions."]
  },
  "mountain climbers": {
    id: "c020",
    name: "Mountain Climber",
    target: "Core & Cardio",
    equipment: "Body Weight",
    steps: ["Start in a high plank with your hands under your shoulders.","Keep your core tight and your back flat.","Drive your right knee towards your chest, then quickly switch legs.","Continue alternating legs at a running pace while keeping your hips level.","Continue for the target time."]
  },
  "burpees": {
    id: "1160",
    name: "Burpee",
    target: "Full Body",
    equipment: "Body Weight",
    steps: ["Start standing with your feet shoulder-width apart.","Squat down and place your hands on the floor in front of you.","Kick your feet back into a push-up position and perform one push-up.","Jump your feet back towards your hands.","Explode up into a jump, reaching your arms overhead.","Land softly and go straight into the next repetition."]
  },
  "jumping jacks": {
    id: "c021",
    name: "Jumping Jack",
    target: "Full Body",
    equipment: "Body Weight",
    steps: ["Stand upright with your feet together and arms at your sides.","Jump your feet out wide while swinging your arms overhead.","Jump back to the starting position, bringing your arms down.","Keep a steady rhythm and land softly on the balls of your feet.","Continue for the target time."]
  },
  "jump rope": {
    id: "c022",
    name: "Jump Rope",
    target: "Cardiovascular System",
    equipment: "Jump Rope",
    steps: ["Hold the rope handles at hip height with the rope behind your heels.","Swing the rope overhead using your wrists, not your arms.","Jump just high enough for the rope to pass under your feet, landing softly on the balls of your feet.","Keep your elbows close to your sides and your gaze forward.","Continue at a steady rhythm for the target time."]
  },
};

export function findExerciseInfo(name?: string): ExerciseInfo | undefined {
  if (!name) return undefined;
  return EXERCISE_LIBRARY[name.trim().toLowerCase()];
}
