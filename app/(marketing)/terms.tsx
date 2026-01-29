// Terms of Service Page
import React from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { LiquidBackground, LandingGlassCard } from '../../components/landing';
import { liquidGlass, spacing, typography, radius } from '../../constants/landingTheme';

export default function TermsOfServicePage() {
  return (
    <View style={styles.container}>
      <LiquidBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Navigation */}
        <Link href="/" asChild>
          <Pressable style={styles.backButton}>
            <ArrowLeft size={20} color={liquidGlass.text.secondary} />
            <Text style={[typography.bodyMedium, styles.backText]}>Back</Text>
          </Pressable>
        </Link>

        <LandingGlassCard tier="standard" style={styles.card}>
          <Text style={[typography.displaySmall, styles.title]}>Terms of Service</Text>
          <Text style={[typography.bodySmall, styles.lastUpdated]}>
            Last updated: January 25, 2026
          </Text>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>1. Acceptance of Terms</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              By accessing or using the Heirclark mobile application ("App") and related services,
              you agree to be bound by these Terms of Service ("Terms"). If you do not agree to
              these Terms, please do not use our App.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>2. Description of Service</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              Heirclark provides an AI-powered nutrition tracking application that helps users
              monitor their food intake, analyze nutritional content, and receive personalized
              health insights. Our services include meal logging, photo-based food recognition,
              voice logging, Apple Health integration, and AI-generated recommendations.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>3. User Accounts</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              To use certain features of the App, you may need to create an account or sign in
              using Sign in with Apple. You are responsible for:
            </Text>
            <View style={styles.list}>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Maintaining the confidentiality of your account
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • All activities that occur under your account
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Notifying us immediately of any unauthorized use
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>4. Health Disclaimer</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              IMPORTANT: Heirclark is not a medical device and is not intended to diagnose, treat,
              cure, or prevent any disease or health condition. The nutritional information and
              recommendations provided are for informational purposes only and should not be
              considered medical advice.
            </Text>
            <Text style={[typography.bodyMedium, styles.paragraph, { marginTop: spacing.md }]}>
              Always consult with a qualified healthcare provider before making any changes to
              your diet, exercise routine, or health regimen. If you have any medical conditions
              or concerns, seek professional medical advice.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>5. AI-Generated Content</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              Our App uses artificial intelligence to analyze meals and provide recommendations.
              While we strive for accuracy, AI-generated nutritional estimates may not be 100%
              accurate. Users should verify nutritional information when precision is critical.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>6. Acceptable Use</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              You agree not to:
            </Text>
            <View style={styles.list}>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Use the App for any unlawful purpose
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Attempt to gain unauthorized access to our systems
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Interfere with or disrupt the App or servers
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Upload malicious code or content
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Impersonate any person or entity
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Resell or redistribute the App without permission
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>7. Intellectual Property</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              All content, features, and functionality of the App, including but not limited to
              text, graphics, logos, icons, images, audio clips, and software, are the exclusive
              property of Heirclark, LLC and are protected by copyright, trademark, and other
              intellectual property laws.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>8. User Content</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              By uploading photos, voice recordings, or other content to the App, you grant us
              a non-exclusive, worldwide, royalty-free license to use, process, and analyze this
              content solely for the purpose of providing our services to you. You retain all
              ownership rights to your content.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>9. Subscription and Payments</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              Some features of the App may require a paid subscription. Subscription terms,
              pricing, and billing are handled through the Apple App Store. You agree to Apple's
              terms and conditions for in-app purchases and subscriptions.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>10. Limitation of Liability</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, HEIRCLARK SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT
              NOT LIMITED TO LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM
              YOUR USE OF THE APP.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>11. Disclaimer of Warranties</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED,
              ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>12. Termination</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              We reserve the right to terminate or suspend your account and access to the App
              at our sole discretion, without notice, for conduct that we believe violates these
              Terms or is harmful to other users, us, or third parties.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>13. Changes to Terms</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              We may modify these Terms at any time. We will notify you of any material changes
              by posting the new Terms on this page. Your continued use of the App after changes
              constitutes acceptance of the modified Terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>14. Governing Law</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              These Terms shall be governed by and construed in accordance with the laws of the
              State of Texas, without regard to its conflict of law provisions.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>15. Contact Us</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              If you have any questions about these Terms, please contact us at:
            </Text>
            <Text style={[typography.bodyMedium, styles.contactInfo]}>
              Email: legal@heirclark.com{'\n'}
              Address: Heirclark, LLC{'\n'}
              Houston, TX
            </Text>
          </View>
        </LandingGlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: spacing['3xl'],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
  },
  backText: {
    color: liquidGlass.text.secondary,
  },
  card: {
    maxWidth: 800,
    marginHorizontal: 'auto',
    padding: spacing['2xl'],
  },
  title: {
    color: liquidGlass.text.primary,
    marginBottom: spacing.sm,
  },
  lastUpdated: {
    color: liquidGlass.text.tertiary,
    marginBottom: spacing['2xl'],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: liquidGlass.text.primary,
    marginBottom: spacing.md,
  },
  paragraph: {
    color: liquidGlass.text.secondary,
    lineHeight: 24,
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  listItem: {
    color: liquidGlass.text.secondary,
    lineHeight: 24,
    paddingLeft: spacing.sm,
  },
  contactInfo: {
    color: liquidGlass.text.secondary,
    lineHeight: 24,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: liquidGlass.glass.subtle,
    borderRadius: radius.md,
  },
});
