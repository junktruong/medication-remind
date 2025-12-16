import AsyncStorage from '@react-native-async-storage/async-storage';

const ADHERENCE_LOG_KEY = '@adherence:log';
const SNOOZE_STATE_KEY = '@adherence:snooze';

export type AdherenceAction = 'taken' | 'snooze' | 'call' | 'verify';

export type AdherenceEntry = {
    id: string;
    medicationId?: string;
    medicationName?: string;
    timestamp: number;
    action: AdherenceAction;
    scheduleTime?: number;
    note?: string;
};

export type SnoozeState = Record<string, number>;

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const loadAdherenceLog = async (): Promise<AdherenceEntry[]> => {
    try {
        const stored = await AsyncStorage.getItem(ADHERENCE_LOG_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('loadAdherenceLog error', error);
        return [];
    }
};

export const logAdherenceEvent = async (entry: Omit<AdherenceEntry, 'id'>) => {
    try {
        const existing = await loadAdherenceLog();
        const record: AdherenceEntry = { ...entry, id: generateId() };
        const updated = [...existing, record];
        await AsyncStorage.setItem(ADHERENCE_LOG_KEY, JSON.stringify(updated));
        return record;
    } catch (error) {
        console.warn('logAdherenceEvent error', error);
        return null;
    }
};

export const getLatestAdherence = async (action?: AdherenceAction): Promise<AdherenceEntry | null> => {
    const log = await loadAdherenceLog();
    const filtered = action ? log.filter((entry) => entry.action === action) : log;
    if (!filtered.length) return null;
    return filtered.reduce((latest, entry) => (entry.timestamp > latest.timestamp ? entry : latest));
};

export const loadSnoozeState = async (): Promise<SnoozeState> => {
    try {
        const stored = await AsyncStorage.getItem(SNOOZE_STATE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.warn('loadSnoozeState error', error);
        return {};
    }
};

export const setSnoozeUntil = async (medicationId: string, timestamp: number) => {
    const state = await loadSnoozeState();
    const updated = { ...state, [medicationId]: timestamp };
    await AsyncStorage.setItem(SNOOZE_STATE_KEY, JSON.stringify(updated));
};

export const clearSnoozeState = async (medicationId: string) => {
    const state = await loadSnoozeState();
    if (state[medicationId]) {
        delete state[medicationId];
        await AsyncStorage.setItem(SNOOZE_STATE_KEY, JSON.stringify(state));
    }
};

export const isSnoozed = async (medicationId?: string): Promise<boolean> => {
    if (!medicationId) return false;
    const state = await loadSnoozeState();
    const until = state[medicationId];
    return typeof until === 'number' && until > Date.now();
};
