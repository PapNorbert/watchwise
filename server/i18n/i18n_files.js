import { readFileSync } from 'fs'
import { join } from 'path'


const folder = join(process.cwd(), 'i18n');
export let i18nData_eng = {}
export let i18nData_hu = {}

export function readLanguageDataFiles() {
  try {
    i18nData_eng = JSON.parse(readFileSync(join(folder, 'i18n_data.json')));
    i18nData_hu = JSON.parse(readFileSync(join(folder, 'i18n_data_hu.json')));
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}
