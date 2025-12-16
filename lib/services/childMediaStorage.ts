import AsyncStorage from '@react-native-async-storage/async-storage';

const CHILD_PHOTO_KEY = '@child:photo-uri';
const CHILD_AUDIO_KEY = '@child:audio-uri';

export const saveChildPhotoUri = async (uri: string) => {
    try {
        await AsyncStorage.setItem(CHILD_PHOTO_KEY, uri);
    } catch (error) {
        console.warn('saveChildPhotoUri error', error);
    }
};

export const loadChildPhotoUri = async (): Promise<string | null> => {
    try {
        const stored = await AsyncStorage.getItem(CHILD_PHOTO_KEY);
        return stored ?? null;
    } catch (error) {
        console.warn('loadChildPhotoUri error', error);
        return null;
    }
};

export const saveChildAudioUri = async (uri: string) => {
    try {
        await AsyncStorage.setItem(CHILD_AUDIO_KEY, uri);
    } catch (error) {
        console.warn('saveChildAudioUri error', error);
    }
};

export const loadChildAudioUri = async (): Promise<string | null> => {
    try {
        const stored = await AsyncStorage.getItem(CHILD_AUDIO_KEY);
        return stored ?? null;
    } catch (error) {
        console.warn('loadChildAudioUri error', error);
        return null;
    }
};

export const clearChildMedia = async () => {
    try {
        await AsyncStorage.multiRemove([CHILD_PHOTO_KEY, CHILD_AUDIO_KEY]);
    } catch (error) {
        console.warn('clearChildMedia error', error);
    }
};
