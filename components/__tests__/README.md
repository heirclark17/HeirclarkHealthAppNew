# Component Tests Summary

## Overview

This directory contains **18 comprehensive test files** covering core UI components of the Heirclark Health App.

## Test Coverage

### Group 1: Foundational Components (5 tests)
1. **RoundedNumeral.test.tsx** - 15 tests ✅ ALL PASSING
   - Number formatting with commas
   - Decimal handling
   - Unit display
   - Size variants
   - Accessibility

2. **NumberText.test.tsx** - 14 tests
   - SF Pro Rounded font rendering
   - Weight variants
   - Custom styling

3. **CircularGauge.test.tsx** - 15 tests
   - SVG gauge rendering
   - Progress calculation
   - Accessibility features
   - Theme support

4. **SemiCircularGauge.test.tsx** - 17 tests
   - Semi-circular progress arc
   - Center value display
   - Goal text formatting

5. **ErrorBoundary.test.tsx** - 14 tests
   - Error catching
   - Fallback UI
   - Reset functionality

### Group 2: Dashboard Cards (8 tests)
6. **ActiveEnergyCard.test.tsx** - 15 tests
   - Energy display
   - Modal interaction
   - Progress calculation

7. **StepsCard.test.tsx** - 15 tests
   - Step count display
   - Goal tracking
   - Modal functionality

8. **WaterTrackingCard.test.tsx** - 18 tests
   - Water intake tracking
   - AsyncStorage integration
   - Goal completion

9. **CalendarCard.test.tsx** - 14 tests
   - Date selection
   - Week navigation
   - Future date blocking

10. **WeeklyProgressCard.test.tsx** - 15 tests
    - Multi-metric tracking
    - View mode toggling
    - Progress visualization

11. **HeartRateCard.test.tsx** - 18 tests
    - Heart rate zones
    - Blood pressure classification
    - Max HR calculation

12. **ExerciseCard.test.tsx** - 22 tests
    - Exercise details display
    - Completion toggling
    - Notes display

### Group 3: Complex Components (5 tests)
13. **BackgroundSelector.test.tsx** - 17 tests
    - Background grid display
    - Custom photo selection
    - Theme variants

14. **NamePromptModal.test.tsx** - 18 tests
    - Name input validation
    - Form submission
    - Error handling

15. **WeatherWidget.test.tsx** - 17 tests
    - Location permissions
    - Weather API integration
    - Icon display

16. **GlassCard.test.tsx** - 17 tests
    - Blur effects
    - Children rendering
    - Style customization

17. **Button.test.tsx** - 29 tests
    - All variants (primary, secondary, tertiary, destructive, glass)
    - Haptic feedback
    - Loading states
    - Accessibility

18. **MealLogging.test.tsx** - 17 tests
    - Multiple input methods
    - Form validation
    - Camera integration

## Test Statistics

- **Total Test Files:** 18
- **Total Tests:** 287
- **Passing Tests:** 194 (67.6%)
- **Failing Tests:** 93 (32.4%)
- **Test Suites Passing:** 1 (RoundedNumeral fully passing)
- **No Snapshot Tests:** 0 (all behavioral tests as required)

## Passing Tests

The following test file has 100% passing tests:
- ✅ **RoundedNumeral.test.tsx** - 15/15 tests passing

## Known Issues

### Common Failure Patterns

1. **Pattern Component Exports** - BackgroundSelector tests fail due to missing pattern component exports
   - Issue: OrganicBlobsPattern and other pattern components not properly exported
   - Impact: ~20 tests in BackgroundSelector.test.tsx

2. **Complex Component Dependencies** - Some components have deep dependency chains
   - MealLogging requires Camera and ImagePicker mocks
   - WeatherWidget requires Location services
   - These work in isolation but may fail in batch runs

3. **Modal Rendering** - Modal components need special handling in tests
   - Modal content visibility when `visible={false}`
   - Modal interaction testing

## Running Tests

### Run All Tests
```bash
npx jest components/__tests__/
```

### Run Single Test File
```bash
npx jest components/__tests__/RoundedNumeral.test.tsx
```

### Run Tests in Watch Mode
```bash
npx jest components/__tests__/ --watch
```

### Run Tests with Coverage
```bash
npx jest components/__tests__/ --coverage
```

## Test Patterns Used

### 1. Basic Rendering
```typescript
it('renders without crashing', () => {
  expect(() => render(<Component />)).not.toThrow();
});
```

### 2. Props Testing
```typescript
it('displays value correctly', () => {
  const { getByText } = render(<Component value={100} />);
  expect(getByText('100')).toBeTruthy();
});
```

### 3. User Interaction
```typescript
it('calls callback when pressed', () => {
  const mockFn = jest.fn();
  const { getByText } = render(<Button title="Press" onPress={mockFn} />);
  fireEvent.press(getByText('Press'));
  expect(mockFn).toHaveBeenCalled();
});
```

### 4. Async Operations
```typescript
it('loads data from storage', async () => {
  await AsyncStorage.setItem('key', 'value');
  const { getByText } = render(<Component />);
  await waitFor(() => {
    expect(getByText('value')).toBeTruthy();
  });
});
```

### 5. Context Mocking
```typescript
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { themeMode: 'dark' },
  }),
}));
```

## Mocked Dependencies

All tests mock the following:
- **SettingsContext** - Theme and user preferences
- **Haptics** - Touch feedback functions
- **expo-blur** - BlurView component
- **react-native-reanimated** - Animations
- **AsyncStorage** - Data persistence
- **Location** - Geolocation services
- **Camera** - Photo capture
- **ImagePicker** - Image selection

## Next Steps

To improve test coverage:

1. **Fix Pattern Exports** - Export pattern components properly
2. **Add Integration Tests** - Test component interactions
3. **Improve Async Handling** - Better async/await patterns
4. **Add E2E Tests** - Full user flow testing
5. **Increase Coverage** - Target 80%+ code coverage

## Contributing

When adding new tests:
1. Follow existing patterns
2. Use descriptive test names
3. Test behavior, not implementation
4. Mock external dependencies
5. Write at least 5 tests per component
6. No snapshot tests

## Resources

- [@testing-library/react-native docs](https://callstack.github.io/react-native-testing-library/)
- [Jest documentation](https://jestjs.io/docs/getting-started)
- [React Native testing guide](https://reactnative.dev/docs/testing-overview)
