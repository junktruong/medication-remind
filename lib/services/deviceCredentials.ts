import AsyncStorage from '@react-native-async-storage/async-storage';

export type DeviceCredentials = {
    familyId?: string | null;
    deviceId?: string | null;
    deviceSecret?: string | null;
};

const FAMILY_ID_KEY = 'secure:familyId';
const DEVICE_ID_KEY = 'secure:deviceId';
const DEVICE_SECRET_KEY = 'secure:deviceSecret';

export const saveDeviceCredentials = async (creds: DeviceCredentials) => {
    if (creds.familyId) await AsyncStorage.setItem(FAMILY_ID_KEY, creds.familyId);
    if (creds.deviceId) await AsyncStorage.setItem(DEVICE_ID_KEY, creds.deviceId);
    if (creds.deviceSecret) await AsyncStorage.setItem(DEVICE_SECRET_KEY, creds.deviceSecret);
};

export const getDeviceCredentials = async (): Promise<DeviceCredentials> => {
    const [familyId, deviceId, deviceSecret] = await Promise.all([
        AsyncStorage.getItem(FAMILY_ID_KEY),
        AsyncStorage.getItem(DEVICE_ID_KEY),
        AsyncStorage.getItem(DEVICE_SECRET_KEY),
    ]);

    return { familyId, deviceId, deviceSecret };
};

export const clearDeviceCredentials = async () => {
    await Promise.all([
        AsyncStorage.removeItem(FAMILY_ID_KEY),
        AsyncStorage.removeItem(DEVICE_ID_KEY),
        AsyncStorage.removeItem(DEVICE_SECRET_KEY),
    ]);
};

export const setFamilyId = async (familyId: string) => AsyncStorage.setItem(FAMILY_ID_KEY, familyId);

export const getFamilyId = async () => AsyncStorage.getItem(FAMILY_ID_KEY);

