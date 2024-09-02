
export function validateRatingData(ratingJson) {
  let error = null
  let correct = true

  if (ratingJson.showType !== 'movie' && ratingJson.showType !== 'serie') {
    error = 'wrong_show_type';
    correct = false;
  }
  if (ratingJson.showKey === '' || ratingJson.showKey === null) {
    error = 'empty_showKey';
    correct = false;
  }
  if (ratingJson.newRating === '' || ratingJson.newRating === null) {
    error = 'empty_rating';
    correct = false;
  }
  const rating = parseFloat(ratingJson.newRating);
  if (rating >= 0 && rating <= 5 && (rating * 2) % 1 === 0) {
    // rating is between 0 to 5, increasing by 0.5
    // rating * 2 is always whole number, modulo 1 checks this
    return { correct, error }
  }

  return { correct: false, error: 'not_accepted_rating' }
}