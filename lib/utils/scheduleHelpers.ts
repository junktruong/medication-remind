import { Medication, MedicationSchedule } from '../types/medication';

const getWeekday = (date: Date) => date.getDay() as MedicationSchedule['daysOfWeek'][number];

export const matchesDay = (schedule: MedicationSchedule, date: Date) => {
    if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) return true;
    return schedule.daysOfWeek.includes(getWeekday(date));
};

const findNextOccurrence = (schedule: MedicationSchedule, from = new Date()): Date | null => {
    for (let offset = 0; offset < 7; offset++) {
        const candidate = new Date(from);
        candidate.setDate(from.getDate() + offset);
        candidate.setHours(schedule.hour, schedule.minute, 0, 0);

        if (!matchesDay(schedule, candidate)) continue;
        if (candidate.getTime() <= from.getTime()) continue;

        return candidate;
    }
    return null;
};

export const countTodayDoses = (medications: Medication[], today = new Date()): number => {
    return medications.reduce((count, med) => {
        if (!med.enabled) return count;
        const daily = med.schedules?.filter((schedule) => matchesDay(schedule, today)).length || 0;
        return count + daily;
    }, 0);
};

export type NextDoseInfo = {
    medication: Medication;
    schedule: MedicationSchedule;
    date: Date;
};

export type TodayDoseInfo = NextDoseInfo;

export const getNextDose = (medications: Medication[], from = new Date()): NextDoseInfo | null => {
    let closest: NextDoseInfo | null = null;

    medications.forEach((med) => {
        if (!med.enabled) return;
        med.schedules?.forEach((schedule) => {
            const next = findNextOccurrence(schedule, from);
            if (!next) return;

            if (!closest || next.getTime() < closest.date.getTime()) {
                closest = { medication: med, schedule, date: next };
            }
        });
    });

    return closest;
};

export const getTodayDoses = (medications: Medication[], today = new Date()): TodayDoseInfo[] => {
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const entries: TodayDoseInfo[] = [];

    medications.forEach((medication) => {
        if (!medication.enabled) return;
        medication.schedules?.forEach((schedule) => {
            if (!matchesDay(schedule, today)) return;
            const doseTime = new Date(startOfDay);
            doseTime.setHours(schedule.hour, schedule.minute, 0, 0);
            entries.push({ medication, schedule, date: doseTime });
        });
    });

    return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};
