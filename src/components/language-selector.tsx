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
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'ko' as const, name: t('korean'), flag: '🇰🇷' },
    { code: 'en' as const, name: t('english'), flag: '🇺🇸' },
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
      <DropdownMenuContent align="end" className="w-40">
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