import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../lib/components/PrimaryButton';
import { useSession } from '../lib/context/SessionContext';
import { colors, fontSize, radius, spacing } from '../lib/design/tokens';
import { loadChildPhone, saveChildPhone } from '../lib/services/contactStorage';

export default function ChildScreen() {
    const { reset } = useSession();
    const [phone, setPhone] = useState('');
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    useEffect(() => {
        const loadPhone = async () => {
            const stored = await loadChildPhone();
            if (stored) {
                setPhone(stored);
                setLastSaved(stored);
            }
        };

        loadPhone();
    }, []);

    const handleSavePhone = async () => {
        const trimmed = phone.trim();
        if (!trimmed) {
            Alert.alert('Nhập số điện thoại', 'Hãy nhập số để bố/mẹ có thể gọi nhanh.');
            return;
        }

        await saveChildPhone(trimmed);
        setLastSaved(trimmed);
        Alert.alert('Đã lưu số', 'Bố/mẹ sẽ gọi được cho con ngay từ màn hình nhắc.');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Chế độ dành cho con</Text>
                    <Text style={styles.subtitle}>Tính năng sẽ được cập nhật. Hãy báo cho bố/mẹ khi cần hỗ trợ.</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Số điện thoại của con</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Ví dụ: 0912 345 678"
                            keyboardType="phone-pad"
                        />
                        {lastSaved ? (
                            <Text style={styles.helper}>Đã lưu: {lastSaved}</Text>
                        ) : (
                            <Text style={styles.helper}>Lưu số để bố/mẹ bấm GỌI CON nhanh.</Text>
                        )}

                        <PrimaryButton title="Lưu số cho bố/mẹ" onPress={handleSavePhone} />
                    </View>

                    <PrimaryButton title="Quay lại chọn vai trò" onPress={reset} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    container: {
        flex: 1,
        padding: spacing.xl,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        gap: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: '800',
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSize.md,
        color: colors.muted,
        lineHeight: 22,
    },
    inputGroup: {
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    label: {
        fontSize: fontSize.md,
        fontWeight: '700',
        color: colors.text,
    },
    input: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.lg,
        backgroundColor: '#fff',
    },
    helper: {
        color: colors.muted,
        fontSize: fontSize.sm,
    },
});

