// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { MedicationProvider } from '../lib/context/MedicationContext';
import { SessionProvider, useSession } from '../lib/context/SessionContext';

const RootNavigation = () => {
  const router = useRouter();
  const segments = useSegments();
  const { role, loading } = useSession();

  useEffect(() => {
    if (loading) return;

    const isRoleScreen = segments[0] === 'role';
    const isChildArea = segments[0] === 'child';

    if (!role && !isRoleScreen) {
      router.replace('/role');
      return;
    }

    if (role === 'parent' && isRoleScreen) {
      router.replace('/');
      return;
    }

    if (role === 'child' && !isChildArea) {
      router.replace('/child');
    }
  }, [loading, role, router, segments]);

  if (loading) return null;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Nhắc uống thuốc', headerShown: false }}
      />
      <Stack.Screen
        name="role"
        options={{ title: 'Chọn chế độ', headerShown: false }}
      />
      <Stack.Screen
        name="child"
        options={{ title: 'Chế độ của con', headerShown: false }}
      />
      <Stack.Screen
        name="reminder"
        options={{ title: 'Nhắc uống', headerShown: false }}
      />
      <Stack.Screen
        name="medication/form"
        options={{ title: 'Thêm/Sửa thuốc' }}
      />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <SessionProvider>
      <MedicationProvider>
        <RootNavigation />
      </MedicationProvider>
    </SessionProvider>
  );
}
