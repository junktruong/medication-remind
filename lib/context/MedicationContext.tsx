// app/lib/context/MedicationContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    addMedication,
    deleteMedication as deleteMedStorage,
    loadMedications,
    updateMedication as updateMedStorage
} from '../services/medicationStorage';
import {
    cancelNotifications,
    requestNotificationPermission,
    scheduleNotificationsForMedication,
    scheduleNotificationsForSchedule,
} from '../services/notificationService';
import { Medication, MedicationSchedule, Weekday } from '../types/medication';


export type MedicationInput = Omit<Medication, 'id' | 'createdAt'>;

interface Ctx {
    medications: Medication[];
    refresh: () => Promise<void>;
    createMedication: (input: MedicationInput) => Promise<void>;
    updateMedication: (med: Medication) => Promise<void>;
    deleteMedication: (id: string) => Promise<void>;
    toggleEnabled: (id: string, enabled?: boolean) => Promise<void>;
}

const MedicationContext = createContext<Ctx | undefined>(undefined);

export const MedicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [medications, setMedications] = useState<Medication[]>([]);

    const areDaysEqual = (a: Weekday[] = [], b: Weekday[] = []) => {
        if (a.length !== b.length) return false;
        return a.every((day, idx) => day === b[idx]);
    };

    const hasScheduleChanged = (
        prev?: MedicationSchedule,
        next?: MedicationSchedule,
    ) => {
        if (!prev || !next) return true;
        return (
            prev.hour !== next.hour ||
            prev.minute !== next.minute ||
            !areDaysEqual(prev.daysOfWeek, next.daysOfWeek)
        );
    };

    const buildSchedulesWithNotifications = async (
        med: Medication,
        existing?: Medication,
    ): Promise<MedicationSchedule[]> => {
        const existingSchedules = existing?.schedules ?? [];

        if (!med.enabled) {
            await Promise.all(
                existingSchedules.map(async (schedule) => {
                    if (schedule.notificationIds?.length) {
                        await cancelNotifications(schedule.notificationIds);
                    }
                })
            );

            return med.schedules.map((schedule) => ({ ...schedule, notificationIds: [] }));
        }

        const updatedSchedules: MedicationSchedule[] = [];

        for (let index = 0; index < med.schedules.length; index++) {
            const nextSchedule = med.schedules[index];
            const prevSchedule = existingSchedules[index];
            const changed = hasScheduleChanged(prevSchedule, nextSchedule);

            if (!changed && prevSchedule?.notificationIds?.length) {
                updatedSchedules.push({ ...nextSchedule, notificationIds: prevSchedule.notificationIds });
                continue;
            }

            if (prevSchedule?.notificationIds?.length) {
                await cancelNotifications(prevSchedule.notificationIds);
            }

            const notificationIds = await scheduleNotificationsForSchedule(med, nextSchedule);
            updatedSchedules.push({ ...nextSchedule, notificationIds });
        }

        if (existingSchedules.length > med.schedules.length) {
            const removed = existingSchedules.slice(med.schedules.length);
            await Promise.all(
                removed.map(async (schedule) => {
                    if (schedule.notificationIds?.length) {
                        await cancelNotifications(schedule.notificationIds);
                    }
                })
            );
        }

        return updatedSchedules;
    };

    const refresh = async () => {
        const data = await loadMedications();
        setMedications(data);
    };

    useEffect(() => {
        refresh();
    }, []);

    const createMedication = async (input: MedicationInput) => {
        await requestNotificationPermission();
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const createdAt = Date.now();
        const med: Medication = { id, createdAt, ...input };

        const medWithNotif = await scheduleNotificationsForMedication(med);

        await addMedication(medWithNotif);
        setMedications(prev => [...prev, medWithNotif]);
    };

    const updateMedication = async (med: Medication) => {
        const existing = medications.find(m => m.id === med.id);
        const schedulesWithNotif = await buildSchedulesWithNotifications(med, existing);
        const medWithNotif: Medication = { ...med, schedules: schedulesWithNotif };

        await updateMedStorage(medWithNotif);
        setMedications(prev => prev.map(m => (m.id === med.id ? medWithNotif : m)));
    };

    const deleteMedication = async (id: string) => {
        const med = medications.find(m => m.id === id);

        if (med?.schedules?.length) {
            for (const schedule of med.schedules) {
                if (schedule.notificationIds?.length) {
                    await cancelNotifications(schedule.notificationIds);
                }
            }
        }

        await deleteMedStorage(id);
        setMedications(prev => prev.filter(m => m.id !== id));
    };

    const toggleEnabled = async (id: string, enabled?: boolean) => {
        const med = medications.find(m => m.id === id);
        if (!med) return;

        const targetEnabled = typeof enabled === 'boolean' ? enabled : !med.enabled;
        let updated: Medication = { ...med, enabled: targetEnabled };

        if (!targetEnabled) {
            await Promise.all(
                (med.schedules ?? []).map(async (schedule) => {
                    if (schedule.notificationIds?.length) {
                        await cancelNotifications(schedule.notificationIds);
                    }
                })
            );

            updated = {
                ...updated,
                schedules: (med.schedules ?? []).map((schedule) => ({ ...schedule, notificationIds: [] })),
            };
        } else {
            await requestNotificationPermission();
            const medWithNotif = await scheduleNotificationsForMedication({ ...updated, enabled: true });
            updated = medWithNotif;
        }

        await updateMedStorage(updated);
        setMedications(prev => prev.map(m => (m.id === id ? updated : m)));
    };

    return (
        <MedicationContext.Provider
            value={{ medications, refresh, createMedication, updateMedication, deleteMedication, toggleEnabled }}
        >
            {children}
        </MedicationContext.Provider>
    );
};

export const useMedications = () => {
    const ctx = useContext(MedicationContext);
    if (!ctx) throw new Error('useMedications must be used within MedicationProvider');
    return ctx;
};
