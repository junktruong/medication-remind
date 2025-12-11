// src/storage/medicationStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication } from '../types';

const STORAGE_KEY = 'MEDICATIONS';

export async function loadMedications(): Promise<Medication[]> {
    try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (!json) return [];
        return JSON.parse(json);
    } catch (e) {
        console.error('Failed to load medications', e);
        return [];
    }
}

export async function saveMedications(medications: Medication[]): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
    } catch (e) {
        console.error('Failed to save medications', e);
    }
}
