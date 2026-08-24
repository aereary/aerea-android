# Android confirmation callback

Keep the existing Supabase email template and add this exact URL to **Auth →
URL Configuration → Redirect URLs** in the hosted project:

`aerea://auth/callback`

Android declares that callback on `MainActivity`. Both cold-start and
`singleTask` warm-start intents are passed to the same PKCE/OTP callback
handler. The app accepts PKCE `code`, implicit access/refresh tokens and
`token_hash` callbacks, and shows a resend path for invalid or expired links.

Do not use `localhost` as the `emailRedirectTo` value. Native OTP requests now
send the custom callback while the web build keeps its own origin.
