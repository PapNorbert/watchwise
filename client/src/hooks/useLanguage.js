import { useContext } from 'react'

import { LanguageContext } from '../context/LanguageContextProvider'

export default function useLanguage() {
  return useContext(LanguageContext);
}