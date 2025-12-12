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
    toggleEnabled: (id: string) => Promise<void>;
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

        const notifIds = await scheduleNotificationsForMedication(med);
        med.schedules = med.schedules.map(s => ({ ...s, notificationIds: notifIds }));

        await addMedication(med);
        setMedications(prev => [...prev, med]);
    };

    const updateMedication = async (med: Medication) => {
        // hủy thông báo cũ
        med.schedules.forEach(s => s.notificationIds && cancelNotifications(s.notificationIds));
        const notifIds = await scheduleNotificationsForMedication(med);
        med.schedules = med.schedules.map(s => ({ ...s, notificationIds: notifIds }));

        await updateMedStorage(med);
        setMedications(prev => prev.map(m => (m.id === med.id ? med : m)));
    };

    const deleteMedication = async (id: string) => {
        const med = medications.find(m => m.id === id);
        med?.schedules.forEach(s => s.notificationIds && cancelNotifications(s.notificationIds));
        await deleteMedStorage(id);
        setMedications(prev => prev.filter(m => m.id !== id));
    };

    const toggleEnabled = async (id: string) => {
        const med = medications.find(m => m.id === id);
        if (!med) return;

        if (med.enabled) {
            med.schedules.forEach(s => s.notificationIds && cancelNotifications(s.notificationIds));
            med.schedules = med.schedules.map(s => ({ ...s, notificationIds: [] }));
            med.enabled = false;
        } else {
            const ids = await scheduleNotificationsForMedication(med);
            med.schedules = med.schedules.map(s => ({ ...s, notificationIds: ids }));
            med.enabled = true;
        }

        await updateMedStorage(med);
        setMedications(prev => prev.map(m => (m.id === id ? med : m)));
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
