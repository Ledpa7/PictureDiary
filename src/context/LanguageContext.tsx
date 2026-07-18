"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ko' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ 
    children, 
    defaultLanguage = 'en' 
}: { 
    children: React.ReactNode; 
    defaultLanguage?: Language; 
}) {
    const [language, setLanguageState] = useState<Language>(defaultLanguage);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const savedLang = localStorage.getItem('app-language') as Language;
            if (savedLang && (savedLang === 'ko' || savedLang === 'en')) {
                setLanguageState(savedLang);
                document.cookie = `app-language=${savedLang}; path=/; max-age=31536000; SameSite=Lax`;
            } else {
                const cookieLang = typeof document !== 'undefined' ? document.cookie
                    .split('; ')
                    .find(row => row.startsWith('app-language='))
                    ?.split('=')[1] as Language : null;
                if (cookieLang && (cookieLang === 'ko' || cookieLang === 'en')) {
                    setLanguageState(cookieLang);
                    localStorage.setItem('app-language', cookieLang);
                } else {
                    document.cookie = 'app-language=en; path=/; max-age=31536000; SameSite=Lax';
                }
            }
        } catch (e) {
            console.error('Failed to load language', e);
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        
        const updateTitle = () => {
            const currentTitle = document.title;
            if (language === 'en') {
                if (currentTitle.includes("두들로그 - Doodle Log")) {
                    document.title = currentTitle.replace("두들로그 - Doodle Log", "Doodle Log");
                }
            } else if (language === 'ko') {
                if (currentTitle.includes("Doodle Log") && !currentTitle.includes("두들로그")) {
                    document.title = currentTitle.replace("Doodle Log", "두들로그 - Doodle Log");
                }
            }
        };

        updateTitle();

        const titleEl = document.querySelector('title');
        if (titleEl) {
            const observer = new MutationObserver(() => {
                updateTitle();
            });
            observer.observe(titleEl, { childList: true });
            return () => observer.disconnect();
        }
    }, [language, isLoaded]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app-language', lang);
        document.cookie = `app-language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
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
