# AÉREA Supabase Edge Functions

These folders mirror the live library synchronization functions so changes can
be reviewed and tested before deployment.

The Apps Script caller sends a Google OAuth access token in the Authorization
header. These functions therefore keep Supabase gateway JWT verification
disabled and perform their own Google identity verification before using the
service-role client.

`drive-library-sync` is retained as a legacy snapshot only. The current Apps
Script flow uses the AO3 and generic preview/apply/publish functions.
