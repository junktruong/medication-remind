// app/_layout.tsx
import * as Notifications from 'expo-notifications';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { MedicationProvider } from '../lib/context/MedicationContext';
import { SessionProvider, useSession } from '../lib/context/SessionContext';
import { ReminderInstanceProvider } from '../lib/context/ReminderInstanceContext';
import { ensurePushTokenRegistered } from '../lib/services/notificationService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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

  useEffect(() => {
    if (loading || role !== 'parent') return;

    const navigateToReminder = (data: Notifications.NotificationContent['data']) => {
      const medicationId = typeof data?.medicationId === 'string' ? data.medicationId : undefined;
      if (!medicationId) return;

      router.push({ pathname: '/reminder', params: { id: medicationId } });
    };

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) navigateToReminder(response.notification.request.content.data);
      })
      .catch(() => undefined);

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      navigateToReminder(notification.request.content.data);
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateToReminder(response.notification.request.content.data);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [loading, role, router]);

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
