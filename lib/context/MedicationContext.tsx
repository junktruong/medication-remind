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
} from '../services/notificationService';
import { Medication } from '../types/medication';


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

        const scheduleIds = await scheduleNotificationsForMedication(med);
        const medWithNotif: Medication = {
            ...med,
            schedules: med.schedules.map((s, idx) => ({
                ...s,
                notificationIds: scheduleIds.find(n => n.scheduleIdx === idx)?.ids ?? [],
            })),
        };

        await addMedication(medWithNotif);
        setMedications(prev => [...prev, medWithNotif]);
    };

    const updateMedication = async (med: Medication) => {
        const existing = medications.find(m => m.id === med.id);
        existing?.schedules.forEach(s => s.notificationIds && cancelNotifications(s.notificationIds));

        const scheduleIds = await scheduleNotificationsForMedication(med);
        const medWithNotif: Medication = {
            ...med,
            schedules: med.schedules.map((s, idx) => ({
                ...s,
                notificationIds: scheduleIds.find(n => n.scheduleIdx === idx)?.ids ?? [],
            })),
        };

        await updateMedStorage(medWithNotif);
        setMedications(prev => prev.map(m => (m.id === med.id ? medWithNotif : m)));
    };

    const deleteMedication = async (id: string) => {
        const med = medications.find(m => m.id === id);
        med?.schedules.forEach(s => s.notificationIds && cancelNotifications(s.notificationIds));
        await deleteMedStorage(id);
        setMedications(prev => prev.filter(m => m.id !== id));
    };

    const toggleEnabled = async (id: string, enabled?: boolean) => {
        const med = medications.find(m => m.id === id);
        if (!med) return;

        const targetEnabled = typeof enabled === 'boolean' ? enabled : !med.enabled;
        const baseSchedules = med.schedules ?? [];

        let updated: Medication = { ...med, schedules: baseSchedules };

        if (!targetEnabled) {
            baseSchedules.forEach(s => s.notificationIds && cancelNotifications(s.notificationIds));
            updated = {
                ...updated,
                enabled: false,
                schedules: baseSchedules.map(s => ({ ...s, notificationIds: [] })),
            };
        } else {
            const ids = await scheduleNotificationsForMedication({ ...updated, enabled: true });
            updated = {
                ...updated,
                enabled: true,
                schedules: baseSchedules.map((s, idx) => ({
                    ...s,
                    notificationIds: ids.find(n => n.scheduleIdx === idx)?.ids ?? [],
                })),
            };
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
