// lib/utils/validateMedication.ts
import { MedicationInput } from '../context/MedicationContext';

export function validateMedicationInput(input: MedicationInput): void {
    const errors: string[] = [];

    if (!input.name || input.name.trim() === '') {
        errors.push('Tên thuốc không được để trống');
    }

    if (!input.schedules || input.schedules.length === 0) {
        errors.push('Vui lòng chọn ít nhất 1 lịch');
    }

    input.schedules.forEach((s, i) => {
        if (s.hour < 0 || s.hour > 23 || s.minute < 0 || s.minute > 59) {
            errors.push(`Lịch ${i + 1}: Giờ hoặc phút không hợp lệ`);
        }

        if (!s.daysOfWeek || s.daysOfWeek.length === 0) {
            errors.push(`Lịch ${i + 1}: Vui lòng chọn ít nhất 1 ngày`);
        }
    });

    if (errors.length > 0) {
        throw new Error(`[ ${errors.join(', ')} ]`);
    }
}
