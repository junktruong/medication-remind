// app/medication/form.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import DayOfWeekSelector from '../../lib/components/DayOfWeekSelector';
import PhotoSelector from '../../lib/components/PhotoSelector';
import PrimaryButton from '../../lib/components/PrimaryButton';
import TextInputField from '../../lib/components/TextInputField';
import TimePickerField from '../../lib/components/TimePickerField';
import { useMedications } from '../../lib/context/MedicationContext';
import { validateMedicationInput } from '../../lib/utils/validateMedication';

export default function MedicationForm() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const mode = id ? 'edit' : 'create';
    const { medications, createMedication, updateMedication, deleteMedication } = useMedications();
    const existing = medications.find(m => m.id === id);

    const [name, setName] = useState(existing?.name ?? '');
    const [dosage, setDosage] = useState(existing?.dosage ?? '');
    const [notes, setNotes] = useState(existing?.notes ?? '');
    const [photoUri, setPhotoUri] = useState(existing?.photoUri ?? undefined);
    const [schedules, setSchedules] = useState(existing?.schedules ?? []);

    const onSave = async () => {
        try {
            const input = { name, dosage, notes, photoUri, schedules, enabled: true };

            const error = validateMedicationInput(input);
            if (error) {
                console.log(error);
                throw error.toString();
            }

            if (mode === 'create') await createMedication(input);
            else await updateMedication({ ...existing!, ...input });

            router.back();
        }
        catch (e: any) {
            console.log('eror : ', e.message);
        }
    };

    const onDelete = async () => {
        if (!id) return;
        await deleteMedication(id);
        router.back();
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Nhập thuốc của bạn</Text>
                <Text style={styles.subtitle}>
                    Giao diện chữ lớn, dễ nhìn cho người lớn tuổi.
                </Text>
            </View>

            <View style={styles.card}>
                <TextInputField
                    label="Tên thuốc"
                    value={name}
                    onChangeText={setName}
                    placeholder="Ví dụ: Paracetamol"
                />
                <TextInputField
                    label="Liều lượng"
                    value={dosage}
                    onChangeText={setDosage}
                    placeholder="Ví dụ: 500mg"
                />
                <TextInputField
                    label="Ghi chú"
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Nhắc nhở thêm (uống sau ăn...)"
                    multiline
                />

                <PhotoSelector uri={photoUri} onChange={setPhotoUri} />

                <DayOfWeekSelector schedules={schedules} onChange={setSchedules} />
                <TimePickerField schedules={schedules} onChange={setSchedules} />
            </View>

            <View style={styles.actions}>
                <PrimaryButton title="Lưu" onPress={onSave} />

                {mode === 'edit' && (
                    <PrimaryButton
                        title="Xóa"
                        onPress={onDelete}
                        style={styles.deleteButton}
                        danger
                    />
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: '#f5f6fa',
        gap: 16,
    },
    header: {
        gap: 6,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 16,
        color: '#475569',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        gap: 4,
    },
    actions: {
        gap: 12,
    },
    deleteButton: {
        marginTop: 4,
    },
});
