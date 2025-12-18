// app/lib/types/medication.ts

// Thứ trong tuần: 0 = Chủ nhật, 1 = Thứ 2, ... 6 = Thứ 7
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface MedicationSchedule {
    scheduleId: string;           // UUID/nanoid ổn định cho schedule
    hour: number;                 // Giờ uống (0–23)
    minute: number;               // Phút uống (0–59)
    daysOfWeek: Weekday[];        // Những ngày uống trong tuần
    notificationIds?: string[];   // ID thông báo đã tạo (nếu có)
}

export interface Medication {
    id: string;                   // UUID hoặc id bất kỳ
    name: string;                 // Tên thuốc
    dosage: string;               // Liều lượng
    notes?: string;               // Ghi chú thêm
    photoUri?: string;            // Ảnh thuốc (nếu có)
    schedules: MedicationSchedule[]; // Danh sách lịch uống
    enabled: boolean;             // Đang bật nhắc hay không
    createdAt: number;            // Timestamp tạo
}

export type {
    Medication as TMedication,
    MedicationSchedule as TMedicationSchedule,
    Weekday as TWeekday
};

