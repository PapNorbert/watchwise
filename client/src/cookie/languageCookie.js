import Cookies from 'js-cookie'

import { supportedLanguages, defaultLanguage } from '../config/supportedLanguages'

export function setLanguageCookie(language) {
  Cookies.set('Lang', language, { expires: 1 });
}

export function getLanguageCookie() {
  const savedLanguage = Cookies.get('Lang');
  console.log(supportedLanguages)
  if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
    console.log(savedLanguage);
    return savedLanguage;
  }
  return defaultLanguage;
}