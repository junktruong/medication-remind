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
    container: { marginVertical: 16 },
    label: { fontSize: 14, marginBottom: 6, color: '#333' },
    image: { width: '100%', height: 180, borderRadius: 8, marginBottom: 10 },
    placeholder: {
        width: '100%',
        height: 180,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    placeholderText: { color: '#888' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    btn: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    btnText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});

export default PhotoSelector;
