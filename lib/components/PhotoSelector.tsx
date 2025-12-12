// src/components/PhotoSelector.tsx
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    uri?: string;
    onChange: (uri?: string) => void;
}

const PhotoSelector: React.FC<Props> = ({ uri, onChange }) => {
    const requestPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted' && lib.status === 'granted';
    };

    const pickFromLibrary = async () => {
        const ok = await requestPermission();
        if (!ok) return Alert.alert('Lỗi', 'Bạn chưa cấp quyền truy cập ảnh.');

        const res = await ImagePicker.launchImageLibraryAsync({
            quality: 0.7,
            allowsEditing: true,
        });
        if (!res.canceled) onChange(res.assets[0].uri);
    };

    const pickFromCamera = async () => {
        const ok = await requestPermission();
        if (!ok) return Alert.alert('Lỗi', 'Bạn chưa cấp quyền camera.');

        const res = await ImagePicker.launchCameraAsync({
            quality: 0.7,
            allowsEditing: true,
        });
        if (!res.canceled) onChange(res.assets[0].uri);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Ảnh thuốc</Text>

            {uri ? (
                <Image source={{ uri: uri }} style={styles.image} />
            ) : (
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>Chưa có ảnh</Text>
                </View>
            )}

            <View style={styles.row}>
                <TouchableOpacity style={styles.btn} onPress={pickFromCamera}>
                    <Text style={styles.btnText}>Chụp ảnh</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btn} onPress={pickFromLibrary}>
                    <Text style={styles.btnText}>Chọn ảnh</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginVertical: 18, gap: 10 },
    label: { fontSize: 18, marginBottom: 4, color: '#0f172a', fontWeight: '700' },
    image: { width: '100%', height: 220, borderRadius: 14, marginBottom: 6 },
    placeholder: {
        width: '100%',
        height: 220,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        backgroundColor: '#f8fafc',
    },
    placeholderText: { color: '#94a3b8', fontSize: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    btn: {
        flex: 1,
        backgroundColor: '#0f172a',
        paddingVertical: 14,
        borderRadius: 12,
    },
    btnText: { color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 },
});

export default PhotoSelector;
