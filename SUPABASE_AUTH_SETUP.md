# Supabase Auth Redirect Setup

For GitHub Pages email confirmation links, configure these values in Supabase:

1. Open Supabase Dashboard > Authentication > URL Configuration.
2. Set Site URL to:
   https://opmatrix1.github.io/FootHold/
3. Add Redirect URLs:
   https://opmatrix1.github.io/FootHold/**
   https://opmatrix1.github.io/FootHold/#/app
4. Save changes.

The app also sends `emailRedirectTo` during signup, pointing to:
https://opmatrix1.github.io/FootHold/#/app

If an email link says `otp_expired`, request a new confirmation link or sign up again. Old links cannot be repaired after they expire.