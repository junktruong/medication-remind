import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Linking,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMedications } from '../lib/context/MedicationContext';
import { colors, fontSize, radius, spacing } from '../lib/design/tokens';

import {
    clearSnoozeState,
    isSnoozed,
    logAdherenceEvent,
    setSnoozeUntil,
} from '../lib/services/adherenceStorage';
import { loadChildAudioUri, loadChildPhotoUri } from '../lib/services/childMediaStorage';
import { loadChildPhone } from '../lib/services/contactStorage';
import { requestNotificationPermission } from '../lib/services/notificationService';
import { Weekday } from '../lib/types/medication';
import { generateStableId } from '../lib/utils/id';
import { formatTime, getNextDose } from '../lib/utils/scheduleHelpers';

const childPhoto = require('../assets/images/react-logo.png');
const defaultMedicationImage = require('../assets/images/react-logo.png');

export default function ReminderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string; verify?: string; mock?: string }>();
    const { medications } = useMedications();

    const [verificationPhoto, setVerificationPhoto] = useState<string | undefined>();
    const [childPhone, setChildPhone] = useState<string | null>(null);
    const [childPhotoUri, setChildPhotoUri] = useState<string | null>(null);
    const [childAudioUri, setChildAudioUri] = useState<string | null>(null);

    // --- audio ---
    const soundRef = useRef<Audio.Sound | null>(null);

    // --- actions reveal after 5s audio ---
    const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [actionsVisible, setActionsVisible] = useState(false);
    const [audioStatusText, setAudioStatusText] = useState<string>('Đang phát lời nhắc…');
    const actionsFade = useRef(new Animated.Value(0)).current;

    // --- bottom sheet hide 10s then show ---
    const sheetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [sheetVisible, setSheetVisible] = useState(false);
    const sheetFade = useRef(new Animated.Value(0)).current;

    const isMock = params.mock === 'true';

    const reminder = useMemo(() => {
        if (isMock) {
            const now = new Date();
            const schedule = {
                scheduleId: generateStableId('schedule'),
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
        const loadMedia = async () => {
            const [storedPhone, storedPhoto, storedAudio] = await Promise.all([
                loadChildPhone(),
                loadChildPhotoUri(),
                loadChildAudioUri(),
            ]);
            setChildPhone(storedPhone);
            setChildPhotoUri(storedPhoto);
            setChildAudioUri(storedAudio);
        };

        loadMedia();

        // Bottom sheet: hide first 10s
        setSheetVisible(false);
        sheetFade.setValue(0);
        if (sheetTimerRef.current) clearTimeout(sheetTimerRef.current);
        sheetTimerRef.current = setTimeout(() => {
            setSheetVisible(true);
            Animated.timing(sheetFade, {
                toValue: 1,
                duration: 420,
                useNativeDriver: true,
            }).start();
        }, 10000);

        return () => {
            if (sheetTimerRef.current) clearTimeout(sheetTimerRef.current);
            if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
            if (soundRef.current) {
                soundRef.current.unloadAsync().catch(() => undefined);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const resetActions = () => {
            setActionsVisible(false);
            actionsFade.setValue(0);
        };

        const revealActions = () => {
            setActionsVisible(true);
            Animated.timing(actionsFade, {
                toValue: 1,
                duration: 380,
                useNativeDriver: true,
            }).start();
        };

        const playAudioOnce = async () => {
            resetActions();
            setAudioStatusText('Đang phát lời nhắc…');

            if (revealTimerRef.current) {
                clearTimeout(revealTimerRef.current);
                revealTimerRef.current = null;
            }

            // Không có audio -> show actions nhanh (nhưng sheet vẫn bị delay 10s)
            if (!childAudioUri) {
                setAudioStatusText('Không có ghi âm — hiện nút thao tác.');
                revealTimerRef.current = setTimeout(revealActions, 600);
                return;
            }

            try {
                if (soundRef.current) {
                    await soundRef.current.unloadAsync();
                    soundRef.current = null;
                }

                const { sound } = await Audio.Sound.createAsync(
                    { uri: childAudioUri },
                    { shouldPlay: true }
                );
                soundRef.current = sound;

                // Sau đúng 5 giây kể từ lúc bắt đầu play -> show actions
                revealTimerRef.current = setTimeout(() => {
                    setAudioStatusText('');
                    revealActions();
                }, 9000);
            } catch (error) {
                console.warn('playChildAudio error', error);
                setAudioStatusText('Không phát được audio — hiện nút thao tác.');
                revealTimerRef.current = setTimeout(revealActions, 600);
            }
        };

        playAudioOnce();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childAudioUri]);

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
    const reminderPhoto = childPhotoUri ? { uri: childPhotoUri } : childPhoto;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Fullscreen photo */}
            <View style={styles.bg}>
                <Image source={reminderPhoto} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                <View style={styles.darkOverlay} />

                {/* Top info (giữ nguyên, không cần ẩn) */}
                <View style={styles.topArea}>
                    <View style={styles.topPill}>
                        <Text style={styles.topPillText}>⏰ Đã đến giờ nhắc con uống thuốc</Text>
                    </View>

                    <Text style={styles.timeBig}>
                        {reminder?.date ? formatTime(reminder.date) : 'Ngay bây giờ'}
                    </Text>

                    <Text style={styles.audioHint}>{audioStatusText}</Text>
                </View>

                {/* Bottom sheet: ẩn 10 giây đầu, rồi mới hiện */}
                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            opacity: sheetFade,
                            transform: [
                                {
                                    translateY: sheetFade.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                    pointerEvents={sheetVisible ? 'auto' : 'none'}
                >
                    <View style={styles.sheetGrab} />

                    <View style={styles.medHeader}>
                        <Image source={medImage} style={styles.pillPhoto} contentFit="cover" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.medName} numberOfLines={2}>
                                {medication?.name ?? 'Thuốc tiếp theo'}
                            </Text>
                            {medication?.dosage ? <Text style={styles.medDosage}>{medication.dosage}</Text> : null}
                            {reminder?.date ? (
                                <Text style={styles.medTime}>Hôm nay • {formatTime(reminder.date)}</Text>
                            ) : null}
                        </View>
                    </View>

                    <Text style={styles.instruction} numberOfLines={3}>
                        {medication?.notes ?? 'Uống sau ăn và uống đủ nước.'}
                    </Text>

                    {enableVerification && (
                        <TouchableOpacity style={styles.verifyButton} onPress={handleVerify} activeOpacity={0.85}>
                            <Text style={styles.verifyText}>📸 KIỂM TRA THUỐC</Text>
                        </TouchableOpacity>
                    )}

                    {verificationPhoto ? (
                        <Image source={{ uri: verificationPhoto }} style={styles.verifyPreview} contentFit="cover" />
                    ) : null}

                    {/* Actions: appear after 5s */}
                    <Animated.View
                        style={[
                            styles.actions,
                            {
                                opacity: actionsFade,
                                transform: [
                                    {
                                        translateY: actionsFade.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [12, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                        pointerEvents={actionsVisible ? 'auto' : 'none'}
                    >
                        <TouchableOpacity
                            style={[styles.actionButton, styles.primary]}
                            onPress={handleTaken}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.actionText}>✅ ĐÃ UỐNG</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.snooze]}
                            onPress={handleSnooze}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.actionText}>⏰ NHẮC LẠI 5 PHÚT</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.call]}
                            onPress={handleCall}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.actionText}>📞 GỌI CON</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {!actionsVisible ? (
                        <View style={styles.lockRow}>
                            <View style={styles.lockDot} />
                            <Text style={styles.lockText}>Nút sẽ hiện sau 5 giây…</Text>
                        </View>
                    ) : null}
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },

    bg: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#000',
    },

    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        // backgroundColor: 'rgba(2, 6, 23, 0.55)',
    },

    topArea: {
        paddingTop: Platform.OS === 'android' ? 52 : 18,
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },

    topPill: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.22)',
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderRadius: 999,
    },
    topPillText: {
        color: '#e2e8f0',
        fontSize: fontSize.md,
        fontWeight: '800',
    },

    timeBig: {
        color: '#38bdf8',
        fontSize: Platform.OS === 'android' ? 44 : 48,
        fontWeight: '900',
        letterSpacing: 0.3,
    },

    audioHint: {
        color: 'rgba(226, 232, 240, 0.9)',
        fontSize: fontSize.md,
        fontWeight: '700',
    },

    sheet: {
        marginTop: 'auto',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: spacing.xl,
        gap: spacing.md,
    },

    sheetGrab: {
        alignSelf: 'center',
        width: 44,
        height: 5,
        borderRadius: 99,
        backgroundColor: 'rgba(15, 23, 42, 0.18)',
        marginTop: -8,
        marginBottom: 6,
    },

    medHeader: {
        flexDirection: 'row',
        gap: spacing.md,
        alignItems: 'center',
    },

    pillPhoto: {
        width: 88,
        height: 88,
        borderRadius: radius.md,
        backgroundColor: '#e2e8f0',
    },

    medName: {
        fontSize: Platform.OS === 'android' ? 22 : 24,
        fontWeight: '900',
        color: colors.text,
    },

    medDosage: {
        fontSize: fontSize.md,
        color: colors.text,
        marginTop: 2,
        fontWeight: '700',
    },

    medTime: {
        fontSize: fontSize.md,
        color: '#0284c7',
        marginTop: spacing.xs,
        fontWeight: '800',
    },

    instruction: {
        fontSize: fontSize.md,
        color: colors.muted,
        lineHeight: 22,
        fontWeight: '700',
    },

    verifyButton: {
        backgroundColor: '#fbbf24',
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    verifyText: {
        fontSize: fontSize.md,
        fontWeight: '900',
        color: '#78350f',
        letterSpacing: 0.2,
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

    primary: { backgroundColor: colors.primary },
    snooze: { backgroundColor: '#f97316' },
    call: { backgroundColor: '#0ea5e9' },

    actionText: {
        color: '#fff',
        fontSize: Platform.OS === 'android' ? 20 : 21,
        fontWeight: '900',
        letterSpacing: 0.3,
    },

    lockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    lockDot: {
        width: 8,
        height: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(2, 132, 199, 0.7)',
    },
    lockText: {
        color: 'rgba(15, 23, 42, 0.65)',
        fontWeight: '800',
    },
});
