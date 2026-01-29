// Landing Page Footer
import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Link } from 'expo-router';
import { liquidGlass, spacing, typography, radius } from '../../constants/landingTheme';
import { useBreakpoint } from '../../hooks/useResponsive';
import { LandingGlassCard } from './LandingGlassCard';
import {
  Twitter,
  Instagram,
  Mail,
  MapPin,
} from 'lucide-react-native';

const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Testimonials', href: '#testimonials' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Download', href: '#download' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/(marketing)/privacy' },
      { label: 'Terms of Service', href: '/(marketing)/terms' },
      { label: 'Support', href: '/(marketing)/support' },
    ],
  },
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/heirclark', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/heirclark', label: 'Instagram' },
];

export function Footer() {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const currentYear = new Date().getFullYear();

  const handleLinkPress = (href: string) => {
    if (href.startsWith('#')) {
      // Scroll to section
      if (typeof document !== 'undefined') {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (href.startsWith('http')) {
      Linking.openURL(href);
    }
  };

  return (
    <View style={styles.container}>
      <LandingGlassCard tier="subtle" style={styles.card}>
        <View style={[styles.content, isMobile && styles.contentMobile]}>
          {/* Brand column */}
          <View style={[styles.brandColumn, isMobile && styles.brandColumnMobile]}>
            <View style={styles.logo}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoText}>H</Text>
              </View>
              <Text style={styles.brandName}>Heirclark</Text>
            </View>

            <Text style={[typography.bodySmall, styles.brandDescription]}>
              AI-powered nutrition tracking for a healthier you. Transform your
              eating habits with personalized insights and intelligent meal planning.
            </Text>

            {/* Contact info */}
            <View style={styles.contactInfo}>
              <View style={styles.contactRow}>
                <Mail size={16} color={liquidGlass.text.tertiary} />
                <Text style={[typography.bodySmall, styles.contactText]}>
                  hello@heirclark.com
                </Text>
              </View>
              <View style={styles.contactRow}>
                <MapPin size={16} color={liquidGlass.text.tertiary} />
                <Text style={[typography.bodySmall, styles.contactText]}>
                  Houston, TX
                </Text>
              </View>
            </View>

            {/* Social links */}
            <View style={styles.socialLinks}>
              {socialLinks.map((social) => (
                <Pressable
                  key={social.label}
                  onPress={() => Linking.openURL(social.href)}
                  style={styles.socialButton}
                  accessibilityLabel={social.label}
                >
                  <social.icon size={20} color={liquidGlass.text.secondary} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Link columns */}
          <View style={[styles.linksContainer, isMobile && styles.linksContainerMobile]}>
            {Object.entries(footerLinks).map(([key, section]) => (
              <View
                key={key}
                style={[styles.linkColumn, isMobile && styles.linkColumnMobile]}
              >
                <Text style={[typography.labelLarge, styles.columnTitle]}>
                  {section.title}
                </Text>
                <View style={styles.linksList}>
                  {section.links.map((link) => (
                    link.href.startsWith('/') ? (
                      <Link key={link.label} href={link.href as any} asChild>
                        <Pressable style={styles.linkItem}>
                          <Text style={[typography.bodySmall, styles.linkText]}>
                            {link.label}
                          </Text>
                        </Pressable>
                      </Link>
                    ) : (
                      <Pressable
                        key={link.label}
                        onPress={() => handleLinkPress(link.href)}
                        style={styles.linkItem}
                      >
                        <Text style={[typography.bodySmall, styles.linkText]}>
                          {link.label}
                        </Text>
                      </Pressable>
                    )
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom bar */}
        <View style={[styles.bottomBar, isMobile && styles.bottomBarMobile]}>
          <Text style={[typography.bodySmall, styles.copyright]}>
            {currentYear} Heirclark, LLC. All rights reserved.
          </Text>

          <View style={styles.bottomLinks}>
            <Link href="/(marketing)/privacy" asChild>
              <Pressable>
                <Text style={[typography.bodySmall, styles.bottomLinkText]}>
                  Privacy
                </Text>
              </Pressable>
            </Link>
            <Text style={styles.bottomDivider}>|</Text>
            <Link href="/(marketing)/terms" asChild>
              <Pressable>
                <Text style={[typography.bodySmall, styles.bottomLinkText]}>
                  Terms
                </Text>
              </Pressable>
            </Link>
            <Text style={styles.bottomDivider}>|</Text>
            <Link href="/(marketing)/support" asChild>
              <Pressable>
                <Text style={[typography.bodySmall, styles.bottomLinkText]}>
                  Support
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </LandingGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  card: {
    maxWidth: 1280,
    marginHorizontal: 'auto',
    padding: spacing['2xl'],
  },
  content: {
    flexDirection: 'row',
    gap: spacing['3xl'],
  },
  contentMobile: {
    flexDirection: 'column',
    gap: spacing['2xl'],
  },
  brandColumn: {
    flex: 1,
    maxWidth: 320,
    gap: spacing.lg,
  },
  brandColumnMobile: {
    maxWidth: '100%',
    alignItems: 'center',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: liquidGlass.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  brandName: {
    color: liquidGlass.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  brandDescription: {
    color: liquidGlass.text.tertiary,
    lineHeight: 20,
  },
  contactInfo: {
    gap: spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactText: {
    color: liquidGlass.text.tertiary,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: liquidGlass.glass.subtle,
    borderWidth: 1,
    borderColor: liquidGlass.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linksContainer: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  linksContainerMobile: {
    justifyContent: 'space-between',
  },
  linkColumn: {
    minWidth: 140,
    gap: spacing.md,
  },
  linkColumnMobile: {
    width: '45%',
    minWidth: 'auto',
  },
  columnTitle: {
    color: liquidGlass.text.primary,
    marginBottom: spacing.xs,
  },
  linksList: {
    gap: spacing.sm,
  },
  linkItem: {
    paddingVertical: spacing.xs,
  },
  linkText: {
    color: liquidGlass.text.tertiary,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xl,
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: liquidGlass.border.subtle,
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  bottomBarMobile: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  copyright: {
    color: liquidGlass.text.disabled,
  },
  bottomLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bottomLinkText: {
    color: liquidGlass.text.tertiary,
  },
  bottomDivider: {
    color: liquidGlass.text.disabled,
  },
});
