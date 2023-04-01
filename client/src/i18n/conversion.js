export function convertToSelectedLanguage(databaseObject, i18nData) {
  if (i18nData) {
    let convertedKeysObject = {}
    for (const [key, value] of Object.entries(databaseObject)) {
      const convertedKey = convertKeyToSelectedLanguage(key, i18nData);
      convertedKeysObject[convertedKey] = value;
    }
    return convertedKeysObject;
  }
}

export function convertKeyToSelectedLanguage(key, i18nData) {
  if (i18nData) {
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
