import { checkUserExistsWithUsername } from '../db/users_db.js'


export async function validateWatchGroupCreation(watchGroupJson) {
  let error = null
  let correct = true

  if (watchGroupJson.title === '' || watchGroupJson.title === null) {
    error = 'empty_title';
    correct = false;
  }
  if (watchGroupJson.description === '' || watchGroupJson.description === null) {
    error = 'empty_description';
    correct = false;
  }
  if (watchGroupJson.watch_date === '' || watchGroupJson.watch_date === null) {
    error = 'empty_watch_date';
    correct = false;
  }
  const date = new Date(watchGroupJson.watch_date);
  if (Date.now() > date.getTime()) {
    error = 'watch_date_in_past';
    correct = false;
  }
  if (watchGroupJson.location === '' || watchGroupJson.location === null) {
    error = 'empty_location';
    correct = false;
  }
  if (watchGroupJson.creator === '' || watchGroupJson.creator === null) {
    error = 'creator_missing';
    correct = false;
  }
  if (watchGroupJson.show === '' && watchGroupJson.show === null) {
    error = 'empty_show';
    correct = false;
  }

  if (!error) {
    const exists = await checkUserExistsWithUsername(watchGroupJson.creator);
    if (!exists) {
      error = 'user_not_exists';
      correct = false;
    }
  }

  return { correct, error }
}

export function validateWatchDate(watchDate) {
  if (watchDate === '' || watchDate === null) {
    return {
      error: 'empty_watch_date',
      correct: false
    }
  }
  const date = new Date(watchDate);
  if (Date.now() > date.getTime()) {
    return {
      error: 'watch_date_in_past',
      correct: false
    }
  }
  return {
    errur: null,
    correct: true
  }
}