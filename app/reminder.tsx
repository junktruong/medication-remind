import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Linking, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMedications } from '../lib/context/MedicationContext';
import { colors, fontSize, radius, spacing } from '../lib/design/tokens';
import { appendLog } from '../lib/services/intakeLog';
import { formatTime, getNextDose } from '../lib/utils/scheduleHelpers';


const childPhoto = require('../assets/images/react-logo.png');
const defaultMedicationImage = require('../assets/images/react-logo.png');

export default function ReminderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string; verify?: string }>();
    const { medications } = useMedications();
    const [verificationPhoto, setVerificationPhoto] = useState<string | undefined>();

    const reminder = useMemo(() => {
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
    }, [medications, params.id]);

    const medication = reminder?.medication;
    const enableVerification = params.verify === 'true';

    const handleTaken = async () => {
        if (!medication) return router.back();
        await appendLog({
            medicationId: medication.id,
            medicationName: medication.name,
            takenAt: Date.now(),
            action: 'taken',
            note: 'Người chăm sóc bấm ĐÃ UỐNG',
        });
        Alert.alert('Đã ghi nhận', 'Cảm ơn bố/mẹ!');
        router.back();
    };

    const handleSnooze = async () => {
        await appendLog({
            medicationId: medication?.id,
            medicationName: medication?.name,
            takenAt: Date.now(),
            action: 'snooze',
            note: 'Nhắc lại sau 5 phút',
        });
        Alert.alert('Sẽ nhắc lại', 'Ứng dụng sẽ nhắc lại sau 5 phút.');
        router.back();
    };

    const handleCall = async () => {
        await appendLog({
            medicationId: medication?.id,
            medicationName: medication?.name,
            takenAt: Date.now(),
            action: 'call',
            note: 'Bố/mẹ chọn gọi con',
        });
        const telLink = 'tel:';
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
            await appendLog({
                medicationId: medication?.id,
                medicationName: medication?.name,
                takenAt: Date.now(),
                action: 'verify',
                note: 'Chụp ảnh kiểm tra thuốc',
            });
            Alert.alert('Đã chụp', 'Kiểm tra nhanh xem có đúng thuốc không.');
        }
    };

    const medImage = medication?.photoUri ? { uri: medication.photoUri } : defaultMedicationImage;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.mediaCard}>
                    <Text style={styles.sectionLabel}>Hãy nhìn xem con đã sẵn sàng</Text>
                    <Image source={childPhoto} style={styles.childPhoto} contentFit="cover" />
                </View>

                <View style={styles.card}>
                    <View style={styles.medHeader}>
                        <Image source={medImage} style={styles.pillPhoto} contentFit="cover" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.medName}>{medication?.name ?? 'Thuốc tiếp theo'}</Text>
                            {medication?.dosage ? <Text style={styles.medDosage}>{medication.dosage}</Text> : null}
                            {reminder?.date ? <Text style={styles.medTime}>Lúc {formatTime(reminder.date)}</Text> : null}
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
        padding: spacing.lg,
        gap: spacing.lg,
    },
    mediaCard: {
        backgroundColor: '#e0f2fe',
        borderRadius: radius.lg,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionLabel: {
        fontSize: fontSize.md,
        color: colors.muted,
        marginBottom: spacing.sm,
        fontWeight: '700',
    },
    childPhoto: {
        width: '100%',
        height: '100%',
        minHeight: 220,
        borderRadius: radius.md,
    },
    card: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
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
        width: 96,
        height: 96,
        borderRadius: radius.md,
        backgroundColor: '#e2e8f0',
    },
    medName: {
        fontSize: Platform.OS === 'android' ? 26 : 28,
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
        marginTop: spacing.sm,
    },
    actionButton: {
        paddingVertical: spacing.lg,
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
