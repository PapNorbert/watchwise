export function convertToSelectedLanguage(databaseObject, i18nData) {
  let convertedKeysObject = {}
  for (const [key, value] of Object.entries(databaseObject)) {
    const convertedKey = i18nData[key];
    switch (convertedKey) {
      case undefined:
      case "":
        console.log(`Error: Could not find '${key}' in ${i18nData?.language} translation data.`)
        convertedKeysObject[key] = value;
        break;
      default:
        convertedKeysObject[convertedKey] = value;
    }
  }
  return convertedKeysObject;
}