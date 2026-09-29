# public/ — static assets

Files here are served at the site root. For example, `public/logo.png` is
available at `/logo.png`.

## Add the SHFTD logo

The app's `Logo` component automatically uses **`public/logo.png`** if it
exists (otherwise it shows a built-in silver SVG fallback).

To use your exact logo image:

1. On your computer, rename your image file to exactly **`logo.png`**
   (lowercase, `.png`).
2. On GitHub, open this `public` folder on the
   `claude/shftd-marketing-os-ft56w0` branch.
3. Click **Add file → Upload files**, drag in `logo.png`, and **Commit**.
4. Vercel redeploys automatically — your exact logo then appears everywhere
   (sidebar, login, sign-up).

A transparent-background PNG looks best on the white theme.
