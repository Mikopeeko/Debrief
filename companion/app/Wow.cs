// Finding WoW on this PC and putting the Debrief addon in (same rules as the PowerShell app had).
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Microsoft.Win32;

namespace Debrief {
  static class Wow {
    // (your own WoW Logs folder, when you pasted one in the window)
    static string OwnLogs(string here) {
      foreach (var own in new[] { Path.Combine(here, "logs-path.txt"), Path.Combine(Path.GetDirectoryName(here.TrimEnd('\\')) ?? here, "logs-path.txt") }) {
        try { if (File.Exists(own)) { var d = File.ReadAllText(own).Trim().Trim('﻿'); if (d != "" && Directory.Exists(d)) return d; } } catch { }
      }
      return null;
    }

    public static string FindRetail(string here) {
      var own = OwnLogs(here); if (own != null) return Path.GetDirectoryName(own.TrimEnd('\\'));
      var cands = new List<string>();
      var keys = new[] { @"SOFTWARE\WOW6432Node\Blizzard Entertainment\World of Warcraft", @"SOFTWARE\Blizzard Entertainment\World of Warcraft",
        @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\World of Warcraft", @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\World of Warcraft" };
      try {
        using (var hklm = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64)) {
          foreach (var k in keys) {
            try { using (var key = hklm.OpenSubKey(k)) { if (key == null) continue; foreach (var n in new[] { "InstallPath", "InstallLocation" }) { var v = key.GetValue(n) as string; if (!string.IsNullOrEmpty(v)) cands.Add(v); } } } catch { }
          }
        }
      } catch { }
      var subs = new[] { @"Program Files (x86)\World of Warcraft", @"Program Files\World of Warcraft", "World of Warcraft", @"Games\World of Warcraft", @"Games\Blizzard\World of Warcraft",
        @"Blizzard\World of Warcraft", @"Battle.net\World of Warcraft", @"Program Files (x86)\Battle.net\World of Warcraft", @"Blizzard Games\World of Warcraft" };
      foreach (var drv in DriveInfo.GetDrives()) {
        try { if (drv.DriveType != DriveType.Fixed && drv.DriveType != DriveType.Removable) continue; if (!drv.IsReady) continue; } catch { continue; }
        foreach (var s in subs) cands.Add(Path.Combine(drv.RootDirectory.FullName, s));
      }
      foreach (var c0 in cands) {
        try {
          var c = c0.TrimEnd('\\');
          if (string.Equals(Path.GetFileName(c), "_retail_", StringComparison.OrdinalIgnoreCase) && Directory.Exists(c)) return c;
          var r = Path.Combine(c, "_retail_"); if (Directory.Exists(r)) return r;
        } catch { }
      }
      return null;
    }

    public static string FindLogsDir(string here) {
      var own = OwnLogs(here); if (own != null) return own;
      var r = FindRetail(here); if (r == null) return null;
      var l = Path.Combine(r, "Logs");
      if (!Directory.Exists(l)) { try { Directory.CreateDirectory(l); } catch { } }
      return l;
    }

    static string TocVersion(string toc) {
      try { foreach (var line in File.ReadAllLines(toc)) if (line.StartsWith("## Version:")) return line.Substring(11).Trim(); } catch { }
      return "";
    }

    static void CopyDir(string src, string dst) {
      Directory.CreateDirectory(dst);
      foreach (var f in Directory.GetFiles(src)) File.Copy(f, Path.Combine(dst, Path.GetFileName(f)), true);
      foreach (var d in Directory.GetDirectories(src)) CopyDir(d, Path.Combine(dst, Path.GetFileName(d)));
    }

