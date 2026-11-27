## 1. Sign-in check

- [x] 1.1 Retry a timeout, a network error, and HTTP 429 or 5xx on the sign-in check and on session refresh
- [x] 1.2 Keep the session cookies when the auth service does not answer
- [x] 1.3 Answer HTTP 503 on a protected page, and render a public page signed out, for that request
- [x] 1.4 Clear the session only when the auth service rejects the token
- [x] 1.5 Test the retry, the kept session, and the rejected token
