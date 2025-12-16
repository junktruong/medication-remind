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

const quickPresets: { label: string; days: Weekday[] }[] = [
    { label: 'Hàng ngày', days: [0, 1, 2, 3, 4, 5, 6] },
    { label: 'T2–T7', days: [1, 2, 3, 4, 5, 6] },
];

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

    const applyPreset = (days: Weekday[]) => {
        onChange({
            ...schedule,
            daysOfWeek: days,
        });
    };

    return (
        <View style={styles.wrapper}>
            <Text style={styles.label}>{title ?? 'Chọn ngày trong tuần'}</Text>
            <View style={styles.presetRow}>
                {quickPresets.map((preset) => {
                    const active =
                        preset.days.length === schedule.daysOfWeek.length &&
                        preset.days.every((day, idx) => day === schedule.daysOfWeek[idx]);

                    return (
                        <TouchableOpacity
                            key={preset.label}
                            style={[styles.presetButton, active && styles.presetButtonActive]}
                            onPress={() => applyPreset(preset.days)}
                        >
                            <Text style={[styles.presetText, active && styles.presetTextActive]}>{preset.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
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
    presetRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    presetButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    presetButtonActive: {
        backgroundColor: '#dbeafe',
        borderColor: '#2563eb',
    },
    presetText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
    },
    presetTextActive: {
        color: '#1d4ed8',
    },
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
