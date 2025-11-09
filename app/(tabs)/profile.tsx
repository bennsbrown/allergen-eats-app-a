
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Stack, router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/hooks/useAuth';
import { useBusiness } from '@/hooks/useBusiness';

export default function ProfileScreen() {
  const { user, loading: authLoading, signIn, signUp, signOut, isConfigured } = useAuth();
  const { business, loading: businessLoading, updateGoogleSheetUrl } = useBusiness();
  
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (authMode === 'signup' && !businessName) {
      Alert.alert('Error', 'Please enter your business name');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        await signIn(email, password);
        Alert.alert('Success', 'Welcome back!');
        console.log('Login successful');
      } else {
        await signUp(email, password, businessName);
        Alert.alert(
          'Success', 
          'Account created! Please check your email to verify your account.'
        );
        console.log('Signup successful');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      Alert.alert('Logged Out', 'You have been logged out successfully.');
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error);
      Alert.alert('Error', error.message || 'Logout failed');
    }
  };

  const handleConnectSheet = async () => {
    if (!googleSheetUrl) {
      Alert.alert('Error', 'Please enter a Google Sheet URL');
      return;
    }

    try {
      await updateGoogleSheetUrl(googleSheetUrl);
      Alert.alert(
        'Success',
        'Google Sheet connected! Your QR code now links to this sheet.',
        [{ text: 'OK' }]
      );
      console.log('Connected Google Sheet:', googleSheetUrl);
    } catch (error: any) {
      console.error('Connect sheet error:', error);
      Alert.alert('Error', error.message || 'Failed to connect Google Sheet');
    }
  };

  const handleNavigateToTerms = () => {
    console.log('Navigating to Terms & Conditions');
    router.push('/terms-acceptance');
  };

  // Show setup message if Supabase is not configured
  if (!isConfigured) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen
            options={{
              title: 'Business',
            }}
          />
        )}
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.setupContainer}>
            <View style={styles.setupCard}>
              <IconSymbol name="exclamationmark.triangle.fill" color={colors.secondary} size={64} />
              <Text style={styles.setupTitle}>Supabase Setup Required</Text>
              <Text style={styles.setupText}>
                To enable business authentication and unique QR codes, please:
              </Text>
              <View style={styles.setupSteps}>
                <View style={styles.setupStep}>
                  <Text style={styles.setupStepNumber}>1</Text>
                  <Text style={styles.setupStepText}>
                    Click the Supabase button in Natively
                  </Text>
                </View>
                <View style={styles.setupStep}>
                  <Text style={styles.setupStepNumber}>2</Text>
                  <Text style={styles.setupStepText}>
                    Connect to your Supabase project (or create one)
                  </Text>
                </View>
                <View style={styles.setupStep}>
                  <Text style={styles.setupStepNumber}>3</Text>
                  <Text style={styles.setupStepText}>
                    Run the database setup SQL (provided below)
                  </Text>
                </View>
              </View>
              <View style={styles.sqlCard}>
                <Text style={styles.sqlTitle}>Database Setup SQL:</Text>
                <Text style={styles.sqlCode}>
                  {`-- Create businesses table
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  google_sheet_url TEXT,
  qr_code_data TEXT NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own business"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business"
  ON businesses FOR UPDATE
  USING (auth.uid() = user_id);`}
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Show loading state
  if (authLoading || businessLoading) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen
            options={{
              title: 'Business',
            }}
          />
        )}
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Login/Signup Screen
  if (!user) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen
            options={{
              title: 'Business',
            }}
          />
        )}
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.loginScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.loginContainer}>
              <View style={styles.loginCard}>
                <IconSymbol name="lock.fill" color={colors.primary} size={64} />
                <Text style={styles.loginTitle}>
                  {authMode === 'login' ? 'Business Login' : 'Create Business Account'}
                </Text>
                <Text style={styles.loginSubtitle}>
                  {authMode === 'login' 
                    ? 'Sign in to access your dashboard and QR code'
                    : 'Sign up to get your unique QR code'}
                </Text>
                
                {authMode === 'signup' && (
                  <View style={styles.loginInputContainer}>
                    <Text style={styles.inputLabel}>Business Name</Text>
                    <TextInput
                      style={styles.loginInput}
                      value={businessName}
                      onChangeText={setBusinessName}
                      placeholder="Enter your business name"
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                )}

                <View style={styles.loginInputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.loginInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.loginInputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.loginInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <Pressable 
                  style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]} 
                  onPress={handleAuth}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.card} />
                  ) : (
                    <Text style={styles.loginButtonText}>
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                    </Text>
                  )}
                </Pressable>

                <Pressable 
                  style={styles.switchModeButton}
                  onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                >
                  <Text style={styles.switchModeText}>
                    {authMode === 'login' 
                      ? "Don't have an account? Sign up" 
                      : 'Already have an account? Sign in'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  // Business Dashboard (after login)
  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Business Dashboard',
          }}
        />
      )}
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://i.postimg.cc/W1WRMMdY/eaze-06.jpg' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Business Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {business?.business_name || 'Your Business'}
            </Text>
            <Text style={styles.headerEmail}>{user.email}</Text>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <IconSymbol name="arrow.right.square.fill" color={colors.card} size={18} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </View>

          {/* QR Code Card */}
          <View style={styles.qrCard}>
            <View style={styles.cardHeader}>
              <IconSymbol name="qrcode" color={colors.primary} size={24} />
              <Text style={styles.cardTitle}>Your Unique QR Code</Text>
            </View>
            <Text style={styles.cardDescription}>
              This QR code is unique to your business and links to your Google Sheet menu.
              {business?.google_sheet_url 
                ? ' Customers scanning this will see your menu data.'
                : ' Connect a Google Sheet below to activate it.'}
            </Text>
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodeBrandWrapper}>
                <View style={styles.qrCodeLogoContainer}>
                  <Image
                    source={{ uri: 'https://i.postimg.cc/W1WRMMdY/eaze-06.jpg' }}
                    style={styles.qrCodeLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.qrCodeWrapper}>
                  <QRCode
                    value={business?.qr_code_data || `https://yourapp.com/menu/${user.id}`}
                    size={220}
                    color={colors.primary}
                    backgroundColor="#FFFFFF"
                    quietZone={10}
                  />
                </View>
                <View style={styles.qrCodeBrandFooter}>
                  <Text style={styles.qrCodeBrandText}>Scan to view menu</Text>
                </View>
              </View>
              <Text style={styles.qrCodeUrl}>
                {business?.qr_code_data || `https://yourapp.com/menu/${user.id}`}
              </Text>
            </View>
            <View style={styles.qrActionsContainer}>
              <Pressable 
                style={styles.qrActionButton}
                onPress={() => {
                  Alert.alert('Download QR Code', 'In production, this would download the QR code as an image.');
                  console.log('Download QR code');
                }}
              >
                <IconSymbol name="arrow.down.circle.fill" color={colors.card} size={20} />
                <Text style={styles.qrActionButtonText}>Download</Text>
              </Pressable>
              <Pressable 
                style={[styles.qrActionButton, styles.qrActionButtonSecondary]}
                onPress={() => {
                  Alert.alert('Share QR Code', 'In production, this would open the share dialog.');
                  console.log('Share QR code');
                }}
              >
                <IconSymbol name="square.and.arrow.up.fill" color={colors.card} size={20} />
                <Text style={styles.qrActionButtonText}>Share</Text>
              </Pressable>
            </View>
          </View>

          {/* Google Sheets Integration Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="doc.text.fill" color={colors.secondary} size={24} />
              <Text style={styles.cardTitle}>Google Sheets Integration</Text>
            </View>
            {business?.google_sheet_url ? (
              <View style={styles.connectedSheetCard}>
                <IconSymbol name="checkmark.circle.fill" color={colors.primary} size={32} />
                <Text style={styles.connectedSheetTitle}>Sheet Connected!</Text>
                <Text style={styles.connectedSheetUrl} numberOfLines={2}>
                  {business.google_sheet_url}
                </Text>
              </View>
            ) : (
              <Text style={styles.cardDescription}>
                Connect your Google Sheet to link it with your QR code. Customers will access your menu data when they scan.
              </Text>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Google Sheet URL</Text>
              <TextInput
                style={styles.input}
                value={googleSheetUrl || business?.google_sheet_url || ''}
                onChangeText={setGoogleSheetUrl}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Pressable style={styles.connectButton} onPress={handleConnectSheet}>
              <IconSymbol name="link" color={colors.card} size={20} />
              <Text style={styles.connectButtonText}>
                {business?.google_sheet_url ? 'Update Sheet' : 'Connect Sheet'}
              </Text>
            </Pressable>
          </View>

          {/* Instructions Card */}
          <View style={styles.instructionsCard}>
            <View style={styles.cardHeader}>
              <IconSymbol name="info.circle.fill" color={colors.card} size={24} />
              <Text style={styles.cardTitle}>How to Set Up Your Sheet</Text>
            </View>
            <Text style={styles.instructionText}>
              Your Google Sheet should have the following columns:
            </Text>
            <View style={styles.columnList}>
              <View style={styles.columnItem}>
                <Text style={styles.columnBullet}>•</Text>
                <Text style={styles.columnText}>
                  <Text style={styles.columnBold}>Name:</Text> Dish name
                </Text>
              </View>
              <View style={styles.columnItem}>
                <Text style={styles.columnBullet}>•</Text>
                <Text style={styles.columnText}>
                  <Text style={styles.columnBold}>Description:</Text> Brief description
                </Text>
              </View>
              <View style={styles.columnItem}>
                <Text style={styles.columnBullet}>•</Text>
                <Text style={styles.columnText}>
                  <Text style={styles.columnBold}>Category:</Text> Mains, Salads, Desserts, etc.
                </Text>
              </View>
              <View style={styles.columnItem}>
                <Text style={styles.columnBullet}>•</Text>
                <Text style={styles.columnText}>
                  <Text style={styles.columnBold}>Allergens:</Text> Comma-separated (nuts, gluten, dairy, etc.)
                </Text>
              </View>
            </View>
          </View>

          {/* Business Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="building.2.fill" color={colors.primary} size={24} />
              <Text style={styles.cardTitle}>Business Information</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Business Name:</Text>
              <Text style={styles.infoValue}>{business?.business_name || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Business ID:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {business?.id || user.id}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Created:</Text>
              <Text style={styles.infoValue}>
                {business?.created_at 
                  ? new Date(business.created_at).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>

          {/* About Card */}
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>About Eaze</Text>
            <Text style={styles.aboutText}>
              This app helps restaurants digitalize their allergen information, making it easy for customers to find dishes that match their dietary needs.
            </Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>

          {/* Terms & Conditions Button */}
          <Pressable style={styles.termsButton} onPress={handleNavigateToTerms}>
            <IconSymbol name="doc.text.fill" color={colors.primary} size={20} />
            <Text style={styles.termsButtonText}>Terms & Conditions</Text>
            <IconSymbol name="chevron.right" color={colors.primary} size={18} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  // Logo Container
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  logoImage: {
    width: 240,
    height: 100,
  },
  // Setup Screen
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  setupCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
    boxShadow: '0px 8px 24px rgba(56, 189, 248, 0.3)',
    elevation: 8,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  setupText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
    lineHeight: 24,
  },
  setupSteps: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  setupStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  setupStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    color: colors.card,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
  },
  setupStepText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 32,
  },
  sqlCard: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  sqlTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  sqlCode: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  // Login Screen Styles
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
    boxShadow: '0px 8px 24px rgba(56, 189, 248, 0.3)',
    elevation: 8,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
    lineHeight: 24,
  },
  loginInputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  loginInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(56, 189, 248, 0.4)',
    elevation: 4,
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.card,
  },
  switchModeButton: {
    marginTop: 20,
    padding: 8,
  },
  switchModeText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Dashboard Styles
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 18,
    color: colors.text,
    marginTop: 6,
    fontWeight: '700',
  },
  headerEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
    gap: 8,
    boxShadow: '0px 2px 6px rgba(56, 189, 248, 0.3)',
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.card,
  },
  // QR Code Card Styles
  qrCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.accent,
    boxShadow: '0px 3px 10px rgba(56, 189, 248, 0.15)',
    elevation: 3,
    alignItems: 'center',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  qrCodeBrandWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    boxShadow: '0px 8px 24px rgba(56, 189, 248, 0.25)',
    elevation: 8,
    width: '100%',
    maxWidth: 320,
  },
  qrCodeLogoContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeLogoImage: {
    width: 180,
    height: 75,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  qrCodeBrandFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
    width: '100%',
    alignItems: 'center',
  },
  qrCodeBrandText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  qrCodeUrl: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  qrActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  qrActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    boxShadow: '0px 2px 6px rgba(56, 189, 248, 0.3)',
    elevation: 2,
  },
  qrActionButtonSecondary: {
    backgroundColor: colors.secondary,
  },
  qrActionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.card,
  },
  // Connected Sheet Card
  connectedSheetCard: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
    gap: 8,
  },
  connectedSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  connectedSheetUrl: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Common Card Styles
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.accent,
    boxShadow: '0px 3px 10px rgba(56, 189, 248, 0.15)',
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  connectButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    boxShadow: '0px 2px 6px rgba(56, 189, 248, 0.3)',
    elevation: 2,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.card,
  },
  instructionsCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(56, 189, 248, 0.3)',
    elevation: 4,
  },
  instructionText: {
    fontSize: 14,
    color: colors.card,
    marginBottom: 12,
    fontWeight: '600',
  },
  columnList: {
    gap: 8,
  },
  columnItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  columnBullet: {
    fontSize: 16,
    color: colors.card,
    marginRight: 8,
    marginTop: 2,
    fontWeight: '800',
  },
  columnText: {
    flex: 1,
    fontSize: 14,
    color: colors.card,
    lineHeight: 20,
    fontWeight: '500',
  },
  columnBold: {
    fontWeight: '800',
  },
  // Business Info
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  aboutCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(56, 189, 248, 0.3)',
    elevation: 4,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.card,
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: colors.card,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 12,
    color: colors.card,
    opacity: 0.7,
    fontWeight: '600',
  },
  // Terms & Conditions Button
  termsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 10,
    borderWidth: 2,
    borderColor: colors.accent,
    boxShadow: '0px 3px 10px rgba(56, 189, 248, 0.15)',
    elevation: 3,
  },
  termsButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    flex: 1,
  },
});
