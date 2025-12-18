// app/lib/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Medication, MedicationSchedule } from '../types/medication';
import { apiFetch } from './apiClient';
import { getDeviceCredentials } from './deviceCredentials';

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

    for (const day of schedule.daysOfWeek) {
        const trigger = {
            weekday: day + 1,   // Expo: 1 = Sunday
            hour: schedule.hour,
            minute: schedule.minute,
            repeats: true,
        } as Notifications.CalendarTriggerInput;

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: `Nhắc uống thuốc: ${med.name}`,
                body:
                    `${schedule.hour.toString().padStart(2, '0')}:` +
                    schedule.minute.toString().padStart(2, '0'),
                sound: 'default',
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
