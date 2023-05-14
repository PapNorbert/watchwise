
export function convertDateToFormInput(dateString) {
  if (dateString) {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }
  return '';
}

export function convertDateWithoutTimeToFormInput(dateString) {
  if (dateString) {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
  }
  return '';
}