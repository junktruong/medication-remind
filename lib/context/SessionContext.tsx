// lib/context/SessionContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'child' | 'parent';

type SessionContextValue = {
    role: UserRole | null;
    loading: boolean;
    setRole: (nextRole: UserRole) => Promise<void>;
    reset: () => Promise<void>;
};

const STORAGE_KEY = '@session:role';

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRoleState] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRole = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored === 'child' || stored === 'parent') {
                    setRoleState(stored);
                }
            } catch (error) {
                console.error('loadRole error', error);
            } finally {
                setLoading(false);
            }
        };

        loadRole();
    }, []);

    const setRole = async (nextRole: UserRole) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, nextRole);
            setRoleState(nextRole);
        } catch (error) {
            console.error('setRole error', error);
        }
    };

    const reset = async () => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('resetRole error', error);
        } finally {
            setRoleState(null);
        }
    };

    const value = useMemo(() => ({ role, loading, setRole, reset }), [role, loading]);

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be used within SessionProvider');
    return ctx;
};

