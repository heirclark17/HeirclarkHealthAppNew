// Responsive Design Hooks for Landing Page
import { useState, useEffect, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultrawide: 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('mobile');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setBreakpoint('mobile');
      return;
    }

    const updateBreakpoint = () => {
      const width = Dimensions.get('window').width;
      if (width >= breakpoints.ultrawide) setBreakpoint('ultrawide');
      else if (width >= breakpoints.wide) setBreakpoint('wide');
      else if (width >= breakpoints.desktop) setBreakpoint('desktop');
      else if (width >= breakpoints.tablet) setBreakpoint('tablet');
      else setBreakpoint('mobile');
    };

    updateBreakpoint();
    const subscription = Dimensions.addEventListener('change', updateBreakpoint);
    return () => subscription.remove();
  }, []);

  return breakpoint;
}

export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const breakpoint = useBreakpoint();
  const orderedBreakpoints: Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide', 'ultrawide'];
  const currentIndex = orderedBreakpoints.indexOf(breakpoint);

  for (let i = currentIndex; i >= 0; i--) {
    const value = values[orderedBreakpoints[i]];
    if (value !== undefined) return value;
  }
  return undefined;
}

export function useWindowDimensions() {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription.remove();
  }, []);

  return dimensions;
}

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useScrollReveal({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}: UseScrollRevealOptions = {}) {
  const ref = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // On native, always show content
    if (Platform.OS !== 'web') {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) {
      // If no element yet, set visible after a short delay
      const timeout = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timeout);
    }

    // Check if IntersectionObserver is available
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}
