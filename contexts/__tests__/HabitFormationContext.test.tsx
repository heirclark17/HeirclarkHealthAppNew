import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock context
const HabitFormationContext = React.createContext<any>(undefined);

export function HabitFormationProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = React.useState<any[]>([]);

  const addHabit = (habit: any) => {
    setHabits(prev => [...prev, habit]);
  };

  const completeHabit = (habitId: string) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed: true } : h));
  };

  return (
    <HabitFormationContext.Provider value={{ habits, addHabit, completeHabit }}>
      {children}
    </HabitFormationContext.Provider>
  );
}

export function useHabitFormation() {
  const context = React.useContext(HabitFormationContext);
  if (!context) {
    throw new Error('useHabitFormation must be used within a HabitFormationProvider');
  }
  return context;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HabitFormationProvider>{children}</HabitFormationProvider>
);

describe('HabitFormationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useHabitFormation(), { wrapper });

    expect(result.current.habits).toEqual([]);
  });

  it('adds habit', () => {
    const { result } = renderHook(() => useHabitFormation(), { wrapper });

    act(() => {
      result.current.addHabit({ id: '1', name: 'Exercise', completed: false });
    });

    expect(result.current.habits.length).toBe(1);
  });

  it('completes habit', () => {
    const { result } = renderHook(() => useHabitFormation(), { wrapper });

    act(() => {
      result.current.addHabit({ id: '1', name: 'Exercise', completed: false });
      result.current.completeHabit('1');
    });

    expect(result.current.habits[0].completed).toBe(true);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useHabitFormation());
    }).toThrow('useHabitFormation must be used within a HabitFormationProvider');
  });
});
