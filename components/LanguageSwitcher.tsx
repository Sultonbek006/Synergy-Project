import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'
                    }`}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage('uz')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${language === 'uz' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'
                    }`}
            >
                UZ
            </button>
            <button
                onClick={() => setLanguage('ru')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${language === 'ru' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'
                    }`}
            >
                RU
            </button>
        </div>
    );
};
