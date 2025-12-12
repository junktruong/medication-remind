// app/lib/services/medicationStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Medication,
} from '../types/medication';

const STORAGE_KEY = '@medications';

export async function loadMedications(): Promise<Medication[]> {
    try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (!json) return [];
        return JSON.parse(json) as Medication[];
    } catch (err) {
        console.error('loadMedications error:', err);
        return [];
    }
}

export async function saveMedications(list: Medication[]): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
        console.error('saveMedications error:', err);
    }
}

export async function addMedication(med: Medication): Promise<void> {
    try {
        const meds = await loadMedications();
        meds.push(med);
        await saveMedications(meds);
    } catch (err) {
        console.error('addMedication error:', err);
    }
}

export async function updateMedication(updated: Medication): Promise<void> {
    try {
        const meds = await loadMedications();
        const newList = meds.map(m => (m.id === updated.id ? updated : m));
        await saveMedications(newList);
    } catch (err) {
        console.error('updateMedication error:', err);
    }
}

export async function deleteMedication(id: string): Promise<void> {
    try {
        const meds = await loadMedications();
        const newList = meds.filter(m => m.id !== id);
        await saveMedications(newList);
    } catch (err) {
        console.error('deleteMedication error:', err);
    }
}
