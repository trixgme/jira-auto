import { ko } from './ko';
import { en } from './en';
import { ja } from './ja';
import { zh } from './zh';
import { es } from './es';
import { fr } from './fr';
import { de } from './de';
import { pt } from './pt';
import { ru } from './ru';
import { ar } from './ar';
import { hi } from './hi';
import { vi } from './vi';
import { it } from './it';
import { tr } from './tr';
import { pl } from './pl';
import { nl } from './nl';
import { sv } from './sv';
import { da } from './da';
import { no } from './no';
import { fi } from './fi';
import { th } from './th';
import { id } from './id';
import { cs } from './cs';
import { hu } from './hu';
import { ro } from './ro';
import { bg } from './bg';
import { he } from './he';
import { Language, TranslationKeys } from './types';

export const translations: Record<Language, TranslationKeys> = {
  ko,
  en,
  ja,
  zh,
  es,
  fr,
  de,
  pt,
  ru,
  ar,
  hi,
  vi,
  it,
  tr,
  pl,
  nl,
  sv,
  da,
  no,
  fi,
  th,
  id,
  cs,
  hu,
  ro,
  bg,
  he,
};

export type { Language, TranslationKeys } from './types';