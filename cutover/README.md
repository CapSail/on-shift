# Cut-over: forwarding the old SHIFTY-1 link

`shifty-1/` is the small site that replaces the SHIFTY-1 app at https://capsail.github.io/shifty-1/ once the merged
ON SHIFT is live and Cap has said go. It is kept here (and tested here, `tests/shell/forward.spec.ts`) so the
shifty-1 repo is not touched before that.

What it does:
- In a browser tab: forwards straight to `/on-shift/#shifty-1`. Same site, so the save (`shifty1.v1`) is already there.
- From an installed SHIFTY-1 icon: shows "SHIFTY-1 moved into ON SHIFT" with an Open button. On an iPhone install it
  also offers "Copy my progress code" (an installed iPhone app has its own storage; the code is pasted into
  AI school → About → Move my progress in the new app).
- `sw.js` replaces the old offline cache, on the old worker's terms: it waits for the "New version ready" tap or for
  the old app to be closed.

## Steps (only after Cap's OK in chat)

In `C:\Users\jrsjo\Desktop\Projects & Code\shifty_1` (repo CapSail/shifty-1):

1. Tag the last standalone build: `git tag v1-final-standalone` (on current `main`), push the tag.
2. Add a folder `forward/` with this folder's `index.html` and `sw.js`, plus copies of the app's
   `public/manifest.webmanifest` and `public/icons/` (the installed icon keeps its name and picture).
3. Change `.github/workflows/ci.yml` so it no longer builds or tests the app and uploads `forward/` as the Pages
   artifact instead of `dist/`.
4. Add a line at the top of `README.md` and a dated note in `HANDOFF.md`: moved into ON SHIFT, this repo is the archive.
5. Push `main`, wait for Pages, then check: the old link in a tab lands on ON SHIFT's AI school with the progress there;
   an old install shows "New version ready", and after the tap shows the "moved" page.

Roll-back: redeploy the tag (revert the workflow change). The save was never converted, so the old app still reads it.
