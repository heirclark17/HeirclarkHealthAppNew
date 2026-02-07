import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const Footer = ({ links, onLinkPress }: any) => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <View testID="footer">
      <Text testID="footer-title">Heirclark Health</Text>
      <Text testID="copyright">© 2026 Heirclark Health. All rights reserved.</Text>
      {links.map((link: any) => (
        <TouchableOpacity
          key={link.id}
          onPress={() => onLinkPress(link)}
          testID={`link-${link.id}`}
        >
          <Text>{link.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

describe('Footer', () => {
  const mockLinks = [
    { id: 'privacy', text: 'Privacy Policy', url: '/privacy' },
    { id: 'terms', text: 'Terms of Service', url: '/terms' },
    { id: 'contact', text: 'Contact Us', url: '/contact' },
  ];

  const mockOnLinkPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() =>
      render(<Footer links={mockLinks} onLinkPress={mockOnLinkPress} />)
    ).not.toThrow();
  });

  it('displays footer title', () => {
    const { getByText } = render(
      <Footer links={mockLinks} onLinkPress={mockOnLinkPress} />
    );
    expect(getByText('Heirclark Health')).toBeTruthy();
  });

  it('displays copyright text', () => {
    const { getByText } = render(
      <Footer links={mockLinks} onLinkPress={mockOnLinkPress} />
    );
    expect(getByText('© 2026 Heirclark Health. All rights reserved.')).toBeTruthy();
  });

  it('renders all footer links', () => {
    const { getByText } = render(
      <Footer links={mockLinks} onLinkPress={mockOnLinkPress} />
    );
    expect(getByText('Privacy Policy')).toBeTruthy();
    expect(getByText('Terms of Service')).toBeTruthy();
    expect(getByText('Contact Us')).toBeTruthy();
  });

  it('calls onLinkPress when link is pressed', () => {
    const { getByTestId } = render(
      <Footer links={mockLinks} onLinkPress={mockOnLinkPress} />
    );
    fireEvent.press(getByTestId('link-privacy'));
    expect(mockOnLinkPress).toHaveBeenCalledWith(mockLinks[0]);
  });

  it('renders with empty links array', () => {
    const { getByTestId } = render(
      <Footer links={[]} onLinkPress={mockOnLinkPress} />
    );
    expect(getByTestId('footer')).toBeTruthy();
  });
});
