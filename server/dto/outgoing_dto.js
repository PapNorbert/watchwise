

export function createResponseDto(databaseObject) {
  delete databaseObject['_id']
  delete databaseObject['_rev']
  return databaseObject;
}

export function createResponseDtos(databaseObjectArray) {
  let responseDtos = []
  databaseObjectArray.forEach(dbObject => {
    responseDtos.push(createResponseDto(dbObject));
  });
  return responseDtos;
}

export function createResponseDtoLoggedIn(databaseObject) {
  delete databaseObject['doc']['_id']
  delete databaseObject['doc']['_rev']
  return databaseObject;
}

export function createResponseDtosLoggedIn(databaseObjectArray) {
  let responseDtos = []
  databaseObjectArray.forEach(dbObject => {
    responseDtos.push(createResponseDtoLoggedIn(dbObject));
  });
  return responseDtos;
}