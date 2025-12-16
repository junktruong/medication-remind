// app/index.tsx
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../lib/design/tokens';
import { useMedications } from '../lib/context/MedicationContext';
import { countTodayDoses, formatTime, getNextDose, getTodayDoses } from '../lib/utils/scheduleHelpers';
import { AdherenceEntry, getLatestAdherence } from '../lib/services/adherenceStorage';

export default function HomeScreen() {
    const router = useRouter();
    const { medications } = useMedications();
    const [latestTaken, setLatestTaken] = useState<AdherenceEntry | null>(null);

    const todayCount = useMemo(() => countTodayDoses(medications), [medications]);
    const nextDose = useMemo(() => getNextDose(medications), [medications]);
    const todayDoses = useMemo(() => getTodayDoses(medications), [medications]);

    const openReminder = () => {
        const params = nextDose?.medication?.id ? { id: nextDose.medication.id } : {};
        router.push({ pathname: '/reminder', params });
    };

    const openManage = () => {
        router.push('/medication/form');
    };

    const openTestReminder = () => {
        router.push({ pathname: '/reminder', params: { mock: 'true' } });
    };

    useFocusEffect(
        useCallback(() => {
            const loadLatest = async () => {
                const latest = await getLatestAdherence('taken');
                setLatestTaken(latest);
            };

            loadLatest();
        }, []),
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.greeting}>Hôm nay uống gì?</Text>
                        <Text style={styles.helper}>Bố/mẹ xem nhanh lịch uống của con.</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={openManage}>
                        <Text style={styles.addButtonText}>+ Thêm thuốc</Text>
                    </TouchableOpacity>
                </View>

                {latestTaken ? (
                    <View style={styles.statusCard}>
                        <Text style={styles.sectionLabel}>Lần uống gần nhất</Text>
                        <Text style={styles.statusText}>
                            ĐÃ HOÀN THÀNH {latestTaken.medicationName ?? 'liều thuốc'} lúc{' '}
                            {formatTime(new Date(latestTaken.timestamp))}
                        </Text>
                    </View>
                ) : null}

                <View style={styles.nextCard}>
                    <Text style={styles.sectionLabel}>Lần uống tiếp theo</Text>
                    {nextDose ? (
                        <>
                            <View style={styles.nextRow}>
                                <Text style={styles.nextTime}>{formatTime(nextDose.date)}</Text>
                                <Text style={styles.nextPill}>{nextDose.medication.name}</Text>
                            </View>
                            {nextDose.medication.dosage ? (
                                <Text style={styles.nextDetail}>{nextDose.medication.dosage}</Text>
                            ) : null}
                            <Text style={styles.nextNote}>
                                {nextDose.medication.notes || 'Nhắc bố/mẹ bấm ĐÃ UỐNG đúng giờ.'}
                            </Text>

                            <TouchableOpacity style={styles.primaryAction} onPress={openReminder}>
                                <Text style={styles.primaryActionText}>Mở nhắc uống</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryAction} onPress={openTestReminder}>
                                <Text style={styles.secondaryText}>Test reminder</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Chưa có lịch. Thêm thuốc để bắt đầu nhắc nhở.</Text>
                            <TouchableOpacity style={styles.secondaryAction} onPress={openManage}>
                                <Text style={styles.secondaryText}>+ Lên lịch uống</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.listCard}>
                    <View style={styles.listHeader}>
                        <View>
                            <Text style={styles.sectionLabel}>Lịch hôm nay</Text>
                            <Text style={styles.smallMuted}>{todayCount} lần cần uống</Text>
                        </View>
                        <TouchableOpacity style={styles.viewTodayButton} onPress={openReminder}>
                            <Text style={styles.viewTodayText}>Xem lịch hôm nay</Text>
                        </TouchableOpacity>
                    </View>

                    {todayDoses.length === 0 ? (
                        <Text style={styles.emptyText}>Chưa có lịch cho hôm nay.</Text>
                    ) : (
                        todayDoses.map((dose) => (
                            <View key={`${dose.medication.id}-${dose.schedule.hour}-${dose.schedule.minute}`} style={styles.listItem}>
                                <Text style={styles.listTime}>{formatTime(dose.date)}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.listName}>{dose.medication.name}</Text>
                                    {dose.medication.dosage ? (
                                        <Text style={styles.listDosage}>{dose.medication.dosage}</Text>
                                    ) : null}
                                </View>
                            </View>
                        ))
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
        padding: spacing.xl,
        gap: spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: fontSize.display,
        fontWeight: '800',
        color: colors.text,
    },
    helper: {
        color: colors.muted,
        marginTop: spacing.xs,
    },
    addButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: '#e0f2fe',
        borderRadius: radius.sm,
    },
    addButtonText: {
        color: '#0369a1',
        fontWeight: '700',
    },
    statusCard: {
        backgroundColor: '#ecfeff',
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: '#bae6fd',
        gap: spacing.xs,
    },
    statusText: {
        color: '#0f172a',
        fontSize: fontSize.lg,
        fontWeight: '800',
    },
    sectionLabel: {
        fontSize: fontSize.md,
        color: colors.muted,
        marginBottom: spacing.xs,
        letterSpacing: 0.2,
        textTransform: 'uppercase',
        fontWeight: '700',
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
    nextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    nextTime: {
        fontSize: fontSize.display,
        fontWeight: '900',
        color: '#0ea5e9',
    },
    nextPill: {
        fontSize: fontSize.xxl,
        fontWeight: '800',
        color: colors.text,
        flexShrink: 1,
    },
    nextDetail: {
        fontSize: fontSize.lg,
        color: colors.text,
    },
    nextNote: {
        fontSize: fontSize.md,
        color: colors.muted,
        marginTop: spacing.xs,
        lineHeight: 22,
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
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    emptyState: {
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    emptyText: {
        color: colors.muted,
        fontSize: fontSize.md,
    },
    secondaryAction: {
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: radius.md,
        borderColor: '#bae6fd',
        borderWidth: 1,
    },
    secondaryText: {
        color: '#0ea5e9',
        fontSize: fontSize.md,
        fontWeight: '700',
    },
    listCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        gap: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        flex: 1,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    smallMuted: {
        color: colors.muted,
    },
    viewTodayButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: '#eef2ff',
        borderRadius: radius.sm,
    },
    viewTodayText: {
        color: '#4338ca',
        fontWeight: '700',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomColor: '#e2e8f0',
        borderBottomWidth: 1,
    },
    listTime: {
        fontSize: fontSize.xl,
        fontWeight: '800',
        color: '#0ea5e9',
        width: 72,
    },
    listName: {
        fontSize: fontSize.lg,
        fontWeight: '700',
        color: colors.text,
    },
    listDosage: {
        color: colors.muted,
    },
});
