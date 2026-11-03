// The recap pop-up (Oct 22): a window that floats over WoW right after a boss pull. It never takes focus from the game: Windows shows it without
// activating it, it has no taskbar button, and it stays on top. It hides when the next pull starts or when you close it.
// (Nov 3, the studio's popup-shape-brief.md; Flex: "have it pop up in the middle of the screen and by default be 1 column, if its more than half the
// height of the screen 2 columns", "Make the edges of the window clean like the website, and let them drag the corner/edges of the window to resize it",
// "whats the maximum length we should make it?"): always a floating window, never docked. By default it fits the pull: one column about 520 px wide and
// exactly as tall as the card (at least 360 px); if that's taller than 60% of the screen, two columns about 1000 px wide; if even that is, it stops at
// 60% and scrolls. It opens centred on the chosen screen with its top 12% down, is sized before it shows, and each new pull re-fits with the top edge
// staying put. Once you move or resize it, your size and place win (popup-place.txt) until Settings' Size and place: Reset. The page draws invisible
// resize edges (they start a real Windows resize); Windows 11 gives it small round corners and the site's 1 px line, Windows 10 a square line.
using System;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Debrief {
  class PopupForm : Form {
    readonly MainForm main; readonly string here; readonly int port; readonly CoreWebView2Environment env;
    readonly WebView2 web = new WebView2();
    readonly Timer fitTimer = new Timer { Interval = 2500 }; // (if the card never reports its height, it shows anyway)
    string pending; bool ready, starting, w11;
    bool userPlaced, locked, moved, resized, fitting; Rectangle userR; int fitStage; long resetSeen = -1; string wantScreen = "main"; double sizeZ = 1;

    public PopupForm(MainForm main, string here, int port, CoreWebView2Environment env) {
      this.main = main; this.here = here; this.port = port; this.env = env;
      Text = "Debrief recap";
      FormBorderStyle = FormBorderStyle.None; ShowInTaskbar = false; TopMost = true;
      StartPosition = FormStartPosition.Manual; AutoScaleMode = AutoScaleMode.None;
      BackColor = Color.FromArgb(0x17, 0x1a, 0x22);
      web.Dock = DockStyle.Fill; web.DefaultBackgroundColor = BackColor;
      Controls.Add(web);
      fitTimer.Tick += (a, b) => FinishFit(-1);
      LoadPlace();
    }

    // (shown without taking focus: the game keeps your keys and mouse)
    protected override bool ShowWithoutActivation { get { return true; } }
    protected override CreateParams CreateParams {
      get { var cp = base.CreateParams; cp.ExStyle |= 0x08000000 /* WS_EX_NOACTIVATE */ | 0x00000080 /* WS_EX_TOOLWINDOW */ | 0x00000008 /* WS_EX_TOPMOST */; return cp; }
    }
    // (the website's edges: on Windows 11 the small round corners and a 1 px #353b49 line; older Windows says no and the page draws a square line)
    protected override void OnHandleCreated(EventArgs e) {
      base.OnHandleCreated(e);
      try { int pref = 3 /* DWMWCP_ROUNDSMALL */; w11 = DwmSetWindowAttribute(Handle, 33 /* DWMWA_WINDOW_CORNER_PREFERENCE */, ref pref, 4) == 0;
        if (w11) { int col = 0x00493b35 /* #353b49 as BGR */; DwmSetWindowAttribute(Handle, 34 /* DWMWA_BORDER_COLOR */, ref col, 4); } } catch { w11 = false; }
    }

    async Task Start() {
      try {
        await web.EnsureCoreWebView2Async(env);
        var cw = web.CoreWebView2;
        cw.Settings.UserAgent = cw.Settings.UserAgent + " " + Server.AppMark + Program.Version;
        cw.Settings.AreDevToolsEnabled = Environment.GetEnvironmentVariable("DBF_DEV") != null;
        cw.Settings.IsStatusBarEnabled = false; cw.Settings.AreDefaultContextMenusEnabled = false;
        cw.Settings.IsZoomControlEnabled = false;
        try { cw.Settings.IsNonClientRegionSupportEnabled = true; } catch { /* (older WebView2: the top can't be dragged) */ }
        cw.NewWindowRequested += (a, e) => { e.Handled = true; };
        cw.NavigationStarting += (a, e) => { if (!e.Uri.StartsWith("http://localhost:" + port + "/")) e.Cancel = true; };
        cw.WebMessageReceived += OnMessage;
        cw.Navigate("http://localhost:" + port + "/popup");
      } catch (Exception e) { Program.Log("popup: " + e.Message); }
    }

    // (a pull's recap, as JSON from the main window's page)
    public void ShowRecap(string json) {
      var look = Wow.AddonLook(here);
      if (json.StartsWith("{")) { string lk = "{}"; try { lk = new System.Web.Script.Serialization.JavaScriptSerializer().Serialize(Wow.AddonCard(here)); } catch { } json = "{\"look\":\"" + look[1] + "\",\"lk\":" + lk + "," + json.Substring(1); } // (who you are, from WoW's folders)
      pending = json;
      if (userPlaced && OnScreen(userR)) { Place(userR.X, userR.Y, userR.Width, userR.Height); ShowNoFocus(); } // (your size and place)
      else BeginFit(false);
      if (web.CoreWebView2 == null) { if (!starting) { starting = true; var h = Handle; BeginInvoke(new Action(async () => await Start())); } }
      else if (ready) Send(json);
    }
    // (the recap hotkey (Nov 1): the last recap again, on top of the game (windowed or windowed fullscreen), without taking focus)
    public bool HasRecap { get { return pending != null; } }
    public void ShowAgain() { if (userPlaced && OnScreen(userR)) Place(userR.X, userR.Y, userR.Width, userR.Height); ShowNoFocus(); }
    void ShowNoFocus() { if (!Visible) Show(); SetWindowPos(Handle, (IntPtr)(-1) /* HWND_TOPMOST */, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010 | 0x0040 /* NOSIZE NOMOVE NOACTIVATE SHOWWINDOW */); }
    void Send(string json) { try { web.CoreWebView2.PostWebMessageAsJson(json); } catch (Exception e) { Program.Log("popup send: " + e.Message); } }
    void Tell(string m) { try { if (web.CoreWebView2 != null) web.CoreWebView2.PostWebMessageAsString(m); } catch { } }

    void OnMessage(object s, CoreWebView2WebMessageReceivedEventArgs e) {
      string m; try { m = e.TryGetWebMessageAsString() ?? ""; } catch { return; }
      if (m == "ready") { ready = true; Tell(w11 ? "frame:w11" : "frame:w10"); if (pending != null) Send(pending); if (fitting) { fitTimer.Stop(); fitTimer.Start(); } }
      else if (m == "close") Hide();
      else if (m == "open") main.ShowInFront();
      else if (m == "settings") main.ShowSettings(); // (the gear (Nov 3))
      else if (m.StartsWith("set:")) ApplySet(m.Substring(4)); // (the settings window's Screen, Lock in place, Size and Size and place: Reset)
      else if (m.StartsWith("h:")) OnHeight(m.Substring(2)); // (the card's height, for Fit to the pull)
      else if (m.StartsWith("rs:")) { int ht; if (!locked && int.TryParse(m.Substring(3), out ht) && ht >= 10 && ht <= 17) BeginInvoke(new Action(() => { ReleaseCapture(); SendMessage(Handle, 0x00A1 /* WM_NCLBUTTONDOWN */, (IntPtr)ht, IntPtr.Zero); })); } // (a resize edge pressed)
      else if (m.StartsWith("pull:")) main.PopupPull(m.Substring(5)); // (a pull chip: the main page loads that pull's coach box)
      else if (m.StartsWith("key:")) main.PopupKey(m.Substring(4)); // (a key picked from the switch, Saved or the key's name (Nov 1))
      else if (m.StartsWith("cut:")) main.PopupCut(m.Substring(4)); // (Stop at death changed: the main page rebuilds the coach box)
    }

    // ---------- Fit to the pull ----------
    // (one column first, about 520 px; recentre ("recenter") when the screen changed or it isn't shown yet: centred, its top 12% down)
    void BeginFit(bool recenter) {
      var wa = ScreenFor().WorkingArea; int w = Math.Min(Px((int)Math.Round(520 * sizeZ), wa), wa.Width);
      bool fresh = recenter || !Visible || !OnScreen(Bounds);
      int h = fresh ? Math.Max(Px(360, wa), (int)(wa.Height * 0.6)) : Height;
      int x = fresh ? wa.Left + (wa.Width - w) / 2 : Left + (Width - w) / 2, y = fresh ? wa.Top + (int)(wa.Height * 0.12) : Top;
      fitting = true; fitStage = 1; Place(x, y, w, h); fitTimer.Stop(); fitTimer.Start();
      Tell("refit");
    }
    // ("h:<height>:<width>" in the page's pixels, measured at the width it's at now; one measured before a resize is passed over)
    void OnHeight(string s) {
      if (!fitting) return;
      var p = s.Split(':'); double hc, wc;
      if (p.Length < 2 || !double.TryParse(p[0], NumberStyles.Float, CultureInfo.InvariantCulture, out hc) || !double.TryParse(p[1], NumberStyles.Float, CultureInfo.InvariantCulture, out wc)) return;
      double sc = Dpi() / 96.0; if (Math.Abs(wc - ClientSize.Width / sc) > 3) return;
      var wa = ScreenFor().WorkingArea; int cap = (int)(wa.Height * 0.6), h = (int)Math.Ceiling(hc * sc);
      if (fitStage == 1 && h > cap) { // (taller than 60% in one column: two columns, about 1000 px)
        fitStage = 2; int w2 = Math.Min(Px((int)Math.Round(1000 * sizeZ), wa), wa.Width - Px(24, wa));
        Place(Left + (Width - w2) / 2, Top, w2, Height); Tell("refit"); return;
      }
      FinishFit(Math.Max(Px(360, wa), Math.Min(cap, h)));
    }
    void FinishFit(int h) {
      fitTimer.Stop(); if (!fitting) return; fitting = false;
      if (h > 0) Place(Left, Top, Width, h);
      ShowNoFocus();
    }
    // (moved or resized programmatically: kept on its screen)
    void Place(int x, int y, int w, int h) {
      var wa = Screen.FromRectangle(new Rectangle(x, y, Math.Max(1, w), Math.Max(1, h))).WorkingArea;
      w = Math.Min(w, wa.Width); h = Math.Min(h, wa.Height);
      x = Math.Max(wa.Left, Math.Min(x, wa.Right - w)); y = Math.Max(wa.Top, Math.Min(y, wa.Bottom - h));
      MinimumSize = new Size(Math.Min(Px(300, wa), wa.Width), Math.Min(Px(360, wa), wa.Height));
      SetBounds(x, y, w, h);
    }

    // ---------- your own size and place ----------
    protected override void WndProc(ref Message m) {
      if (m.Msg == 0x0231 /* WM_ENTERSIZEMOVE */) { moved = false; resized = false; }
      if (m.Msg == 0x0214 /* WM_SIZING */) resized = true;
      if (m.Msg == 0x0216 /* WM_MOVING */) moved = true;
      if (m.Msg == 0x0232 /* WM_EXITSIZEMOVE */ && (moved || resized) && !locked) { userPlaced = true; userR = Bounds; fitting = false; fitTimer.Stop(); SavePlace(); }
      base.WndProc(ref m);
    }
    void ApplySet(string json) {
      try {
        var d = new System.Web.Script.Serialization.JavaScriptSerializer().Deserialize<System.Collections.Generic.Dictionary<string, object>>(json);
        Func<string, object> g = (k) => d.ContainsKey(k) ? d[k] : null;
        locked = g("lock") is bool && (bool)g("lock");
        double z = 1; try { z = Convert.ToDouble(g("size") ?? 1, CultureInfo.InvariantCulture); } catch { } sizeZ = z >= 0.8 && z <= 1.3 ? z : 1;
        long ra = 0; try { ra = Convert.ToInt64(g("resetAt") ?? 0); } catch { }
        bool refit = false;
        if (resetSeen < 0) resetSeen = ra; else if (ra != resetSeen) { resetSeen = ra; userPlaced = false; try { File.Delete(PlaceFile); } catch { } refit = true; } // (Size and place: Reset)
        var sc = g("screen") as string ?? "main"; if (sc != wantScreen) { wantScreen = sc; if (!userPlaced) refit = true; }
        if (refit && Visible) BeginFit(true);
      } catch (Exception e) { Program.Log("popup set: " + e.Message); }
    }
    Screen ScreenFor() {
      var game = GameScreen(); if (wantScreen == "second") foreach (var s in Screen.AllScreens) if (s.DeviceName != game.DeviceName) return s; // (Screen: Second screen)
      return game;
    }
    bool OnScreen(Rectangle r) { foreach (var s in Screen.AllScreens) { var x = Rectangle.Intersect(s.WorkingArea, r); if (x.Width >= 120 && x.Height >= 80) return true; } return false; }
    string PlaceFile { get { return Path.Combine(here, "popup-place.txt"); } } // ("user,<x>,<y>,<width>,<height>"; 0.10.0's "float,…" is a place you chose too, its "dock,…" isn't)
    void LoadPlace() {
      try { var p = File.ReadAllText(PlaceFile).Trim().Split(',');
        if ((p[0] == "user" || p[0] == "float") && p.Length == 5) { userR = new Rectangle(int.Parse(p[1]), int.Parse(p[2]), int.Parse(p[3]), int.Parse(p[4])); userPlaced = true; } } catch { }
    }
    void SavePlace() { try { File.WriteAllText(PlaceFile, "user," + userR.X + "," + userR.Y + "," + userR.Width + "," + userR.Height); } catch { } }

    [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
    [DllImport("user32.dll")] static extern bool ReleaseCapture();
    [DllImport("user32.dll")] static extern IntPtr SendMessage(IntPtr h, int msg, IntPtr w, IntPtr l);
    [DllImport("dwmapi.dll")] static extern int DwmSetWindowAttribute(IntPtr h, int attr, ref int value, int size);
    [DllImport("user32.dll")] static extern int GetDpiForWindow(IntPtr h);
    // (the pop-up's own screen scaling once it has a window, the app's before that; DpiAt: the scaling of the screen a spot is on)
    int Dpi() { int dpi = 96; try { dpi = GetDpiForWindow(IsHandleCreated ? Handle : main.Handle); } catch { } return dpi < 96 ? 96 : dpi; }
    [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }
    [DllImport("user32.dll")] static extern IntPtr MonitorFromRect(ref RECT r, uint flags);
    [DllImport("shcore.dll")] static extern int GetDpiForMonitor(IntPtr mon, int type, out uint dx, out uint dy);
    int DpiAt(Rectangle r) {
      try { var rc = new RECT { L = r.Left, T = r.Top, R = r.Right, B = r.Bottom }; uint dx, dy; if (GetDpiForMonitor(MonitorFromRect(ref rc, 2 /* nearest */), 0 /* effective */, out dx, out dy) == 0 && dx >= 96) return (int)dx; } catch { }
      return Dpi();
    }
    int Px(int v, Rectangle onScreen) { return (int)Math.Round(v * DpiAt(onScreen) / 96.0); }
    static Screen GameScreen() {
      foreach (var n in new[] { "Wow", "WowT", "WowB" }) {
        try { foreach (var p in System.Diagnostics.Process.GetProcessesByName(n)) if (p.MainWindowHandle != IntPtr.Zero) return Screen.FromHandle(p.MainWindowHandle); } catch { }
      }
      return Screen.PrimaryScreen;
    }
  }
}
