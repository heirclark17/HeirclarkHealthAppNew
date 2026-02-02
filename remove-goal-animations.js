// Script to remove animations from goal wizard components
// This documents what needs to be changed

const componentsToFix = [
  {
    file: 'components/goals/PrimaryGoalStep.tsx',
    changes: [
      'Remove Animated imports',
      'Replace Animated.View with View',
      'Replace Animated.Text with Text',
      'Remove useSharedValue, useAnimatedStyle',
      'Remove withSpring, withTiming calls',
      'Replace animated styles with static conditional styles'
    ]
  },
  {
    file: 'components/goals/PlanPreviewStep.tsx',
    changes: [
      'Remove all number counting animations',
      'Display numbers directly without animation',
      'Remove Animated.Text components'
    ]
  },
  {
    file: 'components/goals/SuccessScreen.tsx',
    changes: [
      'Remove confetti animations',
      'Remove entrance animations',
      'Remove all Animated components'
    ]
  },
  {
    file: 'components/goals/CoachingModal.tsx',
    changes: [
      'Remove modal entrance/exit animations',
      'Static modal display'
    ]
  },
  {
    file: 'components/goals/PlanSummaryCard.tsx',
    changes: [
      'Remove card animations',
      'Static card display'
    ]
  },
  {
    file: 'components/goals/NutritionPreferencesStep.tsx',
    changes: [
      'Remove selection animations',
      'Static selection states'
    ]
  },
  {
    file: 'components/goals/ActivityLifestyleStep.tsx',
    changes: [
      'Remove selection animations',
      'Static selection states'
    ]
  }
];

console.log('Goal Wizard Animation Removal Plan:');
console.log('====================================\n');

componentsToFix.forEach((component, index) => {
  console.log(`${index + 1}. ${component.file}`);
  component.changes.forEach(change => {
    console.log(`   - ${change}`);
  });
  console.log('');
});

console.log('Total components: ' + componentsToFix.length);
