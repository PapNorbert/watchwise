export function convertToSelectedLanguage(databaseObject, i18nData) {
  if (i18nData && databaseObject) {
    let convertedKeysObject = {}
    for (const [key, value] of Object.entries(databaseObject)) {
      const convertedKey = convertKeyToSelectedLanguage(key, i18nData);
      convertedKeysObject[convertedKey] = value;
    }
    return convertedKeysObject;
  }
}

export function convertKeyToSelectedLanguage(key, i18nData) {
  if (i18nData && key) {
    const convertedKey = i18nData[key];
    switch (convertedKey) {
      case undefined:
      case '':
        console.log(`Error: Could not find '${key}' in ${i18nData?.language} translation data.`)
        return key;
      default:
        return convertedKey;
    }
  }
}

export function convertDateAndTimeToLocale(date, language) {
  if (language === 'hu') {
    return new Date(date).toLocaleDateString('hu-HU').concat(' ',
      new Date(date).toLocaleTimeString('hu-HU'));
  }
  return new Date(date).toLocaleDateString().concat(' ',
    new Date(date).toLocaleTimeString())
}

export function convertDateToLocale(date, language) {
  if (language === 'hu') {
    return new Date(date).toLocaleDateString('hu-HU');
  }
  return new Date(date).toLocaleDateString();
}

export function convertBasedOnRatingsToLanguage(language, ratingCount, i18nData) {
  if (i18nData && language && ratingCount) {
    switch (language) {
      case 'eng':
        return `${convertKeyToSelectedLanguage('based_on_ratings', i18nData)} ${ratingCount} ratings`
      case 'hu':
        return `${ratingCount} ${convertKeyToSelectedLanguage('based_on_ratings', i18nData)}`
      default:
        return
    }
  }
}