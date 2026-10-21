// Updates: at start, a newer version from debriefme.io replaces this one (checked by its SHA-256), then it restarts.
// latest.json: { "version": "0.6.0", "url": "https://debriefme.io/companion/app.zip", "sha256": "...", "addon": "0.4.7" }; skipped quietly when offline.
// (no WebView2 types in here: the update runs before the window's files are loaded, so every file can be replaced)
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Security.Cryptography;
using System.Web.Script.Serialization;

namespace Debrief {
  static class Updater {
    const string Latest = "https://debriefme.io/companion/latest.json";

    // (files a running copy holds open can't be overwritten, but Windows lets them be renamed: the old one becomes *.old, gone next start)
    public static void CleanOld(string here) {
      // (only Debrief's own files: the window's WebView2 folder keeps its own *.old files)
      var web = Path.Combine(here, "WebView2") + "\\";
      try { foreach (var f in Directory.GetFiles(here, "*.old", SearchOption.AllDirectories)) { if (f.StartsWith(web, StringComparison.OrdinalIgnoreCase)) continue; try { File.Delete(f); } catch { } } } catch { }
    }

    public static bool Newer(string a, string b) {
      try { return new Version(a) > new Version(b); } catch { return false; }
    }

    public static bool Run(string here) {
      try {
        ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
        string text;
        var test = Environment.GetEnvironmentVariable("DBF_LATEST"); // (a test address: only a copy on this PC)
        if (test != null && !test.StartsWith("http://localhost:")) test = null;
        using (var wc = new TimedClient(6000)) text = wc.DownloadString(test ?? Latest);
        var m = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(text);
        string ver = m.ContainsKey("version") ? Convert.ToString(m["version"]) : null, url = m.ContainsKey("url") ? Convert.ToString(m["url"]) : null,
          sha = m.ContainsKey("sha256") ? Convert.ToString(m["sha256"]) : null;
        if (string.IsNullOrEmpty(ver) || string.IsNullOrEmpty(url) || string.IsNullOrEmpty(sha)) return false;
        if (!Newer(ver, Program.Version)) return false;
        if (!url.StartsWith("https://debriefme.io/") && !(test != null && url.StartsWith("http://localhost:"))) return false;
        var zip = Path.Combine(Path.GetTempPath(), "debrief-update-" + ver + ".zip");
        using (var wc = new TimedClient(60000)) wc.DownloadFile(url, zip);
        string got;
        using (var s = File.OpenRead(zip)) using (var h = SHA256.Create()) got = BitConverter.ToString(h.ComputeHash(s)).Replace("-", "");
        if (!string.Equals(got, sha, StringComparison.OrdinalIgnoreCase)) { File.Delete(zip); Program.Log("update " + ver + ": download did not check out, skipped"); return false; }
        var root = Path.GetFullPath(here).TrimEnd('\\') + "\\";
        using (var z = ZipFile.OpenRead(zip)) {
          foreach (var e in z.Entries) {
            if (string.IsNullOrEmpty(e.Name)) continue; // (a folder)
            var dst = Path.GetFullPath(Path.Combine(here, e.FullName.Replace('/', '\\')));
            if (!dst.StartsWith(root, StringComparison.OrdinalIgnoreCase)) continue;
            Directory.CreateDirectory(Path.GetDirectoryName(dst));
            try { e.ExtractToFile(dst, true); }
            catch (IOException) { var old = dst + ".old"; try { File.Delete(old); } catch { } File.Move(dst, old); e.ExtractToFile(dst, true); }
          }
        }
        try { File.Delete(zip); } catch { }
        Program.Log("updated to " + ver);
        return true;
      } catch (Exception e) { Program.Log("update check: " + e.Message); return false; }
    }

    class TimedClient : WebClient {
      readonly int ms;
      public TimedClient(int ms) { this.ms = ms; Headers[HttpRequestHeader.UserAgent] = "DebriefCompanion/" + Program.Version; }
      protected override WebRequest GetWebRequest(Uri address) { var r = base.GetWebRequest(address); r.Timeout = ms; return r; }
    }
  }
}
