
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
background: '#FFFFFF',   // Very light sky blue background
text: '#1A1A1A',         // Dark text for strong readability
textSecondary: '#0C4A6E',// Deep teal-blue for secondary text
primary: '#38BDF8',      // Bright sky blue (main action colour)
primaryDark: '#0284C7',  // Bold vivid blue for hover/active states
secondary: '#0EA5E9',    // Clear bright blue secondary tone
accent: '#BAE6FD',       // Soft pastel blue accent
card: '#FFFFFF',         // White card surface
highlight: '#E0F2FE',    // Light icy blue highlight
success: '#10B981',      // Green for success
warning: '#F59E0B',      // Warm amber for warnings
danger: '#EF4444',       // Bright red for errors
};

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.secondary,
    alignSelf: 'center',
    width: '100%',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 2px 3px rgba(59, 130, 246, 0.15)',
    elevation: 2,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.primary,
  },
});
