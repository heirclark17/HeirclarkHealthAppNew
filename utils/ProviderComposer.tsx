/**
 * ProviderComposer - Utility to flatten nested context providers
 *
 * Replaces the 16-level provider nesting in app/_layout.tsx that causes
 * TypeScript stack overflow. Composes providers in a flat, type-safe way.
 */
import React from 'react';

interface ProviderProps {
  children: React.ReactNode;
}

type Provider = React.ComponentType<ProviderProps>;

interface ProviderComposerProps {
  providers: Provider[];
  children: React.ReactNode;
}

/**
 * Composes multiple context providers into a single component
 * Usage:
 * <ProviderComposer providers={[Provider1, Provider2, Provider3]}>
 *   <App />
 * </ProviderComposer>
 */
export function ProviderComposer({ providers, children }: ProviderComposerProps) {
  return providers.reduceRight(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children
  );
}

export default ProviderComposer;
