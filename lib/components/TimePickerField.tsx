// src/components/TimePickerField.tsx
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MedicationSchedule } from '../types/medication';

interface Props {
    schedules: MedicationSchedule[];
    onChange: (schedules: MedicationSchedule[]) => void;
}

const ITEM_HEIGHT = 44;

const TimePickerField: React.FC<Props> = ({ schedules, onChange }) => {
    // Nếu chưa có schedule → tạo mới
    const schedule = schedules[0] ?? {
        hour: 8,
        minute: 0,
        daysOfWeek: [],
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const [editing, setEditing] = useState(false);
    const [selectedHour, setSelectedHour] = useState(schedule.hour);
    const [selectedMinute, setSelectedMinute] = useState(schedule.minute);

    const hourListRef = useRef<FlatList<number>>(null);
    const minuteListRef = useRef<FlatList<number>>(null);

    const scrollToValue = (ref: React.RefObject<FlatList<number>>, value: number) => {
        ref.current?.scrollToOffset({ offset: value * ITEM_HEIGHT, animated: false });
    };

    useEffect(() => {
        if (editing) {
            setSelectedHour(schedule.hour);
            setSelectedMinute(schedule.minute);
            requestAnimationFrame(() => {
                scrollToValue(hourListRef, schedule.hour);
                scrollToValue(minuteListRef, schedule.minute);
            });
        }
    }, [editing, schedule.hour, schedule.minute]);

    const save = () => {
        const newSchedule: MedicationSchedule = {
            ...schedule,
            hour: selectedHour,
            minute: selectedMinute,
        };

        onChange([newSchedule]);
        setEditing(false);
    };

    const handleMomentumEnd = (
        ref: React.RefObject<FlatList<number>>,
        setValue: (value: number) => void,
        event: any,
    ) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.min(
            ref === hourListRef ? hours.length - 1 : minutes.length - 1,
            Math.max(0, Math.round(offsetY / ITEM_HEIGHT)),
        );
        setValue(ref === hourListRef ? hours[index] : minutes[index]);
    };

    const renderWheelItem = (value: number, isActive: boolean) => (
        <View style={[styles.wheelItem, isActive && styles.wheelItemActive]}>
            <Text style={[styles.wheelText, isActive && styles.wheelTextActive]}>{
                value.toString().padStart(2, '0')
            }</Text>
        </View>
    );

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
                <Modal
                    transparent
                    animationType="fade"
                    visible={editing}
                    onRequestClose={() => setEditing(false)}
                >
                    <View style={styles.modalContainer}>
                        <Pressable style={styles.backdrop} onPress={() => setEditing(false)} />
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Chọn giờ uống</Text>
                            <View style={styles.wheelRow}>
                                <View style={styles.wheelContainer}>
                                    <FlatList
                                        ref={hourListRef}
                                        data={hours}
                                        keyExtractor={item => `h-${item}`}
                                        showsVerticalScrollIndicator={false}
                                        snapToInterval={ITEM_HEIGHT}
                                        decelerationRate="fast"
                                        initialNumToRender={24}
                                        getItemLayout={(_, index) => ({
                                            length: ITEM_HEIGHT,
                                            offset: ITEM_HEIGHT * index,
                                            index,
                                        })}
                                        onMomentumScrollEnd={event =>
                                            handleMomentumEnd(hourListRef, setSelectedHour, event)
                                        }
                                        renderItem={({ item }) =>
                                            renderWheelItem(item, item === selectedHour)
                                        }
                                    />
                                    <Text style={styles.wheelLabel}>Giờ</Text>
                                </View>
                                <Text style={styles.colon}>:</Text>
                                <View style={styles.wheelContainer}>
                                    <FlatList
                                        ref={minuteListRef}
                                        data={minutes}
                                        keyExtractor={item => `m-${item}`}
                                        showsVerticalScrollIndicator={false}
                                        snapToInterval={ITEM_HEIGHT}
                                        decelerationRate="fast"
                                        initialNumToRender={60}
                                        getItemLayout={(_, index) => ({
                                            length: ITEM_HEIGHT,
                                            offset: ITEM_HEIGHT * index,
                                            index,
                                        })}
                                        onMomentumScrollEnd={event =>
                                            handleMomentumEnd(minuteListRef, setSelectedMinute, event)
                                        }
                                        renderItem={({ item }) =>
                                            renderWheelItem(item, item === selectedMinute)
                                        }
                                    />
                                    <Text style={styles.wheelLabel}>Phút</Text>
                                </View>
                            </View>
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setEditing(false)}
                                >
                                    <Text style={styles.cancelText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={save}>
                                    <Text style={styles.saveText}>Lưu giờ</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
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
    colon: { fontSize: 22, marginHorizontal: 4, fontWeight: '700', color: '#0f172a' },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    backdrop: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    modalCard: {
        marginHorizontal: 24,
        marginTop: '30%',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 16,
        textAlign: 'center',
    },
    wheelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        gap: 12,
        marginBottom: 18,
    },
    wheelContainer: {
        width: 110,
        height: ITEM_HEIGHT * 3,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
        position: 'relative',
    },
    wheelItem: {
        height: ITEM_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    wheelItemActive: {
        backgroundColor: '#e0ecff',
    },
    wheelText: {
        fontSize: 20,
        color: '#475569',
        fontWeight: '600',
    },
    wheelTextActive: {
        color: '#1d4ed8',
        fontWeight: '800',
    },
    wheelLabel: {
        position: 'absolute',
        bottom: 8,
        width: '100%',
        textAlign: 'center',
        color: '#64748b',
        fontSize: 13,
        letterSpacing: 0.5,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#f1f5f9',
    },
    cancelText: {
        fontSize: 15,
        color: '#0f172a',
        fontWeight: '700',
    },
    saveBtn: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 10,
        shadowColor: '#2563eb',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default TimePickerField;
