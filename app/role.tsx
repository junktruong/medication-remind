import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../lib/components/PrimaryButton';
import { colors, fontSize, radius, spacing } from '../lib/design/tokens';
import { useSession } from '../lib/context/SessionContext';

export default function RoleScreen() {
    const router = useRouter();
    const { setRole } = useSession();

    const chooseRole = async (role: 'child' | 'parent') => {
        await setRole(role);
        router.replace(role === 'parent' ? '/' : '/child');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Bạn đang dùng ứng dụng với vai trò?</Text>
                    <Text style={styles.subtitle}>Chọn 1 lần duy nhất, chúng tôi sẽ ghi nhớ cho những lần mở sau.</Text>

                    <PrimaryButton title="Tôi là Bố/Mẹ" onPress={() => chooseRole('parent')} />
                    <PrimaryButton title="Tôi là Con" onPress={() => chooseRole('child')} style={styles.secondary} />
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
    secondary: {
        backgroundColor: '#0ea5e9',
    },
});

