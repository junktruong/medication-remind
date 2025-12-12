// src/components/DayOfWeekSelector.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MedicationSchedule, Weekday } from '../types/medication';

interface Props {
    schedules: MedicationSchedule[];
    onChange: (schedules: MedicationSchedule[]) => void;
}

const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const DayOfWeekSelector: React.FC<Props> = ({ schedules, onChange }) => {
    // Nếu chưa có schedule nào → tạo schedule đầu tiên
    const schedule = schedules[0] ?? {
        hour: 8,
        minute: 0,
        daysOfWeek: [] as Weekday[],
    };

    const toggleDay = (day: Weekday) => {
        const exists = schedule.daysOfWeek.includes(day);

        const newDays = exists
            ? schedule.daysOfWeek.filter(d => d !== day) as Weekday[]
            : [...schedule.daysOfWeek, day].sort((a, b) => a - b) as Weekday[];

        const newSchedule: MedicationSchedule = {
            ...schedule,
            daysOfWeek: newDays,
        };

        onChange([newSchedule]); // luôn trả mảng schedules
    };

    return (
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
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 12,
    },
    day: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    active: {
        backgroundColor: '#007AFF22',
        borderColor: '#007AFF',
    },
    text: {
        fontSize: 14,
        color: '#333',
    },
    activeText: {
        color: '#007AFF',
        fontWeight: '600',
    },
});

export default DayOfWeekSelector;
