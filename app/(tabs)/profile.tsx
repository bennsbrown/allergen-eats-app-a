
import React, { useState, useEffect, useRef } from 'react';
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
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { Share } from 'react-native';
import { supabase } from '@/app/integrations/supabase/client';
import { useBusiness } from '@/hooks/useBusiness';
import Button from '@/components/button';
import html2canvas from 'html2canvas';


export default function ProfileScreen() {
  const { business, loading: businessLoading, loginWithCode, logout } = useBusiness();
  const [loginCode, setLoginCode] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lastDebug, setLastDebug] = useState('');
  const [syncDebug, setSyncDebug] = useState('');

  // Business code constant for QR generation
  const businessCode = business?.qr_slug || "";

  // QR image URL (hosted QR, no libraries required)
  const businessUrl = businessCode
    ? `https://eatwitheaze.netlify.app?code=${encodeURIComponent(businessCode)}`
    : '';

  const qrImageUrl = businessUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        businessUrl
      )}`
    : '';

  const handleCopyLink = async () => {
    if (!businessUrl) {
      Alert.alert('No business code', 'Please set a business code before copying the link.');
      return;
    }

    await Clipboard.setStringAsync(businessUrl);
    Alert.alert('Copied', 'Menu link copied to clipboard.');
  };

  const handleDownloadQR = async () => {
    if (!qrImageUrl) {
      Alert.alert('No QR available', 'Please set a business code to generate the QR code.');
      return;
    }
    // Open the hosted QR image in the browser so the user can save/download it
    await WebBrowser.openBrowserAsync(qrImageUrl);
  };

  const qrRef = useRef<any>(null);

  const handleSaveToPhotos = async () => {
    console.log("Saving QR Code!")

    if (!businessUrl) {
      console.error("No QR code available")
      Alert.alert('No QR available', 'Please set a business code to generate the QR code.');
      return;
    }
    const element: HTMLElement|null = document.getElementById("buisinessQRCodeSticker");
    console.log(element)
    if(element === null){
      console.error("Unable to locate generated QR Code sticker")
      return;
    }

    html2canvas(element, {useCORS : true, scale : 2}).then(canvas => {
      const link = document.createElement("a");
      link.download = `${businessCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });    
  };

  const handleShareLink = async () => {
    if (!businessUrl) {
      Alert.alert('No business code', 'Please set a business code before sharing.');
      return;
    }

    try {
      await Share.share({ message: businessUrl });
    } catch (error: any) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Unable to open share dialog.');
    }
  };

  const handleLogin = async () => {
    setLastDebug('Login button pressed');
    Alert.alert('DEBUG', 'Login button pressed');

    if (!loginCode.trim()) {
      setLastDebug('Error: No code entered');
      Alert.alert('Error', 'Please enter a business code');
      return;
    }

    setIsLoggingIn(true);

    try {
      const normalizedCode = loginCode.trim();
      setLastDebug('Code entered: ' + normalizedCode);
      Alert.alert('DEBUG', 'Code entered: ' + normalizedCode);

      // Query the business table for the entered code
      const { data, error } = await (supabase as any)
        .from('business')
        .select('*')
        .eq('unique_identifier', normalizedCode)
        .maybeSingle();

      if (error) {
        setLastDebug('Supabase error: ' + error.message);
        Alert.alert('Supabase error', error.message);
        console.error('Supabase query error:', error);
        return;
      }

      if (!data) {
        setLastDebug('No business found for code: ' + normalizedCode);
        Alert.alert(
          'Error',
          "We couldn't find a business with that code. Please check your code and try again."
        );
        return;
      }

      setLastDebug('Business found: ' + data.name);
      Alert.alert('DEBUG', 'Business found: id=' + data.id + ', name=' + data.name);

      // Store business data using the hook
      await loginWithCode(data);

      setLastDebug('Navigating to dashboard/profile');
      Alert.alert('DEBUG', 'Navigating to dashboard/profile now');
      console.log('Business login successful');
    } catch (error: any) {
      console.error('Error in handleLogin:', error);
      setLastDebug('Unexpected error: ' + error.message);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLoginCode('');
    setGoogleSheetUrl('');
    setLastDebug('');
    setSyncDebug('');
    Alert.alert('Logged Out', 'You have been logged out of the business section.');
    console.log('Business logout');
  };

  const handleUpdateSheetURL = async () => {
    setSyncDebug('Sync button pressed');

    if (!googleSheetUrl.trim()) {
      setSyncDebug('Error: No Google Sheet URL entered');
      Alert.alert('Error', 'Please enter a Google Sheet URL');
      return;
    }

    if (!business?.id) {
      setSyncDebug('Error: Business ID not found');
      Alert.alert('Error', 'Business ID not found. Please try logging in again.');
      return;
    }

    setIsSyncing(true);

    try {
      console.log('=== SYNC MENU START ===');
      console.log('Business ID:', business.id);
      console.log('Sheet URL:', googleSheetUrl.trim());
      setSyncDebug('Starting sync for business ID: ' + business.id);

      // 1. Save the Google Sheet URL to business.sheet_url in Supabase
      const { error: updateError } = await (supabase as any)
        .from('business')
        .update({ sheet_url: googleSheetUrl.trim() })
        .eq('id', business.id);

      if (updateError) {
        console.error('Failed to update sheet URL:', updateError);
        setSyncDebug('Failed to save sheet URL: ' + updateError.message);
        Alert.alert('Error', `Failed to save sheet URL: ${updateError.message}`);
        return;
      }

      console.log('Sheet URL saved successfully, invoking sync-menu edge function...');
      setSyncDebug('Sheet URL saved, invoking sync-menu edge function...');

      // 2. Invoke the Supabase Edge Function called sync-menu (with hyphen)
      const { data, error } = await supabase.functions.invoke('sync-menu', {
        body: { business_id: business.id, sheet_url: googleSheetUrl.trim()}, //TODO FIX HERE
      });

      console.log('=== EDGE FUNCTION RESPONSE ===');
      console.log('Response data:', JSON.stringify(data, null, 2));
      console.log('Response error:', error);

      // Handle edge function invocation errors (network, timeout, etc.)
      if (error) {
        console.error('Edge function invocation error:', error);
        setSyncDebug('Edge function error: ' + error.message);
        Alert.alert('Error', error.message || 'Failed to sync menu. Please try again.');
        return;
      }

      // Handle errors returned in the response body
      if (data?.error) {
        console.error('Edge function returned error:', data.error);
        setSyncDebug('Edge function returned error: ' + data.error);

        // Check for specific error messages
        const errorMessage = data.error.toLowerCase();

        if (errorMessage.includes('no menu') || errorMessage.includes('menu not found')) {
          Alert.alert('Error', 'No menu found. Please check your Google Sheet and try again.');
        } else if (errorMessage.includes('no sheet') || errorMessage.includes('sheet_url') || errorMessage.includes('sheet url')) {
          Alert.alert('Error', 'No sheet URL found. Please enter a valid Google Sheet URL and try again.');
        } else {
          Alert.alert('Error', data.error);
        }
        return;
      }

      // 3. Show success message with items created count
      const itemsCreated = data?.items_created ?? 0;

      console.log('=== SYNC SUCCESS ===');
      console.log('Items created:', itemsCreated);
      setSyncDebug('Success! Menu synced. ' + itemsCreated + ' items created.');

      // Display success alert with exact format requested
      Alert.alert('Success', 'Menu synced! ' + itemsCreated + ' items created.');

      console.log(`Menu sync completed successfully. ${itemsCreated} items created.`);
    } catch (error: any) {
      console.error('Error in handleSaveAndSyncMenu:', error);
      setSyncDebug('Unexpected error: ' + error.message);
      Alert.alert('Error', error.message || 'An error occurred while syncing the menu. Please try again.');
    } finally {
      setIsSyncing(false);
      console.log('=== SYNC MENU END ===');
    }
  };

const handleUpdateFromCurrentSheet = async () => {
    setSyncDebug('Sync button pressed');

    if (!business?.id) {
      setSyncDebug('Error: Business ID not found');
      Alert.alert('Error', 'Business ID not found. Please try logging in again.');
      return;
    }

    setIsSyncing(true);

    try {
      console.log('=== SYNC MENU START ===');
      console.log('Business ID:', business.id);
      setSyncDebug('Starting sync for business ID: ' + business.id);

      // 1. Save the Google Sheet URL to business.sheet_url in Supabase
      const { error: updateError } = await (supabase as any)
        .from('business')
        .update({ sheet_url: googleSheetUrl.trim() })
        .eq('id', business.id);

      if (updateError) {
        console.error('Failed to update sheet URL:', updateError);
        setSyncDebug('Failed to save sheet URL: ' + updateError.message);
        Alert.alert('Error', `Failed to save sheet URL: ${updateError.message}`);
        return;
      }

      console.log('Sheet URL saved successfully, invoking sync-menu edge function...');
      setSyncDebug('Sheet URL saved, invoking sync-menu edge function...');

      // 2. Invoke the Supabase Edge Function called sync-menu (with hyphen)
      const { data, error } = await supabase.functions.invoke('sync-menu', {
        body: { business_id: business.id, sheet_url: googleSheetUrl.trim()}, //TODO FIX HERE
      });

      console.log('=== EDGE FUNCTION RESPONSE ===');
      console.log('Response data:', JSON.stringify(data, null, 2));
      console.log('Response error:', error);

      // Handle edge function invocation errors (network, timeout, etc.)
      if (error) {
        console.error('Edge function invocation error:', error);
        setSyncDebug('Edge function error: ' + error.message);
        Alert.alert('Error', error.message || 'Failed to sync menu. Please try again.');
        return;
      }

      // Handle errors returned in the response body
      if (data?.error) {
        console.error('Edge function returned error:', data.error);
        setSyncDebug('Edge function returned error: ' + data.error);

        // Check for specific error messages
        const errorMessage = data.error.toLowerCase();

        if (errorMessage.includes('no menu') || errorMessage.includes('menu not found')) {
          Alert.alert('Error', 'No menu found. Please check your Google Sheet and try again.');
        } else if (errorMessage.includes('no sheet') || errorMessage.includes('sheet_url') || errorMessage.includes('sheet url')) {
          Alert.alert('Error', 'No sheet URL found. Please enter a valid Google Sheet URL and try again.');
        } else {
          Alert.alert('Error', data.error);
        }
        return;
      }

      // 3. Show success message with items created count
      const itemsCreated = data?.items_created ?? 0;

      console.log('=== SYNC SUCCESS ===');
      console.log('Items created:', itemsCreated);
      setSyncDebug('Success! Menu synced. ' + itemsCreated + ' items created.');

      // Display success alert with exact format requested
      Alert.alert('Success', 'Menu synced! ' + itemsCreated + ' items created.');

      console.log(`Menu sync completed successfully. ${itemsCreated} items created.`);
    } catch (error: any) {
      console.error('Error in handleSaveAndSyncMenu:', error);
      setSyncDebug('Unexpected error: ' + error.message);
      Alert.alert('Error', error.message || 'An error occurred while syncing the menu. Please try again.');
    } finally {
      setIsSyncing(false);
      console.log('=== SYNC MENU END ===');
    }
  };

const handleNavigateToTerms = () => {
    console.log('Navigating to Terms & Conditions');
    router.push('/terms-acceptance');
  };

  // Login Screen
  if (!business) {
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
                  editable={!isLoggingIn}
                />
              </View>

              <Pressable
                style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <ActivityIndicator color={colors.card} size="small" />
                    <Text style={styles.loginButtonText}>Logging in...</Text>
                  </>
                ) : (
                  <Text style={styles.loginButtonText}>Access Dashboard</Text>
                )}
              </Pressable>

              {lastDebug ? (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugLabel}>Debug Status:</Text>
                  <Text style={styles.debugText}>{lastDebug}</Text>
                </View>
              ) : null}

              <View style={styles.loginHintCard}>
                <IconSymbol name="info.circle.fill" color={colors.secondary} size={20} />
                <Text style={styles.loginHintText}>
                  Enter your business code (e.g. PIZZA-001)
                </Text>
              </View>
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
          {/* Header with Logo - No box, matching customer section */}
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
              {business.name || 'Manage your allergen menu configuration'}
            </Text>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <IconSymbol name="arrow.right.square.fill" color={colors.card} size={18} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </View>

          {/* Google Sheets Integration Card - Moved to top for better visibility */}
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
                placeholder=""
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSyncing}
              />
            </View>
            <Pressable
              style={[styles.connectButton, isSyncing && styles.connectButtonDisabled]}
              onPress={handleUpdateSheetURL}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <ActivityIndicator color={colors.card} size="small" />
                  <Text style={styles.connectButtonText}>Syncing Menu...</Text>
                </>
              ) : (
                <>
                  <IconSymbol name="arrow.triangle.2.circlepath" color={colors.card} size={20} />
                  <Text style={styles.connectButtonText}>Save & Sync Menu</Text>
                </>
              )}
            </Pressable>

            {syncDebug ? (
              <View style={styles.debugContainer}>
                <Text style={styles.debugLabel}>Debug Status:</Text>
                <Text style={styles.debugText}>{syncDebug}</Text>
              </View>
            ) : null}
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
                  <Text style={styles.columnBold}>Description:</Text> Brief description (optional)
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
                  <Text style={styles.columnBold}>Preferences:</Text> Comma-separated (vegan, vegetarian, etc.)
                </Text>
              </View>
            </View>
            <View style={styles.instructionNote}>
              <IconSymbol name="exclamationmark.triangle.fill" color={colors.card} size={16} />
              <Text style={styles.instructionNoteText}>
                Make sure your Google Sheet is publicly accessible (Anyone with the link can view)
              </Text>
            </View>
          </View>

          {/* QR Code Card */}
          <View style={styles.qrCard}>
            <View style={styles.cardHeader}>
              <IconSymbol name="qrcode" color={colors.primary} size={24} />
              <Text style={styles.cardTitle}>Customer Menu QR Code</Text>
            </View>
            <Text style={styles.cardDescription}>
              Share this QR code with your customers. They can scan it to view your allergen-friendly menu.
            </Text>
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodeBrandWrapper}
                id = "buisinessQRCodeSticker"
              >
                <View style={styles.qrCodeLogoContainer}>
                  <Image
                    source={{ uri: 'https://i.postimg.cc/W1WRMMdY/eaze-06.jpg' }}
                    style={styles.qrCodeLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.qrCodeWrapper}
                    id = "Buisiness_QRcode"
                >
                  <QRCode
                    ref={qrRef}
                    value={businessUrl}
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
              <Text style={styles.qrCodeUrl}>{businessUrl}</Text>
            </View>
            <View style={styles.qrActionsContainer}>
              <Pressable
                style={[styles.qrActionButton, !businessUrl && styles.qrActionButtonDisabled]}
                onPress={handleCopyLink}
                disabled={!businessUrl}
              >
                <IconSymbol name="doc.on.doc.fill" color={colors.card} size={20} />
                <Text style={styles.qrActionButtonText}>Copy Link</Text>
              </Pressable>

              <Pressable
                style={[styles.qrActionButton, !businessUrl && styles.qrActionButtonDisabled]}
                onPress={handleSaveToPhotos}
                disabled={!businessUrl}
              >
                <IconSymbol name="arrow.down.circle.fill" color={colors.card} size={20} />
                <Text style={styles.qrActionButtonText}>Save</Text>
              </Pressable>

              <Pressable
                style={[styles.qrActionButton, styles.qrActionButtonSecondary, !businessUrl && styles.qrActionButtonDisabled]}
                onPress={handleShareLink}
                disabled={!businessUrl}
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
              <Text style={styles.businessCodeText}>
                {business.unique_identifier || 'N/A'}
              </Text>
            </View>
            <Text style={styles.cardDescription}>
              Keep this code secure. You&apos;ll need it to access the business dashboard.
            </Text>
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
  // Logo Container - No box, matching customer section
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  logoImage: {
    width: 240,
    height: 100,
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
    boxShadow: '0px 8px 24px rgba(56, 189, 248, 0.3)',
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0px 4px 12px rgba(56, 189, 248, 0.4)',
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.card,
  },
  debugContainer: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  debugText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    lineHeight: 20,
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
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  loginHintCode: {
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 1,
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
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
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
  qrActionButtonDisabled: {
    opacity: 0.5,
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
  connectButtonDisabled: {
    opacity: 0.6,
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
    marginBottom: 12,
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
  instructionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  instructionNoteText: {
    flex: 1,
    fontSize: 12,
    color: colors.card,
    fontWeight: '600',
    lineHeight: 18,
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
