import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMedications } from '../lib/context/MedicationContext';
import { colors, fontSize, radius, spacing } from '../lib/design/tokens';
import { clearSnoozeState, isSnoozed, logAdherenceEvent, setSnoozeUntil } from '../lib/services/adherenceStorage';
import { loadChildPhone } from '../lib/services/contactStorage';
import { requestNotificationPermission } from '../lib/services/notificationService';
import { Weekday } from '../lib/types/medication';
import { formatTime, getNextDose } from '../lib/utils/scheduleHelpers';

const childPhoto = require('../assets/images/react-logo.png');
const defaultMedicationImage = require('../assets/images/react-logo.png');

export default function ReminderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string; verify?: string; mock?: string }>();
    const { medications } = useMedications();
    const [verificationPhoto, setVerificationPhoto] = useState<string | undefined>();
    const [childPhone, setChildPhone] = useState<string | null>(null);

    const isMock = params.mock === 'true';

    const reminder = useMemo(() => {
        if (isMock) {
            const now = new Date();
            const schedule = {
                hour: now.getHours(),
                minute: now.getMinutes(),
                daysOfWeek: [now.getDay() as Weekday],
            };

            const medication = {
                id: 'mock-medication',
                name: 'Thuốc mẫu',
                dosage: '1 viên trước bữa ăn',
                notes: 'Đây là màn hình nhắc uống thử. Bấm các nút để kiểm tra luồng.',
                schedules: [schedule],
                enabled: true,
                createdAt: now.getTime(),
            };

            return { medication, schedule, date: now };
        }

        if (params.id) {
            const med = medications.find((m) => m.id === params.id);
            if (med) {
                const schedule = med.schedules?.[0];
                const nextDate = schedule
                    ? (() => {
                        const date = new Date();
                        date.setHours(schedule.hour, schedule.minute, 0, 0);
                        return date;
                    })()
                    : new Date();
                return med && schedule ? { medication: med, schedule, date: nextDate } : null;
            }
        }

        return getNextDose(medications);
    }, [isMock, medications, params.id]);

    const medication = reminder?.medication;
    const enableVerification = params.verify === 'true';

    useEffect(() => {
        const loadPhone = async () => {
            const stored = await loadChildPhone();
            setChildPhone(stored);

        };

        loadPhone();
    }, []);

    const handleTaken = async () => {
        if (!medication) return router.back();

        await logAdherenceEvent({
            medicationId: medication.id,
            medicationName: medication.name,
            timestamp: Date.now(),
            action: 'taken',
            scheduleTime: reminder?.date?.getTime(),
            note: 'Người chăm sóc bấm ĐÃ UỐNG',
        });
        await clearSnoozeState(medication.id);
        Alert.alert('Đã ghi nhận', 'Cảm ơn bố/mẹ đã xác nhận con đã uống thuốc.');
        router.back();
    };

    const handleSnooze = async () => {
        if (!medication) {
            router.back();
            return;
        }

        const snoozed = await isSnoozed(medication.id);
        if (snoozed) {
            Alert.alert('Đã lên lịch', 'Ứng dụng đang chờ nhắc lại sau 5 phút, không cần bấm thêm.');
            return;
        }

        const granted = await requestNotificationPermission();
        if (!granted) {
            Alert.alert('Cần quyền thông báo', 'Hãy cho phép ứng dụng gửi thông báo để nhắc lại.');
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `Nhắc lại: ${medication.name}`,
                body: 'Đã tới lúc uống thuốc, bố/mẹ nhớ nhắc con nhé!',
                sound: 'default',
            },
            trigger: { seconds: 300 },
        });

        const snoozeUntil = Date.now() + 5 * 60 * 1000;
        await setSnoozeUntil(medication.id, snoozeUntil);

        await logAdherenceEvent({
            medicationId: medication.id,
            medicationName: medication.name,
            timestamp: Date.now(),
            action: 'snooze',
            scheduleTime: reminder?.date?.getTime(),
            note: 'Nhắc lại sau 5 phút',
        });

        Alert.alert('Sẽ nhắc lại', 'Ứng dụng sẽ nhắc lại sau 5 phút.');
        router.back();
    };

    const handleCall = async () => {
        if (!childPhone) {
            Alert.alert('Chưa có số điện thoại', 'Hãy lưu số ở màn hình của con để bố/mẹ gọi nhanh.');
            return;
        }

        await logAdherenceEvent({
            medicationId: medication?.id,
            medicationName: medication?.name,
            timestamp: Date.now(),
            action: 'call',
            scheduleTime: reminder?.date?.getTime(),
            note: 'Bố/mẹ chọn gọi con',
        });

        const telLink = `tel:${childPhone}`;
        const supported = await Linking.canOpenURL(telLink);
        if (supported) Linking.openURL(telLink);
        else Alert.alert('Gọi con', 'Hãy gọi cho con bằng số đã lưu.');
    };

    const handleVerify = async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Cần quyền camera', 'Vui lòng cho phép ứng dụng dùng camera.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.5 });
        if (!result.canceled) {
            const uri = result.assets?.[0]?.uri;
            setVerificationPhoto(uri);
            await logAdherenceEvent({
                medicationId: medication?.id,
                medicationName: medication?.name,
                timestamp: Date.now(),
                action: 'verify',
                scheduleTime: reminder?.date?.getTime(),
                note: 'Chụp ảnh kiểm tra thuốc',
            });
            Alert.alert('Đã chụp', 'Kiểm tra nhanh xem có đúng thuốc không.');
        }
    };

    const medImage = medication?.photoUri ? { uri: medication.photoUri } : defaultMedicationImage;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.hero}>
                    <Text style={styles.heroLabel}>Đã đến giờ nhắc con uống thuốc</Text>
                    <Text style={styles.heroTime}>{reminder?.date ? formatTime(reminder.date) : 'Ngay bây giờ'}</Text>
                    <Image source={childPhoto} style={styles.childPhoto} contentFit="cover" />
                </View>

                <View style={styles.card}>
                    <View style={styles.medHeader}>
                        <Image source={medImage} style={styles.pillPhoto} contentFit="cover" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.medName}>{medication?.name ?? 'Thuốc tiếp theo'}</Text>
                            {medication?.dosage ? <Text style={styles.medDosage}>{medication.dosage}</Text> : null}
                            {reminder?.date ? <Text style={styles.medTime}>Hôm nay • {formatTime(reminder.date)}</Text> : null}
                        </View>
                    </View>

                    <Text style={styles.instruction}>{medication?.notes ?? 'Uống sau ăn và uống đủ nước.'}</Text>

                    {enableVerification && (
                        <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
                            <Text style={styles.verifyText}>KIỂM TRA THUỐC</Text>
                        </TouchableOpacity>
                    )}

                    {verificationPhoto ? (
                        <Image source={{ uri: verificationPhoto }} style={styles.verifyPreview} contentFit="cover" />
                    ) : null}
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={[styles.actionButton, styles.primary]} onPress={handleTaken}>
                        <Text style={styles.actionText}>✅ ĐÃ UỐNG</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.snooze]} onPress={handleSnooze}>
                        <Text style={styles.actionText}>⏰ NHẮC LẠI 5 PHÚT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.call]} onPress={handleCall}>
                        <Text style={styles.actionText}>📞 GỌI CON</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scroll: {
        flexGrow: 1,
        padding: spacing.lg,
        gap: spacing.lg,
    },
    hero: {
        backgroundColor: '#1e293b',
        borderRadius: radius.lg,
        padding: spacing.lg,
        gap: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    heroLabel: {
        color: '#e2e8f0',
        fontSize: fontSize.lg,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    heroTime: {
        color: '#38bdf8',
        fontSize: Platform.OS === 'android' ? 30 : 32,
        fontWeight: '900',
    },
    childPhoto: {
        width: '100%',
        height: 240,
        borderRadius: radius.md,
        marginTop: spacing.sm,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
        gap: spacing.md,
    },
    medHeader: {
        flexDirection: 'row',
        gap: spacing.md,
        alignItems: 'center',
    },
    pillPhoto: {
        width: 110,
        height: 110,
        borderRadius: radius.md,
        backgroundColor: '#e2e8f0',
    },
    medName: {
        fontSize: Platform.OS === 'android' ? 28 : 30,
        fontWeight: '900',
        color: colors.text,
    },
    medDosage: {
        fontSize: fontSize.lg,
        color: colors.text,
        marginTop: 2,
    },
    medTime: {
        fontSize: fontSize.xl,
        color: '#0ea5e9',
        marginTop: spacing.xs,
        fontWeight: '700',
    },
    instruction: {
        fontSize: fontSize.lg,
        color: colors.text,
        lineHeight: 24,
    },
    verifyButton: {
        backgroundColor: '#fbbf24',
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    verifyText: {
        fontSize: fontSize.lg,
        fontWeight: '800',
        color: '#78350f',
    },
    verifyPreview: {
        width: '100%',
        height: 160,
        borderRadius: radius.md,
        backgroundColor: '#f1f5f9',
    },
    actions: {
        gap: spacing.sm,
    },
    actionButton: {
        paddingVertical: spacing.xl,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    primary: {
        backgroundColor: colors.primary,
    },
    snooze: {
        backgroundColor: '#f97316',
    },
    call: {
        backgroundColor: '#0ea5e9',
    },
    actionText: {
        color: '#fff',
        fontSize: Platform.OS === 'android' ? 22 : 24,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
});
