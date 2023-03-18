import { readFileSync } from 'fs'

let i18nData = JSON.parse(readFileSync('i18n_data.json'));

let k = "g"
switch (k) {
  case undefined, "":
    console.log("undefined")
    break;
  default:
    console.log("default")
}