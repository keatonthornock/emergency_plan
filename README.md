# Ward Emergency Response Site Template

A static, GitHub Pages-friendly template for a ward emergency response map site.

This template is designed for **non-technical maintenance**:
- replace one map file (or switch map path in config)
- update one `config.json`
- optionally update a Google Doc (published to web) for ward plan content
- no backend, no build step

## Files you will edit

```text
/
  index.html
  styles.css
  app.js
  config.json               # Your live settings
  config.json.example       # Commented reference template
  /content
    ward-plan.html          # Local fallback ward plan content
  /assets/maps
    current-map.svg         # Replaceable map asset
```

## Quick setup

1. Copy `config.json.example` to `config.json` (or edit existing `config.json`).
2. Replace `assets/maps/current-map.svg` with your map (or set `map_asset` to another path).
3. Add your Google Form embed URL in `signup_form.embed_url`.
4. Choose ward plan source:
   - Google Doc published HTML URL (`google_doc_html`), or
   - local fallback file (`local_html` + `content/ward-plan.html`).
5. Push to GitHub and enable GitHub Pages from branch root.

---

## 1) Replace the map file

### Option A (easiest): keep same filename
- Replace `assets/maps/current-map.svg` with your own map image/file.
- No code edits needed.

### Option B: use a different file/path
- Put your map where you want (for example `assets/maps/2026-ward-map.png`).
- Update this in `config.json`:

```json
"map_asset": "assets/maps/2026-ward-map.png"
```

Supported map assets:
- image files (`.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`)
- HTML map paths (`map/` or `path/to/map.html`) if you want to embed a dynamic map app

---

## 2) Configure Google Form sign-up

In `config.json`:

```json
"signup_form": {
  "source_type": "google_form_embed",
  "embed_url": "https://docs.google.com/forms/d/e/.../viewform?embedded=true"
}
```

How to get embed URL:
1. Open your Google Form.
2. Click **Send**.
3. Select the **<> Embed HTML** tab.
4. Copy the URL from the iframe `src` and paste into `embed_url`.

If Google blocks embedding, the modal automatically shows a fallback button to open the form in a new tab.

---

## 3) Configure ward plan from Google Doc

In `config.json`:

```json
"ward_plan": {
  "source_type": "google_doc_html",
  "url": "https://docs.google.com/document/d/e/.../pub"
}
```

How to publish a Google Doc for this:
1. Open your doc.
2. **File → Share → Publish to web**.
3. Publish as a webpage.
4. Copy the published URL into `ward_plan.url`.

The site fetches this HTML at runtime and sanitizes it before rendering.

---

## 4) Use local HTML fallback instead

If you do not want Google Docs, use:

```json
"ward_plan": {
  "source_type": "local_html",
  "url": "content/ward-plan.html"
}
```

Then edit `content/ward-plan.html` directly.

---

## 5) Config reference

Use `config.json.example` as your commented reference.
For normal updates, only edit `config.json` and replace your map asset.

---

## Notes

- This is a pure static site and works on GitHub Pages.
- If `config.json` is missing or invalid, the page shows a visible error banner.
- If ward plan loading fails, the info modal shows an error message.
