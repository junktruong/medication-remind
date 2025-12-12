// app/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import { MedicationProvider } from '../lib/context/MedicationContext';

export default function RootLayout() {
  return (
    <MedicationProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ title: 'Nhắc uống thuốc' }}
        />
        <Stack.Screen
          name="medication/form"
          options={{ title: 'Thêm/Sửa thuốc' }}
        />
      </Stack>
    </MedicationProvider>
  );
}
