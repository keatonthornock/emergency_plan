# Ward Emergency Response Site Template

A static, GitHub Pages-friendly template for a ward emergency response map site.

This template is designed for **non-technical maintenance**:
- replace one map file (or switch map path in config)
- update one `config.json`
- optionally update a Google Doc (published to web) for ward plan content
- use a Google Apps Script endpoint for signup form submissions
- no frontend code edits required for normal use

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
  /apps-script
    Code.gs                 # Apps Script backend example
```

## Quick setup

1. Copy `config.json.example` to `config.json` (or edit existing `config.json`).
2. Set `map_asset` to either:
   - an image file path, or
   - a qgis2web exported HTML path (for example `map/index.html` or `map/`).
3. Deploy the Apps Script backend in `apps-script/Code.gs` as a web app.
4. Paste the deployed web app URL into `signup_form.endpoint_url` in `config.json`.
5. Choose ward plan source:
   - Google Doc published HTML URL (`google_doc_html`), or
   - local fallback file (`local_html` + `content/ward-plan.html`).
6. Push to GitHub and enable GitHub Pages from branch root.

---

## 1) Replace the map file or use qgis2web HTML

### Option A: keep the default image filename
- Replace `assets/maps/current-map.svg` with your own map image.
- No code edits needed.

### Option B: use a different map image path
Update `config.json`:

```json
"map_asset": "assets/maps/2026-ward-map.png"
```

### Option C: use qgis2web output directly (recommended for interactive maps)
If you export a web map from qgis2web, copy the exported folder into this repo (example: `map/`) and set:

```json
"map_asset": "map/index.html"
```

You can also use `"map/"` if that folder serves its `index.html`.

Supported map assets:
- image files (`.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`)
- HTML map paths (`map/` or `path/to/map.html`)

---

## 2) Configure native signup form + Apps Script endpoint

In `config.json`:

```json
"signup_form": {
  "source_type": "apps_script_endpoint",
  "endpoint_url": "https://script.google.com/macros/s/REPLACE_ME/exec",
  "sheet_tab_name": "House List"
}
```

The site opens a native signup form in the modal and POSTs JSON with:
- `full_name`
- `address`
- `phone`
- `sheet_tab_name`

The frontend automatically:
- validates required fields
- normalizes whitespace
- submits JSON to your endpoint
- displays success or failure messages in the modal

---

## 3) Deploy the Google Apps Script web app

1. Create/open a Google Sheet that contains your house list.
2. Ensure tab **House List** has headers exactly:
   - `A1 Address`
   - `B1 Name`
   - `C1 Contact`
3. In Google Sheets, open **Extensions → Apps Script**.
4. Paste in the contents of `apps-script/Code.gs`.
5. Set `SPREADSHEET_ID` in the script (copy from your sheet URL).
6. Click **Deploy → New deployment**.
7. Type: **Web app**.
8. Execute as: **Me**.
9. Who has access: **Anyone** (or your chosen audience that can access from browser clients).
10. Deploy and copy the **Web app URL** (ends with `/exec`).
11. Paste that URL in `config.json` under `signup_form.endpoint_url`.

If you update the script later, redeploy a new version and keep using the `/exec` URL.

---

## 4) Configure ward plan from Google Doc

In `config.json`:

```json
"ward_plan": {
  "source_type": "google_doc_html",
  "url": "https://docs.google.com/document/d/e/.../pub"
}
```

How to publish a Google Doc:
1. Open your doc.
2. **File → Share → Publish to web**.
3. Publish as webpage.
4. Copy URL to `ward_plan.url`.

The site fetches this HTML at runtime and sanitizes it before rendering.

---

## 5) Use local HTML ward plan instead

If you do not want Google Docs:

```json
"ward_plan": {
  "source_type": "local_html",
  "url": "content/ward-plan.html"
}
```

Then edit `content/ward-plan.html` directly.

---

## 6) Config reference

Use `config.json.example` as your commented reference.
For normal updates, only edit:
- `config.json`
- your map asset files
- optionally Google Doc content

No frontend code changes are required for normal template use.

---

## Notes

- This is a pure static site and works on GitHub Pages.
- If `config.json` is missing or invalid, the page shows a visible error banner.
- If ward plan loading fails, the info modal shows an error message.
- If signup submission fails, the signup modal shows the returned error.
