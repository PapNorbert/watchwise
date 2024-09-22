

export function createResponseDto(databaseObject) {
  const { _id, _rev, ...rest } = databaseObject;
  // remove null values
  Object.keys(rest).forEach(key => {
    if (rest[key] === null || rest[key] === '') {
      delete rest[key];
    }
  });
  return rest;
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