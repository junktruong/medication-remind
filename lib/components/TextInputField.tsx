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
    container: { marginBottom: 16 },
    label: { fontSize: 14, marginBottom: 6, color: '#333' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
});

export default TextInputField;
