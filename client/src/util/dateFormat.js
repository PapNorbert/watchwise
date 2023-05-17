
const ms_per_day = 1000 * 60 * 60 * 24;

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

export function convertDateToTimeElapsed(dateString, language) {
  if (dateString) {
    const date = new Date(dateString);
    const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const dateNow = new Date(Date.now());
    const utcNow = Date.UTC(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate());
    const days = Math.floor((utcNow - utcDate) / ms_per_day);
    const created = language === 'hu' ? 'Létrehozva ' : 'Created '
    if (days === 0) {
      return `${created} ${language === 'hu' ? 'ma.' : 'today.'}`
    }
    if (days <= 31) {
      return `${created} ${days} ${language === 'hu' ? 'napja.' : 'days ago.'}`
    }
    return `${created} ${Math.floor(days / 30)} ${language === 'hu' ? 'hónapja.' : 'months ago.'}`
  }
  return '';
}
