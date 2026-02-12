// Support Page
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { MotiView } from 'moti';
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Twitter,
  Instagram,
} from 'lucide-react-native';
import { LiquidBackground, LandingGlassCard, LandingGlassButton } from '../../components/landing';
import { liquidGlass, spacing, typography, radius } from '../../constants/landingTheme';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How does the AI meal analysis work?',
    answer:
      'Simply take a photo of your meal or describe it using voice input. Our AI analyzes the food items, estimates portions, and calculates nutritional information including calories, protein, carbs, and fats. The more you use it, the better it learns your preferences.',
  },
  {
    question: 'Is my health data secure?',
    answer:
      'Yes, we take your privacy seriously. All data is encrypted in transit and at rest. We never sell your personal health data to third parties. You can read our full Privacy Policy for more details on how we protect your information.',
  },
  {
    question: 'How do I sync with Apple Health?',
    answer:
      'Go to Settings in the app and tap "Apple Health Integration." From there, you can enable syncing for activity data, nutrition, and other health metrics. You\'ll be prompted to grant permissions through Apple Health.',
  },
  {
    question: 'Can I use voice to log meals?',
    answer:
      'Yes! Tap the microphone icon on the meal logging screen and simply describe what you ate. For example, "I had a grilled chicken salad with ranch dressing and a glass of water." Our AI will parse your description and log the meal.',
  },
  {
    question: 'How accurate is the calorie tracking?',
    answer:
      'Our AI provides estimates based on visual analysis and standard serving sizes. While we strive for accuracy, actual nutritional content can vary based on preparation methods, exact portions, and ingredient variations. For precise tracking, you can manually adjust entries.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'You can request account deletion by going to Settings > Account > Delete Account, or by emailing us at support@heirclark.com. We will process your request and delete all associated data within 30 days.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes! New users get a 7-day free trial with full access to all premium features. After the trial, you can choose to subscribe or continue with the free tier which includes basic meal logging and tracking.',
  },
  {
    question: 'What devices are supported?',
    answer:
      'Heirclark is currently available on iOS devices running iOS 15.0 or later. We support iPhone and iPad. Apple Watch integration is available for activity syncing through Apple Health.',
  },
];

