// app/medication/form.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
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

            console.log("mode :   ", mode);

            if (mode === 'create') await createMedication(input);
            else await updateMedication({ ...existing!, ...input });

            router.back();
        }
        catch (e: any) {
            console.log("eror : ", e.message);

        }
    };

    const onDelete = async () => {
        if (!id) return;
        await deleteMedication(id);
        router.back();
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            <TextInputField label="Tên thuốc" value={name} onChangeText={setName} />
            <TextInputField label="Liều lượng" value={dosage} onChangeText={setDosage} />
            <TextInputField label="Ghi chú" value={notes} onChangeText={setNotes} multiline />

            <PhotoSelector uri={photoUri} onChange={setPhotoUri} />

            <DayOfWeekSelector schedules={schedules} onChange={setSchedules} />
            <TimePickerField schedules={schedules} onChange={setSchedules} />

            <PrimaryButton title="Lưu" onPress={onSave} />

            {mode === 'edit' && (
                <PrimaryButton title="Xóa" onPress={onDelete} style={{ marginTop: 12 }} danger />
            )}
        </ScrollView>
    );
}
