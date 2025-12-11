// App.tsx
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MedicationProvider } from './src/context/MedicationContext';
import MedicationListScreen from './src/screens/MedicationListScreen';
import MedicationFormScreen from './src/screens/MedicationFormScreen';
import { RootStackParamList } from './src/types';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
    useEffect(() => {
        const setupNotifications = async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission for notifications not granted');
            }

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                });
            }
        };

        setupNotifications();
    }, []);

    return (
        <MedicationProvider>
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen
                        name="MedicationList"
                        component={MedicationListScreen}
                        options={{ title: 'Nhắc uống thuốc' }}
                    />
                    <Stack.Screen
                        name="MedicationForm"
                        component={MedicationFormScreen}
                        options={{ title: 'Thêm / sửa thuốc' }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </MedicationProvider>
    );
}
