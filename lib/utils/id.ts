// lib/utils/id.ts

export const generateStableId = (prefix = 'id'): string => {
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${Date.now().toString(36)}-${random}`;
};

