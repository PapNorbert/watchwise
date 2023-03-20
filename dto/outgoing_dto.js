import { convertToSelectedLanguage, getCurrentLanguage } from "../i18n/conversion.js"


export function createResponseDto(databaseObject) {
  delete databaseObject['_id']
  delete databaseObject['_rev']
  let responseDto = {}
  for (const [key, value] of Object.entries(databaseObject)) {
    const convertedKey = convertToSelectedLanguage(key)
    switch (convertedKey) {
      case undefined, "":
        console.log("Error: " + key + "not found in" + getCurrentLanguage() + " i18n data.")
        responseDto[key] = value;
        break;
      default:
        responseDto[convertedKey] = value;
    }
  }
  return responseDto;
}

export function createResponseDtos(databaseObjectArray) {
  let responseDtos = []
  databaseObjectArray.forEach(dbObject => {
    responseDtos.push(createResponseDto(dbObject));
  });
  return responseDtos;
}