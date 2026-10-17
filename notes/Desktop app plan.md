# Desktop app (Windows): the plan, agreed 2026-10-17

The user said yes to "the small app with auto-update from the Cloudflare site". To be built while the user sleeps.

## Why an app
- Chrome blocks every website from opening files under Program Files, where WoW is installed, so the website can't
  follow the combat log live. An installed app can. On the user's PC, start.bat's helper already does it.
- Warcraft Logs links work through the Cloudflare Worker (CORS `*` checked), so nobody needs their own key.

## Shape
- A C# WinForms app with WebView2 (the Edge engine built into Windows), targeting .NET Framework 4.8 (already on
  Windows 10 and 11). It's built with the .NET 8 SDK that's already installed (`dotnet build`), with the
  Microsoft.Web.WebView2 package from nuget.org. Sources go in `src/desktop/`, and `bin/` and `obj/` stay out of git.
- One exe (about 1 to 3 MB):
  - the WebView2 DLLs are embedded and loaded through AssemblyResolve;
  - WebView2Loader.dll (x64 and arm64) is extracted and found through `SetLoaderDllFolderPath`;
  - a compressed fallback copy of the app HTML is embedded.
- First run installs itself to `%LOCALAPPDATA%\Programs\Debrief`, adds Start menu and desktop shortcuts, and adds an
  Apps & Features entry (`--uninstall`).
  - For tests, `DEBRIEF_HOME` points it at a scratch folder and `DEBRIEF_NO_SHORTCUTS=1` skips the shortcuts.
    Don't put shortcuts on the user's desktop while testing.
- The page is served at `https://app.debrief/` through WebResourceRequested. The origin stays fixed, so saved pulls
  and notes survive updates. The WebView2 data lives in `%LOCALAPPDATA%\Debrief`. It serves:
  - `/` and `/index.html`: the cached app HTML (or the embedded copy);
  - `/log/info` and `/log/read`: the same replies as server.ps1, including its WoW-folder search (registry, then the
    usual folders), plus a saved path the user picked;
  - `/log/pick`: a folder dialog.
- A script injected before the page runs sets:
  - `window.WLA_HOSTED = true` (Warcraft Logs goes through the Worker);
  - `WLA_API` = https://debrief.james-m-nemecek.workers.dev;
  - `WLA_DESKTOP` = { the version, what was just updated }.
- Links to other sites open in the default browser (NewWindowRequested and NavigationStarting). The window remembers
  its size and position.

## Updates (checked every launch, about a 4 s timeout)
- The Worker moves to **static assets** (`[assets] directory = "online/public"`), which keeps the script small:
  - `index.html` is the hosted page;
  - `desktop/version.json` holds { app version, appSha256, exe version, exeSha256 };
  - `desktop/app.html` is the plain build;
  - `desktop/Debrief.exe` is the app itself;
  - `desktop/index.html` is a download page.
  - The download page isn't linked from the front page yet (the beta is for guildmates).
- App HTML: if the hash differs, download it, check it, save it and load it. Nobody clicks anything.
- Exe: if the version is newer, download it, check the SHA-256, rename the running exe to `.old`, move the new one in,
  restart, and delete `.old` on the next launch.
- No internet: use the last cached copy, or the embedded one.
- The version shows in the app (on the start screen) and as an "updated" toast.
- For tests, `DEBRIEF_UPDATE_URL` (a file:/// path works, through WebClient) points the updates at a scratch folder.

## Page changes (ui.js)
- `DESKTOP = window.WLA_DESKTOP`. The start screen uses the local-style "Follow my combat log" button through the
  helper routes, with desktop wording (no start.bat or logs-path.txt), and "Choose your WoW folder" when it isn't found.
  Warcraft Logs import goes the hosted way.
- Check every `WCL.HOSTED` use: syncUrl, the hosted start panel, BLOCKED_HINT, line ~5969 (hosted boot), and the
  /wcl/login paths.

## Testing
- Run the built exe with `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222 --remote-allow-origins=*`.
  Drive it over the DevTools protocol from PowerShell (ClientWebSocket: Runtime.evaluate, Page.captureScreenshot to a
  PNG).
- Check that:
  - the front page loads;
  - `/log/info` finds the real log;
  - a Warcraft Logs report opens;
  - an app update and an exe update both go through from a scratch update folder.
- Then deploy, and give the user the download link to install it themselves (the real test, including Chrome's and
  SmartScreen's warnings).
- Risk to tell the user: Defender sometimes flags small unsigned apps that download and replace their own exe. Later fix:
  code signing.
