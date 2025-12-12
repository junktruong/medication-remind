// app/lib/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Medication } from '../types/medication';

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
): Promise<string[]> {
    const ids: string[] = [];

    try {
        for (const schedule of med.schedules) {
            for (const day of schedule.daysOfWeek) {
                // Calendar trigger KHÔNG cần "type"
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
        }
    } catch (err) {
        console.error('scheduleNotificationsForMedication error:', err);
    }

    return ids;
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
