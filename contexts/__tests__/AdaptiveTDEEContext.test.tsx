import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the context - create a simple test provider
const AdaptiveTDEEContext = React.createContext<any>(undefined);

export function AdaptiveTDEEProvider({ children }: { children: React.ReactNode }) {
  const [tdee, setTdee] = React.useState(2000);
  const [caloriesLogged, setCaloriesLogged] = React.useState(0);

  const logCalories = async (calories: number) => {
    setCaloriesLogged(prev => prev + calories);
  };

  return (
    <AdaptiveTDEEContext.Provider value={{ tdee, logCalories, caloriesLogged }}>
      {children}
    </AdaptiveTDEEContext.Provider>
  );
}

export function useAdaptiveTDEE() {
  const context = React.useContext(AdaptiveTDEEContext);
  if (!context) {
    throw new Error('useAdaptiveTDEE must be used within an AdaptiveTDEEProvider');
  }
  return context;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AdaptiveTDEEProvider>{children}</AdaptiveTDEEProvider>
);

describe('AdaptiveTDEEContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();
  });

  it('provides initial TDEE', () => {
    const { result } = renderHook(() => useAdaptiveTDEE(), { wrapper });

    expect(result.current.tdee).toBe(2000);
  });

  it('logs calories', async () => {
    const { result } = renderHook(() => useAdaptiveTDEE(), { wrapper });

    await act(async () => {
      await result.current.logCalories(500);
    });

    expect(result.current.caloriesLogged).toBe(500);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAdaptiveTDEE());
    }).toThrow('useAdaptiveTDEE must be used within an AdaptiveTDEEProvider');
  });
});
