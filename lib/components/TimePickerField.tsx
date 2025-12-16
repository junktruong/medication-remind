import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { MedicationSchedule } from '../types/medication';

interface Props {
    schedule: MedicationSchedule;
    onChange: (schedule: MedicationSchedule) => void;
    title?: string;
}

// --- Constants & Config ---
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const { width } = Dimensions.get('window');

// Colors
const COLORS = {
    primary: '#4F46E5', // Indigo 600
    primaryLight: '#EEF2FF', // Indigo 50
    text: '#0F172A', // Slate 900
    textLight: '#64748B', // Slate 500
    border: '#E2E8F0', // Slate 200
    bg: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.6)',
    highlight: 'rgba(79, 70, 229, 0.1)',
};

// --- Helper Component: Wheel Column ---
interface WheelProps {
    items: string[];
    initialIndex: number;
    onChange: (index: number) => void;
    label?: string;
}

const WheelPicker: React.FC<WheelProps> = ({ items, initialIndex, onChange, label }) => {
    const flatListRef = useRef<FlatList>(null);

    // Pad the data so the first/last items can be selected in the center
    const paddedItems = ['', '', ...items, '', ''];

    useEffect(() => {
        // Scroll to initial value after a brief delay to ensure layout
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: initialIndex,
                animated: false,
            });
        }, 100);
    }, [initialIndex]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        // Clamp index to valid range
        if (index >= 0 && index < items.length) {
            onChange(index);
        }
    };

    return (
        <View style={styles.wheelContainer}>
            {/* Label above the column */}
            {label && <Text style={styles.columnLabel}>{label}</Text>}

            <View style={styles.wheelWrapper}>
                {/* The Selection Overlay (Middle Bar) */}
                <View style={styles.selectionOverlay} pointerEvents="none" />

                <FlatList
                    ref={flatListRef}
                    data={paddedItems}
                    keyExtractor={(_, index) => index.toString()}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    onMomentumScrollEnd={handleScroll}
                    getItemLayout={(_, index) => ({
                        length: ITEM_HEIGHT,
                        offset: ITEM_HEIGHT * index,
                        index,
                    })}
                    renderItem={({ item, index }) => {
                        // Adjust index because of padding
                        const adjustIndex = index - 2;
                        return (
                            <View style={styles.itemContainer}>
                                <Text
                                    style={[
                                        styles.itemText,
                                        // Optional: Highlight selected item logic could go here based on state
                                        // but keeping it simple with the overlay bar works best for perf
                                        item === '' ? styles.hiddenText : {},
                                    ]}
                                >
                                    {item}
                                </Text>
                            </View>
                        );
                    }}
                />
            </View>
        </View>
    );
};

// --- Main Component ---
const TimePickerField: React.FC<Props> = ({ schedule, onChange, title }) => {
    // Ensure we have a schedule
    const currentSchedule = schedule ?? {
        hour: 8,
        minute: 0,
        daysOfWeek: [],
    };

    const [modalVisible, setModalVisible] = useState(false);

    // Temporary state for the modal (so we can cancel without saving)
    const [tempHour, setTempHour] = useState(currentSchedule.hour);
    const [tempMinute, setTempMinute] = useState(currentSchedule.minute);

    // Generate Data Arrays
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const openPicker = () => {
        setTempHour(currentSchedule.hour);
        setTempMinute(currentSchedule.minute);
        setModalVisible(true);
    };

    const handleSave = () => {
        const newSchedule: MedicationSchedule = {
            ...currentSchedule,
            hour: tempHour,
            minute: tempMinute,
        };
        onChange(newSchedule);
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{title ?? 'Giờ uống'}</Text>

            {/* Trigger Button */}
            <TouchableOpacity
                style={styles.triggerButton}
                activeOpacity={0.7}
                onPress={openPicker}
            >
                <View style={styles.timeDisplayContainer}>
                    <Text style={styles.triggerTimeText}>
                        {currentSchedule.hour.toString().padStart(2, '0')}
                    </Text>
                    <Text style={styles.triggerColon}>:</Text>
                    <Text style={styles.triggerTimeText}>
                        {currentSchedule.minute.toString().padStart(2, '0')}
                    </Text>
                </View>
                <View style={styles.triggerIconContainer}>
                    <Text style={styles.editLabel}>Chạm để đổi</Text>
                </View>
            </TouchableOpacity>

            {/* Modal Picker */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    {/* Closes modal if user taps background */}
                    <TouchableOpacity
                        style={styles.backdropTouch}
                        onPress={() => setModalVisible(false)}
                    />

                    <View style={styles.pickerCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn thời gian</Text>
                        </View>

                        <View style={styles.pickersRow}>
                            <WheelPicker
                                items={hours}
                                initialIndex={tempHour}
                                onChange={setTempHour}
                                label="Giờ"
                            />
                            <Text style={styles.rowColon}>:</Text>
                            <WheelPicker
                                items={minutes}
                                initialIndex={tempMinute}
                                onChange={setTempMinute}
                                label="Phút"
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalBtn, styles.confirmBtn]}
                                onPress={handleSave}
                            >
                                <Text style={styles.confirmBtnText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 10,
        marginLeft: 4,
    },

    // --- Trigger Button Styles ---
    triggerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 16,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        // Shadow for Android
        elevation: 2,
    },
    timeDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    triggerTimeText: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.primary,
        fontVariant: ['tabular-nums'], // Keeps numbers monospaced prevents jitter
    },
    triggerColon: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.primary,
        marginHorizontal: 2,
        marginBottom: 4,
    },
    triggerIconContainer: {
        backgroundColor: COLORS.primaryLight,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    editLabel: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 13,
    },

    // --- Modal Styles ---
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdropTouch: {
        ...StyleSheet.absoluteFillObject,
    },
    pickerCard: {
        width: width * 0.85,
        backgroundColor: COLORS.bg,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        // Card Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },

    // --- Wheel/Picker Area ---
    pickersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: PICKER_HEIGHT,
        marginBottom: 20,
    },
    rowColon: {
        fontSize: 30,
        fontWeight: 'bold',
        color: COLORS.text,
        marginHorizontal: 15,
        marginTop: 20, // Offset for label
    },

    // Wheel Component
    wheelContainer: {
        height: PICKER_HEIGHT + 30, // Extra space for label
        width: 70,
        alignItems: 'center',
    },
    wheelWrapper: {
        height: PICKER_HEIGHT,
        width: '100%',
        overflow: 'hidden',
    },
    columnLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textLight,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    selectionOverlay: {
        position: 'absolute',
        top: ITEM_HEIGHT * 2, // Centered (item 3)
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        backgroundColor: COLORS.highlight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    itemContainer: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemText: {
        fontSize: 22,
        fontWeight: '600',
        color: COLORS.text,
        fontVariant: ['tabular-nums'],
    },
    hiddenText: {
        opacity: 0
    },

    // --- Actions ---
    modalActions: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        backgroundColor: '#F1F5F9', // Slate 100
    },
    confirmBtn: {
        backgroundColor: COLORS.primary,
    },
    cancelBtnText: {
        color: COLORS.textLight,
        fontWeight: '700',
        fontSize: 16,
    },
    confirmBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
});

export default TimePickerField;