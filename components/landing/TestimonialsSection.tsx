// Landing Page Testimonials Section
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';
import { MotiView } from 'moti';
import { liquidGlass, spacing, typography, radius } from '../../constants/landingTheme';
import { useBreakpoint } from '../../hooks/useResponsive';
import { useScrollReveal } from '../../hooks/useResponsive';
import { LandingGlassCard } from './LandingGlassCard';
import { LandingGlassPill } from './LandingGlassPill';
import { MessageSquareQuote, Star, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  initials: string;
  rating: number;
  quote: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah M.',
    role: 'Lost 30 lbs in 4 months',
    initials: 'SM',
    rating: 5,
    quote: 'The AI meal planning changed everything for me. I never have to think about what to eat anymore - it just works with my schedule and preferences.',
  },
  {
    id: '2',
    name: 'James K.',
    role: 'Fitness Enthusiast',
    initials: 'JK',
    rating: 5,
    quote: 'Finally an app that syncs properly with my Apple Watch and adjusts my macros based on my workouts. The integration is seamless.',
  },
  {
    id: '3',
    name: 'Emily R.',
    role: 'Busy Professional',
    initials: 'ER',
    rating: 5,
    quote: "I've tried every nutrition app out there. This is the first one that actually stuck because it's so easy to use. Voice logging is a game changer.",
  },
  {
    id: '4',
    name: 'Michael T.',
    role: 'Marathon Runner',
    initials: 'MT',
    rating: 5,
    quote: "The recovery recommendations and nutrition timing features helped me PR my last marathon. I can't train without it now.",
  },
  {
    id: '5',
    name: 'Lisa C.',
    role: 'Nutritionist',
    initials: 'LC',
    rating: 5,
    quote: "I recommend this app to all my clients. The tracking is comprehensive but not overwhelming, and the insights are genuinely helpful.",
  },
];

const CARD_WIDTH = 360;
const CARD_SPACING = spacing.lg;

export function TestimonialsSection() {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = isMobile ? screenWidth - spacing.xl * 2 : CARD_WIDTH;
  const itemWidth = cardWidth + CARD_SPACING;

  // Auto-scroll
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % testimonials.length;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeIndex, isVisible]);

  return (
    <View ref={ref} style={styles.container} nativeID="testimonials">
      {/* Header */}
      <MotiView
        animate={{
          opacity: isVisible ? 1 : 0,
          translateY: isVisible ? 0 : 30,
        }}
        transition={{ type: 'timing', duration: 600 }}
        style={styles.header}
      >
        <LandingGlassPill
          label="Testimonials"
          icon={<MessageSquareQuote size={14} color={liquidGlass.accent.primary} />}
          variant="accent"
        />

        <Text style={[typography.displaySmall, styles.title, isMobile && styles.titleMobile]}>
          Loved by <Text style={styles.titleAccent}>Thousands</Text>
        </Text>

        <Text style={[typography.bodyLarge, styles.subtitle]}>
          See what our users have to say about their transformation
        </Text>
      </MotiView>

      {/* Carousel */}
      <MotiView
        animate={{
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ type: 'timing', duration: 800, delay: 300 }}
        style={styles.carouselContainer}
      >
        {/* Navigation */}
        {!isMobile && (
          <>
            <Pressable
              onPress={() => {
                const prevIndex = activeIndex === 0 ? testimonials.length - 1 : activeIndex - 1;
                setActiveIndex(prevIndex);
                flatListRef.current?.scrollToIndex({
                  index: prevIndex,
                  animated: true,
                  viewPosition: 0.5,
                });
              }}
              style={[styles.navButton, styles.navButtonLeft]}
            >
              <ChevronLeft size={24} color={liquidGlass.text.primary} />
            </Pressable>
            <Pressable
              onPress={() => {
                const nextIndex = (activeIndex + 1) % testimonials.length;
                setActiveIndex(nextIndex);
                flatListRef.current?.scrollToIndex({
                  index: nextIndex,
                  animated: true,
                  viewPosition: 0.5,
                });
              }}
              style={[styles.navButton, styles.navButtonRight]}
            >
              <ChevronRight size={24} color={liquidGlass.text.primary} />
            </Pressable>
          </>
        )}

        <FlatList
          ref={flatListRef}
          data={testimonials}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={itemWidth}
          decelerationRate="fast"
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: (screenWidth - cardWidth) / 2 },
          ]}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / itemWidth);
            setActiveIndex(Math.max(0, Math.min(index, testimonials.length - 1)));
          }}
          renderItem={({ item, index }) => (
            <TestimonialCard
              testimonial={item}
              isActive={index === activeIndex}
              cardWidth={cardWidth}
            />
          )}
          getItemLayout={(_, index) => ({
            length: itemWidth,
            offset: itemWidth * index,
            index,
          })}
        />
      </MotiView>

      {/* Pagination */}
      <View style={styles.pagination}>
        {testimonials.map((_, index) => (
          <Pressable
            key={index}
            onPress={() => {
              setActiveIndex(index);
              flatListRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.5,
              });
            }}
          >
            <MotiView
              animate={{
                width: index === activeIndex ? 24 : 8,
                backgroundColor: index === activeIndex
                  ? liquidGlass.accent.primary
                  : liquidGlass.glass.elevated,
              }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              style={styles.dot}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  isActive: boolean;
  cardWidth: number;
}

function TestimonialCard({ testimonial, isActive, cardWidth }: TestimonialCardProps) {
  return (
    <MotiView
      animate={{
        scale: isActive ? 1 : 0.92,
        opacity: isActive ? 1 : 0.5,
      }}
      transition={{ type: 'spring', damping: 15, stiffness: 150 }}
      style={[styles.cardContainer, { width: cardWidth }]}
    >
      <LandingGlassCard tier="elevated" hasSpecular style={styles.card}>
        {/* Rating */}
        <View style={styles.rating}>
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} size={16} color="#fbbf24" fill="#fbbf24" />
          ))}
        </View>

        {/* Quote */}
        <Text style={[typography.bodyLarge, styles.quote]}>
          "{testimonial.quote}"
        </Text>

        {/* Author */}
        <View style={styles.author}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{testimonial.initials}</Text>
          </View>
          <View>
            <Text style={[typography.labelLarge, styles.name]}>
              {testimonial.name}
            </Text>
            <Text style={[typography.bodySmall, styles.role]}>
              {testimonial.role}
            </Text>
          </View>
        </View>
      </LandingGlassCard>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing['5xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: liquidGlass.text.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  titleMobile: {
    fontSize: 32,
    lineHeight: 40,
  },
  titleAccent: {
    color: liquidGlass.accent.primary,
  },
  subtitle: {
    color: liquidGlass.text.secondary,
    textAlign: 'center',
    maxWidth: 400,
  },
  carouselContainer: {
    position: 'relative',
  },
  listContent: {
    paddingVertical: spacing.lg,
  },
  cardContainer: {
    paddingHorizontal: CARD_SPACING / 2,
  },
  card: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  rating: {
    flexDirection: 'row',
    gap: 4,
  },
  quote: {
    color: liquidGlass.text.primary,
    fontStyle: 'italic',
    lineHeight: 28,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: liquidGlass.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  name: {
    color: liquidGlass.text.primary,
  },
  role: {
    color: liquidGlass.text.tertiary,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: liquidGlass.glass.standard,
    borderWidth: 1,
    borderColor: liquidGlass.border.standard,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navButtonLeft: {
    left: spacing.xl,
  },
  navButtonRight: {
    right: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: radius.full,
  },
});
