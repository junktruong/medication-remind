// app/_layout.tsx
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { MedicationProvider } from '../lib/context/MedicationContext';
import { SessionProvider, useSession } from '../lib/context/SessionContext';
import { ReminderInstanceProvider } from '../lib/context/ReminderInstanceContext';
import { ensurePushTokenRegistered } from '../lib/services/notificationService';

const RootNavigation = () => {
  const router = useRouter();
  const segments = useSegments();
  const { role, loading } = useSession();
  const keepAwakeActiveRef = useRef(false);

  useEffect(() => {
    activateKeepAwakeAsync()
      .then(() => {
        keepAwakeActiveRef.current = true;
      })
      .catch((error) => {
        console.warn('Unable to activate keep awake. Continuing without it.', error);
      });

    return () => {
      if (keepAwakeActiveRef.current) {
        deactivateKeepAwake().catch((error) => {
          console.warn('Unable to deactivate keep awake.', error);
        });
      }
    };
  }, []);

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

  useEffect(() => {
    if (loading) return;

    ensurePushTokenRegistered().catch(() => undefined);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        ensurePushTokenRegistered().catch(() => undefined);
      }
    });

    return () => subscription.remove();
  }, [loading]);

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
        <ReminderInstanceProvider>
          <RootNavigation />
        </ReminderInstanceProvider>
      </MedicationProvider>
    </SessionProvider>
  );
}
