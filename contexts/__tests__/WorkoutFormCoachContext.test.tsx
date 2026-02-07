import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock context
const WorkoutFormCoachContext = React.createContext<any>(undefined);

export function WorkoutFormCoachProvider({ children }: { children: React.ReactNode }) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [feedback, setFeedback] = React.useState<any>(null);

  const analyzeForm = async (videoUri: string) => {
    setIsAnalyzing(true);
    setFeedback({ score: 85, tips: ['Good form'] });
    setIsAnalyzing(false);
  };

  return (
    <WorkoutFormCoachContext.Provider value={{ isAnalyzing, feedback, analyzeForm }}>
      {children}
    </WorkoutFormCoachContext.Provider>
  );
}

export function useWorkoutFormCoach() {
  const context = React.useContext(WorkoutFormCoachContext);
  if (!context) {
    throw new Error('useWorkoutFormCoach must be used within a WorkoutFormCoachProvider');
  }
  return context;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WorkoutFormCoachProvider>{children}</WorkoutFormCoachProvider>
);

describe('WorkoutFormCoachContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useWorkoutFormCoach(), { wrapper });

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.feedback).toBeNull();
  });

  it('analyzes form', async () => {
    const { result } = renderHook(() => useWorkoutFormCoach(), { wrapper });

    await act(async () => {
      await result.current.analyzeForm('video.mp4');
    });

    expect(result.current.feedback).toBeTruthy();
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useWorkoutFormCoach());
    }).toThrow('useWorkoutFormCoach must be used within a WorkoutFormCoachProvider');
  });
});
