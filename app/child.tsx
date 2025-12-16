import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../lib/components/PrimaryButton';
import { useMedications } from '../lib/context/MedicationContext';
import { useSession } from '../lib/context/SessionContext';
import { colors, fontSize, radius, spacing } from '../lib/design/tokens';
import {
    loadChildAudioUri,
    loadChildPhotoUri,
    saveChildAudioUri,
    saveChildPhotoUri,
} from '../lib/services/childMediaStorage';
import { loadChildPhone, saveChildPhone } from '../lib/services/contactStorage';
import { AdherenceEntry, loadAdherenceLog } from '../lib/services/adherenceStorage';
import { TodayDoseInfo, formatTime, getTodayDoses } from '../lib/utils/scheduleHelpers';

type DoseStatus = {
    id: string;
    medicationName: string;
    time: string;
    status: 'done' | 'pending' | 'missed';
    note: string;
};

const defaultChildPhoto = require('../assets/images/react-logo.png');

export default function ChildScreen() {
    const { reset } = useSession();
    const { medications } = useMedications();
    const [phone, setPhone] = useState('');
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [statuses, setStatuses] = useState<DoseStatus[]>([]);
    const [childPhotoUri, setChildPhotoUri] = useState<string | null>(null);
    const [childAudioUri, setChildAudioUri] = useState<string | null>(null);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const todaySummary = useMemo(() => {
        const done = statuses.filter((s) => s.status === 'done').length;
        const missed = statuses.filter((s) => s.status === 'missed').length;
        const pending = statuses.filter((s) => s.status === 'pending').length;
        return { done, missed, pending, total: statuses.length };
    }, [statuses]);

    const findTakenEntry = useCallback((entries: AdherenceEntry[], dose: TodayDoseInfo) => {
        const target = dose.date.getTime();
        const startOfDay = new Date(dose.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        return entries.find((entry) => {
            if (entry.action !== 'taken') return false;
            if (entry.medicationId && entry.medicationId !== dose.medication.id) return false;

            if (typeof entry.scheduleTime === 'number') {
                return Math.abs(entry.scheduleTime - target) <= 30 * 60 * 1000;
            }

            return entry.timestamp >= startOfDay.getTime() && entry.timestamp <= endOfDay.getTime();
        });
    }, []);

    const refreshStatuses = useCallback(async () => {
        const [log, storedPhoto, storedAudio, storedPhone] = await Promise.all([
            loadAdherenceLog(),
            loadChildPhotoUri(),
            loadChildAudioUri(),
            loadChildPhone(),
        ]);

        if (storedPhoto) setChildPhotoUri(storedPhoto);
        if (storedAudio) setChildAudioUri(storedAudio);
        if (storedPhone) {
            setPhone(storedPhone);
            setLastSaved(storedPhone);
        }

        const todayDoses = getTodayDoses(medications);
        const now = Date.now();
        const mapped: DoseStatus[] = todayDoses.map((dose) => {
            const taken = findTakenEntry(log, dose);
            const id = `${dose.medication.id}-${dose.date.getTime()}`;
            if (taken) {
                return {
                    id,
                    medicationName: dose.medication.name,
                    time: formatTime(dose.date),
                    status: 'done',
                    note: 'Bố/mẹ đã bấm ĐÃ UỐNG',
                };
            }

            const status = now < dose.date.getTime() ? 'pending' : 'missed';

            return {
                id,
                medicationName: dose.medication.name,
                time: formatTime(dose.date),
                status,
                note:
                    status === 'pending'
                        ? 'Chưa tới giờ, nhắc bố/mẹ chuẩn bị nhé!'
                        : 'Đã qua giờ uống, báo bố/mẹ kiểm tra ngay.',
            };
        });

        setStatuses(mapped);
    }, [findTakenEntry, medications]);

    useFocusEffect(
        useCallback(() => {
            refreshStatuses();
            return () => {
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }
                if (recordingRef.current) {
                    recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
                }
            };
        }, [refreshStatuses]),
    );

    useEffect(() => {
        refreshStatuses();
    }, [refreshStatuses]);

    const handleSavePhone = async () => {
        const trimmed = phone.trim();
        if (!trimmed) {
            Alert.alert('Nhập số điện thoại', 'Hãy nhập số để bố/mẹ có thể gọi nhanh.');
            return;
        }

        await saveChildPhone(trimmed);
        setLastSaved(trimmed);
        Alert.alert('Đã lưu số', 'Bố/mẹ sẽ gọi được cho con ngay từ màn hình nhắc.');
    };

    const pickChildPhoto = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Cần quyền truy cập ảnh', 'Hãy cho phép ứng dụng truy cập thư viện ảnh.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true });
        if (!result.canceled) {
            const uri = result.assets?.[0]?.uri;
            if (uri) {
                setChildPhotoUri(uri);
                await saveChildPhotoUri(uri);
            }
        }
    };

    const stopRecording = useCallback(async () => {
        const activeRecording = recordingRef.current;
        if (!activeRecording) return;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        try {
            await activeRecording.stopAndUnloadAsync();
            const status = await activeRecording.getStatusAsync();
            const uri = activeRecording.getURI();
            setRecording(null);
            recordingRef.current = null;

            if (!uri) return;

            if (status.isLoaded && status.durationMillis && status.durationMillis < 5000) {
                Alert.alert('Bản ghi quá ngắn', 'Hãy ghi ít nhất 5 giây để bố/mẹ nghe rõ.');
                return;
            }

            setChildAudioUri(uri);
            await saveChildAudioUri(uri);
            Alert.alert('Đã lưu ghi âm', 'Âm thanh sẽ phát khi bố/mẹ mở nhắc uống.');
        } catch (error) {
            console.warn('stopRecording error', error);
            Alert.alert('Lỗi ghi âm', 'Không thể lưu file âm thanh, thử lại nhé.');
        }
    }, []);

    const startRecording = async () => {
        if (recording) return;

        const perm = await Audio.requestPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Cần quyền micro', 'Hãy cho phép ứng dụng ghi âm để nhắc bố/mẹ.');
            return;
        }

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            const { recording: rec } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY,
            );

            setRecording(rec);
            recordingRef.current = rec;
            timerRef.current = setTimeout(stopRecording, 10_000);
            Alert.alert('Đang ghi âm', 'Hát hoặc nhắn nhủ bố/mẹ trong tối đa 10 giây.');
        } catch (error) {
            console.warn('startRecording error', error);
            Alert.alert('Không thể ghi âm', 'Kiểm tra lại micro và thử lại nhé.');
        }
    };

    const playAudioPreview = async () => {
        if (!childAudioUri) return;
        try {
            const { sound } = await Audio.Sound.createAsync({ uri: childAudioUri });
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate((status) => {
                if (!status.isLoaded || status.isPlaying) return;
                sound.unloadAsync().catch(() => undefined);
            });
        } catch (error) {
            console.warn('playAudioPreview error', error);
            Alert.alert('Không phát được', 'File âm thanh có thể đã bị xóa, hãy ghi lại.');
        }
    };

    const renderStatusPill = (status: DoseStatus['status']) => {
        const mapping: Record<DoseStatus['status'], { label: string; color: string; bg: string }> = {
            done: { label: 'Done', color: '#16a34a', bg: '#dcfce7' },
            pending: { label: 'Pending', color: '#0ea5e9', bg: '#e0f2fe' },
            missed: { label: 'Missed', color: '#b91c1c', bg: '#fee2e2' },
        };

        const view = mapping[status];
        return (
            <View style={[styles.statusPill, { backgroundColor: view.bg }]}>
                <Text style={[styles.statusPillText, { color: view.color }]}>{view.label}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Hôm nay bố/mẹ uống đủ chưa?</Text>
                    <Text style={styles.subtitle}>Con xem ngay tiến độ uống thuốc và gửi lời nhắc yêu thương.</Text>
                </View>

                <View style={styles.summaryCard}>
                    <View>
                        <Text style={styles.sectionLabel}>Tổng quan hôm nay</Text>
                        <Text style={styles.summaryText}>
                            Bố/mẹ đã uống {todaySummary.done}/{todaySummary.total || '0'} lần
                        </Text>
                        <Text style={styles.summaryHelper}>
                            Pending: {todaySummary.pending} • Missed: {todaySummary.missed}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.refreshButton} onPress={refreshStatuses}>
                        <Text style={styles.refreshText}>↻ Cập nhật</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Lịch uống hôm nay</Text>
                    {statuses.length === 0 ? (
                        <Text style={styles.helper}>Chưa có lịch. Nhờ bố/mẹ thêm thuốc để con theo dõi.</Text>
                    ) : (
                        statuses.map((item) => (
                            <View key={item.id} style={styles.listItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemTitle}>{item.time} • {item.medicationName}</Text>
                                    <Text style={styles.itemNote}>{item.note}</Text>
                                </View>
                                {renderStatusPill(item.status)}
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Media nhắc bố/mẹ</Text>
                    <View style={styles.mediaRow}>
                        <Image
                            source={childPhotoUri ? { uri: childPhotoUri } : defaultChildPhoto}
                            style={styles.childPhoto}
                            contentFit="cover"
                        />
                        <View style={{ flex: 1, gap: spacing.sm }}>
                            <Text style={styles.helper}>
                                Chọn ảnh dễ thương để bố/mẹ thấy khi mở nhắc uống.
                            </Text>
                            <PrimaryButton title="Chọn ảnh con" onPress={pickChildPhoto} />
                        </View>
                    </View>

                    <View style={styles.audioRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.helper}>Ghi âm 5–10s để nhắc bố/mẹ (chỉ phát khi mở nhắc).</Text>
                            <View style={styles.audioActions}>
                                <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                                    <Text style={styles.recordText}>{recording ? 'Đang ghi...' : '🎤 Ghi âm'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.recordButton, styles.stopButton]}
                                    onPress={stopRecording}
                                    disabled={!recording}
                                >
                                    <Text style={[styles.recordText, { color: recording ? '#fff' : '#94a3b8' }]}>⏹ Dừng</Text>
                                </TouchableOpacity>
                            </View>
                            {childAudioUri ? (
                                <TouchableOpacity style={styles.playButton} onPress={playAudioPreview}>
                                    <Text style={styles.playText}>▶️ Nghe lại ghi âm</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Số điện thoại của con</Text>
                    <Text style={styles.helper}>Bố/mẹ sẽ bấm GỌI CON ngay từ màn hình nhắc.</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Ví dụ: 0912 345 678"
                        keyboardType="phone-pad"
                    />
                    <PrimaryButton title="Lưu số cho bố/mẹ" onPress={handleSavePhone} />
                    {lastSaved ? (
                        <Text style={styles.helper}>Đã lưu: {lastSaved}</Text>
                    ) : (
                        <Text style={styles.helper}>Lưu số để bố/mẹ bấm GỌI CON nhanh.</Text>
                    )}
                </View>

                <PrimaryButton title="Quay lại chọn vai trò" onPress={reset} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    container: {
        padding: spacing.xl,
        gap: spacing.lg,
    },
    header: {
        gap: spacing.xs,
    },
    title: {
        fontSize: fontSize.display,
        fontWeight: '900',
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSize.md,
        color: colors.muted,
        lineHeight: 22,
    },
    summaryCard: {
        backgroundColor: '#ecfeff',
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: '#bae6fd',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionLabel: {
        fontSize: fontSize.md,
        color: colors.muted,
        letterSpacing: 0.2,
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: spacing.xs,
    },
    summaryText: {
        fontSize: fontSize.xl,
        fontWeight: '900',
        color: '#0ea5e9',
    },
    summaryHelper: {
        color: colors.text,
        marginTop: spacing.xs,
    },
    refreshButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: '#e0f2fe',
        borderRadius: radius.sm,
    },
    refreshText: {
        color: '#0369a1',
        fontWeight: '800',
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        gap: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
    helper: {
        color: colors.muted,
        fontSize: fontSize.md,
    },
    listItem: {
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    itemTitle: {
        fontSize: fontSize.lg,
        fontWeight: '800',
        color: colors.text,
    },
    itemNote: {
        color: colors.muted,
        marginTop: spacing.xs,
    },
    statusPill: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.md,
    },
    statusPillText: {
        fontWeight: '800',
    },
    mediaRow: {
        flexDirection: 'row',
        gap: spacing.md,
        alignItems: 'center',
    },
    childPhoto: {
        width: 120,
        height: 120,
        borderRadius: radius.md,
        backgroundColor: '#e2e8f0',
    },
    audioRow: {
        gap: spacing.sm,
    },
    audioActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    recordButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: '#f97316',
    },
    stopButton: {
        backgroundColor: '#dc2626',
    },
    recordText: {
        color: '#fff',
        fontWeight: '800',
    },
    playButton: {
        marginTop: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: '#e2e8f0',
        alignSelf: 'flex-start',
    },
    playText: {
        color: '#0f172a',
        fontWeight: '800',
    },
    input: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.lg,
        backgroundColor: '#fff',
    },
});
