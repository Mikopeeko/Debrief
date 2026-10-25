// The fast combat log scanner, the same code the PowerShell app compiled at start: finds the ENCOUNTER_START /
// ENCOUNTER_END lines and their byte offsets, and makes practice pulls from training dummy fights.
using System; using System.IO; using System.Text; using System.Collections.Generic;

namespace Debrief {
  public static class DbfScan {
    static string Esc(string s) { var b = new StringBuilder(s.Length + 8); foreach (char c in s) { if (c == '"' || c == '\\') { b.Append('\\'); b.Append(c); } else if (c < 32) b.Append(' '); else b.Append(c); } return b.ToString(); }
    // (training dummies: hits on anything named "...Dummy" make a practice pull, closed after 8 quiet seconds; WoW starts no encounter for them)
    class Dummy { public bool open, enc; public DateTime seen, ended; public long startOff, lastEnd; public int startMs, lastMs; public string startTs, lastTs; public Dictionary<string, string> ci = new Dictionary<string, string>(); }
    static readonly Dictionary<string, Dummy> dummies = new Dictionary<string, Dummy>();
    // (a boss pull or a practice pull is open in a log read in the last half hour: the hourly update waits until it's over)
    public static bool Busy() {
      // (and for a few minutes after one ends, while its recap is read and copied)
      lock (dummies) {
        foreach (var d in dummies.Values) {
          // (a practice pull with nothing written for 15 s is over, even when WoW has moved on to a new log that this one never hears from)
          bool quiet = false;
          if (d.open && !d.enc) { int now = (int)DateTime.Now.TimeOfDay.TotalMilliseconds, gap = now - d.lastMs; if (gap < 0) gap += 86400000; quiet = gap > 15000 && gap < 3600000 * 6; }
          if ((d.enc || (d.open && !quiet)) && (DateTime.UtcNow - d.seen).TotalMinutes < 30) return true;
          if ((DateTime.UtcNow - d.ended).TotalSeconds < 20) return true; // (20 s after a pull: its recap is built by then (the user, Oct 22: "make it 20s"))
        }
      }
      return false;
    }
    static int Tod(byte[] h, int n) {
      int sp = -1; for (int i = 0; i < n && i < 20; i++) if (h[i] == 32) { sp = i; break; }
      if (sp < 0 || sp + 12 >= n) return -1;
      int p = sp + 1, hh = 0, mm = 0, ss = 0, ms = 0;
      while (p < n && h[p] != 58) { hh = hh * 10 + (h[p] - 48); p++; } p++;
      while (p < n && h[p] != 58) { mm = mm * 10 + (h[p] - 48); p++; } p++;
      while (p < n && h[p] != 46) { ss = ss * 10 + (h[p] - 48); p++; } p++;
      for (int d = 0; d < 3 && p < n && h[p] >= 48 && h[p] <= 57; d++, p++) ms = ms * 10 + (h[p] - 48);
      return ((hh * 60 + mm) * 60 + ss) * 1000 + ms;
    }
    static bool Has(byte[] h, int n, string s) { for (int i = 0; i + s.Length <= n; i++) { int k = 0; while (k < s.Length && h[i + k] == s[k]) k++; if (k == s.Length) return true; } return false; }
    static void Item(StringBuilder sb, ref bool first, long o, long e, string t) {
      if (!first) sb.Append(','); first = false;
      sb.Append("{\"o\":").Append(o).Append(",\"e\":").Append(e).Append(",\"t\":\"").Append(Esc(t)).Append("\"}");
    }
    static void Close(Dummy d, StringBuilder sb, ref bool first) {
      d.open = false; d.ended = DateTime.UtcNow;
      int dur = d.lastMs - d.startMs; if (dur < 0) dur += 86400000;
      if (dur < 10000) return; // (a few stray hits aren't a practice pull)
      Item(sb, ref first, d.startOff, d.startOff, d.startTs + "  ENCOUNTER_START,990001,\"Training Dummy\",0,0,0");
      Item(sb, ref first, d.lastEnd, d.lastEnd, d.lastTs + "  ENCOUNTER_END,990001,\"Training Dummy\",0,0,0," + dur);
    }
    public static string Scan(string path, long from) {
      var sb = new StringBuilder(); sb.Append("{\"items\":[");
      bool first = true; long done;
      Dummy dm; lock (dummies) { if (!dummies.TryGetValue(path, out dm) || from == 0) { dm = new Dummy(); dummies[path] = dm; } }
      dm.seen = DateTime.UtcNow;
      using (var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete, 1 << 16)) {
        long len = fs.Length; if (from < 0 || from > len) from = 0; done = from;
        fs.Seek(from, SeekOrigin.Begin);
        byte[] buf = new byte[1 << 22]; byte[] head = new byte[600]; int hn = 0;
        long lineStart = from, abs = from; int n;
        while ((n = fs.Read(buf, 0, buf.Length)) > 0) {
          for (int i = 0; i < n; i++) {
            byte c = buf[i];
            if (c == 10) {
              if (hn > 24) {
                int lim = Math.Min(hn - 12, 64), dbl = -1;
                for (int k = 0; k < lim; k++) {
                  if (head[k] == 32 && head[k + 1] == 32) { dbl = k; }
                  // (a key starting or ending: CHALLENGE_MODE_START / _END, for the level of the dungeon bosses inside it (Oct 24))
                  if (head[k] == 32 && head[k + 1] == 32 && head[k + 2] == 67 && head[k + 3] == 72 && head[k + 4] == 65 && head[k + 11] == 95 && hn > k + 18 && (head[k + 17] == 83 || head[k + 17] == 69)) {
                    Item(sb, ref first, lineStart, abs + i + 1, Encoding.UTF8.GetString(head, 0, hn).TrimEnd('\r'));
                    break;
                  }
                  if (head[k] == 32 && head[k + 1] == 32 && head[k + 2] == 69 && head[k + 3] == 78 && head[k + 4] == 67 && head[k + 11] == 95) {
                    if (dm.open) Close(dm, sb, ref first);
                    dm.enc = head[k + 12] == 83; if (!dm.enc) dm.ended = DateTime.UtcNow; // (ENCOUNTER_START opens a boss pull, ENCOUNTER_END closes it)
                    string t = Encoding.UTF8.GetString(head, 0, hn).TrimEnd('\r');
                    Item(sb, ref first, lineStart, abs + i + 1, t);
                    break;
                  }
                  if (dbl >= 0) break;
                }
                // (each player's spec, as WoW writes it at a boss pull: a later practice pull in the same log uses it)
                if (dbl > 0 && hn > dbl + 17 && head[dbl + 2] == 67 && head[dbl + 3] == 79 && head[dbl + 4] == 77 && head[dbl + 11] == 95 && head[dbl + 16] == 44) {
                  string[] cf = Encoding.UTF8.GetString(head, dbl + 17, hn - dbl - 17).Split(',');
                  if (cf.Length > 25 && cf[0].StartsWith("Player-")) { int sp; if (int.TryParse(cf[24], out sp) && sp > 0) dm.ci[cf[0]] = cf[24]; else if (int.TryParse(cf[23], out sp) && sp > 0) dm.ci[cf[0]] = cf[23]; }
                }
                if (dbl > 0) {
                  int ms = Tod(head, dbl);
                  if (dm.open && ms >= 0) { int gap = ms - dm.lastMs; if (gap < 0) gap += 86400000; if (gap > 8000) Close(dm, sb, ref first); }
                  if (ms >= 0 && Has(head, hn, "_DAMAGE,") && Has(head, hn, "Dummy\"")) {
                    string ts = Encoding.UTF8.GetString(head, 0, dbl);
                    if (!dm.open) { dm.open = true; dm.startOff = lineStart; dm.startMs = ms; dm.startTs = ts; }
                    dm.lastEnd = abs + i + 1; dm.lastMs = ms; dm.lastTs = ts;
                  }
                }
              }
              lineStart = abs + i + 1; done = lineStart; hn = 0;
            } else if (hn < head.Length) head[hn++] = c;
          }
          abs += n;
        }
        // (nothing written for a while after the last hit: the practice pull is over)
        if (dm.open) { int now = (int)DateTime.Now.TimeOfDay.TotalMilliseconds, gap = now - dm.lastMs; if (gap < 0) gap += 86400000; if (gap > 9000 && gap < 3600000) Close(dm, sb, ref first); }
        sb.Append("],\"done\":").Append(done).Append(",\"size\":").Append(len).Append(",\"dummy\":").Append(dm.open ? "true" : "false").Append(",\"ci\":{");
        bool fc = true; foreach (var kv in dm.ci) { if (!fc) sb.Append(','); fc = false; sb.Append('"').Append(Esc(kv.Key)).Append("\":").Append(kv.Value); }
        sb.Append("}}");
      }
      return sb.ToString();
    }
  }
}
