// src/components/TimePickerField.tsx
import React, { useMemo, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MedicationSchedule } from '../types/medication';

interface Props {
    schedules: MedicationSchedule[];
    onChange: (schedules: MedicationSchedule[]) => void;
}

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const LOOP_MULTIPLIER = 40;
const HOUR_COUNT = 24;
const MINUTE_COUNT = 60;

const createLoopedData = (length: number) =>
    Array.from({ length: length * LOOP_MULTIPLIER }, (_, index) => index % length);

const getCenteredIndex = (value: number, length: number) =>
    Math.floor(LOOP_MULTIPLIER / 2) * length + value;

const pad = (value: number) => value.toString().padStart(2, '0');

interface NumberWheelProps {
    range: number;
    value: number;
    onChange: (value: number) => void;
}

const NumberWheel: React.FC<NumberWheelProps> = ({ range, value, onChange }) => {
    const listRef = useRef<FlatList<number>>(null);
    const data = useMemo(() => createLoopedData(range), [range]);
    const centerBase = useMemo(() => Math.floor(LOOP_MULTIPLIER / 2) * range, [range]);

    const scrollToValue = (val: number, animated = false) => {
        const index = getCenteredIndex(val, range);
        listRef.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated });
    };

    const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = event.nativeEvent.contentOffset.y;
        const rawIndex = Math.round(offset / ITEM_HEIGHT);
        const normalizedValue = data[rawIndex % data.length];
        onChange(normalizedValue);

        const targetIndex = centerBase + normalizedValue;
        if (Math.abs(rawIndex - targetIndex) > range) {
            scrollToValue(normalizedValue);
        }
    };

    return (
        <View style={[styles.wheelContainer, { height: ITEM_HEIGHT * VISIBLE_ITEMS }]}>
            <View
                style={[
                    styles.selectionOverlay,
                    {
                        top: (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2,
                        height: ITEM_HEIGHT,
                    },
                ]}
            />

            <FlatList
                ref={listRef}
                data={data}
                keyExtractor={(item, index) => `${item}-${index}`}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                initialScrollIndex={getCenteredIndex(value, range)}
                getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * ((VISIBLE_ITEMS - 1) / 2) }}
                onMomentumScrollEnd={handleMomentumEnd}
                onScrollEndDrag={handleMomentumEnd}
                renderItem={({ item }) => (
                    <View style={styles.wheelItem}>
                        <Text style={styles.wheelText}>{pad(item)}</Text>
                    </View>
                )}
            />
        </View>
    );
};

const TimePickerField: React.FC<Props> = ({ schedules, onChange }) => {
    // Nếu chưa có schedule → tạo mới
    const schedule = schedules[0] ?? {
        hour: 8,
        minute: 0,
        daysOfWeek: [],
    };

    const [editing, setEditing] = useState(false);
    const [hour, setHour] = useState(schedule.hour);
    const [minute, setMinute] = useState(schedule.minute);

    const save = () => {
        const newSchedule: MedicationSchedule = {
            ...schedule,
            hour,
            minute,
        };

        onChange([newSchedule]);
        setEditing(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Giờ uống</Text>

            {!editing ? (
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        setHour(schedule.hour);
                        setMinute(schedule.minute);
                        setEditing(true);
                    }}
                >
                    <Text style={styles.time}>
                        {pad(schedule.hour)}:{pad(schedule.minute)}
                    </Text>
                    <Text style={styles.helper}>Chạm để chỉnh giờ</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.editRow}>
                    <NumberWheel range={HOUR_COUNT} value={hour} onChange={setHour} />
                    <Text style={styles.colon}>:</Text>
                    <NumberWheel range={MINUTE_COUNT} value={minute} onChange={setMinute} />
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
    colon: { fontSize: 22, marginHorizontal: 4, fontWeight: '700', color: '#0f172a' },
    saveBtn: {
        marginLeft: 4,
        backgroundColor: '#2563eb',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    wheelContainer: {
        width: 82,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f8fafc',
    },
    wheelItem: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0f172a',
    },
    selectionOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(37, 99, 235, 0.35)',
        zIndex: 1,
        pointerEvents: 'none',
    },
});

export default TimePickerField;
