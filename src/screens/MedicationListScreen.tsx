// src/screens/MedicationListScreen.tsx
import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useMedication } from '../context/MedicationContext';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicationList'>;

const MedicationListScreen: React.FC<Props> = ({ navigation }) => {
    const { medications, deleteMedication } = useMedication();

    const handleDelete = (id: string) => {
        Alert.alert('Xoá thuốc', 'Bạn có chắc muốn xoá thuốc này?', [
            { text: 'Huỷ', style: 'cancel' },
            {
                text: 'Xoá',
                style: 'destructive',
                onPress: () => deleteMedication(id),
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={medications}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        Chưa có thuốc nào. Nhấn nút + để thêm.
                    </Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigation.navigate('MedicationForm', { id: item.id })}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{item.name}</Text>
                            {item.dosage ? (
                                <Text style={styles.dosage}>Liều: {item.dosage}</Text>
                            ) : null}
                            <Text style={styles.time}>Giờ uống: {item.time}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDelete(item.id)}
                        >
                            <Text style={styles.deleteText}>Xoá</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('MedicationForm')}
            >
                <Text style={styles.fabText}>＋</Text>
            </TouchableOpacity>
        </View>
    );
};

export default MedicationListScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 32,
        color: '#666',
    },
    item: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        marginBottom: 12,
        alignItems: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    dosage: {
        fontSize: 14,
        color: '#555',
    },
    time: {
        marginTop: 4,
        fontSize: 14,
        color: '#333',
    },
    deleteButton: {
        marginLeft: 12,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#ff4d4f',
        borderRadius: 8,
    },
    deleteText: {
        color: '#fff',
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 32,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    fabText: {
        color: '#fff',
        fontSize: 30,
        lineHeight: 30,
    },
});
