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
            style={[styles.button, disabled && styles.disabled, style]}
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
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PrimaryButton;
