import { Redirect } from 'expo-router';

/**
 * Root index - immediately redirects to the main tabs.
 * Authentication is handled in Settings page instead of a landing page.
 */
export default function RootIndex() {
  // Immediately redirect to tabs - no landing page
  return <Redirect href="/(tabs)" />;
}
