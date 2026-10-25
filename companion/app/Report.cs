// "Report a problem" from the app (Oct 24, release polish): your words, the app and addon versions, and the problems the addon noted,
// sent to the project's GitHub through the website's own report address (the same as its Report a problem form). Nothing else is sent.
using System; using System.Collections.Generic; using System.Linq; using System.Net; using System.Text;
using System.Text.RegularExpressions; using System.Web.Script.Serialization;

namespace Debrief {
  public static class Report {
    // (the problems the addon noted: its save holds ["errors"] = { { m = "where: what", n = times, v = version }, ... }, at /reload or logout)
    public static List<string> Errors(string here) {
      var o = new List<string>();
      try {
        var s = Wow.SvText(here); var i = s.LastIndexOf("[\"errors\"] = {"); if (i < 0) return o;
        int start = s.IndexOf('{', i), depth = 0, entry = -1; bool str = false;
        for (int k = start; k < s.Length; k++) {
          char c = s[k];
          if (str) { if (c == '\\') k++; else if (c == '"') str = false; continue; }
          if (c == '"') { str = true; continue; }
          if (c == '{') { depth++; if (depth == 2) entry = k; }
          else if (c == '}') {
            if (depth == 2 && entry >= 0) o.Add(Line(s.Substring(entry, k - entry + 1)));
            depth--; if (depth == 0) break;
          }
        }
        o.RemoveAll(string.IsNullOrEmpty);
      } catch { }
      return o;
    }
    static string Line(string b) {
      var m = Regex.Match(b, "\\[\"m\"\\] = \"((?:[^\"\\\\]|\\\\.)*)\""); if (!m.Success) return "";
      var v = Regex.Match(b, "\\[\"v\"\\] = \"([^\"]*)\""); var n = Regex.Match(b, "\\[\"n\"\\] = (\\d+)");
      var msg = m.Groups[1].Value.Replace("\\\"", "\"").Replace("\\\\", "\\");
      return (v.Success && v.Groups[1].Value != "" ? v.Groups[1].Value + " · " : "") + (n.Success && n.Groups[1].Value != "1" ? n.Groups[1].Value + "x · " : "") + msg;
    }
    public static Dictionary<string, object> Send(string here, string addonVersion, Dictionary<string, object> body) {
      var js = new JavaScriptSerializer();
      try {
        var text = body != null && body.ContainsKey("text") ? Convert.ToString(body["text"]).Trim() : "";
        if (text.Length < 10) return new Dictionary<string, object> { { "error", "Please say a little more about what happened." } };
        var errs = Errors(here);
        var ctx = new Dictionary<string, object> { { "From", "Debrief Companion" }, { "App", Program.Version }, { "Addon", addonVersion ?? "" } };
        if (errs.Count > 0) ctx["Addon problems"] = errs.Skip(Math.Max(0, errs.Count - 5)).ToArray();
        var json = js.Serialize(new Dictionary<string, object> { { "text", "From the Debrief app: " + text }, { "name", "" }, { "ctx", ctx } });
        using (var w = new WebClient()) {
          w.Encoding = Encoding.UTF8;
          w.Headers[HttpRequestHeader.ContentType] = "application/json";
          w.Headers[HttpRequestHeader.UserAgent] = "DebriefCompanion/" + Program.Version;
          w.Headers["Origin"] = "https://debriefme.io";
          var r = w.UploadString("https://debriefme.io/api/bug", "POST", json);
          return js.Deserialize<Dictionary<string, object>>(r) ?? new Dictionary<string, object> { { "ok", true } };
        }
      } catch (WebException e) {
        try { using (var s = new System.IO.StreamReader(e.Response.GetResponseStream())) { var d = js.Deserialize<Dictionary<string, object>>(s.ReadToEnd()); if (d != null && d.ContainsKey("error")) return d; } } catch { }
        Program.Log("report: " + e.Message); return new Dictionary<string, object> { { "error", "The report couldn't be sent right now. Please try again in a minute." } };
      } catch (Exception e) { Program.Log("report: " + e.Message); return new Dictionary<string, object> { { "error", "The report couldn't be sent right now. Please try again in a minute." } }; }
    }
  }
}
