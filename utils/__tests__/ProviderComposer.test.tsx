import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ProviderComposer } from '../ProviderComposer';

// ============================================
// Mock Providers
// ============================================
const TestProviderA = ({ children }: { children: React.ReactNode }) => (
  <Text testID="provider-a">
    Provider A: {children}
  </Text>
);

const TestProviderB = ({ children }: { children: React.ReactNode }) => (
  <Text testID="provider-b">
    Provider B: {children}
  </Text>
);

const TestProviderC = ({ children }: { children: React.ReactNode }) => (
  <Text testID="provider-c">
    Provider C: {children}
  </Text>
);

// ============================================
// Tests
// ============================================
describe('ProviderComposer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when no providers', () => {
    const { getByTestId } = render(
      <ProviderComposer providers={[]}>
        <Text testID="child">Test Child</Text>
      </ProviderComposer>
    );

    expect(getByTestId('child')).toBeTruthy();
  });

  it('wraps children in single provider', () => {
    const { getByTestId } = render(
      <ProviderComposer providers={[TestProviderA]}>
        <Text testID="child">Test Child</Text>
      </ProviderComposer>
    );

    expect(getByTestId('provider-a')).toBeTruthy();
    expect(getByTestId('child')).toBeTruthy();
  });

  it('wraps children in multiple providers in correct order (outermost first)', () => {
    // When providers array is [A, B, C], the result should be:
    // <A><B><C>children</C></B></A>
    // This means A is outermost, C is innermost
    const { getByTestId, UNSAFE_getAllByType } = render(
      <ProviderComposer providers={[TestProviderA, TestProviderB, TestProviderC]}>
        <Text testID="child">Test Child</Text>
      </ProviderComposer>
    );

    // All providers should be present
    expect(getByTestId('provider-a')).toBeTruthy();
    expect(getByTestId('provider-b')).toBeTruthy();
    expect(getByTestId('provider-c')).toBeTruthy();
    expect(getByTestId('child')).toBeTruthy();

    // Check order: outermost to innermost should be A -> B -> C
    const allTexts = UNSAFE_getAllByType(Text);
    const testIds = allTexts.map((text) => text.props.testID).filter(Boolean);

    // Provider A should be outermost (first in tree)
    expect(testIds[0]).toBe('provider-a');
  });

  it('providers receive children correctly', () => {
    const mockProvider = jest.fn(({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ));

    render(
      <ProviderComposer providers={[mockProvider]}>
        <Text>Test Child</Text>
      </ProviderComposer>
    );

    expect(mockProvider).toHaveBeenCalled();
    expect(mockProvider.mock.calls[0][0]).toHaveProperty('children');
  });

  it('handles deeply nested providers', () => {
    const Providers = [
      TestProviderA,
      TestProviderB,
      TestProviderC,
      TestProviderA, // Reuse A
      TestProviderB, // Reuse B
    ];

    const { getByTestId, getAllByTestId } = render(
      <ProviderComposer providers={Providers}>
        <Text testID="child">Nested Child</Text>
      </ProviderComposer>
    );

    expect(getByTestId('child')).toBeTruthy();
    // Should have multiple instances of providers
    expect(getAllByTestId('provider-a')).toHaveLength(2); // Provider A used twice
    expect(getAllByTestId('provider-b')).toHaveLength(2); // Provider B used twice
    expect(getAllByTestId('provider-c')).toHaveLength(1); // Provider C used once
  });

  it('works with context providers', () => {
    const TestContext = React.createContext<string>('default');

    const ContextProvider = ({ children }: { children: React.ReactNode }) => (
      <TestContext.Provider value="test-value">{children}</TestContext.Provider>
    );

    const ChildComponent = () => {
      const value = React.useContext(TestContext);
      return <Text testID="context-value">{value}</Text>;
    };

    const { getByTestId } = render(
      <ProviderComposer providers={[ContextProvider]}>
        <ChildComponent />
      </ProviderComposer>
    );

    expect(getByTestId('context-value')).toHaveTextContent('test-value');
  });
});
