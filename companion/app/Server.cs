// The small helper the window talks to, on http://localhost:8772 (only this PC can reach it). The same addresses the
// PowerShell app answered, so companion.html works unchanged: it lists and reads combat logs, waits for new pulls,
// shows the recap, and installs the addon.
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;

namespace Debrief {
  class Server {
    public readonly int Port;
    readonly string here;
    readonly HttpListener listener = new HttpListener();
    readonly object scanLock = new object();
    public Action<string, bool> Popup; // (the recap pop-up over the game)
    public Action Quit;
    public Func<int, int, string, string> SetHotkey; public Func<Dictionary<string, object>> HotkeyInfo; // (the recap hotkey (Nov 1))
    public Action OpenSettings, ShowSample; public Func<string> PickWowDir; // (the settings window (Nov 3))
    public Action<string, string, string> Remind; // (the raid reminder's Windows notification (Nov 3))
    static readonly JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = int.MaxValue };
    // (the window marks its requests; an old Edge window from the PowerShell app still open on this address gets told to stand down,
    // so a pull isn't copied twice)
    public const string AppMark = "DebriefApp/";
    static readonly bool Dev = Environment.GetEnvironmentVariable("DBF_DEV") != null;

    public Server(string here, int port) { this.here = here; Port = port; listener.Prefixes.Add("http://localhost:" + port + "/"); }

    public bool Start() {
      try { listener.Start(); } catch (Exception e) { Program.Log("port " + Port + " busy: " + e.Message); return false; }
      var t = new Thread(Loop) { IsBackground = true, Name = "server" }; t.Start();
      return true;
    }
    public void Stop() { try { listener.Stop(); } catch { } }

    void Loop() {
      while (listener.IsListening) {
        HttpListenerContext ctx;
        try { ctx = listener.GetContext(); } catch { break; }
        ThreadPool.QueueUserWorkItem(_ => Handle(ctx));
      }
    }

