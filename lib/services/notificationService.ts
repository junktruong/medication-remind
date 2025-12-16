// app/lib/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Medication } from '../types/medication';

export type ScheduleNotificationResult = {
    scheduleIdx: number;
    ids: string[];
};

export async function requestNotificationPermission(): Promise<boolean> {
    try {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    } catch (err) {
        console.error('requestNotificationPermission error:', err);
        return false;
    }
}

export async function scheduleNotificationsForMedication(
    med: Medication
): Promise<ScheduleNotificationResult[]> {
    const result: ScheduleNotificationResult[] = [];

    if (!med.enabled) return result;

    try {
        med.schedules.forEach((_schedule, idx) => result.push({ scheduleIdx: idx, ids: [] }));

        for (let index = 0; index < med.schedules.length; index++) {
            const schedule = med.schedules[index];
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

            result[index] = { scheduleIdx: index, ids };
        }
    } catch (err) {
        console.error('scheduleNotificationsForMedication error:', err);
    }

    return result;
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
