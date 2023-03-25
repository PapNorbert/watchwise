import { readFileSync } from 'fs'
import { join } from 'path'


let i18nData = {}
let currentLanguage = ""

export function readSelectedLanguageDataFile(language) {
  const folder = join(process.cwd(), 'i18n');
  let filename = "i18n_data.json"
  let succesfull = true;
  switch (language) {
    case "", "eng":
      currentLanguage = "english";
      break;
    case "hu":
      currentLanguage = "hungarian"
      filename = "i18n_data_hu.json";
      break;
    default:
      succesfull = false;
      currentLanguage = "english";
      console.log("Error: not recognised language selected!")
  }
  console.log("Reading " + currentLanguage + " data file: " + filename);
  try {
    i18nData = JSON.parse(readFileSync(join(folder, filename)));
    return succesfull;
  } catch(err) {
    console.log(err);
    return false;
  }
}


export function convertToSelectedLanguage(key) {
  return i18nData[key];
}

export function getCurrentLanguage() {
  return currentLanguage;
}