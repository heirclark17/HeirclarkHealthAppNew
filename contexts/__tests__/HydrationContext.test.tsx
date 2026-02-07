import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock context
const HydrationContext = React.createContext<any>(undefined);

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const [dailyGoal, setDailyGoal] = React.useState(64);
  const [consumed, setConsumed] = React.useState(0);

  const logWater = (amount: number) => {
    setConsumed(prev => prev + amount);
  };

  const resetDaily = () => {
    setConsumed(0);
  };

  return (
    <HydrationContext.Provider value={{ dailyGoal, consumed, logWater, resetDaily, setDailyGoal }}>
      {children}
    </HydrationContext.Provider>
  );
}

export function useHydration() {
  const context = React.useContext(HydrationContext);
  if (!context) {
    throw new Error('useHydration must be used within a HydrationProvider');
  }
  return context;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HydrationProvider>{children}</HydrationProvider>
);

describe('HydrationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useHydration(), { wrapper });

    expect(result.current.dailyGoal).toBe(64);
    expect(result.current.consumed).toBe(0);
  });

  it('logs water intake', () => {
    const { result } = renderHook(() => useHydration(), { wrapper });

    act(() => {
      result.current.logWater(8);
    });

    expect(result.current.consumed).toBe(8);

    act(() => {
      result.current.logWater(8);
    });

    expect(result.current.consumed).toBe(16);
  });

  it('resets daily intake', () => {
    const { result } = renderHook(() => useHydration(), { wrapper });

    act(() => {
      result.current.logWater(32);
    });

    expect(result.current.consumed).toBe(32);

    act(() => {
      result.current.resetDaily();
    });

    expect(result.current.consumed).toBe(0);
  });

  it('updates daily goal', () => {
    const { result } = renderHook(() => useHydration(), { wrapper });

    act(() => {
      result.current.setDailyGoal(80);
    });

    expect(result.current.dailyGoal).toBe(80);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useHydration());
    }).toThrow('useHydration must be used within a HydrationProvider');
  });
});
