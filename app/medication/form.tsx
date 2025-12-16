// app/medication/form.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DayOfWeekSelector from '../../lib/components/DayOfWeekSelector';
import PhotoSelector from '../../lib/components/PhotoSelector';
import PrimaryButton from '../../lib/components/PrimaryButton';
import TextInputField from '../../lib/components/TextInputField';
import TimePickerField from '../../lib/components/TimePickerField';
import { colors, fontSize, radius, spacing } from '../../lib/design/tokens';
import { useMedications } from '../../lib/context/MedicationContext';
import { MedicationSchedule, Weekday } from '../../lib/types/medication';
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
    const [schedules, setSchedules] = useState<MedicationSchedule[]>(
        existing?.schedules?.length ? existing.schedules : [{ hour: 8, minute: 0, daysOfWeek: [] as Weekday[] }]
    );
    const enabled = existing?.enabled ?? true;

    const updateSchedule = (index: number, updated: MedicationSchedule) => {
        setSchedules((prev) => prev.map((s, i) => (i === index ? updated : s)));
    };

    const addSchedule = () => {
        setSchedules((prev) => [...prev, { hour: 8, minute: 0, daysOfWeek: [] as Weekday[] }]);
    };

    const removeSchedule = (index: number) => {
        setSchedules((prev) => prev.filter((_, i) => i !== index));
    };

    const onSave = async () => {
        try {
            const input = { name, dosage, notes, photoUri, schedules, enabled };

            validateMedicationInput(input);

            if (mode === 'create') await createMedication(input);
            else if (existing) await updateMedication({ ...existing, ...input });

            router.back();
        }
        catch (e: any) {
            console.log('eror : ', e.message ?? e);
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

                <View style={styles.scheduleHeaderRow}>
                    <Text style={styles.sectionTitle}>Lịch uống</Text>
                    <TouchableOpacity style={styles.addButton} onPress={addSchedule}>
                        <Text style={styles.addButtonText}>+ Add time</Text>
                    </TouchableOpacity>
                </View>

                {schedules.map((schedule, index) => (
                    <View
                        key={`${index}-${schedule.hour}-${schedule.minute}-${schedule.daysOfWeek.join('-')}`}
                        style={styles.scheduleCard}
                    >
                        <View style={styles.scheduleTitleRow}>
                            <Text style={styles.scheduleTitle}>Lịch {index + 1}</Text>
                            <TouchableOpacity
                                onPress={() => removeSchedule(index)}
                                disabled={schedules.length <= 1}
                            >
                                <Text style={[styles.removeText, schedules.length <= 1 && styles.removeDisabled]}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                        <TimePickerField
                            schedule={schedule}
                            onChange={(value) => updateSchedule(index, value)}
                            title="Giờ uống"
                        />
                        <DayOfWeekSelector
                            schedule={schedule}
                            onChange={(value) => updateSchedule(index, value)}
                            title="Ngày trong tuần"
                        />
                    </View>
                ))}
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
        padding: spacing.xl,
        backgroundColor: colors.bg,
        gap: spacing.lg,
    },
    header: {
        gap: spacing.xs,
    },
    title: {
        fontSize: fontSize.xxl,
        fontWeight: '800',
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSize.md,
        color: colors.muted,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        gap: spacing.sm,
    },
    scheduleHeaderRow: {
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontSize: fontSize.xl,
        fontWeight: '700',
        color: colors.text,
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: fontSize.md,
    },
    scheduleCard: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: radius.md,
        padding: spacing.md,
        marginTop: spacing.sm,
        backgroundColor: colors.surface,
    },
    scheduleTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    scheduleTitle: {
        fontSize: fontSize.lg,
        fontWeight: '700',
        color: colors.text,
    },
    removeText: {
        color: colors.danger,
        fontWeight: '600',
    },
    removeDisabled: {
        color: colors.muted,
    },
    actions: {
        gap: spacing.md,
        marginTop: spacing.md,
    },
    deleteButton: {
        marginTop: spacing.xs,
    },
});
