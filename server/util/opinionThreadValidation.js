import { checkUserExistsWithUsername } from '../db/users_db.js'


export async function validateOpinionTreadCreation(opinionThreadJson) {
  let error = null
  let correct = true

  if (opinionThreadJson.title === '' || opinionThreadJson.title === null) {
    error = 'empty_title';
    correct = false;
  }
  if (opinionThreadJson.description === '' || opinionThreadJson.description === null) {
    error = 'empty_description';
    correct = false;
  }
  if (opinionThreadJson.creator === '' || opinionThreadJson.creator === null) {
    error = 'creator_missing';
    correct = false;
  }
  if (opinionThreadJson.show === '' || opinionThreadJson.show === null) {
    error = 'empty_show';
    correct = false;
  }
  if (opinionThreadJson.tags === '' || opinionThreadJson.tags === null
    || opinionThreadJson.tags.split(',').length < 2) {
    error = 'empty_tags';
    correct = false;
  }

  if (!error) {
    const exists = await checkUserExistsWithUsername(opinionThreadJson.creator);
    if (!exists) {
      error = 'user_not_exists';
      correct = false;
    }
  }

  return { correct, error }
}