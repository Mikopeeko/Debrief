// Windowed (Fullscreen) for a true-Fullscreen player who says yes (Nov 3, the studio's walkthrough-brief.md; Flex: "Is there a way to ask them if they
// want to change their game settings to full screen windowed and then it changes by them pressing yes?"). It lives in WoW's own WTF\Config.wtf:
// SET gxWindow "1" and SET gxMaximize "1", and only those two lines change, after a copy (Config.wtf.debrief-backup). WoW writes that file when it
// closes, which would undo a change made while it runs, so with WoW open the change waits until WoW has closed and finished saving, then is checked.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

namespace Debrief {
  public static class WinMode {
    static string state = "", msg = ""; static bool waiting; static readonly object gate = new object();
    const string Failed = "Couldn't change it: in WoW, Options › Graphics › Display Mode › Windowed (Fullscreen).";
    static bool WowOpen() { foreach (var n in new[] { "Wow", "WowT", "WowB" }) { try { if (Process.GetProcessesByName(n).Length > 0) return true; } catch { } } return false; }
    public static Dictionary<string, object> Info() { return new Dictionary<string, object> { { "wow", WowOpen() }, { "state", state }, { "msg", msg } }; }
    public static Dictionary<string, object> Switch(string here) {
      var retail = Wow.FindRetail(here); var cfg = retail == null ? null : Path.Combine(retail, @"WTF\Config.wtf");
      if (cfg == null || !File.Exists(cfg)) { state = "error"; msg = Failed; return Info(); }
      if (WowOpen()) {
        lock (gate) { if (!waiting) { waiting = true; state = "queued"; msg = "Debrief switches it the moment you close WoW, and it's ready next time."; new Thread(() => Wait(cfg)) { IsBackground = true }.Start(); } }
        return Info();
      }
      Finish(Apply(cfg)); return Info();
    }
    static void Wait(string cfg) {
      while (WowOpen()) Thread.Sleep(2000);
      Thread.Sleep(6000); // (WoW's own save as it closes)
      bool ok = Apply(cfg); lock (gate) { waiting = false; } Finish(ok);
    }
    static void Finish(bool ok) { state = ok ? "done" : "error"; msg = ok ? "Done: WoW opens in Windowed (Fullscreen) next time." : Failed; Program.Log("display mode: " + (ok ? "Windowed (Fullscreen) set" : "couldn't be set")); }
    static bool Apply(string cfg) {
      try {
        var bak = cfg + ".debrief-backup"; if (!File.Exists(bak)) File.Copy(cfg, bak); // (the first copy is kept: the player's own settings)
        var text = File.ReadAllText(cfg); text = Set(Set(text, "gxWindow"), "gxMaximize");
        File.WriteAllText(cfg, text, new UTF8Encoding(false));
        var back = File.ReadAllText(cfg); return Has(back, "gxWindow") && Has(back, "gxMaximize"); // (it stuck)
      } catch (Exception e) { Program.Log("display mode: " + e.Message); return false; }
    }
    static string Set(string t, string k) {
      var re = new Regex("^SET " + k + " \"[^\"]*\"", RegexOptions.Multiline | RegexOptions.IgnoreCase);
      if (re.IsMatch(t)) return re.Replace(t, "SET " + k + " \"1\"");
      var nl = t.Contains("\r\n") ? "\r\n" : "\n"; return t + (t.Length > 0 && !t.EndsWith("\n") ? nl : "") + "SET " + k + " \"1\"" + nl;
    }
    static bool Has(string t, string k) { return Regex.IsMatch(t, "^SET " + k + " \"1\"", RegexOptions.Multiline | RegexOptions.IgnoreCase); }
  }
}
