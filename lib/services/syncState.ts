import AsyncStorage from '@react-native-async-storage/async-storage';

type SyncKey = 'medications' | 'reminderInstances';

const SERVER_TIME_KEY_PREFIX = '@sync:serverTime:';

export const getLastServerTime = async (key: SyncKey): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(`${SERVER_TIME_KEY_PREFIX}${key}`);
    } catch (error) {
        console.warn('getLastServerTime error', error);
        return null;
    }
};

export const setLastServerTime = async (key: SyncKey, serverTime?: string | number | null) => {
    if (!serverTime) return;
    try {
        await AsyncStorage.setItem(`${SERVER_TIME_KEY_PREFIX}${key}`, String(serverTime));
    } catch (error) {
        console.warn('setLastServerTime error', error);
    }
};

