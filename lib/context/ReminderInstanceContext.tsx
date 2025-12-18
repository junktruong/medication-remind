import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useMedications } from './MedicationContext';
import { useSession } from './SessionContext';
import { createReminderInstance, fetchReminderInstances, markReminderInstanceTaken, markReminderInstanceTakenByKey } from '../services/reminderInstanceService';
import { getDeviceCredentials } from '../services/deviceCredentials';
import { getLastServerTime, setLastServerTime } from '../services/syncState';
import { DueEvent, getDueEventsWithinWindow } from '../utils/scheduleHelpers';
import { ReminderInstance } from '../types/reminderInstance';

type ReminderContextValue = {
    instances: ReminderInstance[];
    syncInstances: () => Promise<void>;
    ensureDueInstances: (now?: number) => Promise<void>;
    markTaken: (payload: {
        instanceId?: string;
        scheduleId: string;
        dueAt: string;
        medicationId?: string;
        medicationName?: string;
    }) => Promise<void>;
};

const ReminderInstanceContext = createContext<ReminderContextValue | undefined>(undefined);

const FOREGROUND_INTERVAL = 5000;
const BACKGROUND_INTERVAL = 30000;
const PAST_WINDOW = 2 * 60 * 60 * 1000;
const FUTURE_WINDOW = 60 * 60 * 1000;

const buildKey = (scheduleId: string, dueAt: string) => `${scheduleId}:${dueAt}`;

export const ReminderInstanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { medications } = useMedications();
    const { role } = useSession();
    const [instances, setInstances] = useState<ReminderInstance[]>([]);
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
    const knownKeysRef = useRef<Set<string>>(new Set());
    const lastCheckRef = useRef<number>(Date.now());

    const loadCredentials = useCallback(async () => {
        return getDeviceCredentials();
    }, []);

    const mergeInstances = useCallback((items: ReminderInstance[]) => {
        setInstances((prev) => {
            const map = new Map<string, ReminderInstance>();

            const add = (item: ReminderInstance) => {
                const key = item.id ? `id:${item.id}` : buildKey(item.scheduleId, item.dueAt);
                const existing = map.get(key) ?? prev.find((p) => (p.id ? `id:${p.id}` : buildKey(p.scheduleId, p.dueAt)) === key);
                map.set(key, { ...existing, ...item });
                knownKeysRef.current.add(buildKey(item.scheduleId, item.dueAt));
            };

            prev.forEach(add);
            items.forEach(add);

            return Array.from(map.values());
        });
    }, []);

    const syncInstances = useCallback(async () => {
        if (role !== 'parent') return;
        const creds = await loadCredentials();
        if (!creds.familyId) return;

        const since = await getLastServerTime('reminderInstances');
        const response = await fetchReminderInstances(creds.familyId, since ?? undefined);
        await setLastServerTime('reminderInstances', response.serverTime);
        mergeInstances(response.items ?? []);
    }, [loadCredentials, mergeInstances, role]);

    const createInstancesForEvents = useCallback(
        async (events: DueEvent[], familyId: string) => {
            for (const event of events) {
                const key = buildKey(event.scheduleId, event.dueAt);
                if (knownKeysRef.current.has(key)) continue;

                try {
                    const created = await createReminderInstance({
                        ...event,
                        familyId,
                    });
                    mergeInstances([created]);
                } catch (error) {
                    console.warn('createReminderInstance error', error);
                }
            }
        },
        [mergeInstances],
    );

    const ensureDueInstances = useCallback(async (now = Date.now()) => {
        if (role !== 'parent') return;
        const creds = await loadCredentials();
        if (!creds.familyId) return;

        const events = getDueEventsWithinWindow(
            medications,
            now - PAST_WINDOW,
            now + FUTURE_WINDOW,
        ).filter((event) => new Date(event.dueAt).getTime() <= now);

        await createInstancesForEvents(events, creds.familyId);
        lastCheckRef.current = now;
    }, [createInstancesForEvents, loadCredentials, medications, role]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            setAppState(nextState);
            if (nextState === 'active') {
                const now = Date.now();
                ensureDueInstances(now).catch(() => undefined);
                syncInstances().catch(() => undefined);
            }
        });

        return () => subscription.remove();
    }, [ensureDueInstances, syncInstances]);

    useEffect(() => {
        if (role !== 'parent') return;
        syncInstances().catch(() => undefined);
        ensureDueInstances(Date.now()).catch(() => undefined);
    }, [ensureDueInstances, role, syncInstances]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (role !== 'parent') return;
            const now = Date.now();
            syncInstances().catch(() => undefined);
            const windowMs = appState === 'active' ? FOREGROUND_INTERVAL : BACKGROUND_INTERVAL;
            if (now - lastCheckRef.current >= windowMs) {
                ensureDueInstances(now).catch(() => undefined);
            }
        }, appState === 'active' ? FOREGROUND_INTERVAL : BACKGROUND_INTERVAL);

        return () => clearInterval(interval);
    }, [appState, ensureDueInstances, role, syncInstances]);

    const markTaken = useCallback(async (payload: {
        instanceId?: string;
        scheduleId: string;
        dueAt: string;
        medicationId?: string;
        medicationName?: string;
    }) => {
        const creds = await loadCredentials();
        if (!creds.familyId) return;

        try {
            const updated = payload.instanceId
                ? await markReminderInstanceTaken(payload.instanceId)
                : await markReminderInstanceTakenByKey({
                    scheduleId: payload.scheduleId,
                    dueAt: payload.dueAt,
                    familyId: creds.familyId,
                });
            mergeInstances([updated]);
        } catch (error) {
            console.warn('markTaken error', error);
        }
    }, [loadCredentials, mergeInstances]);

    const value = useMemo(() => ({
        instances,
        syncInstances,
        ensureDueInstances,
        markTaken,
    }), [ensureDueInstances, instances, markTaken, syncInstances]);

    return <ReminderInstanceContext.Provider value={value}>{children}</ReminderInstanceContext.Provider>;
};

export const useReminderInstances = () => {
    const ctx = useContext(ReminderInstanceContext);
    if (!ctx) throw new Error('useReminderInstances must be used within ReminderInstanceProvider');
    return ctx;
};

