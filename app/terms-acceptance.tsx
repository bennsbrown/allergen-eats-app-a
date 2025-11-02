
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TermsAcceptanceScreen() {
  const [isChecked, setIsChecked] = useState(false);

  const handleAccept = async () => {
    if (!isChecked) {
      return;
    }
    
    try {
      await AsyncStorage.setItem('termsAccepted', 'true');
      console.log('Terms accepted, navigating to app');
      // Use replace to prevent going back to terms screen
      router.replace('/(tabs)/(home)/');
    } catch (error) {
      console.error('Error saving terms acceptance:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {/* Logo in header */}
        <Image
          source={require('@/assets/images/499d614b-c3dc-40a7-9ddd-6a461469ccbc.jpeg')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={styles.logoContainer}>
          <IconSymbol name="checkmark.shield.fill" color={colors.primary} size={64} />
        </View>
        <Text style={styles.headerTitle}>Welcome to Eaze</Text>
        <Text style={styles.headerSubtitle}>
          Please review and accept our Terms & Conditions to continue
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.termsCard}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.termsText}>
            By accessing and using Eaze, you accept and agree to be bound by the terms and provision of this agreement.
          </Text>

          <Text style={styles.sectionTitle}>2. Use License</Text>
          <Text style={styles.termsText}>
            Permission is granted to temporarily use Eaze for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
          </Text>

          <Text style={styles.sectionTitle}>3. Allergen Information</Text>
          <Text style={styles.termsText}>
            While we strive to provide accurate allergen information, Eaze is a digital menu platform. Always verify allergen information with restaurant staff before ordering. We are not liable for any allergic reactions or health issues.
          </Text>

          <Text style={styles.sectionTitle}>4. Business Subscription</Text>
          <Text style={styles.termsText}>
            Business accounts require an active paid subscription to access dashboard features and generate QR codes. Subscription fees are non-refundable.
          </Text>

          <Text style={styles.sectionTitle}>5. Data Privacy</Text>
          <Text style={styles.termsText}>
            We collect and process data in accordance with our Privacy Policy. Your dietary preferences and menu interactions may be stored to improve your experience.
          </Text>

          <Text style={styles.sectionTitle}>6. Disclaimer</Text>
          <Text style={styles.termsText}>
            The materials on Eaze are provided on an &apos;as is&apos; basis. Eaze makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </Text>

          <Text style={styles.sectionTitle}>7. Limitations</Text>
          <Text style={styles.termsText}>
            In no event shall Eaze or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use Eaze.
          </Text>

          <Text style={styles.sectionTitle}>8. Accuracy of Materials</Text>
          <Text style={styles.termsText}>
            The materials appearing on Eaze could include technical, typographical, or photographic errors. Eaze does not warrant that any of the materials on its app are accurate, complete or current.
          </Text>

          <Text style={styles.sectionTitle}>9. Modifications</Text>
          <Text style={styles.termsText}>
            Eaze may revise these terms of service at any time without notice. By using this app you are agreeing to be bound by the then current version of these terms of service.
          </Text>

          <Text style={styles.sectionTitle}>10. Governing Law</Text>
          <Text style={styles.termsText}>
            These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={styles.checkboxContainer}
          onPress={() => setIsChecked(!isChecked)}
        >
          <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
            {isChecked && (
              <IconSymbol name="checkmark" color={colors.card} size={18} />
            )}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and agree to the Terms & Conditions
          </Text>
        </Pressable>

        <Pressable 
          style={[styles.acceptButton, !isChecked && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          disabled={!isChecked}
        >
          <Text style={[styles.acceptButtonText, !isChecked && styles.acceptButtonTextDisabled]}>
            Accept & Continue
          </Text>
          <IconSymbol 
            name="arrow.right.circle.fill" 
            color={isChecked ? colors.card : colors.textSecondary} 
            size={24} 
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  headerLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 4px 12px rgba(56, 189, 248, 0.25)',
    elevation: 4,
  },
  logoContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  termsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.accent,
    boxShadow: '0px 4px 12px rgba(59, 130, 246, 0.15)',
    elevation: 3,
  },
  termsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
    gap: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    boxShadow: '0px 4px 12px rgba(59, 130, 246, 0.3)',
    elevation: 4,
  },
  acceptButtonDisabled: {
    backgroundColor: colors.highlight,
    boxShadow: 'none',
    elevation: 0,
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.card,
  },
  acceptButtonTextDisabled: {
    color: colors.textSecondary,
  },
});
