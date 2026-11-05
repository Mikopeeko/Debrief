// The raid note each pull had (Nov 5, the studio's auto-note-brief.md; Flex: "ok make it happen asap!"): the addon copies the note NSRT or MRT has
// loaded at every pull into its saved settings, and this reads them for the website (GET /log/notes), so Debriefing uses the game's note and
// nobody pastes one. WoW writes the file at /reload, logout or quit. Until then (or with the addon off), NSRT's or MRT's own saved note stands in
// for the whole night. Only reads.
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace Debrief {
  static class Notes {
    // (every account's saved file of that name, newest first)
    static List<FileInfo> Saved(string here, string name) {
      var r = Wow.FindRetail(here); if (r == null) return new List<FileInfo>();
      var acc = Path.Combine(r, @"WTF\Account"); if (!Directory.Exists(acc)) return new List<FileInfo>();
      try {
        return Directory.GetDirectories(acc).Select((a) => new FileInfo(Path.Combine(a, "SavedVariables", name))).Where((f) => f.Exists).OrderByDescending((f) => f.LastWriteTimeUtc).ToList();
      } catch { return new List<FileInfo>(); }
    }

    // (a Lua string as WoW saves it: \" \\ \n \r \t and \ddd)
    static string Unq(string s) {
      var b = new StringBuilder(s.Length);
      for (int i = 0; i < s.Length; i++) {
        var c = s[i]; if (c != '\\' || i + 1 >= s.Length) { b.Append(c); continue; }
        var n = s[++i];
        if (n == 'n') b.Append('\n'); else if (n == 'r') b.Append('\r'); else if (n == 't') b.Append('\t');
        else if (char.IsDigit(n)) { int j = i, v = 0; while (j < s.Length && j < i + 3 && char.IsDigit(s[j])) { v = v * 10 + (s[j] - '0'); j++; } b.Append((char)v); i = j - 1; }
        else b.Append(n);
      }
      return b.ToString();
    }
    // (WoW writes the file as UTF-8 bytes; \ddd escapes are bytes too, so the text is put back together as bytes)
    static string Utf8(string s) { try { return Encoding.UTF8.GetString(s.Select((ch) => (byte)ch).ToArray()); } catch { return s; } }
    static string Read(string f) { return Encoding.GetEncoding(28591).GetString(File.ReadAllBytes(f)); } // (byte for byte; Utf8() turns strings back into text)

    // (the table that follows ["key"] = {, up to its closing brace, skipping braces inside strings)
    static string Block(string s, string key, int from = 0) {
      var i = s.IndexOf("[\"" + key + "\"] = {", from, StringComparison.Ordinal); if (i < 0) return null;
      int st = s.IndexOf('{', i), d = 0; bool q = false;
      for (int j = st; j < s.Length; j++) {
        var c = s[j];
        if (q) { if (c == '\\') j++; else if (c == '"') q = false; continue; }
        if (c == '"') q = true; else if (c == '{') d++; else if (c == '}' && --d == 0) return s.Substring(st + 1, j - st - 1);
      }
      return null;
    }
    static readonly Regex KV = new Regex(@"\[""(\w+)""\] = (""(?:[^""\\]|\\.)*""|-?[\d.]+)", RegexOptions.Compiled);
    static readonly Regex REC = new Regex(@"\{((?:[^{}""]|""(?:[^""\\]|\\.)*"")*)\}", RegexOptions.Compiled);
    static readonly Regex TXT = new Regex(@"\[""([^""]+)""\] = (""(?:[^""\\]|\\.)*"")", RegexOptions.Compiled);
    static object Val(string v) { if (v.StartsWith("\"")) return Utf8(Unq(v.Substring(1, v.Length - 2))); double d; return double.TryParse(v, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out d) ? (object)d : v; }

    public static Dictionary<string, object> All(string here) {
      var pulls = new List<Dictionary<string, object>>(); var texts = new Dictionary<string, object>(); var seen = new HashSet<string>();
      // (the addon's copy, every account's)
      foreach (var f in Saved(here, "Debrief.lua")) {
        try {
          var s = Read(f.FullName); var db = Block(s, "notes"); var tx = Block(s, "noteText");
          if (tx != null) foreach (Match m in TXT.Matches(tx)) texts[m.Groups[1].Value] = Val(m.Groups[2].Value);
          if (db != null) foreach (Match m in REC.Matches(db)) {
            var o = new Dictionary<string, object>(); foreach (Match k in KV.Matches(m.Groups[1].Value)) o[k.Groups[1].Value] = Val(k.Groups[2].Value);
            if (!o.ContainsKey("h") || !o.ContainsKey("t")) continue;
            var key = o["t"] + "|" + (o.ContainsKey("e") ? o["e"] : ""); if (!seen.Add(key)) continue;
            o["t"] = Convert.ToDouble(o["t"]) * 1000; o["h"] = Convert.ToString(o["h"], System.Globalization.CultureInfo.InvariantCulture); pulls.Add(o);
          }
        } catch { }
      }
      // (the stand-in: the note NSRT, else MRT, saved last; for every pull of its boss that night)
      Dictionary<string, object> fb = null;
      foreach (var f in Saved(here, "NorthernSkyRaidTools.lua").Take(1)) {
        try {
          var s = Read(f.FullName); var m = Regex.Match(s, @"\[""StoredSharedReminder""\] = (""(?:[^""\\]|\\.)*"")"); if (!m.Success) continue;
          var text = (string)Val(m.Groups[1].Value); if (string.IsNullOrWhiteSpace(text)) continue;
          var n = Regex.Match(s, @"\[""ActiveReminder""\] = (""(?:[^""\\]|\\.)*"")");
          fb = new Dictionary<string, object> { { "s", "NSRT" }, { "n", n.Success ? Val(n.Groups[1].Value) : null }, { "text", text }, { "at", Server.Ms(f.LastWriteTimeUtc) } };
        } catch { }
      }
      if (fb == null) foreach (var f in Saved(here, "MRT.lua").Take(1)) {
        try {
          var s = Read(f.FullName); var nt = Block(s, "Note"); if (nt == null) continue;
          var m = Regex.Match(nt, @"\[""Text1""\] = (""(?:[^""\\]|\\.)*"")"); if (!m.Success) continue;
          var text = (string)Val(m.Groups[1].Value); if (string.IsNullOrWhiteSpace(text)) continue;
          fb = new Dictionary<string, object> { { "s", "MRT" }, { "n", null }, { "text", text }, { "at", Server.Ms(f.LastWriteTimeUtc) } };
        } catch { }
      }
      return new Dictionary<string, object> { { "pulls", pulls }, { "texts", texts }, { "fallback", fb } };
    }
  }
}
