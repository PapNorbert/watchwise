import { findUserByKey } from '../db/users_db.js'
import { userRoleCode } from '../config/userRoleCodes.js'


export async function validateModRequestCreation(modRequestJson) {
  let error = null
  let correct = true

  if (modRequestJson.description === '' || modRequestJson.description === null) {
    error = 'empty_req_description';
    correct = false;
  }

  if (modRequestJson.creator === '' || modRequestJson.creator === null) {
    error = 'creator_missing';
    correct = false;
  }
  if (modRequestJson.creator_key === '' && modRequestJson.creator_key === null) {
    error = 'creator_missing';
    correct = false;
  }

  if (!error) {
    const user = await findUserByKey(modRequestJson.creator_key);
    if (!user) {
      error = 'user_not_exists';
      correct = false;
    } else if (user.username != modRequestJson.creator) {
      error = 'bad_user_data';
      correct = false;
    } else if (user.role !== userRoleCode) {
      error = 'bad_user_role';
      correct = false;
    }
  }

  return { correct, error }
}