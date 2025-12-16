import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../lib/components/PrimaryButton';
import { useSession } from '../lib/context/SessionContext';
import { colors, fontSize, radius, spacing } from '../lib/design/tokens';

export default function ChildScreen() {
    const { reset } = useSession();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Chế độ dành cho con</Text>
                    <Text style={styles.subtitle}>Tính năng sẽ được cập nhật. Hãy báo cho bố/mẹ khi cần hỗ trợ.</Text>

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
});

