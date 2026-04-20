# Community Map Viewer Template

A beginner-friendly **GitHub template repository** for publishing a mobile-friendly QGIS web map (exported with **qgis2web**) using **GitHub Pages**.

## What this repository is

This is a static website template you can copy into your own GitHub account and publish as a shareable map website.

It includes:
- A fullscreen app shell at the repository root that embeds the map and overlays site controls.
- A placeholder `/map` folder that you replace with your own qgis2web export.
- Documentation for non-technical users.

## Who it is for

This repository is for:
- Community groups
- Nonprofits
- Local projects
- GIS beginners
- Anyone who wants a quick, no-backend way to host a QGIS web map online

## How it works

- qgis2web exports maps as static **HTML/CSS/JS** files.
- GitHub Pages can host static files directly from a branch.
- This template is designed so users only need to replace the contents of `/map`.
- The root shell (`/index.html`) embeds `./map/` so visitors load directly into the map experience.

## Repository structure

```text
/
  index.html  # app shell + overlays + form modal
  README.md
  MAP-REPLACEMENT-INSTRUCTIONS.md
  .nojekyll
  /map
    index.html
    /css
    /js
    /data
    /images
    /legend
```

## Quick start

1. Click **Use this template** on GitHub.
2. Create a new repository in your own account or organization.
3. Clone your new repository (or use the GitHub web editor).
4. Follow the replacement instructions below.
5. Enable GitHub Pages from **main branch / root**.
6. Open your GitHub Pages URL and share it.

## How to replace the map

Use this exact process:

1. Click **Use this template**.
2. Create a new repository in your account.
3. Export your map from QGIS using **qgis2web**.
4. Delete the current contents of `/map`.
5. Copy in your own qgis2web export so the exported `index.html` is at `/map/index.html`.
6. Commit and push your changes.
7. Enable GitHub Pages from **main branch root**.
8. Open and share your GitHub Pages URL.

## How to enable GitHub Pages

1. In your repository, go to **Settings** → **Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch: **main**.
4. Select folder: **/ (root)**.
5. Save.
6. Wait for deployment, then open the published URL.

> GitHub Pages can publish from a branch and either the branch root (`/`) or `/docs` folder.  
> This template recommends **main branch root** for simplicity.

## How to turn the repository into a GitHub template

If you are the repository owner and want others to reuse it:

1. Open your repository on GitHub.
2. Go to **Settings**.
3. In the **General** section, enable **Template repository**.
4. Share your repository link.

Then users can click **Use this template** to generate their own copy.

## Notes and limitations

- This template is plain static hosting only (no backend and no build step).
- qgis2web output quality and behavior depend on your QGIS project settings and the selected web library.
- Large datasets can load slowly on mobile devices.
- The map will be publicly viewable once GitHub Pages is enabled.
- On some GitHub plans/settings, Pages for private repositories may still be publicly reachable by URL. **Do not publish sensitive data.**
