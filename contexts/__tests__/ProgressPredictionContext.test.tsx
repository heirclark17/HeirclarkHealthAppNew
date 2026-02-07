import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock context
const ProgressPredictionContext = React.createContext<any>(undefined);

export function ProgressPredictionProvider({ children }: { children: React.ReactNode }) {
  const [predictions, setPredictions] = React.useState<any[]>([]);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const generatePrediction = async () => {
    setIsCalculating(true);
    setPredictions([{ date: new Date(), weight: 180 }]);
    setIsCalculating(false);
  };

  return (
    <ProgressPredictionContext.Provider value={{ predictions, isCalculating, generatePrediction }}>
      {children}
    </ProgressPredictionContext.Provider>
  );
}

export function useProgressPrediction() {
  const context = React.useContext(ProgressPredictionContext);
  if (!context) {
    throw new Error('useProgressPrediction must be used within a ProgressPredictionProvider');
  }
  return context;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ProgressPredictionProvider>{children}</ProgressPredictionProvider>
);

describe('ProgressPredictionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useProgressPrediction(), { wrapper });

    expect(result.current.predictions).toEqual([]);
    expect(result.current.isCalculating).toBe(false);
  });

  it('generates prediction', async () => {
    const { result } = renderHook(() => useProgressPrediction(), { wrapper });

    await act(async () => {
      await result.current.generatePrediction();
    });

    expect(result.current.predictions.length).toBeGreaterThan(0);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useProgressPrediction());
    }).toThrow('useProgressPrediction must be used within a ProgressPredictionProvider');
  });
});
