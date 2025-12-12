// src/utils/timeUtils.ts

function pad2(n: number): string {
    return n.toString().padStart(2, '0');
}

export function formatTime(hour: number, minute: number): string {
    return `${pad2(hour)}:${pad2(minute)}`;
}

export function sortSchedules<T extends { hour: number; minute: number }>(
    schedules: T[]
): T[] {
    return [...schedules].sort((a, b) => {
        if (a.hour !== b.hour) return a.hour - b.hour;
        return a.minute - b.minute;
    });
}
