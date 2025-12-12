// src/components/TextInputField.tsx
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface Props {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    multiline?: boolean;
}

const TextInputField: React.FC<Props> = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <TextInput
                style={[styles.input, multiline && styles.multiline]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                multiline={multiline}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 18 },
    label: { fontSize: 18, marginBottom: 8, color: '#0f172a', fontWeight: '700' },
    input: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 18,
        backgroundColor: '#fff',
    },
    multiline: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
});

export default TextInputField;
