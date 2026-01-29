// Privacy Policy Page
import React from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { LiquidBackground, LandingGlassCard } from '../../components/landing';
import { liquidGlass, spacing, typography, radius } from '../../constants/landingTheme';

export default function PrivacyPolicyPage() {
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
          <Text style={[typography.displaySmall, styles.title]}>Privacy Policy</Text>
          <Text style={[typography.bodySmall, styles.lastUpdated]}>
            Last updated: January 25, 2026
          </Text>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>1. Introduction</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              Welcome to Heirclark ("we," "our," or "us"). We are committed to protecting your
              privacy and personal information. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our mobile application and
              related services.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>2. Information We Collect</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              We collect information you provide directly to us, including:
            </Text>
            <View style={styles.list}>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Account information (name, email address)
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Health and fitness data (meals, nutrition information, activity data)
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Device information and usage data
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Photos you choose to upload for meal analysis
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Voice recordings for voice-based meal logging
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>3. Apple Health Integration</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              With your permission, we may access and sync data from Apple Health, including
              activity data, nutrition information, and other health metrics. This data is used
              solely to provide personalized insights and recommendations within the app. We do
              not sell or share your Apple Health data with third parties for advertising purposes.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>4. How We Use Your Information</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              We use the information we collect to:
            </Text>
            <View style={styles.list}>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Provide, maintain, and improve our services
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Analyze your meals and provide nutritional insights
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Generate personalized recommendations and meal plans
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Send you updates and notifications about your progress
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Respond to your comments, questions, and support requests
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>5. Data Security</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction. Your data is encrypted in transit and at rest using industry-standard
              encryption protocols.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>6. Data Retention</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              We retain your personal information for as long as your account is active or as
              needed to provide you services. You may request deletion of your account and
              associated data at any time by contacting us at privacy@heirclark.com.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>7. Your Rights</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              Depending on your location, you may have certain rights regarding your personal
              information, including:
            </Text>
            <View style={styles.list}>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Access to your personal data
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Correction of inaccurate data
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Deletion of your data
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Data portability
              </Text>
              <Text style={[typography.bodyMedium, styles.listItem]}>
                • Opt-out of certain data processing
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>8. Third-Party Services</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              Our app may use third-party services for analytics, authentication (Sign in with
              Apple), and AI-powered features. These services have their own privacy policies,
              and we encourage you to review them.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>9. Children's Privacy</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              Our services are not intended for children under 13 years of age. We do not
              knowingly collect personal information from children under 13.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>10. Changes to This Policy</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the "Last
              updated" date.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.h4, styles.sectionTitle]}>11. Contact Us</Text>
            <Text style={[typography.bodyMedium, styles.paragraph]}>
              If you have any questions about this Privacy Policy, please contact us at:
            </Text>
            <Text style={[typography.bodyMedium, styles.contactInfo]}>
              Email: privacy@heirclark.com{'\n'}
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
