import allowedOrigin from '../config/allowedOrigin.js'

export function credentialsAllow(req, response, next) {
  const origin = req.headers.origin;
  if (origin === allowedOrigin) {
    response.header('Access-Control-Allow-Credentials', true);
  }
  next();
}
