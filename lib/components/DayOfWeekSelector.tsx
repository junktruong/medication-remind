// src/components/DayOfWeekSelector.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MedicationSchedule, Weekday } from '../types/medication';

interface Props {
    schedule: MedicationSchedule;
    onChange: (schedule: MedicationSchedule) => void;
    title?: string;
}

const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const DayOfWeekSelector: React.FC<Props> = ({ schedule, onChange, title }) => {
    const toggleDay = (day: Weekday) => {
        const exists = schedule.daysOfWeek.includes(day);

        const newDays = exists
            ? schedule.daysOfWeek.filter(d => d !== day) as Weekday[]
            : [...schedule.daysOfWeek, day].sort((a, b) => a - b) as Weekday[];

        const newSchedule: MedicationSchedule = {
            ...schedule,
            daysOfWeek: newDays,
        };

        onChange(newSchedule);
    };

    return (
        <View style={styles.wrapper}>
            <Text style={styles.label}>{title ?? 'Chọn ngày trong tuần'}</Text>
            <View style={styles.row}>
                {labels.map((label, idx) => {
                    const active = schedule.daysOfWeek.includes(idx as Weekday);
                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.day, active && styles.active]}
                            onPress={() => toggleDay(idx as Weekday)}
                        >
                            <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { marginBottom: 16 },
    label: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        // justifyContent: '',
        gap: 8,
    },
    day: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        backgroundColor: '#f8fafc',
        minWidth: 48,
        alignItems: 'center',
    },
    active: {
        backgroundColor: '#dbeafe',
        borderColor: '#2563eb',
    },
    text: {
        fontSize: 16,
        color: '#0f172a',
        fontWeight: '700',
    },
    activeText: {
        color: '#1d4ed8',
    },
});

export default DayOfWeekSelector;
