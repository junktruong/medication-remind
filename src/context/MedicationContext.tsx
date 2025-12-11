// src/context/MedicationContext.tsx
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import * as Notifications from 'expo-notifications';
import { Medication, MedicationInput } from '../types';
import { loadMedications, saveMedications } from '../storage/medicationStorage';

type MedicationContextValue = {
    medications: Medication[];
    addMedication: (input: MedicationInput) => Promise<void>;
    updateMedication: (id: string, input: MedicationInput) => Promise<void>;
    deleteMedication: (id: string) => Promise<void>;
};

const MedicationContext = createContext<MedicationContextValue | undefined>(
    undefined
);

export const useMedication = (): MedicationContextValue => {
    const ctx = useContext(MedicationContext);
    if (!ctx) {
        throw new Error('useMedication must be used within MedicationProvider');
    }
    return ctx;
};

const scheduleDailyNotification = async (
    med: MedicationInput
): Promise<string | undefined> => {
    try {
        const [hourStr, minuteStr] = med.time.split(':');
        const hour = Number(hourStr);
        const minute = Number(minuteStr);

        if (Number.isNaN(hour) || Number.isNaN(minute)) {
            console.warn('Invalid time format, expected HH:mm');
            return undefined;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: `Đến giờ uống thuốc: ${med.name}`,
                body: med.dosage ? `Liều dùng: ${med.dosage}` : 'Nhớ uống thuốc nhé!',
            },
            trigger: {
                hour,
                minute,

                // 👇 Cái này là chìa khóa, nếu thiếu nhiều bản Expo sẽ bắn ngay lập tức thay vì schedule
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                // optional: dùng giờ local
                // useUTC: false,
            },
        });

        return notificationId;
    } catch (err) {
        console.error('Failed to schedule notification', err);
        return undefined;
    }
};

interface Props {
    children: ReactNode;
}

export const MedicationProvider: React.FC<Props> = ({ children }) => {
    const [medications, setMedications] = useState<Medication[]>([]);

    // Load dữ liệu từ AsyncStorage
    useEffect(() => {
        (async () => {
            const data = await loadMedications();
            setMedications(data);
        })();
    }, []);

    // Mỗi lần medications đổi thì lưu lại
    useEffect(() => {
        saveMedications(medications);
    }, [medications]);

    const addMedication = async (input: MedicationInput) => {
        const notificationId = await scheduleDailyNotification(input);

        const newMed: Medication = {
            id: Date.now().toString(),
            name: input.name.trim(),
            dosage: input.dosage.trim(),
            time: input.time.trim(),
            notificationId,
        };

        setMedications(prev => [...prev, newMed]);
    };

    const updateMedication = async (id: string, input: MedicationInput) => {
        setMedications(prev =>
            prev.map(med => {
                if (med.id !== id) return med;
                return {
                    ...med,
                    name: input.name.trim(),
                    dosage: input.dosage.trim(),
                    time: input.time.trim(),
                };
            })
        );

        // Hủy thông báo cũ + tạo lại
        const oldMed = medications.find(m => m.id === id);
        if (oldMed?.notificationId) {
            try {
                await Notifications.cancelScheduledNotificationAsync(
                    oldMed.notificationId
                );
            } catch (err) {
                console.error('Failed to cancel old notification', err);
            }
        }

        const newNotificationId = await scheduleDailyNotification(input);

        setMedications(prev =>
            prev.map(med =>
                med.id === id
                    ? {
                        ...med,
                        notificationId: newNotificationId,
                    }
                    : med
            )
        );
    };

    const deleteMedication = async (id: string) => {
        const med = medications.find(m => m.id === id);
        if (med?.notificationId) {
            try {
                await Notifications.cancelScheduledNotificationAsync(
                    med.notificationId
                );
            } catch (err) {
                console.error('Failed to cancel notification on delete', err);
            }
        }

        setMedications(prev => prev.filter(m => m.id !== id));
    };

    return (
        <MedicationContext.Provider
            value={{ medications, addMedication, updateMedication, deleteMedication }
            }
        >
            {children}
        </MedicationContext.Provider>
    );
};
