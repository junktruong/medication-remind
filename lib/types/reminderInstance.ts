export type ReminderInstanceStatus = 'pending' | 'taken' | 'overdue';

export interface ReminderInstance {
    id?: string;
    familyId?: string;
    medicationId: string;
    medicationName?: string;
    scheduleId: string;
    dueAt: string;
    status?: ReminderInstanceStatus;
    takenAt?: string;
}

export interface ReminderInstanceResponse {
    items: ReminderInstance[];
    serverTime?: string;
}

