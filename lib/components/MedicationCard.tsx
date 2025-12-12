// src/components/MedicationCard.tsx
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Medication } from '../types/medication';

interface Props {
    medication: Medication;
    onPress: () => void;
    onToggleEnabled: (id: string, enabled: boolean) => void;
}

const MedicationCard: React.FC<Props> = ({ medication, onPress, onToggleEnabled }) => {
    const scheduleText = medication.schedules
        .map(s => `${s.hour.toString().padStart(2, '0')}:${s.minute.toString().padStart(2, '0')}`)
        .join(' • ');

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{medication.name}</Text>
                <Text style={styles.dosage}>{medication.dosage}</Text>
                <Text style={styles.schedule}>{scheduleText}</Text>
            </View>

            <Switch
                value={medication.enabled}
                onValueChange={(val) => onToggleEnabled(medication.id, val)}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 10,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },
    name: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
    dosage: { fontSize: 14, color: '#555' },
    schedule: { fontSize: 13, marginTop: 6, color: '#007AFF' },
});

export default MedicationCard;
