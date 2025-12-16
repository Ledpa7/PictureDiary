"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ko' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const savedLang = localStorage.getItem('app-language') as Language;
            if (savedLang && (savedLang === 'ko' || savedLang === 'en')) {
                setLanguageState(savedLang);
            }
        } catch (e) {
            console.error('Failed to load language', e);
        }
        setIsLoaded(true);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app-language', lang);
    };

    // Minimal translation helper for common terms
    const t = (key: string) => {
        // This is a placeholder. Real implementation would likely look up from a dict.
        // For now, consumers might just use 'language' directly.
        return key;
    };

    // if (!isLoaded) {
    //     return null; 
    // }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
