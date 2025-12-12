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
                    <Text style={styles.helper}>Chạm để chỉnh giờ</Text>
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
    container: { marginBottom: 18 },
    label: { fontSize: 18, marginBottom: 8, color: '#0f172a', fontWeight: '700' },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        alignSelf: 'flex-start',
        backgroundColor: '#f8fafc',
    },
    time: { fontSize: 22, color: '#1d4ed8', fontWeight: '800', letterSpacing: 1 },
    helper: { fontSize: 14, color: '#475569', marginTop: 4 },
    editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    input: {
        width: 54,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 10,
        padding: 10,
        textAlign: 'center',
        fontSize: 18,
        backgroundColor: '#fff',
    },
    colon: { fontSize: 22, marginHorizontal: 4, fontWeight: '700', color: '#0f172a' },
    saveBtn: {
        marginLeft: 4,
        backgroundColor: '#2563eb',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default TimePickerField;
