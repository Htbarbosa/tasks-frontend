'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';

function getStoredValue<T>(key: string, initialValue: T): T {
    if (typeof window === 'undefined') {
        return initialValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        return initialValue;
    }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
    // State to store our value - use lazy initialization
    const [storedValue, setStoredValue] = useState<T>(() => getStoredValue(key, initialValue));

    // Track if component has mounted (for hydration)
    const isLoaded = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );

    // Return a wrapped version of useState's setter function that persists the new value to localStorage
    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                // Allow value to be a function so we have same API as useState
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);

                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key, storedValue]
    );

    return [storedValue, setValue, isLoaded] as const;
}
