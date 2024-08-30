
export const querryParamNames = {
  limit: 'per_page',
  page: 'page',
  genres: 'genre',
  name: 'name',
  show: 'show',
  creator: 'creator',
  sortBy: 'sortBy',
  watchDate: 'watchDate',
  location: 'location',
  distance: 'distance',
  onlyGroupFull: 'onlyNotFullGroups',
  banned: 'usersBanned',
  tags: 'tags'
}

export const querryParamDefaultValues = {
  limit: 5,
  page: 1,
  maxLimit: 40,
  genres: 'all',
  name: '',
  show: '',
  creator: '',
  OTsortBy: 'newest',
  WGsortBy: 'distance',
  watchDate: '',
  location: '',
  distance: '',
  onlyGroupFull: false,
  banned: '',
  tags: ''
}

export const limitValues = [2, 5, 10, 15, 20, 30, 40];

export const sortByValuesOT = ['newest', 'oldest', 'show', 'creator', 'title']

export const sortByValuesWG = ['newest', 'oldest', 'show', 'creator', 'title', 'distance', 'watch_date']

export const bannedValues = ['all', 'onlyBanned', 'onlyNotBanned', '']

