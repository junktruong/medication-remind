// src/types.ts
export interface Medication {
    id: string;
    name: string;
    dosage: string;
    time: string; // 'HH:mm'
    notificationId?: string;
}

export type MedicationInput = {
    name: string;
    dosage: string;
    time: string;
};

export type RootStackParamList = {
    MedicationList: undefined;
    MedicationForm: { id?: string } | undefined;
};
