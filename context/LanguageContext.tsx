import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Language, translations } from '../services/i18n';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    // Default to English, or load from localStorage
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('synergy_language');
        return (saved as Language) || 'en';
    });

    useEffect(() => {
        localStorage.setItem('synergy_language', language);
    }, [language]);

    const t = (key: keyof typeof translations['en']) => {
        return translations[language][key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
