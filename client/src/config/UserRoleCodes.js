export const userRoleCode = parseInt(process.env.REACT_APP_USER_ROLE_CODE, 10);
export const moderatorRoleCode = parseInt(process.env.REACT_APP_MODERATOR_ROLE_CODE, 10);
export const adminRoleCode = parseInt(process.env.REACT_APP_ADMIN_ROLE_CODE, 10);

export function convertRoleCode(roleCode) {
  switch (roleCode) {
    case moderatorRoleCode:
      return 'moderatorType';
    case adminRoleCode:
      return 'adminType'
    default:
      return 'userType'
  }
}