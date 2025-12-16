import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../design/tokens';
import { MedicationSchedule } from '../types/medication';
import DayOfWeekSelector from './DayOfWeekSelector';
import TimePickerField from './TimePickerField';

interface Props {
    index: number;
    schedule: MedicationSchedule;
    onChange: (schedule: MedicationSchedule) => void;
    onDelete?: () => void;
    canDelete?: boolean;
}

const ScheduleEditorCard: React.FC<Props> = ({
    index,
    schedule,
    onChange,
    onDelete,
    canDelete = true,
}) => {
    return (
        <View style={styles.scheduleCard}>
            <View style={styles.scheduleTitleRow}>
                <Text style={styles.scheduleTitle}>Lịch {index + 1}</Text>
                {onDelete && (
                    <TouchableOpacity onPress={onDelete} disabled={!canDelete}>
                        <Text style={[styles.removeText, !canDelete && styles.removeDisabled]}>Xóa</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TimePickerField
                schedule={schedule}
                onChange={onChange}
                title="Giờ uống"
            />
            <DayOfWeekSelector
                schedule={schedule}
                onChange={onChange}
                title="Ngày trong tuần"
            />
        </View>
    );
};

const styles = StyleSheet.create({
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
});

export default ScheduleEditorCard;
