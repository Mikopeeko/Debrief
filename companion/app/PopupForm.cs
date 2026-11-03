// The recap pop-up (Oct 22): a small window that floats over WoW right after a boss pull ("Your recap is ready", one click
// for the coach card). It never takes focus from the game: Windows shows it without activating it, it has no taskbar
// button, and it stays on top. It hides when the next pull starts or when you close it.
// (layout A since Nov 1: a full-height side panel on the right or left edge of the game's screen; drag its inner edge for width)
using System;
using System.Drawing;
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
    string pending; bool ready, starting, placed;
    // (Nov 3, the studio's pop-up-only-brief.md: a window you can place. Drag the header to move it, any edge or corner to resize it; dropped against the
    // left or right edge of a screen it docks as the full-height side panel again, which stays the default. Kept in popup-place.txt:
    // "dock,<left|right>,<screen>" or "float,<x>,<y>,<width>,<height>")
    bool floating, moved, resized; Rectangle floatR; string dockSide, dockScreen;
    bool locked; long resetSeen = -1; string wantScreen = "main";
    void ApplySet(string json) {
      try {
        var d = new System.Web.Script.Serialization.JavaScriptSerializer().Deserialize<System.Collections.Generic.Dictionary<string, object>>(json);
        Func<string, object> g = (k) => d.ContainsKey(k) ? d[k] : null; bool redock = false;
        locked = g("lock") is bool && (bool)g("lock");
        long ra = 0; try { ra = Convert.ToInt64(g("resetAt") ?? 0); } catch { }
        if (resetSeen < 0) resetSeen = ra; else if (ra != resetSeen) { resetSeen = ra; floating = false; dockScreen = null; try { File.Delete(SideFile); } catch { } redock = true; } // (Size and place: Reset)
        var sc = g("screen") as string ?? "main"; if (sc != wantScreen) { wantScreen = sc; dockScreen = null; redock = true; }
        var side = g("side") as string; if ((side == "left" || side == "right") && side != dockSide) { dockSide = side; redock = true; }
        if (redock) { if (!floating) SavePlace(); if (placed && Visible) Dock(); }
      } catch (Exception e) { Program.Log("popup set: " + e.Message); }
    }

    public PopupForm(MainForm main, string here, int port, CoreWebView2Environment env) {
      this.main = main; this.here = here; this.port = port; this.env = env;
      Text = "Debrief recap";
      FormBorderStyle = FormBorderStyle.None; ShowInTaskbar = false; TopMost = true;
      StartPosition = FormStartPosition.Manual; AutoScaleMode = AutoScaleMode.None;
      BackColor = Color.FromArgb(0x17, 0x1a, 0x22);
      web.Dock = DockStyle.Fill; web.DefaultBackgroundColor = BackColor;
      Controls.Add(web);
      LoadPlace();
    }

    // (shown without taking focus: the game keeps your keys and mouse)
    protected override bool ShowWithoutActivation { get { return true; } }
    protected override CreateParams CreateParams {
      get { var cp = base.CreateParams; cp.ExStyle |= 0x08000000 /* WS_EX_NOACTIVATE */ | 0x00000080 /* WS_EX_TOOLWINDOW */ | 0x00000008 /* WS_EX_TOPMOST */; return cp; }
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
      // (as wide as the card style picked in the addon: Detailed is the widest, and opens more; Oct 22)
      // (sized for the screen it opens on, not the app's: a 4K screen at 150% needs 1.5 times the pixels, or the recap comes out
      // two-thirds size, one column and cut off (the user's screenshot, Oct 24))
      var look = Wow.AddonLook(here);
      if (json.StartsWith("{")) { string lk = "{}"; try { lk = new System.Web.Script.Serialization.JavaScriptSerializer().Serialize(Wow.AddonCard(here)); } catch { } json = "{\"look\":\"" + look[1] + "\",\"lk\":" + lk + "," + json.Substring(1); } // (and your /db card settings (Oct 24))
      pending = json;
      placed = true; Dock(); // (the side panel, at its side and width (Nov 1))
      if (!Visible) { Show(); SetWindowPos(Handle, (IntPtr)(-1) /* HWND_TOPMOST */, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010 | 0x0040 /* NOSIZE NOMOVE NOACTIVATE SHOWWINDOW */); }
      if (web.CoreWebView2 == null) { if (!starting) { starting = true; BeginInvoke(new Action(async () => await Start())); } }
      else if (ready) Send(json);
    }
    bool docking, sizing; const int EdgeW = 6;
    // (the recap hotkey (Nov 1): the last recap again, on top of the game (windowed or windowed fullscreen), without taking focus)
    public bool HasRecap { get { return pending != null; } }
    public void ShowAgain() { if (placed) Dock(); if (!Visible) Show(); SetWindowPos(Handle, (IntPtr)(-1) /* HWND_TOPMOST */, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010 | 0x0040 /* NOSIZE NOMOVE NOACTIVATE SHOWWINDOW */); }
    void Send(string json) { try { web.CoreWebView2.PostWebMessageAsJson(json); } catch (Exception e) { Program.Log("popup send: " + e.Message); } }

    void OnMessage(object s, CoreWebView2WebMessageReceivedEventArgs e) {
      string m; try { m = e.TryGetWebMessageAsString() ?? ""; } catch { return; }
      if (m == "ready") { ready = true; if (pending != null) Send(pending); }
      else if (m == "close") Hide();
      else if (m == "open") main.ShowInFront();
      else if (m == "settings") main.ShowSettings(); // (the gear (Nov 3))
      else if (m.StartsWith("set:")) ApplySet(m.Substring(4)); // (the settings window's Side, Screen, Lock in place and Size and place: Reset)
      else if (m.StartsWith("pull:")) main.PopupPull(m.Substring(5)); // (a pull chip: the main page loads that pull's coach box)
      else if (m.StartsWith("key:")) main.PopupKey(m.Substring(4)); // (a key picked from the switch, Saved or the key's name (Nov 1))
      else if (m.StartsWith("cut:")) main.PopupCut(m.Substring(4)); // (Stop at death changed: the main page rebuilds the coach box)
      else if (m.StartsWith("cols:") || m.StartsWith("w:") || m.StartsWith("h:")) { } // (one shape since layout A (Nov 1): the panel keeps its full height and width, whatever the card asks)
    }

    // (twice as wide as before, two columns (Oct 23); the addon's Width picks a little more or less)
    // (one column like /recap since Oct 24: the addon's card widths (360, 400, 480, 560, 680), a little roomier)
    static int WidthOf(string w) { return w == "narrow" ? 420 : w == "wide" ? 540 : w == "large" ? 620 : w == "xl" ? 740 : 460; }

    // ---------- layout A (Nov 1, Flex: "Lets just do A"): a side panel against the right edge of the game's screen (or the left, from /db's Side),
    // its full working height; as wide as the addon's Width, or the width its inner edge was dragged to (kept until Width changes in /db).
    // One column that scrolls inside; it never doubles, follows the card's height, or moves ----------
    void Dock() {
      MinimumSize = new Size(Px(300), Px(360));
      if (floating) { // (where it was left, while that spot is still on a screen)
        bool seen = false; foreach (var s in Screen.AllScreens) { var x = Rectangle.Intersect(s.WorkingArea, floatR); if (x.Width >= Px(120) && x.Height >= Px(80)) seen = true; }
        if (seen) { docking = true; try { SetBounds(floatR.X, floatR.Y, Math.Max(floatR.Width, MinimumSize.Width), Math.Max(floatR.Height, MinimumSize.Height)); } finally { docking = false; }
          var pf = new Padding(EdgeW); if (Padding != pf) Padding = pf; return; } // (a thin frame all round to resize from)
        floating = false;
      }
      var look = Wow.AddonLook(here); var wa = DockScreen().WorkingArea; bool left = dockSide != null ? dockSide == "left" : look.Length > 2 && look[2] == "left";
      int dpi = DpiAt(wa), w = SavedW(look[0]); if (w <= 0) w = (int)Math.Round(WidthOf(look[0]) * dpi / 96.0);
      w = Math.Max((int)Math.Round(380 * dpi / 96.0), Math.Min(w, (int)(wa.Width * 0.6)));
      docking = true; try { SetBounds(left ? wa.Left : wa.Right - w, wa.Top, w, wa.Height); } finally { docking = false; }
      var pad = left ? new Padding(0, 0, EdgeW, 0) : new Padding(EdgeW, 0, 0, 0); if (Padding != pad) Padding = pad; // (the inner edge: a thin strip to drag)
    }
    protected override void OnMove(EventArgs e) { base.OnMove(e); if (placed && Visible && !docking && !sizing) BeginInvoke(new Action(Dock)); } // (it stays docked)
    protected override void WndProc(ref Message m) {
      if (m.Msg == 0x0084 /* WM_NCHITTEST */ && placed) {
        long lp = m.LParam.ToInt64(); var p = PointToClient(new Point((short)(lp & 0xffff), (short)((lp >> 16) & 0xffff)));
        if (locked) { } // (Lock in place: no resizing)
        else if (floating) { // (every edge and corner)
          int e = EdgeW + 2; bool L = p.X < e, R = p.X >= ClientSize.Width - e, T = p.Y < e, B = p.Y >= ClientSize.Height - e;
          int hit = T && L ? 13 : T && R ? 14 : B && L ? 16 : B && R ? 17 : L ? 10 : R ? 11 : T ? 12 : B ? 15 : 0; /* HTTOPLEFT … HTBOTTOM */
          if (hit != 0) { m.Result = (IntPtr)hit; return; }
        } else {
          bool left = Padding.Right > 0;
          if (!left && p.X < EdgeW) { m.Result = (IntPtr)10 /* HTLEFT */; return; }
          if (left && p.X >= ClientSize.Width - EdgeW) { m.Result = (IntPtr)11 /* HTRIGHT */; return; }
        }
      }
      if (m.Msg == 0x0231 /* WM_ENTERSIZEMOVE */) { sizing = true; moved = false; resized = false; }
      if (m.Msg == 0x0214 /* WM_SIZING */) resized = true;
      if (m.Msg == 0x0216 /* WM_MOVING */) moved = true;
      if (m.Msg == 0x0232 /* WM_EXITSIZEMOVE */) { sizing = false; AfterDrag(); }
      base.WndProc(ref m);
    }
    // (a drag just ended: the docked panel's inner edge keeps its width; a move that ends against the left or right edge of a screen docks it there,
    // anywhere else it floats, a little shorter than the full height when it leaves the side)
    void AfterDrag() {
      if ((!moved && !resized) || locked) return;
      if (!floating && !moved) { SaveW(); BeginInvoke(new Action(Dock)); return; }
      var sc = Screen.FromRectangle(Bounds); var wa = sc.WorkingArea; int snap = Px(24);
      if (moved && Left <= wa.Left + snap) { floating = false; dockSide = "left"; dockScreen = sc.DeviceName; TellSide(); }
      else if (moved && Right >= wa.Right - snap) { floating = false; dockSide = "right"; dockScreen = sc.DeviceName; TellSide(); }
      else { var r = Bounds; if (!floating && r.Height > wa.Height * 0.8) r.Height = (int)(wa.Height * 0.75); floating = true; floatR = r; }
      SavePlace(); BeginInvoke(new Action(Dock));
    }
    void TellSide() { try { web.CoreWebView2.PostWebMessageAsString("side:" + dockSide); } catch { } } // (the settings window's Side follows a snap)
    Screen DockScreen() {
      if (dockScreen != null) foreach (var s in Screen.AllScreens) if (s.DeviceName == dockScreen) return s;
      var game = GameScreen(); if (wantScreen == "second") foreach (var s in Screen.AllScreens) if (s.DeviceName != game.DeviceName) return s; // (Screen: Second screen)
      return game;
    }
    string PlaceFile { get { return Path.Combine(here, "popup-place.txt"); } }
    void LoadPlace() {
      try { var p = File.ReadAllText(PlaceFile).Trim().Split(',');
        if (p[0] == "float" && p.Length == 5) { floatR = new Rectangle(int.Parse(p[1]), int.Parse(p[2]), int.Parse(p[3]), int.Parse(p[4])); floating = true; }
        else if (p[0] == "dock" && p.Length > 1) { dockSide = p[1] == "left" ? "left" : "right"; if (p.Length > 2 && p[2] != "") dockScreen = p[2]; } } catch { }
    }
    void SavePlace() { try { File.WriteAllText(PlaceFile, floating ? "float," + floatR.X + "," + floatR.Y + "," + floatR.Width + "," + floatR.Height : "dock," + dockSide + "," + (dockScreen ?? "")); } catch { } }
    string SideFile { get { return Path.Combine(here, "popup-side.txt"); } } // ("<the addon's Width>,<pixels>": a dragged width, for that Width setting)
    int SavedW(string widthSetting) { try { var p = File.ReadAllText(SideFile).Split(','); if (p.Length > 1 && p[0] == widthSetting) return int.Parse(p[1]); } catch { } return 0; }
    void SaveW() { try { File.WriteAllText(SideFile, Wow.AddonLook(here)[0] + "," + Width); } catch { } }

    [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
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
    int Px(int v) { return (int)Math.Round(v * Dpi() / 96.0); }
    static Screen GameScreen() {
      foreach (var n in new[] { "Wow", "WowT", "WowB" }) {
        try { foreach (var p in System.Diagnostics.Process.GetProcessesByName(n)) if (p.MainWindowHandle != IntPtr.Zero) return Screen.FromHandle(p.MainWindowHandle); } catch { }
      }
      return Screen.PrimaryScreen;
    }
  }
}
