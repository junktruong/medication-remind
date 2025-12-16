import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_KEY = '@medication-intake-log';

export type IntakeLogEntry = {
    id: string;
    medicationId?: string;
    medicationName?: string;
    takenAt: number;
    action: 'taken' | 'snooze' | 'call' | 'verify';
    note?: string;
};

export const appendLog = async (entry: Omit<IntakeLogEntry, 'id'>) => {
    try {
        const existing = await AsyncStorage.getItem(LOG_KEY);
        const parsed: IntakeLogEntry[] = existing ? JSON.parse(existing) : [];
        const record: IntakeLogEntry = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
        parsed.push(record);
        await AsyncStorage.setItem(LOG_KEY, JSON.stringify(parsed));
    } catch (e) {
        console.warn('appendLog error', e);
    }
};

export const clearLog = async () => {
    try {
        await AsyncStorage.removeItem(LOG_KEY);
    } catch (e) {
        console.warn('clearLog error', e);
    }
};
