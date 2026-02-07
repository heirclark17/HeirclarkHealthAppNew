import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock context for testing
const AccountabilityPartnerContext = React.createContext<any>(undefined);

export function AccountabilityPartnerProvider({ children }: { children: React.ReactNode }) {
  const [partner, setPartner] = React.useState(null);
  const [messages, setMessages] = React.useState<any[]>([]);

  const addMessage = (message: any) => {
    setMessages(prev => [...prev, message]);
  };

  return (
    <AccountabilityPartnerContext.Provider value={{ partner, setPartner, messages, addMessage }}>
      {children}
    </AccountabilityPartnerContext.Provider>
  );
}

export function useAccountabilityPartner() {
  const context = React.useContext(AccountabilityPartnerContext);
  if (!context) {
    throw new Error('useAccountabilityPartner must be used within an AccountabilityPartnerProvider');
  }
  return context;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AccountabilityPartnerProvider>{children}</AccountabilityPartnerProvider>
);

describe('AccountabilityPartnerContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const AsyncStorageMock = require('@react-native-async-storage/async-storage').default;
    AsyncStorageMock.__resetStore();
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useAccountabilityPartner(), { wrapper });

    expect(result.current.partner).toBeNull();
    expect(result.current.messages).toEqual([]);
  });

  it('adds messages', () => {
    const { result } = renderHook(() => useAccountabilityPartner(), { wrapper });

    act(() => {
      result.current.addMessage({ text: 'Hello', sender: 'user' });
    });

    expect(result.current.messages.length).toBe(1);
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAccountabilityPartner());
    }).toThrow('useAccountabilityPartner must be used within an AccountabilityPartnerProvider');
  });
});
