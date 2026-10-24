// The recap pop-up (Oct 22): a small window that floats over WoW right after a boss pull ("Your recap is ready", one click
// for the coach card). It never takes focus from the game: Windows shows it without activating it, it has no taskbar
// button, and it stays on top. It hides when the next pull starts or when you close it. Drag it by its top; the spot is kept.
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

    public PopupForm(MainForm main, string here, int port, CoreWebView2Environment env) {
      this.main = main; this.here = here; this.port = port; this.env = env;
      Text = "Debrief recap";
      FormBorderStyle = FormBorderStyle.None; ShowInTaskbar = false; TopMost = true;
      StartPosition = FormStartPosition.Manual; AutoScaleMode = AutoScaleMode.None;
      BackColor = Color.FromArgb(0x17, 0x1a, 0x22);
      web.Dock = DockStyle.Fill; web.DefaultBackgroundColor = BackColor;
      Controls.Add(web);
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
      var look = Wow.AddonLook(here); int bw = WidthOf(look[0]);
      var probe = placed ? Bounds : SavedBounds(bw, 70);
      int dpi = DpiAt(probe); var waP = Screen.FromRectangle(probe).WorkingArea;
      int w = Math.Min((int)Math.Round(bw * dpi / 96.0), (int)(waP.Width * 0.94)), h0 = (int)Math.Round(70 * dpi / 96.0);
      if (json.StartsWith("{")) { string lk = "{}"; try { lk = new System.Web.Script.Serialization.JavaScriptSerializer().Serialize(Wow.AddonCard(here)); } catch { } json = "{\"look\":\"" + look[1] + "\",\"lk\":" + lk + "," + json.Substring(1); } // (and your /db card settings (Oct 24))
      pending = json;
      if (!placed) { placed = true; Bounds = SavedBounds(w, h0); }
      else if (Width != w) { var wa = Screen.FromHandle(Handle).WorkingArea; int x = Left + Width / 2 - w / 2; SetBounds(Math.Max(wa.Left, Math.Min(x, wa.Right - w)), Top, w, Height); }
      if (!Visible) { Show(); SetWindowPos(Handle, (IntPtr)(-1) /* HWND_TOPMOST */, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010 | 0x0040 /* NOSIZE NOMOVE NOACTIVATE SHOWWINDOW */); }
      if (web.CoreWebView2 == null) { if (!starting) { starting = true; BeginInvoke(new Action(async () => await Start())); } }
      else if (ready) Send(json);
    }
    void Send(string json) { try { web.CoreWebView2.PostWebMessageAsJson(json); } catch (Exception e) { Program.Log("popup send: " + e.Message); } }

    void OnMessage(object s, CoreWebView2WebMessageReceivedEventArgs e) {
      string m; try { m = e.TryGetWebMessageAsString() ?? ""; } catch { return; }
      if (m == "ready") { ready = true; if (pending != null) Send(pending); }
      else if (m == "close") { SaveBounds(); Hide(); }
      else if (m == "open") main.ShowInFront();
      else if (m.StartsWith("pull:")) main.PopupPull(m.Substring(5)); // (a pull chip: the main page loads that pull's coach box)
      else if (m.StartsWith("cut:")) main.PopupCut(m.Substring(4)); // (Stop at death changed: the main page rebuilds the coach box)
      else if (m.StartsWith("h:")) {
        // (the window fits the card, up to most of the screen, and stays centred where it was: over your character)
        double h; if (!double.TryParse(m.Substring(2), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out h)) return;
        var wa = Screen.FromHandle(Handle).WorkingArea;
        int px = Math.Max(Px(56), Math.Min((int)Math.Ceiling(h * Dpi() / 96.0), (int)(wa.Height * 0.85)));
        int top = Math.Min(Top + Height / 2 - px / 2, wa.Bottom - px - 8);
        SetBounds(Left, Math.Max(wa.Top, top), Width, px);
      }
      else if (m.StartsWith("share:")) {
        var ok = main.CopyText(m.Substring(6), true);
        Send("{\"copied\":" + (ok ? "true" : "false") + "}");
      }
    }

    // (twice as wide as before, two columns (Oct 23); the addon's Width picks a little more or less)
    // (one column like /recap since Oct 24: the addon's card widths (360, 400, 480, 560, 680), a little roomier)
    static int WidthOf(string w) { return w == "narrow" ? 420 : w == "wide" ? 540 : w == "large" ? 620 : w == "xl" ? 740 : 460; }

    protected override void OnMove(EventArgs e) { base.OnMove(e); if (placed && Visible) SaveBounds(); }

    // ---------- its spot, kept between pulls and starts (right over your character at first: the middle of WoW's screen) ----------
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
    string BoundsFile { get { return Path.Combine(here, "popup2.txt"); } }
    static Screen GameScreen() {
      foreach (var n in new[] { "Wow", "WowT", "WowB" }) {
        try { foreach (var p in System.Diagnostics.Process.GetProcessesByName(n)) if (p.MainWindowHandle != IntPtr.Zero) return Screen.FromHandle(p.MainWindowHandle); } catch { }
      }
      return Screen.PrimaryScreen;
    }
    Rectangle SavedBounds(int w, int h) {
      var wa = GameScreen().WorkingArea;
      var r = new Rectangle(wa.Left + (wa.Width - w) / 2, wa.Top + wa.Height / 2 - h / 2, w, h); // (right over your character)
      try {
        var p = File.ReadAllText(BoundsFile).Split(',');
        // (kept by its centre, so a wider window still sits over your character; older saves had no width: 580)
        int ow = p.Length > 2 ? int.Parse(p[2]) : Px(580);
        var s = new Rectangle(int.Parse(p[0]) + ow / 2 - w / 2, int.Parse(p[1]), w, h);
        s.X = Math.Max(wa.Left, Math.Min(s.X, wa.Right - w));
        foreach (var sc in Screen.AllScreens) if (sc.WorkingArea.IntersectsWith(new Rectangle(s.X + 20, s.Y + 5, Math.Max(1, w - 40), 30))) return s;
      } catch { }
      return r;
    }
    void SaveBounds() { try { File.WriteAllText(BoundsFile, Left + "," + Top + "," + Width); } catch { } }
  }
}
