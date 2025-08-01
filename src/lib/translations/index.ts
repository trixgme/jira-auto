import { ko } from './ko';
import { en } from './en';
import { Language, TranslationKeys } from './types';

export const translations: Record<Language, TranslationKeys> = {
  ko,
  en,
};

export type { Language, TranslationKeys } from './types';