    // Puts the Debrief addon into WoW's AddOns folder (or updates it); never over a newer copy, say one CurseForge installed.
    // (the app's switches the addon reads at login or /reload: with the recap pop-up on and Copy every pull off, WoW doesn't ask
    // "See your recap?" after a pull (Oct 22))
    static bool flagPopup = true, flagAuto = false;
    static void WriteFlagFile(string dst) {
      try { File.WriteAllText(Path.Combine(dst, "Companion.lua"), "-- Written by Debrief Companion: the app is on this PC, and its switches.\r\nDEBRIEF_HAS_APP = true\r\nDEBRIEF_POPUP = " + (flagPopup ? "true" : "false") + "\r\nDEBRIEF_AUTOCOPY = " + (flagAuto ? "true" : "false") + "\r\n", Encoding.ASCII); } catch { }
    }
    public static void SetFlags(string here, bool popup, bool auto) {
      flagPopup = popup; flagAuto = auto;
      var r = FindRetail(here); if (r == null) return;
      var dst = Path.Combine(r, @"Interface\AddOns\Debrief"); if (Directory.Exists(dst)) WriteFlagFile(dst);
    }
    // (the addon's saved pulls (Oct 22): the last 30 pulls' codes, kept beside the app and written into the addon's Pulls.lua, which
    // WoW reads at login or /reload; the addon adds the ones it doesn't have yet)
    static readonly object pullsLock = new object();
    public static void SavePull(string here, string key, string code) {
      if (string.IsNullOrEmpty(code) || !code.StartsWith("DBF1") || code.Contains("]====]")) return;
      SavePullsFile(here, key, code);
    }
    // (after an addon install copies the folder over: the saved pulls go back into Pulls.lua)
    public static void RewritePulls(string here) { SavePullsFile(here, null, null); }
    static void SavePullsFile(string here, string key, string code) {
      lock (pullsLock) {
        var file = Path.Combine(here, "addon-pulls.txt"); var list = new List<string[]>();
        try { foreach (var ln in File.ReadAllLines(file, Encoding.UTF8)) { var i = ln.IndexOf('\t'); if (i > 0) list.Add(new[] { ln.Substring(0, i), ln.Substring(i + 1) }); } } catch { }
        if (key != null) {
          list.RemoveAll(x => x[0] == key); list.Add(new[] { key, code }); while (list.Count > 30) list.RemoveAt(0);
          try { File.WriteAllLines(file, list.Select(x => x[0] + "\t" + x[1]), new UTF8Encoding(false)); } catch { }
        }
        if (list.Count == 0) return;
        var r = FindRetail(here); if (r == null) return; var dst = Path.Combine(r, @"Interface\AddOns\Debrief"); if (!Directory.Exists(dst)) return;
        var sb = new StringBuilder("-- Written by Debrief Companion: your latest pulls, read when you log in or /reload.\r\nDEBRIEF_PULLS = {\r\n");
        foreach (var x in list) sb.Append("[====[").Append(x[1]).Append("]====],\r\n");
        sb.Append("}\r\n");
        try { File.WriteAllText(Path.Combine(dst, "Pulls.lua"), sb.ToString(), new UTF8Encoding(false)); } catch { }
      }
    }
    public static string InstallAddon(string here) {
      var src = Path.Combine(here, "addon", "Debrief");
      if (!Directory.Exists(src)) return "";
      var r = FindRetail(here);
      if (r == null) return @"Couldn't find WoW to install the addon. Copy the folder addon\Debrief (next to this app) into World of Warcraft\_retail_\Interface\AddOns yourself, or paste your WoW folder in the Companion window.";
      var dst = Path.Combine(r, @"Interface\AddOns\Debrief");
      var v = TocVersion(Path.Combine(src, "Debrief.toc"));
      var have = TocVersion(Path.Combine(dst, "Debrief.toc"));
      bool newer;
      try { newer = have != "" && new Version(have) >= new Version(v); } catch { newer = have == v; }
      // (tells the addon this PC runs the app, so the "See your recap?" prompt comes from your very first boss pull; written every start,
      // so it's back after CurseForge updates the addon)
      Action flag = () => WriteFlagFile(dst);
      if (newer) { flag(); return "The Debrief addon (version " + have + ") is installed in " + dst; }
      try {
        CopyDir(src, dst); RewritePulls(here); // (the saved pulls go back in after the folder is copied over)
        flag();
        return "Installed the Debrief addon (version " + v + ") in " + dst + ". If WoW is open, type /reload.";
      } catch (Exception e) { return "Couldn't install the addon in " + dst + " (" + e.Message + @"). Copy the folder addon\Debrief (next to this app) there yourself."; }
    }

    // The combat log a request names, in the Logs folder or the Warcraft Logs archive next to it.
    public static string FindLog(string here, string name) {
      if (name == null || !System.Text.RegularExpressions.Regex.IsMatch(name, @"^(Archive-)?WoWCombatLog[^\\/:*?""<>|]*\.txt$")) throw new Exception("Not a combat log.");
      var d = FindLogsDir(here); if (d == null) throw new Exception("No WoW Logs folder found.");
      foreach (var p in new[] { Path.Combine(d, name), Path.Combine(d, "warcraftlogsarchive", name) }) if (File.Exists(p)) return p;
      throw new Exception("That combat log is gone.");
    }

    // (the size WoW has written so far: read from the open file, which is always current; the folder listing can lag behind)
    public static long LiveLength(string path) {
      try { using (var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete)) return fs.Length; }
      catch { try { return new FileInfo(path).Length; } catch { return 0; } }
    }

    // (the Archive old logs button: old combat logs move into warcraftlogsarchive next to them, the folder the app already lists
    // as "Older log". Nothing is deleted. The log WoW may be writing stays put: WoW starts a fresh one when logging next turns on)
    public static Dictionary<string, object> ArchiveLogs(string here) {
      var d = FindLogsDir(here); if (d == null) throw new Exception("No WoW Logs folder found.");
      bool on = false; foreach (var n in new[] { "Wow", "WowT", "WowB" }) { try { if (System.Diagnostics.Process.GetProcessesByName(n).Length > 0) on = true; } catch { } }
      return ArchiveIn(d, on);
    }
    public static Dictionary<string, object> ArchiveIn(string d, bool wowOn) {
      var arc = Path.Combine(d, "warcraftlogsarchive"); Directory.CreateDirectory(arc);
      int moved = 0; long bytes = 0; var kept = new List<object>();
      var files = new DirectoryInfo(d).GetFiles("WoWCombatLog*.txt").OrderByDescending(f => f.LastWriteTimeUtc).ToList();
      for (int i = 0; i < files.Count; i++) {
        var f = files[i];
        // (WoW is open: its newest log, or any written in the last 10 minutes, may still be in use)
        if (wowOn && (i == 0 || DateTime.UtcNow - f.LastWriteTimeUtc < TimeSpan.FromMinutes(10))) { kept.Add(f.Name); continue; }
        var to = Path.Combine(arc, "Archive-" + f.Name);
        for (int k = 2; File.Exists(to); k++) to = Path.Combine(arc, "Archive-" + Path.GetFileNameWithoutExtension(f.Name) + " (" + k + ").txt");
        try { long len = f.Length; File.Move(f.FullName, to); moved++; bytes += len; } catch { kept.Add(f.Name); }
      }
      return new Dictionary<string, object> { { "moved", moved }, { "mb", (long)Math.Round(bytes / 1048576.0) }, { "kept", kept }, { "wow", wowOn } };
    }

    public static FileInfo NewestLog(string dir) {
      try { return new DirectoryInfo(dir).GetFiles("WoWCombatLog*.txt").OrderByDescending(f => f.LastWriteTimeUtc).FirstOrDefault(); } catch { return null; }
    }
  }
}
