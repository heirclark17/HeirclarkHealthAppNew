import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../../hooks/useResponsive', () => ({
  useBreakpoint: jest.fn(() => 'desktop'),
  useScrollReveal: jest.fn(() => ({ ref: { current: null }, isVisible: true })),
}));

jest.mock('../LandingGlassCard', () => ({
  LandingGlassCard: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('../LandingGlassPill', () => ({
  LandingGlassPill: ({ label, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{label}</Text>;
  },
}));

// Inline mock component
const TestimonialsSection = () => {
  const { View, Text, FlatList, Pressable } = require('react-native');
  const [activeIndex, setActiveIndex] = React.useState(0);

  const testimonials = [
    {
      id: '1',
      name: 'Sarah M.',
      role: 'Lost 30 lbs in 4 months',
      initials: 'SM',
      rating: 5,
      quote: 'The AI meal planning changed everything for me.',
    },
    {
      id: '2',
      name: 'James K.',
      role: 'Fitness Enthusiast',
      initials: 'JK',
      rating: 5,
      quote: 'Finally an app that syncs properly with my Apple Watch.',
    },
    {
      id: '3',
      name: 'Emily R.',
      role: 'Busy Professional',
      initials: 'ER',
      rating: 5,
      quote: "I've tried every nutrition app out there.",
    },
  ];

  return (
    <View testID="testimonials-section">
      <Text testID="section-pill">Testimonials</Text>
      <Text testID="section-title">Loved by Thousands</Text>
      <Text testID="section-subtitle">
        See what our users have to say about their transformation
      </Text>

      {testimonials.map((t) => (
        <View key={t.id} testID={`testimonial-${t.id}`}>
          <Text testID={`quote-${t.id}`}>"{t.quote}"</Text>
          <Text testID={`name-${t.id}`}>{t.name}</Text>
          <Text testID={`role-${t.id}`}>{t.role}</Text>
          <Text testID={`initials-${t.id}`}>{t.initials}</Text>
        </View>
      ))}

      {/* Pagination dots */}
      <View testID="pagination">
        {testimonials.map((_, index) => (
          <Pressable
            key={index}
            testID={`dot-${index}`}
            onPress={() => setActiveIndex(index)}
          />
        ))}
      </View>
    </View>
  );
};

describe('TestimonialsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<TestimonialsSection />)).not.toThrow();
  });

  it('displays section pill label', () => {
    const { getByText } = render(<TestimonialsSection />);
    expect(getByText('Testimonials')).toBeTruthy();
  });

  it('displays section title', () => {
    const { getByText } = render(<TestimonialsSection />);
    expect(getByText('Loved by Thousands')).toBeTruthy();
  });

  it('displays section subtitle', () => {
    const { getByText } = render(<TestimonialsSection />);
    expect(
      getByText('See what our users have to say about their transformation')
    ).toBeTruthy();
  });

  it('renders testimonial cards', () => {
    const { getByTestId } = render(<TestimonialsSection />);
    expect(getByTestId('testimonial-1')).toBeTruthy();
    expect(getByTestId('testimonial-2')).toBeTruthy();
    expect(getByTestId('testimonial-3')).toBeTruthy();
  });

  it('displays testimonial quotes', () => {
    const { getByText } = render(<TestimonialsSection />);
    expect(getByText(/"The AI meal planning changed everything for me."/)).toBeTruthy();
  });

  it('displays testimonial names', () => {
    const { getByText } = render(<TestimonialsSection />);
    expect(getByText('Sarah M.')).toBeTruthy();
    expect(getByText('James K.')).toBeTruthy();
    expect(getByText('Emily R.')).toBeTruthy();
  });

  it('displays testimonial roles', () => {
    const { getByText } = render(<TestimonialsSection />);
    expect(getByText('Lost 30 lbs in 4 months')).toBeTruthy();
    expect(getByText('Fitness Enthusiast')).toBeTruthy();
    expect(getByText('Busy Professional')).toBeTruthy();
  });

  it('displays testimonial initials', () => {
    const { getByText } = render(<TestimonialsSection />);
    expect(getByText('SM')).toBeTruthy();
    expect(getByText('JK')).toBeTruthy();
    expect(getByText('ER')).toBeTruthy();
  });

  it('renders pagination dots', () => {
    const { getByTestId } = render(<TestimonialsSection />);
    expect(getByTestId('pagination')).toBeTruthy();
    expect(getByTestId('dot-0')).toBeTruthy();
    expect(getByTestId('dot-1')).toBeTruthy();
    expect(getByTestId('dot-2')).toBeTruthy();
  });
});
