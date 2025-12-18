import Constants from 'expo-constants';
import { getDeviceCredentials } from './deviceCredentials';

const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL || Constants?.expoConfig?.extra?.apiBaseUrl || '';

type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface ApiOptions<TBody = unknown> {
    method?: ApiMethod;
    body?: TBody;
    headers?: Record<string, string>;
    query?: Record<string, string | number | undefined>;
}

const buildUrl = (path: string, query?: Record<string, string | number | undefined>) => {
    if (path.startsWith('http')) {
        const url = new URL(path);
        Object.entries(query ?? {}).forEach(([key, value]) => {
            if (typeof value === 'undefined') return;
            url.searchParams.set(key, String(value));
        });
        return url.toString();
    }

    const base = API_BASE_URL || 'http://localhost:3000';
    const url = new URL(path, base);
    Object.entries(query ?? {}).forEach(([key, value]) => {
        if (typeof value === 'undefined') return;
        url.searchParams.set(key, String(value));
    });
    return url.toString();
};

export async function apiFetch<TResponse, TBody = unknown>(
    path: string,
    options: ApiOptions<TBody> = {},
): Promise<TResponse> {
    const { method = 'GET', body, headers, query } = options;
    const creds = await getDeviceCredentials();

    const mergedHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers ?? {}),
    };

    if (creds.deviceId) mergedHeaders['x-device-id'] = creds.deviceId;
    if (creds.deviceSecret) mergedHeaders['x-device-secret'] = creds.deviceSecret;

    const url = buildUrl(path, query);
    const response = await fetch(url, {
        method,
        headers: mergedHeaders,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API ${method} ${url} failed: ${response.status} ${errorText}`);
    }

    try {
        return (await response.json()) as TResponse;
    } catch (error) {
        return undefined as unknown as TResponse;
    }
}

