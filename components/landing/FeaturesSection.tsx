// Landing Page Features Section
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MotiView } from 'moti';
import { liquidGlass, spacing, typography, radius } from '../../constants/landingTheme';
import { useBreakpoint } from '../../hooks/useResponsive';
import { useScrollReveal } from '../../hooks/useResponsive';
import { LandingGlassCard } from './LandingGlassCard';
import { LandingGlassPill } from './LandingGlassPill';
import {
  Brain,
  Camera,
  Activity,
  BarChart3,
  Mic,
  Zap,
} from 'lucide-react-native';

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    id: 'ai-tracking',
    icon: <Brain size={28} color={liquidGlass.accent.primary} />,
    title: 'AI Meal Analysis',
    description: 'Snap a photo or describe your meal. Our AI instantly calculates calories, protein, carbs, and fat with incredible accuracy.',
    color: liquidGlass.accent.primary,
  },
  {
    id: 'voice',
    icon: <Mic size={28} color={liquidGlass.accent.secondary} />,
    title: 'Voice Logging',
    description: 'Simply speak what you ate. Our voice recognition understands natural language and logs your meals hands-free.',
    color: liquidGlass.accent.secondary,
  },
  {
    id: 'camera',
    icon: <Camera size={28} color={liquidGlass.accent.tertiary} />,
    title: 'Photo Recognition',
    description: 'Take a picture of your plate. Advanced computer vision identifies foods and portions automatically.',
    color: liquidGlass.accent.tertiary,
  },
  {
    id: 'health-sync',
    icon: <Activity size={28} color="#E74C3C" />,
    title: 'Apple Health Sync',
    description: 'Seamlessly syncs with Apple Health to track steps, active calories, and adjust your nutrition targets automatically.',
    color: '#E74C3C',
  },
  {
    id: 'insights',
    icon: <BarChart3 size={28} color={colors.protein} />,
    title: 'Smart Insights',
    description: 'Get personalized recommendations based on your patterns. Understand what works for your body.',
    color: colors.protein,
  },
  {
    id: 'goals',
    icon: <Zap size={28} color="#FF69B4" />,
    title: 'Goal Wizard',
    description: 'Set your goals and let our algorithm calculate the perfect calorie and macro targets for your journey.',
    color: '#FF69B4',
  },
];

export function FeaturesSection() {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <View ref={ref} style={styles.container} nativeID="features">
      {/* Section header */}
      <View style={styles.header}>
        <MotiView
          animate={{
            opacity: isVisible ? 1 : 0,
            translateY: isVisible ? 0 : 20,
          }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <LandingGlassPill
            label="Features"
            icon={<Zap size={14} color={liquidGlass.accent.primary} />}
            variant="accent"
          />
        </MotiView>

        <MotiView
          animate={{
            opacity: isVisible ? 1 : 0,
            translateY: isVisible ? 0 : 30,
          }}
          transition={{ type: 'timing', duration: 800, delay: 200 }}
        >
          <Text style={[typography.displaySmall, styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>
            Everything You Need to{'\n'}
            <Text style={styles.titleAccent}>Succeed</Text>
          </Text>
        </MotiView>

        <MotiView
          animate={{
            opacity: isVisible ? 1 : 0,
            translateY: isVisible ? 0 : 30,
          }}
          transition={{ type: 'timing', duration: 800, delay: 400 }}
        >
          <Text style={[typography.bodyLarge, styles.sectionSubtitle]}>
            Powerful features designed to make healthy eating effortless
          </Text>
        </MotiView>
      </View>

      {/* Features grid */}
      <View style={[styles.grid, isMobile && styles.gridMobile]}>
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            index={index}
            isVisible={isVisible}
            isMobile={isMobile}
          />
        ))}
      </View>
    </View>
  );
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
  isVisible: boolean;
  isMobile: boolean;
}

function FeatureCard({ feature, index, isVisible, isMobile }: FeatureCardProps) {
  return (
    <MotiView
      animate={{
        opacity: isVisible ? 1 : 0,
        translateY: isVisible ? 0 : 40,
        scale: isVisible ? 1 : 0.95,
      }}
      transition={{
        type: 'timing',
        duration: 600,
        delay: index * 100,
      }}
      style={[styles.cardWrapper, isMobile && styles.cardWrapperMobile]}
    >
      <LandingGlassCard
        tier="standard"
        hasSpecular
        interactive
        hasGlow
        glowColor={`${feature.color}33`}
        style={styles.card}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${feature.color}20` }]}>
          {feature.icon}
        </View>
        <Text style={[typography.h3, styles.featureTitle]}>
          {feature.title}
        </Text>
        <Text style={[typography.bodyMedium, styles.featureDescription]}>
          {feature.description}
        </Text>
      </LandingGlassCard>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
    gap: spacing.md,
  },
  sectionTitle: {
    color: liquidGlass.text.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  sectionTitleMobile: {
    fontSize: 32,
    lineHeight: 40,
  },
  titleAccent: {
    color: liquidGlass.accent.primary,
  },
  sectionSubtitle: {
    color: liquidGlass.text.secondary,
    textAlign: 'center',
    maxWidth: 500,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
    maxWidth: 1200,
    marginHorizontal: 'auto',
  },
  gridMobile: {
    flexDirection: 'column',
  },
  cardWrapper: {
    width: '30%',
    minWidth: 320,
    maxWidth: 380,
  },
  cardWrapperMobile: {
    width: '100%',
    minWidth: 'auto',
    maxWidth: 'none',
  },
  card: {
    padding: spacing.xl,
    gap: spacing.md,
    height: '100%',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    color: liquidGlass.text.primary,
    marginTop: spacing.sm,
  },
  featureDescription: {
    color: liquidGlass.text.secondary,
    lineHeight: 24,
  },
});
