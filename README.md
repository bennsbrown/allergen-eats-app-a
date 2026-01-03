# Eaze

This app was built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

Made with 💙 for creativity.
# localdevelopment
to run the app locally type  `npm run dev` in terminal 

INSERT INTO public.business (unique_identifier, name, qr_slug, sheet_url)
VALUES (?, ?, ?, ?)
ON CONFLICT (unique_identifier)
DO UPDATE SET
  name = EXCLUDED.name,
  qr_slug = EXCLUDED.qr_slug,
  sheet_url = EXCLUDED.sheet_url;
