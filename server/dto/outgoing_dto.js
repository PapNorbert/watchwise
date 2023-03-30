

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