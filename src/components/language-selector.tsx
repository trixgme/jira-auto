'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'ko' as const, name: '한국어', flag: '🇰🇷' },
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'ja' as const, name: '日本語', flag: '🇯🇵' },
    { code: 'zh' as const, name: '中文', flag: '🇨🇳' },
    { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
    { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
    { code: 'de' as const, name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt' as const, name: 'Português', flag: '🇧🇷' },
    { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
    { code: 'ar' as const, name: 'العربية', flag: '🇸🇦' },
    { code: 'hi' as const, name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'vi' as const, name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'it' as const, name: 'Italiano', flag: '🇮🇹' },
    { code: 'tr' as const, name: 'Türkçe', flag: '🇹🇷' },
    { code: 'pl' as const, name: 'Polski', flag: '🇵🇱' },
    { code: 'nl' as const, name: 'Nederlands', flag: '🇳🇱' },
    { code: 'sv' as const, name: 'Svenska', flag: '🇸🇪' },
    { code: 'da' as const, name: 'Dansk', flag: '🇩🇰' },
    { code: 'no' as const, name: 'Norsk', flag: '🇳🇴' },
    { code: 'fi' as const, name: 'Suomi', flag: '🇫🇮' },
    { code: 'th' as const, name: 'ไทย', flag: '🇹🇭' },
    { code: 'id' as const, name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'cs' as const, name: 'Čeština', flag: '🇨🇿' },
    { code: 'hu' as const, name: 'Magyar', flag: '🇭🇺' },
    { code: 'ro' as const, name: 'Română', flag: '🇷🇴' },
    { code: 'bg' as const, name: 'Български', flag: '🇧🇬' },
    { code: 'he' as const, name: 'עברית', flag: '🇮🇱' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage?.flag}</span>
          <span className="hidden md:inline">{currentLanguage?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 max-h-[400px] overflow-y-auto">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
            {language === lang.code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}