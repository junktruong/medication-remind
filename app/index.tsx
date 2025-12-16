// app/index.tsx
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../lib/design/tokens';
import { useMedications } from '../lib/context/MedicationContext';
import { countTodayDoses, formatTime, getNextDose } from '../lib/utils/scheduleHelpers';

export default function HomeScreen() {
    const router = useRouter();
    const { medications } = useMedications();

    const todayCount = useMemo(() => countTodayDoses(medications), [medications]);
    const nextDose = useMemo(() => getNextDose(medications), [medications]);

    const openReminder = () => {
        const params = nextDose?.medication?.id ? { id: nextDose.medication.id } : {};
        router.push({ pathname: '/reminder', params });
    };

    const openManage = () => {
        router.push('/medication/form');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.hero}>
                    <Text style={styles.title}>Bố/Mẹ chỉ cần bấm</Text>
                    <Text style={styles.highlight}>“ĐÃ UỐNG”</Text>
                    <Text style={styles.subtitle}>Mọi thông tin quan trọng đều được gom lại ở đây.</Text>
                </View>

                <View style={styles.summaryCard}>
                    <View>
                        <Text style={styles.sectionLabel}>Hôm nay cần uống</Text>
                        <Text style={styles.countText}>{todayCount} lần</Text>
                    </View>
                    <TouchableOpacity style={styles.manageButton} onPress={openManage}>
                        <Text style={styles.manageText}>+ Thêm/ sửa thuốc</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.nextCard}>
                    <Text style={styles.sectionLabel}>Sắp tới</Text>
                    {nextDose ? (
                        <>
                            <Text style={styles.nextTitle}>{nextDose.medication.name}</Text>
                            <Text style={styles.nextTime}>Lúc {formatTime(nextDose.date)}</Text>
                            {nextDose.medication.dosage ? (
                                <Text style={styles.nextDetail}>Liều: {nextDose.medication.dosage}</Text>
                            ) : null}
                            {nextDose.medication.notes ? (
                                <Text style={styles.nextNote}>{nextDose.medication.notes}</Text>
                            ) : (
                                <Text style={styles.nextNoteMuted}>Nhắc nhở ngắn gọn, dễ đọc.</Text>
                            )}
                        </>
                    ) : (
                        <Text style={styles.nextNoteMuted}>Chưa có lịch nhắc. Hãy thêm thuốc để bắt đầu.</Text>
                    )}

                    <TouchableOpacity style={styles.primaryAction} onPress={openReminder} disabled={!nextDose}>
                        <Text style={styles.primaryActionText}>Mở nhắc uống</Text>
                    </TouchableOpacity>

                    {__DEV__ && (
                        <TouchableOpacity
                            style={[styles.secondaryAction, !nextDose && styles.secondaryDisabled]}
                            onPress={() => router.push('/reminder')}
                        >
                            <Text style={styles.secondaryText}>Test reminder (debug)</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    container: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
        gap: spacing.lg,
    },
    hero: {
        backgroundColor: '#0ea5e9',
        borderRadius: radius.lg,
        padding: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    title: {
        color: '#e0f2fe',
        fontSize: fontSize.xl,
        fontWeight: '700',
    },
    highlight: {
        color: '#fff',
        fontSize: fontSize.display,
        fontWeight: '900',
        marginTop: spacing.xs,
    },
    subtitle: {
        color: '#e0f2fe',
        fontSize: fontSize.md,
        marginTop: spacing.sm,
    },
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    sectionLabel: {
        fontSize: fontSize.md,
        color: colors.muted,
        marginBottom: spacing.xs,
        letterSpacing: 0.2,
    },
    countText: {
        fontSize: fontSize.display,
        fontWeight: '800',
        color: colors.text,
    },
    manageButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: '#e0f2fe',
        borderRadius: radius.sm,
    },
    manageText: {
        color: '#0369a1',
        fontWeight: '700',
        fontSize: fontSize.md,
    },
    nextCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        gap: spacing.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    nextTitle: {
        fontSize: fontSize.xxl,
        fontWeight: '800',
        color: colors.text,
    },
    nextTime: {
        fontSize: fontSize.xl,
        fontWeight: '700',
        color: '#0ea5e9',
    },
    nextDetail: {
        fontSize: fontSize.lg,
        color: colors.text,
    },
    nextNote: {
        fontSize: fontSize.md,
        color: colors.text,
        marginTop: spacing.xs,
    },
    nextNoteMuted: {
        fontSize: fontSize.md,
        color: colors.muted,
        marginTop: spacing.xs,
    },
    primaryAction: {
        marginTop: spacing.lg,
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    primaryActionText: {
        color: '#fff',
        fontSize: Platform.OS === 'android' ? 22 : 24,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    secondaryAction: {
        marginTop: spacing.sm,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: radius.md,
        borderColor: '#bae6fd',
        borderWidth: 1,
    },
    secondaryDisabled: {
        opacity: 0.6,
    },
    secondaryText: {
        color: '#0ea5e9',
        fontSize: fontSize.md,
        fontWeight: '700',
    },
});
