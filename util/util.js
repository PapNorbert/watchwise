export function createCommentKey(user, date) {
  let key = date.toString();
  for(let i = 0; i < user.length; i+=2){
    key += user.charCodeAt(i);
  }
  const completionLength = 24-key.length;
    // key has to have a min of 24 length
  let completion = "";
  for (let i =0; i<completionLength; i++) {
    completion += Math.floor(Math.random() * 10);
  }
  return completion + key;
}

export function createPaginationInfo(page, limit, count) {
  return {
    "page": page,
    "limit": limit,
    "totalCount": count,
    "totalPages": Math.ceil(count / limit),
  };
};