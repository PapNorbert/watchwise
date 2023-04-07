import { checkUserExistsWithUsername } from '../db/users_db.js'


export function checkLoginInformation(loginInformation) {
  return loginInformation.username !== undefined && loginInformation.username !== ''
    && loginInformation.passwd !== undefined && loginInformation.passwd !== ''
}

export async function checkRegistrationInformation(userInformation) {
  let correct = true;
  let error = ''
  if (!checkRegistrationInformationNotEmpty(userInformation)) {
    correct = false;
    error += 'empty_field'
  }
  if (!correctRegistrationPasswords(userInformation)) {
    correct = false;
    error += 'error_passwd'
  }
  if (! await usernameAvailabe(userInformation.username)) {
    correct = false;
    error = 'username_occupied'
  }
  return { correct, error }
}


export function checkRegistrationInformationNotEmpty(userInformation) {
  return userInformation.first_name !== undefined && userInformation.first_name !== ''
    && userInformation.last_name !== undefined && userInformation.last_name !== ''
    && userInformation.username !== undefined && userInformation.username !== ''
    && userInformation.passwd !== undefined && userInformation.passwd !== ''
    && userInformation.passwd_confirm !== undefined && userInformation.passwd_confirm !== ''

}

export function correctRegistrationPasswords(userInformation) {
  return userInformation.passwd === userInformation.passwd_confirm
    && userInformation.passwd.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\-_*!@#$%^&*()<>.,~|:;]{8,}$/gm)
}

export async function usernameAvailabe(username) {
  const exists = await checkUserExistsWithUsername(username);
  return !exists;
}