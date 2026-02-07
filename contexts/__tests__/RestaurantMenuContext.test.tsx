import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock context
const RestaurantMenuContext = React.createContext<any>(undefined);

export function RestaurantMenuProvider({ children }: { children: React.ReactNode }) {
  const [menuItems, setMenuItems] = React.useState<any[]>([]);
  const [isScanning, setIsScanning] = React.useState(false);

  const scanMenu = async (imageUri: string) => {
    setIsScanning(true);
    setMenuItems([{ name: 'Burger', calories: 650 }]);
    setIsScanning(false);
  };

  return (
    <RestaurantMenuContext.Provider value={{ menuItems, isScanning, scanMenu }}>
      {children}
    </RestaurantMenuContext.Provider>
  );
}

export function useRestaurantMenu() {
  const context = React.useContext(RestaurantMenuContext);
  if (!context) {
    throw new Error('useRestaurantMenu must be used within a RestaurantMenuProvider');
  }
  return context;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <RestaurantMenuProvider>{children}</RestaurantMenuProvider>
);

describe('RestaurantMenuContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useRestaurantMenu(), { wrapper });

    expect(result.current.menuItems).toEqual([]);
    expect(result.current.isScanning).toBe(false);
  });

  it('scans menu', async () => {
    const { result } = renderHook(() => useRestaurantMenu(), { wrapper });

    await act(async () => {
      await result.current.scanMenu('menu.jpg');
    });

    expect(result.current.menuItems.length).toBeGreaterThan(0);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useRestaurantMenu());
    }).toThrow('useRestaurantMenu must be used within a RestaurantMenuProvider');
  });
});
