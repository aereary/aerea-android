# Sports sync deployment

Set `SPORTS_API_KEY` and `SPORTS_SYNC_SECRET` as Supabase Edge Function secrets.
Deploy `sync-sports-events`. The checked-in `sync-sports.yml` scheduler sends an
authenticated `POST` every six hours after the same `SPORTS_SYNC_SECRET` is
added to GitHub Actions. Supabase Cron can be used instead with identical
headers. Neither value belongs in Android or web code.

The function queries API-Football through `/fixtures?team=…&from=…&to=…`,
normalizes provider statuses and upserts with the stable provider fixture ID.
Running it repeatedly is idempotent. Changed dates, times, venues, scores and
statuses update the existing row instead of producing duplicates.
