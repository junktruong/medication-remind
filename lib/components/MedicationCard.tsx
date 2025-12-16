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
    const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const formatSchedule = (schedule: Medication['schedules'][number]) => {
        const days = schedule.daysOfWeek;
        const dayText = !days?.length || days.length === 7
            ? 'Hàng ngày'
            : days.map((d) => dayLabels[d] ?? '').join(' ');

        const hour = schedule.hour.toString().padStart(2, '0');
        const minute = schedule.minute.toString().padStart(2, '0');

        return `${dayText} • ${hour}:${minute}`;
    };

    const scheduleText = medication.schedules.map(formatSchedule).join('  |  ');

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
