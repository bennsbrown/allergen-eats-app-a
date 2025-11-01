
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
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Stack, router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

// Business data mapping based on business code
const BUSINESS_DATA: Record<string, {
  name: string;
  address: string;
  phone: string;
  email: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  subscriptionExpiry: string;
}> = {
  'DEMO2024': {
    name: 'The Gourmet Kitchen',
    address: '123 Main Street, London, UK',
    phone: '+44 20 1234 5678',
    email: 'info@gourmetkitchen.com',
    subscriptionStatus: 'active',
    subscriptionExpiry: '2025-12-31',
  },
  'CAFE2024': {
    name: 'Sunrise Café',
    address: '456 High Street, Manchester, UK',
    phone: '+44 161 234 5678',
    email: 'hello@sunrisecafe.com',
    subscriptionStatus: 'trial',
    subscriptionExpiry: '2024-06-30',
  },
  'REST2024': {
    name: 'Ocean View Restaurant',
    address: '789 Beach Road, Brighton, UK',
    phone: '+44 1273 234 567',
    email: 'contact@oceanview.com',
    subscriptionStatus: 'inactive',
    subscriptionExpiry: '2024-01-15',
  },
};

export default function ProfileScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginCode, setLoginCode] = useState('');
  const [businessCode, setBusinessCode] = useState('DEMO2024');
  const [businessInfo, setBusinessInfo] = useState(BUSINESS_DATA['DEMO2024']);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleLogin = () => {
    const code = loginCode.trim().toUpperCase();
    const businessData = BUSINESS_DATA[code];
    
    if (businessData) {
      // Check subscription status
      if (businessData.subscriptionStatus === 'inactive') {
        Alert.alert(
          'Subscription Required',
          'Your subscription has expired. Please renew your subscription to access the business dashboard.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Renew Subscription', 
              onPress: () => {
                console.log('Navigate to subscription renewal');
                Alert.alert('Subscription', 'In production, this would open the subscription renewal page.');
              }
            }
          ]
        );
        return;
      }
      
      setIsLoggedIn(true);
      setBusinessCode(code);
      setBusinessInfo(businessData);
      Alert.alert('Success', `Welcome to ${businessData.name}!`);
      console.log('Business login successful:', code);
    } else {
      Alert.alert('Invalid Code', 'Please enter a valid business access code.');
      console.log('Login failed with code:', code);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginCode('');
    Alert.alert('Logged Out', 'You have been logged out of the business section.');
    console.log('Business logout');
  };

  const handleSaveSettings = () => {
    setIsEditing(false);
    Alert.alert('Settings Saved', 'Your restaurant settings have been updated.');
    console.log('Settings saved:', businessInfo);
  };

  const handleConnectSheet = () => {
    if (!googleSheetUrl) {
      Alert.alert('Error', 'Please enter a Google Sheet URL');
      return;
    }
    Alert.alert(
      'Connect Google Sheet',
      'In production, this would connect to your Google Sheet and import menu data. For now, we are using sample data.',
      [{ text: 'OK' }]
    );
    console.log('Connecting to Google Sheet:', googleSheetUrl);
  };

  const generateMenuUrl = () => {
    return `https://eaze.app/menu/${businessCode}`;
  };

  const handleViewTerms = () => {
    router.push('/terms-acceptance');
  };

  const getSubscriptionStatusColor = () => {
    switch (businessInfo.subscriptionStatus) {
      case 'active':
        return colors.success;
      case 'trial':
        return colors.warning;
      case 'inactive':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };

  const getSubscriptionStatusText = () => {
    switch (businessInfo.subscriptionStatus) {
      case 'active':
        return 'Active';
      case 'trial':
        return 'Trial';
      case 'inactive':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  // Login Screen
  if (!isLoggedIn) {
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
          <View style={styles.loginContainer}>
            <View style={styles.loginCard}>
              <IconSymbol name="lock.fill" color={colors.primary} size={64} />
              <Text style={styles.loginTitle}>Business Access</Text>
              <Text style={styles.loginSubtitle}>
                Enter your unique business code to access the dashboard
              </Text>
              
              <View style={styles.loginInputContainer}>
                <TextInput
                  style={styles.loginInput}
                  value={loginCode}
                  onChangeText={setLoginCode}
                  placeholder="Enter business code"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  secureTextEntry={false}
                />
              </View>

              <Pressable style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Access Dashboard</Text>
              </Pressable>

              <View style={styles.loginHintCard}>
                <IconSymbol name="info.circle.fill" color={colors.secondary} size={20} />
                <Text style={styles.loginHintText}>
                  Demo codes: <Text style={styles.loginHintCode}>DEMO2024</Text>, <Text style={styles.loginHintCode}>CAFE2024</Text>, <Text style={styles.loginHintCode}>REST2024</Text>
                </Text>
              </View>

              <Pressable style={styles.termsLink} onPress={handleViewTerms}>
                <IconSymbol name="doc.text" color={colors.primary} size={16} />
                <Text style={styles.termsLinkText}>View Terms & Conditions</Text>
              </Pressable>
            </View>
          </View>
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
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>{businessInfo.name}</Text>
            <Text style={styles.headerSubtitle}>
              Manage your allergen menu configuration
            </Text>
            
            {/* Subscription Status Badge */}
            <View style={[styles.subscriptionBadge, { backgroundColor: getSubscriptionStatusColor() }]}>
              <IconSymbol name="checkmark.seal.fill" color={colors.card} size={16} />
              <Text style={styles.subscriptionBadgeText}>
                {getSubscriptionStatusText()} until {businessInfo.subscriptionExpiry}
              </Text>
            </View>

            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <IconSymbol name="arrow.right.square.fill" color={colors.card} size={18} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </View>

          {/* QR Code Card - Enhanced with blue/white theme */}
          <View style={styles.qrCard}>
            <View style={styles.cardHeader}>
              <IconSymbol name="qrcode" color={colors.primary} size={24} />
              <Text style={styles.cardTitle}>Customer Menu QR Code</Text>
            </View>
            <Text style={styles.cardDescription}>
              Share this QR code with your customers. They can scan it to view your allergen-friendly menu.
            </Text>
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodeWrapper}>
                <View style={styles.qrCodeInner}>
                  <QRCode
                    value={generateMenuUrl()}
                    size={220}
                    color={colors.primary}
                    backgroundColor={colors.card}
                    logo={require('@/assets/images/final_quest_240x240.png')}
                    logoSize={50}
                    logoBackgroundColor={colors.card}
                    logoMargin={4}
                    logoBorderRadius={8}
                  />
                </View>
                <View style={styles.qrBrandingContainer}>
                  <Text style={styles.qrBrandingText}>Powered by</Text>
                  <Text style={styles.qrBrandingLogo}>Eaze</Text>
                </View>
              </View>
              <Text style={styles.qrCodeUrl}>{generateMenuUrl()}</Text>
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

          {/* Business Code Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="key.fill" color={colors.secondary} size={24} />
              <Text style={styles.cardTitle}>Your Business Code</Text>
            </View>
            <View style={styles.businessCodeDisplay}>
              <Text style={styles.businessCodeText}>{businessCode}</Text>
            </View>
            <Text style={styles.cardDescription}>
              Keep this code secure. You&apos;ll need it to access the business dashboard.
            </Text>
          </View>

          {/* Restaurant Info Card - Auto-updated from business code */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Restaurant Information</Text>
              <Pressable onPress={() => setIsEditing(!isEditing)}>
                <IconSymbol
                  name={isEditing ? 'checkmark.circle.fill' : 'pencil.circle.fill'}
                  color={colors.primary}
                  size={24}
                />
              </Pressable>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Restaurant Name</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={businessInfo.name}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, name: text })}
                editable={isEditing}
                placeholder="Enter restaurant name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={businessInfo.address}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, address: text })}
                editable={isEditing}
                placeholder="Enter address"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={businessInfo.phone}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, phone: text })}
                editable={isEditing}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={businessInfo.email}
                onChangeText={(text) => setBusinessInfo({ ...businessInfo, email: text })}
                editable={isEditing}
                placeholder="Enter email"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            </View>
            {isEditing && (
              <Pressable style={styles.saveButton} onPress={handleSaveSettings}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </Pressable>
            )}
          </View>

          {/* Google Sheets Integration Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="doc.text.fill" color={colors.secondary} size={24} />
              <Text style={styles.cardTitle}>Google Sheets Integration</Text>
            </View>
            <Text style={styles.cardDescription}>
              Connect your Google Sheet to automatically import and update your menu items and allergen information.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Google Sheet URL</Text>
              <TextInput
                style={styles.input}
                value={googleSheetUrl}
                onChangeText={setGoogleSheetUrl}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Pressable style={styles.connectButton} onPress={handleConnectSheet}>
              <IconSymbol name="link" color={colors.card} size={20} />
              <Text style={styles.connectButtonText}>Connect Sheet</Text>
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
              <View style={styles.columnItem}>
                <Text style={styles.columnBullet}>•</Text>
                <Text style={styles.columnText}>
                  <Text style={styles.columnBold}>Price:</Text> Numeric value
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="chart.bar.fill" color={colors.primary} size={24} />
              <Text style={styles.cardTitle}>Menu Statistics</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Total Dishes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>8</Text>
                <Text style={styles.statLabel}>Allergen Types</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>4</Text>
                <Text style={styles.statLabel}>Categories</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>3</Text>
                <Text style={styles.statLabel}>Vegan Options</Text>
              </View>
            </View>
          </View>

          {/* About Card - Changed to "About Eaze" */}
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>About Eaze</Text>
            <Text style={styles.aboutText}>
              Eaze helps restaurants digitalize their allergen information, making it easy for customers to find dishes that match their dietary needs. Our platform streamlines menu management and enhances customer experience.
            </Text>
            <Pressable style={styles.termsButton} onPress={handleViewTerms}>
              <IconSymbol name="doc.text" color={colors.card} size={18} />
              <Text style={styles.termsButtonText}>View Terms & Conditions</Text>
            </Pressable>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
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
    paddingTop: 16,
    paddingBottom: 16,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  // Login Screen Styles
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
    boxShadow: '0px 8px 24px rgba(59, 130, 246, 0.3)',
    elevation: 8,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
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
    marginBottom: 20,
  },
  loginInput: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 18,
    fontSize: 18,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.accent,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 2,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(59, 130, 246, 0.4)',
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.card,
  },
  loginHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  loginHintText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  loginHintCode: {
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 1,
  },
  termsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    padding: 8,
  },
  termsLinkText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  // Dashboard Styles
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
    marginBottom: 16,
    boxShadow: '0px 4px 16px rgba(59, 130, 246, 0.3)',
    elevation: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  subscriptionBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.card,
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
    boxShadow: '0px 2px 6px rgba(30, 64, 175, 0.3)',
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.card,
  },
  // QR Code Card Styles - Enhanced
  qrCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.primary,
    boxShadow: '0px 6px 20px rgba(59, 130, 246, 0.25)',
    elevation: 6,
    alignItems: 'center',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrCodeWrapper: {
    padding: 24,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.primary,
    boxShadow: '0px 4px 16px rgba(59, 130, 246, 0.3)',
    elevation: 4,
    alignItems: 'center',
  },
  qrCodeInner: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  qrBrandingContainer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  qrBrandingText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  qrBrandingLogo: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '800',
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
    boxShadow: '0px 2px 6px rgba(59, 130, 246, 0.3)',
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
  // Business Code Card
  businessCodeDisplay: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 20,
    marginVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  businessCodeText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 4,
  },
  // Common Card Styles
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.accent,
    boxShadow: '0px 3px 10px rgba(59, 130, 246, 0.15)',
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
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
  inputDisabled: {
    opacity: 0.6,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    boxShadow: '0px 2px 6px rgba(59, 130, 246, 0.3)',
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.card,
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
    boxShadow: '0px 2px 6px rgba(30, 64, 175, 0.3)',
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
    boxShadow: '0px 4px 12px rgba(59, 130, 246, 0.3)',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '700',
  },
  aboutCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(30, 64, 175, 0.3)',
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
    marginBottom: 16,
    fontWeight: '500',
  },
  termsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  termsButtonText: {
    fontSize: 13,
    color: colors.card,
    fontWeight: '800',
  },
  versionText: {
    fontSize: 12,
    color: colors.card,
    opacity: 0.7,
    fontWeight: '600',
  },
});
