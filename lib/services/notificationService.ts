// app/lib/services/notificationService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Medication, MedicationSchedule } from '../types/medication';
import { apiFetch } from './apiClient';
import { getDeviceCredentials } from './deviceCredentials';

const PUSH_TOKEN_KEY = '@pushToken:lastRegistered';

export async function requestNotificationPermission(): Promise<boolean> {
    try {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    } catch (err) {
        console.error('requestNotificationPermission error:', err);
        return false;
    }
}

export async function scheduleNotificationsForSchedule(
    med: Medication,
    schedule: MedicationSchedule,
): Promise<string[]> {
    const ids: string[] = [];

    const uniqueDays = [...new Set(schedule.daysOfWeek ?? [])].sort((a, b) => a - b);
    const now = new Date();

    const getNextStartDate = (weekday: number) => {
        const next = new Date(now);
        next.setHours(schedule.hour, schedule.minute, 0, 0);

        // Expo uses 0 = Sunday, but CalendarTriggerInput expects 1 = Sunday
        const currentWeekday = now.getDay();
        const daysUntil = (weekday - currentWeekday + 7) % 7;
        if (daysUntil === 0 && next <= now) {
            next.setDate(next.getDate() + 7);
        } else {
            next.setDate(next.getDate() + daysUntil);
        }

        return next;
    };

    for (const day of uniqueDays) {
        const startDate = getNextStartDate(day);
        const trigger = {
            weekday: day + 1,   // Expo: 1 = Sunday
            hour: schedule.hour,
            minute: schedule.minute,
            second: 0,
            repeats: true,
            startDate,
        } as Notifications.CalendarTriggerInput;

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: `Nhắc uống thuốc: ${med.name}`,
                body:
                    `${schedule.hour.toString().padStart(2, '0')}:` +
                    schedule.minute.toString().padStart(2, '0'),
                sound: 'default',
                data: {
                    type: 'reminder',
                    medicationId: med.id,
                    scheduleId: schedule.scheduleId,
                },
            },
            trigger,
        });

        ids.push(id);
    }

    return ids;
}

export async function scheduleNotificationsForMedication(
    med: Medication
): Promise<Medication> {
    if (!med.enabled) {
        return {
            ...med,
            schedules: med.schedules.map((schedule) => ({ ...schedule, notificationIds: [] })),
        };
    }

    try {
        const schedulesWithIds: MedicationSchedule[] = [];

        for (const schedule of med.schedules) {
            const ids = await scheduleNotificationsForSchedule(med, schedule);
            schedulesWithIds.push({ ...schedule, notificationIds: ids });
        }

        return { ...med, schedules: schedulesWithIds };
    } catch (err) {
        console.error('scheduleNotificationsForMedication error:', err);
        return med;
    }
}

export async function cancelNotifications(ids: string[]): Promise<void> {
    try {
        for (const id of ids) {
            await Notifications.cancelScheduledNotificationAsync(id);
        }
    } catch (err) {
        console.error('cancelNotifications error:', err);
    }
}

export async function registerPushToken(pushToken: string) {
    try {
        const creds = await getDeviceCredentials();
        await apiFetch('/api/devices/push-token', {
            method: 'POST',
            body: {
                pushToken,
                familyId: creds.familyId,
            },
        });
    } catch (error) {
        console.warn('registerPushToken error', error);
    }
}

export async function obtainPushToken(): Promise<string> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        throw new Error('Push notification permission not granted');
    }

    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId || Constants?.expoConfig?.extra?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return token.data;
}

export async function ensurePushTokenRegistered() {
    try {
        const token = await obtainPushToken();
        const lastRegistered = await AsyncStorage.getItem(PUSH_TOKEN_KEY);

        if (token !== lastRegistered) {
            await registerPushToken(token);
            await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        }
    } catch (error) {
        console.warn('ensurePushTokenRegistered error', error);
    }
}