export default function SupportPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        'Message Sent',
        "Thank you for contacting us! We'll get back to you within 24-48 hours.",
        [{ text: 'OK' }]
      );
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@heirclark.com');
  };

  const handleTwitterPress = () => {
    Linking.openURL('https://twitter.com/heirclark');
  };

  const handleInstagramPress = () => {
    Linking.openURL('https://instagram.com/heirclark');
  };

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

        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.displaySmall, styles.title]}>
            How Can We <Text style={styles.titleAccent}>Help?</Text>
          </Text>
          <Text style={[typography.bodyLarge, styles.subtitle]}>
            We're here to help you get the most out of Heirclark
          </Text>
        </View>

        {/* Quick Contact Options */}
        <View style={styles.contactOptions}>
          <Pressable onPress={handleEmailPress}>
            <LandingGlassCard tier="standard" style={styles.contactCard}>
              <View style={styles.contactIcon}>
                <Mail size={24} color={liquidGlass.accent.primary} />
              </View>
              <Text style={[typography.labelLarge, styles.contactTitle]}>Email Support</Text>
              <Text style={[typography.bodySmall, styles.contactText]}>
                support@heirclark.com
              </Text>
            </LandingGlassCard>
          </Pressable>

          <Pressable onPress={handleTwitterPress}>
            <LandingGlassCard tier="standard" style={styles.contactCard}>
              <View style={styles.contactIcon}>
                <Twitter size={24} color={liquidGlass.accent.primary} />
              </View>
              <Text style={[typography.labelLarge, styles.contactTitle]}>Twitter</Text>
              <Text style={[typography.bodySmall, styles.contactText]}>@heirclark</Text>
            </LandingGlassCard>
          </Pressable>

          <Pressable onPress={handleInstagramPress}>
            <LandingGlassCard tier="standard" style={styles.contactCard}>
              <View style={styles.contactIcon}>
                <Instagram size={24} color={liquidGlass.accent.primary} />
              </View>
              <Text style={[typography.labelLarge, styles.contactTitle]}>Instagram</Text>
              <Text style={[typography.bodySmall, styles.contactText]}>@heirclark</Text>
            </LandingGlassCard>
          </Pressable>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <View style={styles.faqHeader}>
            <HelpCircle size={24} color={liquidGlass.accent.primary} />
            <Text style={[typography.h3, styles.faqTitle]}>Frequently Asked Questions</Text>
          </View>

          <View style={styles.faqList}>
            {faqs.map((faq, index) => (
              <Pressable
                key={index}
                onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
              >
                <LandingGlassCard
                  tier="subtle"
                  style={[styles.faqCard, expandedFAQ === index && styles.faqCardExpanded]}
                >
                  <View style={styles.faqQuestion}>
                    <Text style={[typography.labelLarge, styles.faqQuestionText]}>
                      {faq.question}
                    </Text>
                    {expandedFAQ === index ? (
                      <ChevronUp size={20} color={liquidGlass.text.secondary} />
                    ) : (
                      <ChevronDown size={20} color={liquidGlass.text.secondary} />
                    )}
                  </View>
                  {expandedFAQ === index && (
                    <MotiView
                      from={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ type: 'timing', duration: 200 }}
                    >
                      <Text style={[typography.bodyMedium, styles.faqAnswer]}>{faq.answer}</Text>
                    </MotiView>
                  )}
                </LandingGlassCard>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Contact Form */}
        <LandingGlassCard tier="standard" style={styles.formCard}>
          <View style={styles.formHeader}>
            <MessageCircle size={24} color={liquidGlass.accent.primary} />
            <Text style={[typography.h3, styles.formTitle]}>Send Us a Message</Text>
          </View>
          <Text style={[typography.bodyMedium, styles.formSubtitle]}>
            Can't find what you're looking for? Send us a message and we'll get back to you
            within 24-48 hours.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[typography.labelMedium, styles.inputLabel]}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={liquidGlass.text.tertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[typography.labelMedium, styles.inputLabel]}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={liquidGlass.text.tertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[typography.labelMedium, styles.inputLabel]}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="How can we help you?"
                placeholderTextColor={liquidGlass.text.tertiary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <LandingGlassButton
              variant="primary"
              size="lg"
              label="Send Message"
              icon={<Send size={18} color="#fff" />}
              iconPosition="right"
              loading={isSubmitting}
              onPress={handleSubmit}
              fullWidth
            />
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
    paddingBottom: spacing['4xl'],
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
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    color: liquidGlass.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  titleAccent: {
    color: liquidGlass.accent.primary,
  },
  subtitle: {
    color: liquidGlass.text.secondary,
    textAlign: 'center',
    maxWidth: 400,
  },
  contactOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing['3xl'],
    maxWidth: 800,
    marginHorizontal: 'auto',
  },
  contactCard: {
    padding: spacing.lg,
    alignItems: 'center',
    minWidth: 160,
    gap: spacing.sm,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: liquidGlass.glass.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    color: liquidGlass.text.primary,
  },
  contactText: {
    color: liquidGlass.text.tertiary,
  },
  faqSection: {
    maxWidth: 800,
    marginHorizontal: 'auto',
    marginBottom: spacing['3xl'],
    width: '100%',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  faqTitle: {
    color: liquidGlass.text.primary,
  },
  faqList: {
    gap: spacing.md,
  },
  faqCard: {
    padding: spacing.lg,
  },
  faqCardExpanded: {
    borderColor: liquidGlass.accent.primary,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  faqQuestionText: {
    color: liquidGlass.text.primary,
    flex: 1,
  },
  faqAnswer: {
    color: liquidGlass.text.secondary,
    marginTop: spacing.md,
    lineHeight: 24,
  },
  formCard: {
    maxWidth: 600,
    marginHorizontal: 'auto',
    padding: spacing['2xl'],
    width: '100%',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  formTitle: {
    color: liquidGlass.text.primary,
  },
  formSubtitle: {
    color: liquidGlass.text.secondary,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    color: liquidGlass.text.secondary,
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: liquidGlass.glass.subtle,
    borderWidth: 1,
    borderColor: liquidGlass.border.subtle,
    paddingHorizontal: spacing.md,
    color: liquidGlass.text.primary,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outline: 'none' } as any : {}),
  },
  textArea: {
    height: 140,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
});
