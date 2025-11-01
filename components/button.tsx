
import React from "react";
import { appleBlue, zincColors } from "@/constants/Colors";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  useColorScheme,
  ViewStyle,
} from "react-native";

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  children,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      small: { paddingHorizontal: 12, paddingVertical: 6 },
      medium: { paddingHorizontal: 16, paddingVertical: 10 },
      large: { paddingHorizontal: 20, paddingVertical: 14 },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: appleBlue,
      },
      secondary: {
        backgroundColor: isDark ? zincColors.zinc700 : zincColors.zinc200,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: appleBlue,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(disabled && { opacity: 0.5 }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, TextStyle> = {
      small: { fontSize: 12 },
      medium: { fontSize: 14 },
      large: { fontSize: 16 },
    };

    // Variant styles
    const variantStyles: Record<ButtonVariant, TextStyle> = {
      primary: {
        color: '#FFFFFF',
      },
      secondary: {
        color: isDark ? '#FFFFFF' : '#000000',
      },
      outline: {
        color: appleBlue,
      },
      ghost: {
        color: appleBlue,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        getButtonStyle(),
        pressed && !disabled && { opacity: 0.7 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : appleBlue}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{children}</Text>
      )}
    </Pressable>
  );
}
