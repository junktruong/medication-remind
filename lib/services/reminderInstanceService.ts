import { apiFetch } from './apiClient';
import { ReminderInstance, ReminderInstanceResponse } from '../types/reminderInstance';

export type CreateReminderInstanceInput = {
    familyId: string;
    medicationId: string;
    medicationName?: string;
    scheduleId: string;
    dueAt: string;
};

export const createReminderInstance = async (
    input: CreateReminderInstanceInput,
): Promise<ReminderInstance> => {
    return apiFetch<ReminderInstance>('/api/reminder-instances', { method: 'POST', body: input });
};

export const fetchReminderInstances = async (
    familyId: string,
    since?: string | null,
): Promise<ReminderInstanceResponse> => {
    return apiFetch<ReminderInstanceResponse>('/api/reminder-instances', {
        method: 'GET',
        query: { familyId, since: since ?? undefined },
    });
};

export const markReminderInstanceTaken = async (
    instanceId: string,
): Promise<ReminderInstance> => {
    return apiFetch<ReminderInstance>(`/api/reminder-instances/${instanceId}/taken`, { method: 'PATCH' });
};

export const markReminderInstanceTakenByKey = async (
    payload: Pick<CreateReminderInstanceInput, 'scheduleId' | 'dueAt' | 'familyId'>,
): Promise<ReminderInstance> => {
    return apiFetch<ReminderInstance>('/api/reminder-instances/taken', {
        method: 'PATCH',
        body: payload,
    });
};

export const nudgeParent = async (instanceId: string, message?: string) => {
    return apiFetch(`/api/reminder-instances/${instanceId}/nudge-parent`, {
        method: 'POST',
        body: message ? { message } : undefined,
    });
};

