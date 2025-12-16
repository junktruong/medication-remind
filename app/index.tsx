// app/index.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MedicationCard from '../lib/components/MedicationCard';
import { useMedications } from '../lib/context/MedicationContext';

export default function HomeScreen() {
    const router = useRouter();
    const { medications, toggleEnabled } = useMedications();

    const openCreateForm = () => {
        router.push('/medication/form'); // mode tạo mới
    };

    const openEditForm = (id: string) => {
        router.push({ pathname: '/medication/form', params: { id } });
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={medications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <MedicationCard
                        medication={item}
                        onPress={() => openEditForm(item.id)}
                        onToggleEnabled={(medId, enabled) => toggleEnabled(medId, enabled)}
                    />
                )}
                contentContainerStyle={{ padding: 16 }}
            />

            <TouchableOpacity style={styles.fab} onPress={openCreateForm}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
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
        fontSize: 32,
        marginTop: -2,
    },
});
