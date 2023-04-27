import React from "react";


import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import useLanguage from '../hooks/useLanguage'

export default function Home() {
  const { i18nData } = useLanguage();

  return (
    <div>
      <h1>
        {convertKeyToSelectedLanguage('home', i18nData)} 
        </h1>
    </div>
  )
}
