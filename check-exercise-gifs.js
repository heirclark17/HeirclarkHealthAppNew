// Quick script to check if exercises have gifUrl
const exercises = [
  {
    id: "0001",
    name: "3/4 sit-up",
    bodyPart: "waist",
    target: "abs",
    equipment: "body weight",
    gifUrl: "https://v2.exercisedb.io/image/0001",
    instructions: [],
    secondaryMuscles: []
  }
];

console.log('Sample exercise gifUrl:', exercises[0].gifUrl);
console.log('URL format:', exercises[0].gifUrl.startsWith('https://'));
