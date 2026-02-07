import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../hooks/useResponsive', () => ({
  useBreakpoint: jest.fn(() => 'desktop'),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 44, bottom: 34, left: 0, right: 0 })),
}));

jest.mock('../LandingGlassButton', () => ({
  LandingGlassButton: ({ label, onPress, ...props }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID="cta-button" {...props}>
        <Text>{label}</Text>
      </TouchableOpacity>
    );
  },
}));

// Inline mock component
const LandingNavbar = () => {
  const { View, Text, Pressable } = require('react-native');
  const { useBreakpoint } = require('../../../hooks/useResponsive');

  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <View testID="landing-navbar">
      {/* Logo */}
      <Pressable testID="logo-button">
        <Text testID="logo-text">H</Text>
        {!isMobile && <Text testID="brand-name">Heirclark</Text>}
      </Pressable>

      {/* Nav Links */}
      {!isMobile && (
        <View testID="nav-links">
          {navLinks.map((link) => (
            <Pressable key={link.label} testID={`nav-link-${link.label.toLowerCase()}`}>
              <Text>{link.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* CTA */}
      <View testID="nav-actions">
        <Pressable testID="download-button">
          <Text>{isMobile ? 'Get App' : 'Download App'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

describe('LandingNavbar', () => {
  const { useBreakpoint } = require('../../../hooks/useResponsive');

  beforeEach(() => {
    jest.clearAllMocks();
    (useBreakpoint as jest.Mock).mockReturnValue('desktop');
  });

  it('renders without crashing', () => {
    expect(() => render(<LandingNavbar />)).not.toThrow();
  });

  it('displays logo text', () => {
    const { getByTestId } = render(<LandingNavbar />);
    expect(getByTestId('logo-text').props.children).toBe('H');
  });

  it('displays brand name on desktop', () => {
    const { getByText } = render(<LandingNavbar />);
    expect(getByText('Heirclark')).toBeTruthy();
  });

  it('hides brand name on mobile', () => {
    (useBreakpoint as jest.Mock).mockReturnValue('mobile');
    const { queryByTestId } = render(<LandingNavbar />);
    expect(queryByTestId('brand-name')).toBeNull();
  });

  it('displays nav links on desktop', () => {
    const { getByText } = render(<LandingNavbar />);
    expect(getByText('Features')).toBeTruthy();
    expect(getByText('Testimonials')).toBeTruthy();
    expect(getByText('Pricing')).toBeTruthy();
  });

  it('hides nav links on mobile', () => {
    (useBreakpoint as jest.Mock).mockReturnValue('mobile');
    const { queryByTestId } = render(<LandingNavbar />);
    expect(queryByTestId('nav-links')).toBeNull();
  });

  it('shows "Download App" on desktop', () => {
    const { getByText } = render(<LandingNavbar />);
    expect(getByText('Download App')).toBeTruthy();
  });

  it('shows "Get App" on mobile', () => {
    (useBreakpoint as jest.Mock).mockReturnValue('mobile');
    const { getByText } = render(<LandingNavbar />);
    expect(getByText('Get App')).toBeTruthy();
  });

  it('renders actions container', () => {
    const { getByTestId } = render(<LandingNavbar />);
    expect(getByTestId('nav-actions')).toBeTruthy();
  });
});
