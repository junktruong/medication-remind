import AsyncStorage from '@react-native-async-storage/async-storage';

const CHILD_PHONE_KEY = '@contact:child-phone';

export const saveChildPhone = async (phone: string) => {
    try {
        await AsyncStorage.setItem(CHILD_PHONE_KEY, phone);
    } catch (error) {
        console.warn('saveChildPhone error', error);
    }
};

export const loadChildPhone = async (): Promise<string | null> => {
    try {
        const stored = await AsyncStorage.getItem(CHILD_PHONE_KEY);
        return stored ?? null;
    } catch (error) {
        console.warn('loadChildPhone error', error);
        return null;
    }
};

export const clearChildPhone = async () => {
    try {
        await AsyncStorage.removeItem(CHILD_PHONE_KEY);
    } catch (error) {
        console.warn('clearChildPhone error', error);
    }
};
