// Landing Page Stats Section
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { liquidGlass, spacing, typography, radius } from '../../constants/landingTheme';
import { useBreakpoint } from '../../hooks/useResponsive';
import { useScrollReveal } from '../../hooks/useResponsive';
import { LandingGlassCard } from './LandingGlassCard';
import { Users, Utensils, Star, TrendingUp } from 'lucide-react-native';
import { Colors } from '../../constants/Theme';

interface Stat {
  id: string;
  value: number;
  suffix: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const stats: Stat[] = [
  {
    id: 'users',
    value: 10000,
    suffix: '+',
    label: 'Active Users',
    icon: <Users size={28} color={liquidGlass.accent.primary} />,
    color: liquidGlass.accent.glow,
  },
  {
    id: 'meals',
    value: 500000,
    suffix: '+',
    label: 'Meals Tracked',
    icon: <Utensils size={28} color={liquidGlass.accent.secondary} />,
    color: 'rgba(150, 206, 180, 0.3)',
  },
  {
    id: 'rating',
    value: 4.9,
    suffix: '',
    label: 'App Store Rating',
    icon: <Star size={28} color=Colors.warning fill=Colors.warning />,
    color: 'rgba(251, 191, 36, 0.3)',
  },
  {
    id: 'goals',
    value: 85,
    suffix: '%',
    label: 'Users Hit Goals',
    icon: <TrendingUp size={28} color={liquidGlass.success} />,
    color: 'rgba(78, 205, 196, 0.3)',
  },
];

export function StatsSection() {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  return (
    <View ref={ref} style={styles.container}>
      <View style={[styles.grid, isMobile && styles.gridMobile]}>
        {stats.map((stat, index) => (
          <StatCard
            key={stat.id}
            stat={stat}
            index={index}
            isVisible={isVisible}
            isMobile={isMobile}
          />
        ))}
      </View>
    </View>
  );
}

interface StatCardProps {
  stat: Stat;
  index: number;
  isVisible: boolean;
  isMobile: boolean;
}

function StatCard({ stat, index, isVisible, isMobile }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const stepValue = stat.value / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(stat.value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.min(stepValue * currentStep, stat.value));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [isVisible, stat.value]);

  const formatValue = (val: number) => {
    if (stat.id === 'rating') {
      return val.toFixed(1);
    }
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${Math.round(val / 1000)}K`;
    }
    return Math.round(val).toString();
  };

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
        delay: index * 150,
      }}
      style={[styles.cardWrapper, isMobile && styles.cardWrapperMobile]}
    >
      <LandingGlassCard
        tier="standard"
        hasSpecular
        hasGlow
        glowColor={stat.color}
        style={styles.card}
      >
        <View style={styles.iconContainer}>
          {stat.icon}
        </View>

        <Text style={[typography.displaySmall, styles.value]}>
          {formatValue(displayValue)}{stat.suffix}
        </Text>

        <Text style={[typography.bodyMedium, styles.label]}>
          {stat.label}
        </Text>
      </LandingGlassCard>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
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
    flex: 1,
    minWidth: 240,
    maxWidth: 280,
  },
  cardWrapperMobile: {
    minWidth: '100%',
    maxWidth: '100%',
  },
  card: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: liquidGlass.glass.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: liquidGlass.text.primary,
    fontWeight: '700',
  },
  label: {
    color: liquidGlass.text.secondary,
    textAlign: 'center',
  },
});