    static void Send(HttpListenerResponse res, byte[] bytes, string type) {
      res.ContentType = type; res.ContentLength64 = bytes.Length; res.OutputStream.Write(bytes, 0, bytes.Length);
    }
    static void SendJson(HttpListenerResponse res, object o) { Send(res, Encoding.UTF8.GetBytes(Json.Serialize(o)), "application/json"); }
    static string Body(HttpListenerRequest req) { using (var r = new StreamReader(req.InputStream, Encoding.UTF8)) return r.ReadToEnd(); }
    static long Ms(DateTime utc) { return (long)(utc - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds; }

    void Handle(HttpListenerContext ctx) {
      var req = ctx.Request; var res = ctx.Response;
      try {
        var path = req.Url.AbsolutePath; var q = req.QueryString; var get = req.HttpMethod == "GET"; var post = req.HttpMethod == "POST";
        var ua = req.UserAgent ?? ""; var fromApp = ua.Contains(AppMark) || Program.EdgeFallback;
        if (Dev) Program.Log("req " + req.HttpMethod + " " + req.Url.PathAndQuery + (fromApp ? "" : " (not the app)"));
        // (a web page elsewhere can't press the app's buttons: posts only from this address)
        var origin = req.Headers["Origin"];
        // (the website may read this PC's newest combat log, so debriefme.io can follow tonight's raid while Warcraft Logs is down:
        // only the site's own addresses, only reading. Chrome asks you once whether debriefme.io may talk to apps on this PC)
        if (SiteOrigin(origin)) {
          res.AddHeader("Access-Control-Allow-Origin", origin); res.AddHeader("Vary", "Origin");
          res.AddHeader("Access-Control-Allow-Private-Network", "true");
          if (req.HttpMethod == "OPTIONS") {
            res.AddHeader("Access-Control-Allow-Methods", "GET");
            res.AddHeader("Access-Control-Allow-Headers", req.Headers["Access-Control-Request-Headers"] ?? "*");
            res.AddHeader("Access-Control-Max-Age", "600"); res.StatusCode = 204; return;
          }
          if (!(get && (path == "/log/info" || path == "/log/read" || path == "/app-version"))) { res.StatusCode = 403; Send(res, Encoding.UTF8.GetBytes("No"), "text/plain"); return; }
        }
        if (post && !string.IsNullOrEmpty(origin) && origin != "http://localhost:" + Port) { res.StatusCode = 403; Send(res, Encoding.UTF8.GetBytes("No"), "text/plain"); return; }
        if (!fromApp && (path == "/wait" || path == "/scan" || path == "/clip" || path == "/read" || path == "/archive" || path == "/popup" || path == "/hotkey" || path == "/addonflags" || path == "/addonpull" || path.StartsWith("/setup") || path == "/settings" || path == "/" || path == "/index.html")) {
          if (path == "/wait") { Thread.Sleep(25000); SendJson(res, new Dictionary<string, object> { { "size", Num(q["size"]) }, { "name", q["name"] ?? "" } }); return; }
          if (path == "/" || path == "/index.html") { Send(res, Encoding.UTF8.GetBytes(Moved), "text/html; charset=utf-8"); return; }
          res.StatusCode = 409; SendJson(res, new Dictionary<string, object> { { "error", "Debrief Companion is its own app now. Close this window." } }); return;
        }
        if (get && (path == "/" || path == "/index.html")) Send(res, File.ReadAllBytes(Path.Combine(here, "companion.html")), "text/html; charset=utf-8");
        else if (get && System.Text.RegularExpressions.Regex.IsMatch(path, "^/[a-z0-9-]+\\.js$")) Send(res, File.ReadAllBytes(Path.Combine(here, path.Substring(1))), "text/javascript; charset=utf-8");
        else if (get && path == "/app") {
          // Debrief itself (its engine reads each pull): the copy next to this app, or the one in the folder above
          var f = Path.Combine(here, "Debrief.html"); if (!File.Exists(f)) f = Path.Combine(Path.GetDirectoryName(here.TrimEnd('\\')), "WoW-Log-Analyzer.html");
          Send(res, File.ReadAllBytes(f), "text/html; charset=utf-8");
        }
        else if (get && path == "/logs") {
          var d = Wow.FindLogsDir(here);
          if (d == null) { SendJson(res, new Dictionary<string, object> { { "error", "nodir" } }); return; }
          var files = new List<Dictionary<string, object>>();
          Func<FileInfo, bool, Dictionary<string, object>> row = (fi, old) => new Dictionary<string, object> { { "name", fi.Name }, { "size", fi.Length }, { "mtime", Ms(fi.LastWriteTimeUtc) }, { "old", old } };
          try { foreach (var fi in new DirectoryInfo(d).GetFiles("WoWCombatLog*.txt")) files.Add(row(fi, false)); } catch { }
          var arc = Path.Combine(d, "warcraftlogsarchive");
          if (Directory.Exists(arc)) { try { foreach (var fi in new DirectoryInfo(arc).GetFiles("Archive-WoWCombatLog*.txt")) files.Add(row(fi, true)); } catch { } }
          // (and the logs the Raider.IO app moved into its archive, as older logs (Oct 24))
          var rio = Path.Combine(d, "RaiderIOLogsArchive");
          if (Directory.Exists(rio)) { try { foreach (var fi in new DirectoryInfo(rio).GetFiles("WoWCombatLog*.txt")) if (!files.Any(x => (string)x["name"] == fi.Name)) files.Add(row(fi, true)); } catch { } }
          SendJson(res, new Dictionary<string, object> { { "dir", d }, { "files", files.OrderByDescending(x => (long)x["mtime"]).ToList() } });
        }
        else if (get && path == "/scan") {
          var p = Wow.FindLog(here, q["name"]); var from = Num(q["from"]); string s;
          lock (scanLock) s = DbfScan.Scan(p, from);
          Send(res, Encoding.UTF8.GetBytes(s), "application/json");
        }
        else if (get && (path == "/read" || path == "/log/read")) {
          var p = Wow.FindLog(here, q["name"]); long from = Num(q["from"]), to = Num(q["to"]);
          using (var fs = new FileStream(p, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete)) {
            if (to > fs.Length) to = fs.Length;
            int n = (int)Math.Max(0, Math.Min(to - from, 16L << 20));
            var buf = new byte[n]; int got = 0;
            if (n > 0) { fs.Seek(from, SeekOrigin.Begin); while (got < n) { int k = fs.Read(buf, got, n - got); if (k <= 0) break; got += k; } }
            if (got < n) Array.Resize(ref buf, got);
            Send(res, buf, "application/octet-stream");
          }
        }
        else if (get && path == "/log/info") {
          // (for the website: the newest combat log, its name and size, as start.bat's helper answers it)
          var d = Wow.FindLogsDir(here); var f = d == null ? null : Wow.NewestLog(d);
          if (d == null) SendJson(res, new Dictionary<string, object> { { "error", "nodir" } });
          else if (f == null) SendJson(res, new Dictionary<string, object> { { "dir", d }, { "error", "nolog" } });
          else SendJson(res, new Dictionary<string, object> { { "dir", d }, { "name", f.Name }, { "size", Wow.LiveLength(f.FullName) }, { "mtime", Ms(f.LastWriteTimeUtc) } });
        }
        else if (get && path == "/wait") {
          // waits (up to 25 s) for the combat log to grow, or for a newer combat log to appear
          var d = Wow.FindLogsDir(here); var name = q["name"] ?? ""; long size = Num(q["size"]); var max = string.IsNullOrEmpty(q["quick"]) ? 25 : 5;
          var t0 = DateTime.UtcNow; var outp = new Dictionary<string, object> { { "size", size }, { "name", name } };
          while ((DateTime.UtcNow - t0).TotalSeconds < max) {
            var f = d == null ? null : Wow.NewestLog(d);
            if (f != null && f.Name != name) { outp = new Dictionary<string, object> { { "size", Wow.LiveLength(f.FullName) }, { "name", f.Name }, { "newfile", true } }; break; }
            if (f != null) { var len = Wow.LiveLength(f.FullName); if (len != size) { outp = new Dictionary<string, object> { { "size", len }, { "name", f.Name } }; break; } }
            Thread.Sleep(700);
          }
          SendJson(res, outp);
        }
        else if (get && path == "/addon") SendJson(res, new Dictionary<string, object> { { "msg", Wow.InstallAddon(here) } });
        else if (post && path == "/update") SendJson(res, new Dictionary<string, object> { { "result", Program.UpdateNow() } }); // (Update now: installs, never during a pull)
        else if (get && path == "/update-info") SendJson(res, new Dictionary<string, object> { { "available", Program.Available ?? "" }, { "current", Program.Version } }); // (the window's gold bar (Oct 25))
        else if (post && path == "/update-check") SendJson(res, new Dictionary<string, object> { { "available", Program.CheckUpdate() ?? "" }, { "current", Program.Version }, { "online", Updater.LastSeen != null } }); // (Check for updates: only looks (Oct 25))
        else if (get && path == "/version") Send(res, System.Text.Encoding.UTF8.GetBytes(Program.Version), "text/plain; charset=utf-8"); // (the website's new-version check, every 2 seconds in the window (Oct 25))
        else if (get && path == "/app-version") SendJson(res, new Dictionary<string, object> { { "version", Program.Version }, { "addon", AddonVersion() } });
        else if (post && path == "/quit") { SendJson(res, new Dictionary<string, object> { { "ok", true } }); res.Close(); Quit?.Invoke(); }
        else if (post && path == "/archive") SendJson(res, Wow.ArchiveLogs(here)); // (the Archive old logs button)
        else if (get && path == "/problems") SendJson(res, new Dictionary<string, object> { { "list", Report.Errors(here) } }); // (what the addon noted (Oct 24))
        else if (post && path == "/report") SendJson(res, Report.Send(here, AddonVersion(), Json.Deserialize<Dictionary<string, object>>(Body(req)))); // (Report a problem (Oct 24))
        else if (post && path == "/addonpull") {
          // (each pull's code, for the addon's saved pulls: see Wow.SavePull)
          if (!(req.ContentType ?? "").StartsWith("application/json")) throw new Exception("Expected JSON.");
          var body = Json.Deserialize<Dictionary<string, object>>(Body(req));
          Wow.SavePull(here, body.ContainsKey("key") ? Convert.ToString(body["key"]) : "", body.ContainsKey("code") ? Convert.ToString(body["code"]) : "");
          SendJson(res, new Dictionary<string, object> { { "ok", true } });
        }
        else if (post && path == "/addonflags") {
          // (the main page's switches, for the addon: see Wow.SetFlags)
          if (!(req.ContentType ?? "").StartsWith("application/json")) throw new Exception("Expected JSON.");
          var body = Json.Deserialize<Dictionary<string, object>>(Body(req));
          Wow.SetFlags(here, !(body.ContainsKey("popup") && body["popup"] is bool p0 && !p0), body.ContainsKey("autocopy") && body["autocopy"] is bool a0 && a0);
          SendJson(res, new Dictionary<string, object> { { "ok", true } });
        }
        else if (get && path == "/hotkey") SendJson(res, HotkeyInfo != null ? HotkeyInfo() : new Dictionary<string, object>()); // (the recap hotkey (Nov 1))
        else if (post && path == "/hotkey") {
          var body = Json.Deserialize<Dictionary<string, object>>(Body(req));
          int mods = Convert.ToInt32(body.ContainsKey("mods") ? body["mods"] : 0), vk = Convert.ToInt32(body.ContainsKey("vk") ? body["vk"] : 0);
          var why = SetHotkey != null ? SetHotkey(mods, vk, body.ContainsKey("name") ? Convert.ToString(body["name"]) : "") : "off";
          SendJson(res, new Dictionary<string, object> { { "ok", why == "" }, { "why", why } });
        }
        else if (get && path == "/popup") Send(res, File.ReadAllBytes(Path.Combine(here, "popup.html")), "text/html; charset=utf-8");
        // ---------- the settings window (Nov 3, the studio's settings-brief.md) ----------
        else if (get && path == "/settings") Send(res, File.ReadAllBytes(Path.Combine(here, "settings.html")), "text/html; charset=utf-8");
        else if (post && path == "/setup/open") { OpenSettings?.Invoke(); SendJson(res, new Dictionary<string, object> { { "ok", true } }); }
        else if (post && path == "/setup/sample") { ShowSample?.Invoke(); SendJson(res, new Dictionary<string, object> { { "ok", true } }); }
        else if (post && path == "/setup/remind") { // (the raid reminder: a Windows notification; a click opens tonight's plan on debriefme.io)
          var b = Json.Deserialize<Dictionary<string, object>>(Body(req)) ?? new Dictionary<string, object>(); Func<string, string> g = (k) => b.ContainsKey(k) ? Convert.ToString(b[k]) : "";
          var url = g("url"); if (!url.StartsWith("https://debriefme.io/")) url = "https://debriefme.io/";
          Remind?.Invoke(g("title"), g("text"), url); SendJson(res, new Dictionary<string, object> { { "ok", Remind != null } }); }
        else if (path == "/setup/winmode") SendJson(res, post ? WinMode.Switch(here) : WinMode.Info()); // (Windowed (Fullscreen) by a press (Nov 3, the walkthrough))
        else if (post && path == "/setup/wowdir") SendJson(res, new Dictionary<string, object> { { "logs", PickWowDir != null ? PickWowDir() : "" } });
        else if (get && path == "/setup") SendJson(res, SetupInfo());
        else if (get && path == "/setup/chars") SendJson(res, CharsInfo()); // (the Companion window's character (Nov 3))
        else if (get && path == "/setup/addoncard") SendJson(res, Wow.AddonPicks(here)); // (each player's /db picks, carried over once)
        else if (get && path == "/setup/pull") { // (the preview's pull: your latest raid pull, else the sample, with who you are)
          string data = null; bool sample = false;
          try { var f = Path.Combine(here, "lastpop.json"); if (File.Exists(f)) { var t = File.ReadAllText(f); if (t.Contains("\"card\"") && !t.Contains("\"mplus\"")) data = t; } } catch { }
          if (data == null) { try { data = File.ReadAllText(Path.Combine(here, "sample-pop.json")); sample = true; } catch { data = "null"; } }
          var lk = Wow.AddonCard(here); var lkj = new System.Web.Script.Serialization.JavaScriptSerializer().Serialize(new Dictionary<string, object> { { "me", lk.ContainsKey("me") ? lk["me"] : "" }, { "mine", lk.ContainsKey("mine") ? lk["mine"] : new List<string>() } });
          Send(res, Encoding.UTF8.GetBytes("{\"sample\":" + (sample ? "true" : "false") + ",\"lk\":" + lkj + ",\"data\":" + data + "}"), "application/json; charset=utf-8");
        }
        else if (post && path == "/popup") {
          // (the main page: show this pull's recap over the game, or hide it when the next pull starts)
          if (!(req.ContentType ?? "").StartsWith("application/json")) throw new Exception("Expected JSON.");
          var raw = Body(req); var body = Json.Deserialize<Dictionary<string, object>>(raw);
          bool show = body.ContainsKey("show") && body["show"] is bool sb && sb;
          if (Popup != null) Popup(show && body.ContainsKey("data") ? Json.Serialize(body["data"]) : null, show);
          SendJson(res, new Dictionary<string, object> { { "ok", Popup != null } });
        }
        else if (post && path == "/folder") {
          if (!(req.ContentType ?? "").StartsWith("application/json")) throw new Exception("Expected JSON.");
          var body = Json.Deserialize<Dictionary<string, object>>(Body(req));
          var d = (body.ContainsKey("dir") ? Convert.ToString(body["dir"]) : "").Trim().Trim('"');
          if (d != "" && Directory.Exists(Path.Combine(d, @"_retail_\Logs"))) d = Path.Combine(d, @"_retail_\Logs");
          else if (d != "" && !System.Text.RegularExpressions.Regex.IsMatch(d, @"Logs\\?$") && Directory.Exists(Path.Combine(d, "Logs"))) d = Path.Combine(d, "Logs");
          if (d == "" || !Directory.Exists(d)) throw new Exception("That folder doesn't exist.");
          File.WriteAllText(Path.Combine(here, "logs-path.txt"), d, new UTF8Encoding(false));
          SendJson(res, new Dictionary<string, object> { { "ok", true }, { "dir", d } });
        }
        else { res.StatusCode = 404; Send(res, Encoding.UTF8.GetBytes("Not found"), "text/plain"); }
      }
      catch (Exception e) {
        try { res.StatusCode = 500; SendJson(res, new Dictionary<string, object> { { "error", e.Message } }); } catch { }
      }
      finally { try { res.Close(); } catch { } }
    }

    static long Num(string s) { long v; return long.TryParse(s, out v) ? v : 0; }
    // (the addon version this app carries, from its own copy's .toc: it rides along in each recap so the addon knows it's out of date)
    // debriefme.io, its www address, its practice links on workers.dev, and start.bat's local copy
    static bool SiteOrigin(string o) {
      if (string.IsNullOrEmpty(o)) return false;
      return o == "https://debriefme.io" || o == "https://www.debriefme.io" || o == "http://localhost:8765" ||
        System.Text.RegularExpressions.Regex.IsMatch(o, @"^https://([a-z0-9-]+-)?debrief\.james-m-nemecek\.workers\.dev$");
    }
    // (Setup's checks: the WoW folder, the addon (it keeps the combat log on), the display mode from WoW's own Config.wtf, your characters, the screens)
    Dictionary<string, object> SetupInfo() {
      var o = new Dictionary<string, object>(); var retail = Wow.FindRetail(here); o["retail"] = retail ?? ""; o["version"] = Program.Version; o["update"] = Program.Available ?? "";
      string addon = "missing", display = "unknown";
      if (retail != null) {
        try { var toc = Path.Combine(retail, @"Interface\AddOns\Debrief\Debrief.toc"); if (File.Exists(toc)) { string iv = ""; foreach (var line in File.ReadAllLines(toc)) if (line.StartsWith("## Version:")) iv = line.Substring(11).Trim(); var bv = AddonVersion(); addon = bv == "" || iv == bv ? "ok" : "old"; } } catch { }
        try { var cfg = Path.Combine(retail, @"WTF\Config.wtf"); if (File.Exists(cfg)) { var t = File.ReadAllText(cfg); var w = System.Text.RegularExpressions.Regex.Match(t, "SET gxWindow \"(\\d)\"", System.Text.RegularExpressions.RegexOptions.IgnoreCase); var mx = System.Text.RegularExpressions.Regex.Match(t, "SET gxMaximize \"(\\d)\"", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
          display = w.Success && w.Groups[1].Value == "0" ? "fullscreen" : mx.Success && mx.Groups[1].Value == "1" ? "fullwin" : "windowed"; } } catch { }
      }
      o["addon"] = addon; o["display"] = display; o["old"] = File.Exists(Path.Combine(here, "lastpop.json")); // (had a recap before: the walkthrough says "New")
      var card = Wow.AddonCard(here); o["me"] = card.ContainsKey("me") ? card["me"] : ""; o["chars"] = card.ContainsKey("mine") ? card["mine"] : new List<string>();
      int n = 1; try { n = System.Windows.Forms.Screen.AllScreens.Length; } catch { } o["screens"] = n;
      return o;
    }
    // (every character on this PC with its realm, from WoW's own folders, when each was last played, and the region from Config.wtf)
    Dictionary<string, object> CharsInfo() {
      var o = new Dictionary<string, object>(); var list = new List<Dictionary<string, object>>(); string region = "us";
      var r = Wow.FindRetail(here);
      if (r != null) {
        try { var cfg = Path.Combine(r, @"WTF\Config.wtf"); if (File.Exists(cfg)) { var m = System.Text.RegularExpressions.Regex.Match(File.ReadAllText(cfg), "SET portal \"(\\w+)\"", System.Text.RegularExpressions.RegexOptions.IgnoreCase); if (m.Success) region = m.Groups[1].Value.ToLowerInvariant(); } } catch { }
        try { var acc = Path.Combine(r, @"WTF\Account"); if (Directory.Exists(acc)) foreach (var a in Directory.GetDirectories(acc)) foreach (var realm in Directory.GetDirectories(a)) { var rn = Path.GetFileName(realm); if (rn == "SavedVariables") continue;
          foreach (var ch in Directory.GetDirectories(realm)) list.Add(new Dictionary<string, object> { { "name", Path.GetFileName(ch) }, { "realm", rn }, { "at", (long)(Directory.GetLastWriteTimeUtc(ch) - new DateTime(1970, 1, 1)).TotalMilliseconds } }); } } catch { }
      }
      var card = Wow.AddonCard(here); o["me"] = card.ContainsKey("me") ? card["me"] : ""; o["chars"] = list;
      o["region"] = region == "eu" || region == "kr" || region == "tw" ? region : "us";
      return o;
    }
    string AddonVersion() {
      try { foreach (var line in File.ReadAllLines(Path.Combine(here, @"addon\Debrief\Debrief.toc"))) if (line.StartsWith("## Version:")) return line.Substring(11).Trim(); } catch { }
      return "";
    }

    const string Moved = "<!doctype html><meta charset=utf-8><title>Debrief Companion</title><body style=\"margin:0;background:#0f1117;color:#ece8df;font:16px/1.5 Segoe UI,sans-serif;display:grid;place-items:center;min-height:100vh;text-align:center\">" +
      "<div><h2 style=\"margin:0 0 8px\">Debrief Companion is its own app now</h2><p style=\"color:#9aa0ad;margin:0\">You can close this window. Open Debrief from the icon on your desktop or the Start menu.</p></div>";
  }
}
