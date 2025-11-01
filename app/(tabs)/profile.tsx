
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
import { Stack } from 'expo-router';

export default function ProfileScreen() {
  const [restaurantName, setRestaurantName] = useState('My Restaurant');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveSettings = () => {
    setIsEditing(false);
    Alert.alert('Settings Saved', 'Your restaurant settings have been updated.');
    console.log('Settings saved:', { restaurantName, googleSheetUrl });
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

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Settings',
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
            <Text style={styles.headerTitle}>Restaurant Settings</Text>
            <Text style={styles.headerSubtitle}>
              Manage your allergen menu configuration
            </Text>
          </View>

          {/* Restaurant Info Card */}
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
                value={restaurantName}
                onChangeText={setRestaurantName}
                editable={isEditing}
                placeholder="Enter restaurant name"
                placeholderTextColor={colors.textSecondary}
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

          {/* About Card */}
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>About Allergen Menu</Text>
            <Text style={styles.aboutText}>
              This app helps restaurants digitalize their allergen information, making it easy for customers to find dishes that match their dietary needs.
            </Text>
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
    boxShadow: '0px 4px 16px rgba(255, 107, 107, 0.3)',
    elevation: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.accent,
    boxShadow: '0px 3px 10px rgba(255, 107, 107, 0.15)',
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
    boxShadow: '0px 2px 6px rgba(255, 107, 107, 0.3)',
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
    boxShadow: '0px 2px 6px rgba(190, 22, 34, 0.3)',
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
    boxShadow: '0px 4px 12px rgba(255, 107, 107, 0.3)',
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
    boxShadow: '0px 4px 12px rgba(190, 22, 34, 0.3)',
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
});
