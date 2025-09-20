Place a proper favicon.ico in this folder for cross-browser support.

Recommended steps:
1. Generate a 16x16 and 32x32 ICO containing your `logo.png` using a tool such as:
   - https://favicon.io/favicon-converter/
   - ImageMagick: `magick convert logo.png -define icon:auto-resize=64,48,32,16 favicon.ico`
2. Save the generated `favicon.ico` to `frontend/public/favicon.ico`.
3. Rebuild the frontend: `cd frontend; npm run build`.

Notes:
- Next.js will prefer `public/favicon.ico` for `/favicon.ico` requests.
- `layout.tsx` now references both `/favicon.ico` and `/logo.png` to maximize coverage.
