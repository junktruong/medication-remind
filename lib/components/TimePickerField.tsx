// src/components/TimePickerField.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MedicationSchedule } from '../types/medication';

interface Props {
    schedules: MedicationSchedule[];
    onChange: (schedules: MedicationSchedule[]) => void;
}

const TimePickerField: React.FC<Props> = ({ schedules, onChange }) => {
    // Nếu chưa có schedule → tạo mới
    const schedule = schedules[0] ?? {
        hour: 8,
        minute: 0,
        daysOfWeek: [],
    };

    const [editing, setEditing] = useState(false);
    const [h, setH] = useState(schedule.hour.toString().padStart(2, '0'));
    const [m, setM] = useState(schedule.minute.toString().padStart(2, '0'));

    const save = () => {
        const hh = Math.min(23, Math.max(0, parseInt(h || '0', 10)));
        const mm = Math.min(59, Math.max(0, parseInt(m || '0', 10)));

        const newSchedule: MedicationSchedule = {
            ...schedule,
            hour: hh,
            minute: mm,
        };

        onChange([newSchedule]);
        setEditing(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Giờ uống</Text>

            {!editing ? (
                <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
                    <Text style={styles.time}>
                        {schedule.hour.toString().padStart(2, '0')}:
                        {schedule.minute.toString().padStart(2, '0')}
                    </Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.editRow}>
                    <TextInput
                        style={styles.input}
                        keyboardType="number-pad"
                        value={h}
                        onChangeText={setH}
                        maxLength={2}
                    />
                    <Text style={styles.colon}>:</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="number-pad"
                        value={m}
                        onChangeText={setM}
                        maxLength={2}
                    />
                    <TouchableOpacity style={styles.saveBtn} onPress={save}>
                        <Text style={styles.saveText}>OK</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    label: { fontSize: 14, marginBottom: 6, color: '#333' },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    time: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
    editRow: { flexDirection: 'row', alignItems: 'center' },
    input: {
        width: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 6,
        textAlign: 'center',
        fontSize: 16,
        backgroundColor: '#fff',
    },
    colon: { fontSize: 18, marginHorizontal: 6 },
    saveBtn: {
        marginLeft: 10,
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    saveText: { color: '#fff', fontWeight: '600' },
});

export default TimePickerField;
