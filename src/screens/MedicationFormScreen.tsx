// src/screens/MedicationFormScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useMedication } from '../context/MedicationContext';
import WheelTimePicker from '../components/WheelTimePicker';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicationForm'>;

const MedicationFormScreen: React.FC<Props> = ({ navigation, route }) => {
    // --- LOGIC GIỮ NGUYÊN ---
    const { medications, addMedication, updateMedication } = useMedication();
    const editingId = route.params?.id;

    const editingMed = medications.find(m => m.id === editingId);

    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [time, setTime] = useState('08:00'); // default

    // state để control modal chọn giờ
    const [isTimePickerVisible, setTimePickerVisible] = useState(false);

    useEffect(() => {
        if (editingMed) {
            setName(editingMed.name);
            setDosage(editingMed.dosage);
            setTime(editingMed.time);
        }
    }, [editingMed]);

    const onSave = async () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Tên thuốc không được để trống');
            return;
        }

        if (!/^\d{2}:\d{2}$/.test(time.trim())) {
            Alert.alert('Lỗi', 'Giờ uống phải dạng HH:mm (vd: 08:30)');
            return;
        }

        const input = {
            name,
            dosage,
            time,
        };

        try {
            if (editingId) {
                await updateMedication(editingId, input);
            } else {
                await addMedication(input);
            }
            navigation.goBack();
        } catch (err) {
            console.error(err);
            Alert.alert('Lỗi', 'Không thể lưu thuốc');
        }
    };
    // --- KẾT THÚC LOGIC ---

    const openTimePicker = () => {
        setTimePickerVisible(true);
    };

    const closeTimePicker = () => {
        setTimePickerVisible(false);
    };

    // --- GIAO DIỆN MỚI ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardContainer}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerTitle}>
                            {editingId ? 'Cập nhật đơn thuốc' : 'Thêm thuốc mới'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            Nhập thông tin chi tiết bên dưới
                        </Text>
                    </View>

                    {/* Card nhập liệu thông tin */}
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tên thuốc</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ví dụ: Paracetamol"
                                placeholderTextColor="#999"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Liều dùng (Tuỳ chọn)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ví dụ: 1 viên sau ăn"
                                placeholderTextColor="#999"
                                value={dosage}
                                onChangeText={setDosage}
                            />
                        </View>
                    </View>

                    {/* Card chọn giờ */}
                    <Text style={styles.sectionTitle}>Thời gian nhắc nhở</Text>
                    <View style={styles.timeCard}>
                        {/* Nút bấm để mở modal chọn giờ */}
                        <TouchableOpacity
                            style={styles.timeButton}
                            onPress={openTimePicker}
                            activeOpacity={0.8}
                        >
                            <View>
                                <Text style={styles.timeButtonLabel}>Giờ uống</Text>
                                <Text style={styles.timeButtonValue}>{time}</Text>
                                <Text style={styles.timeButtonHint}>Nhấn để chọn giờ</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Nút lưu cố định ở dưới */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={onSave}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.saveText}>
                            {editingId ? 'Lưu thay đổi' : 'Hoàn tất'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* MODAL CHỌN GIỜ */}
                <Modal
                    visible={isTimePickerVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={closeTimePicker}
                >
                    <View style={styles.modalBackdrop}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>Chọn giờ uống thuốc</Text>

                            {/* WheelTimePicker nằm trong Modal, KHÔNG bị lồng ScrollView nữa */}
                            <WheelTimePicker value={time} onChange={setTime} />

                            <View style={styles.modalButtonsRow}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonCancel]}
                                    onPress={closeTimePicker}
                                >
                                    <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>
                                        Huỷ
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonConfirm]}
                                    onPress={closeTimePicker}
                                >
                                    <Text style={styles.modalButtonText}>Xong</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default MedicationFormScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA', // Màu nền sáng nhẹ hiện đại
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100, // Để tránh bị nút che mất nội dung cuối
    },
    headerContainer: {
        marginBottom: 24,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#666',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 20,
        marginBottom: 24,
        // Shadow style
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    inputGroup: {
        paddingVertical: 12,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        fontSize: 17,
        fontWeight: '500',
        color: '#000',
        paddingVertical: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
        marginLeft: 4,
    },
    timeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        minHeight: 100,
    },
    timeButton: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FAFAFA',
    },
    timeButtonLabel: {
        fontSize: 13,
        color: '#8E8E93',
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    timeButtonValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: 4,
    },
    timeButtonHint: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24, // Xử lý tai thỏ cho iOS
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 10,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },

    // --- Modal chọn giờ ---
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginLeft: 8,
    },
    modalButtonCancel: {
        backgroundColor: '#F0F0F0',
    },
    modalButtonConfirm: {
        backgroundColor: '#007AFF',
    },
    modalButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    modalButtonTextCancel: {
        color: '#333',
    },
});
