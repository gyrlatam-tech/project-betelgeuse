import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n';

interface LanguageSelectorProps {
  variant?: 'header' | 'auth' | 'compact';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage, languageInfo, supportedLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`} id="language-selector-container">
      {/* Trigger Button */}
      <button
        type="button"
        id="language-selector-button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={t('common.selectLanguage')}
        className={`inline-flex items-center justify-between gap-1.5 rounded-full border transition-all cursor-pointer select-none whitespace-nowrap shrink-0 ${
          variant === 'header'
            ? 'px-2.5 sm:px-3 py-1.5 bg-[#F4F5F0] hover:bg-[#E8F7DC] border-[#E2E6DF] hover:border-[#9FE870] text-[#0E0F0C] text-xs font-bold'
            : variant === 'auth'
            ? 'px-2.5 sm:px-3.5 py-1.5 sm:py-2 h-9 sm:h-11 bg-white hover:bg-[#F4F5F0] border-[#D4DACF] hover:border-[#163300] text-[#0E0F0C] text-xs sm:text-sm font-semibold shadow-2xs'
            : 'px-2.5 py-1 bg-[#F4F5F0] hover:bg-white border-[#E2E6DF] text-[#0E0F0C] text-xs font-semibold'
        }`}
      >
        <span className="text-base leading-none select-none shrink-0" aria-hidden="true">
          {languageInfo.flag}
        </span>
        <span className="font-bold tracking-tight uppercase whitespace-nowrap sm:hidden">
          {languageInfo.code}
        </span>
        <span className="font-bold tracking-tight uppercase whitespace-nowrap hidden sm:inline">
          {variant === 'compact' ? languageInfo.code : languageInfo.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#868685] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#163300]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="language-dropdown-menu"
          className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white border border-[#E2E6DF] shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right focus:outline-none"
        >
          <div className="px-3 py-1.5 border-b border-[#E2E6DF]/60 text-[10px] font-black uppercase tracking-wider text-[#868685]">
            {t('common.language')}
          </div>
          <div className="py-1">
            {supportedLanguages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  id={`language-option-${lang.code}`}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#E8F7DC] text-[#163300] font-bold'
                      : 'text-[#0E0F0C] hover:bg-[#F4F5F0]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div>
                      <span className="block leading-tight">{lang.name}</span>
                      <span className="text-[10px] text-[#868685] font-normal leading-tight">
                        {lang.nativeName}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#163300] stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
