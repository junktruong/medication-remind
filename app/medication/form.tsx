// app/medication/form.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScheduleEditorCard from '../../lib/components/ScheduleEditorCard';
import PhotoSelector from '../../lib/components/PhotoSelector';
import PrimaryButton from '../../lib/components/PrimaryButton';
import TextInputField from '../../lib/components/TextInputField';
import { colors, fontSize, radius, spacing } from '../../lib/design/tokens';
import { useMedications } from '../../lib/context/MedicationContext';
import { MedicationSchedule, Weekday } from '../../lib/types/medication';
import { validateMedicationInput } from '../../lib/utils/validateMedication';
import { generateStableId } from '../../lib/utils/id';

const createDefaultSchedule = (): MedicationSchedule => ({
    scheduleId: generateStableId('schedule'),
    hour: 8,
    minute: 0,
    daysOfWeek: [] as Weekday[],
});

const withScheduleIds = (schedules: MedicationSchedule[]): MedicationSchedule[] => {
    return schedules.map((schedule) => ({
        ...schedule,
        scheduleId: schedule.scheduleId || generateStableId('schedule'),
    }));
};

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
        existing?.schedules?.length ? withScheduleIds(existing.schedules) : [createDefaultSchedule()]
    );
    const enabled = existing?.enabled ?? true;

    const updateSchedule = (index: number, updated: MedicationSchedule) => {
        setSchedules((prev) => prev.map((s, i) => (i === index ? updated : s)));
    };

    const addSchedule = () => {
        setSchedules((prev) => [...prev, createDefaultSchedule()]);
    };

    const copySchedule = () => {
        setSchedules((prev) => {
            if (!prev.length) return prev;

            const last = prev[prev.length - 1];
            const duplicate: MedicationSchedule = {
                ...last,
                scheduleId: generateStableId('schedule'),
                daysOfWeek: [...last.daysOfWeek] as Weekday[],
            };

            return [...prev, duplicate];
        });
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
                    <View style={styles.scheduleActionRow}>
                        <TouchableOpacity
                            style={[styles.copyButton, !schedules.length && styles.copyButtonDisabled]}
                            onPress={copySchedule}
                            disabled={!schedules.length}
                        >
                            <Text style={[styles.copyButtonText, !schedules.length && styles.copyButtonTextDisabled]}>Copy schedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addButton} onPress={addSchedule}>
                            <Text style={styles.addButtonText}>+ Thêm giờ</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {schedules.map((schedule, index) => (
                    <ScheduleEditorCard
                        key={schedule.scheduleId}
                        index={index}
                        schedule={schedule}
                        onChange={(value) => updateSchedule(index, value)}
                        onDelete={() => removeSchedule(index)}
                        canDelete={schedules.length > 1}
                    />
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
    scheduleActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
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
    copyButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    copyButtonDisabled: {
        borderColor: colors.muted,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: fontSize.md,
    },
    copyButtonText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: fontSize.md,
    },
    copyButtonTextDisabled: {
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
