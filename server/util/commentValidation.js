import { checkUserExistsWithUsername } from '../db/users_db.js'

export async function validateCommentCreation(commentJson) {
  let error = null
  let correct = true

  if (commentJson.user === "" || commentJson.user === null) {
    error = "no_user_for_comment";
    correct = false;
  }
  if (commentJson.text === "" || commentJson.text === null) {
    error = "empty_comment";
    correct = false;
  }
  if (!error) {
    const exists = await checkUserExistsWithUsername(commentJson.user);
    if (!exists) {
      error = 'user_not_exists';
      correct = false;
    }
  }

  return { correct, error }
}