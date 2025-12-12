// lib/components/PrimaryButton.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface Props {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    style?: ViewStyle;
    danger?: boolean;
}

const PrimaryButton: React.FC<Props> = ({ title, onPress, disabled, style, danger }) => {
    return (
        <TouchableOpacity
            style={[styles.button, danger && styles.danger, disabled && styles.disabled, style]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    danger: {
        backgroundColor: '#dc2626',
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});

export default PrimaryButton;
