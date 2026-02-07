import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock context
const SleepRecoveryContext = React.createContext<any>(undefined);

export function SleepRecoveryProvider({ children }: { children: React.ReactNode }) {
  const [sleepData, setSleepData] = React.useState<any[]>([]);
  const [sleepGoal, setSleepGoal] = React.useState(8);

  const logSleep = (hours: number) => {
    setSleepData(prev => [...prev, { date: new Date(), hours }]);
  };

  return (
    <SleepRecoveryContext.Provider value={{ sleepData, sleepGoal, setSleepGoal, logSleep }}>
      {children}
    </SleepRecoveryContext.Provider>
  );
}

export function useSleepRecovery() {
  const context = React.useContext(SleepRecoveryContext);
  if (!context) {
    throw new Error('useSleepRecovery must be used within a SleepRecoveryProvider');
  }
  return context;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SleepRecoveryProvider>{children}</SleepRecoveryProvider>
);

describe('SleepRecoveryContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useSleepRecovery(), { wrapper });

    expect(result.current.sleepData).toEqual([]);
    expect(result.current.sleepGoal).toBe(8);
  });

  it('logs sleep', () => {
    const { result } = renderHook(() => useSleepRecovery(), { wrapper });

    act(() => {
      result.current.logSleep(7.5);
    });

    expect(result.current.sleepData.length).toBe(1);
    expect(result.current.sleepData[0].hours).toBe(7.5);
  });

  it('updates sleep goal', () => {
    const { result } = renderHook(() => useSleepRecovery(), { wrapper });

    act(() => {
      result.current.setSleepGoal(9);
    });

    expect(result.current.sleepGoal).toBe(9);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useSleepRecovery());
    }).toThrow('useSleepRecovery must be used within a SleepRecoveryProvider');
  });
});
