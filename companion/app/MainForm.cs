// The Debrief Companion window: its own title bar and taskbar icon, the app's page inside (companion.html, shown by
// Microsoft's WebView2, the part of Windows that draws web pages), and a gold shield by the clock.
// Closing the window keeps Debrief running there, still reading your pulls; Quit (in the window or by the clock) stops it.
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Debrief {
  class MainForm : Form {
    readonly string here; readonly int port;
    readonly WebView2 web = new WebView2();
    readonly NotifyIcon tray = new NotifyIcon();
    bool quitting, shownOnce, pageStarted, wantShow, sized;
    PopupForm popup;

    public MainForm(string here, int port) {
      this.here = here; this.port = port;
      Text = "Debrief Companion";
      using (var s = typeof(MainForm).Assembly.GetManifestResourceStream("debrief.ico")) { Icon = new Icon(s); }
      BackColor = Color.FromArgb(0x0f, 0x11, 0x17);
      StartPosition = FormStartPosition.Manual; AutoScaleMode = AutoScaleMode.None;
      web.Dock = DockStyle.Fill; web.DefaultBackgroundColor = BackColor;
      Controls.Add(web);

      tray.Text = "Debrief Companion";
      using (var s = typeof(MainForm).Assembly.GetManifestResourceStream("debrief.ico")) { tray.Icon = new Icon(s, SystemInformation.SmallIconSize); }
      var menu = new ContextMenuStrip();
      menu.Items.Add("Open Debrief", null, (a, b) => ShowInFront());
      menu.Items.Add("Quit", null, (a, b) => QuitApp());
      tray.ContextMenuStrip = menu;
      tray.MouseClick += (a, b) => { if (b.Button == MouseButtons.Left) ShowInFront(); };
      tray.Visible = true;
    }

    // (the page runs from the start, even when Debrief starts quietly with Windows: the window just isn't shown)
    async Task StartPage() {
      try {
        var h = web.Handle; // (made now, even while the window stays hidden)
        var data = Path.Combine(here, "WebView2");
        // (keep reading pulls at full speed while the window is closed or behind the game)
        var opts = new CoreWebView2EnvironmentOptions("--disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows");
        var env = await CoreWebView2Environment.CreateAsync(null, data, opts);
        await web.EnsureCoreWebView2Async(env);
        var cw = web.CoreWebView2;
        cw.Settings.UserAgent = cw.Settings.UserAgent + " " + Server.AppMark + Program.Version;
        cw.Settings.AreDevToolsEnabled = Environment.GetEnvironmentVariable("DBF_DEV") != null;
        cw.Settings.IsStatusBarEnabled = false;
        cw.Settings.IsGeneralAutofillEnabled = false; cw.Settings.IsPasswordAutosaveEnabled = false;
        cw.DocumentTitleChanged += (a, b) => { /* keep the app's own name in the title bar */ };
        // (links open in your normal browser; the window only ever shows Debrief)
        cw.NewWindowRequested += (a, e) => { e.Handled = true; OpenOutside(e.Uri); };
        cw.NavigationStarting += (a, e) => { if (!IsOurs(e.Uri)) { e.Cancel = true; OpenOutside(e.Uri); } };
        cw.ProcessFailed += (a, e) => { Program.Log("page process failed: " + e.ProcessFailedKind); if (e.ProcessFailedKind == CoreWebView2ProcessFailedKind.BrowserProcessExited || e.ProcessFailedKind == CoreWebView2ProcessFailedKind.RenderProcessExited) { try { BeginInvoke(new Action(() => { try { web.Reload(); } catch { } })); } catch { } } };
        cw.Navigate("http://localhost:" + port + "/");
      } catch (Exception e) {
        // (no WebView2 on this PC, very rare on Windows 10 and 11: the old way, an Edge window, still works)
        Program.Log("WebView2: " + e.Message);
        Program.EdgeFallback = true;
        Hide();
        if (!Program.StartQuiet) Program.OpenEdge(port);
      }
    }

    bool IsOurs(string uri) { return uri.StartsWith("http://localhost:" + port + "/") || uri.StartsWith("about:") || uri.StartsWith("data:"); }
    static void OpenOutside(string uri) {
      if (uri != null && (uri.StartsWith("https://") || uri.StartsWith("http://"))) { try { Process.Start(new ProcessStartInfo(uri) { UseShellExecute = true }); } catch { } }
    }

    // ---------- in front, every time ----------
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
    [DllImport("user32.dll")] static extern bool BringWindowToTop(IntPtr h);
    public void ShowInFront() {
      if (InvokeRequired) { BeginInvoke(new Action(ShowInFront)); return; }
      if (Program.EdgeFallback) { Program.OpenEdge(port); return; }
      wantShow = true;
      if (Environment.GetEnvironmentVariable("DBF_DEV") != null) Program.Log("show (visible " + Visible + ")");
      if (!Visible) Show();
      if (WindowState == FormWindowState.Minimized) ShowWindow(Handle, 9); // (SW_RESTORE)
      // (Windows only lets the app you just clicked take the front; the icon's start hands that right over, and this
      // brief always-on-top makes sure the window lands above everything, the game included)
      TopMost = true; BringWindowToTop(Handle); SetForegroundWindow(Handle); Activate(); TopMost = false;
      web.Focus();
    }

    protected override void SetVisibleCore(bool value) {
      // (a quiet start makes the window without showing it)
      if (!shownOnce && Program.StartQuiet && !wantShow) { if (!IsHandleCreated) CreateHandle(); value = false; }
      if (value) shownOnce = true;
      base.SetVisibleCore(value);
    }

    protected override void OnHandleCreated(EventArgs e) {
      base.OnHandleCreated(e);
      // (the size and place, now that Windows says how big this screen's pixels are)
      if (!sized) { sized = true; MinimumSize = new Size(Px(700), Px(380)); Bounds = SavedBounds(); }
      if (!pageStarted) { pageStarted = true; BeginInvoke(new Action(async () => await StartPage())); }
      // (a dark title bar like the site's top bar)
      try { int on = 1; DwmSetWindowAttribute(Handle, 20, ref on, 4); int c = 0x0017110f; DwmSetWindowAttribute(Handle, 35, ref c, 4); } catch { }
    }
    [DllImport("dwmapi.dll")] static extern int DwmSetWindowAttribute(IntPtr h, int attr, ref int value, int size);

    protected override void OnFormClosing(FormClosingEventArgs e) {
      SaveBounds();
      if (!quitting && (e.CloseReason == CloseReason.UserClosing || e.CloseReason == CloseReason.None)) {
        // (closing keeps Debrief running by the clock, still reading your pulls)
        e.Cancel = true; Hide();
        var tip = Path.Combine(here, "tray-tip-shown");
        if (!File.Exists(tip)) {
          try { File.WriteAllText(tip, "1"); } catch { }
          tray.ShowBalloonTip(6000, "Debrief keeps running", "It still reads your pulls. Open it again from the gold shield here, or the Debrief icon.", ToolTipIcon.None);
        }
        return;
      }
      tray.Visible = false;
      base.OnFormClosing(e);
    }

    public void QuitApp() {
      if (InvokeRequired) { BeginInvoke(new Action(QuitApp)); return; }
      quitting = true; tray.Visible = false; Close(); Application.Exit();
    }

    // ---------- the recap pop-up over the game (it never takes focus) ----------
    public void Popup(string json, bool show) {
      if (InvokeRequired) { BeginInvoke(new Action(() => Popup(json, show))); return; }
      if (Program.EdgeFallback || web.CoreWebView2 == null) return;
      if (!show) { if (popup != null && popup.Visible) popup.Hide(); return; }
      if (popup == null) popup = new PopupForm(this, here, port, web.CoreWebView2.Environment);
      popup.ShowRecap(json);
    }

    // (the pop-up's Stop at death: the main page rebuilds the coach box at that setting and sends it back)
    public void PopupPull(string sb) {
      long v; if (!long.TryParse(sb, out v)) return;
      if (InvokeRequired) { BeginInvoke(new Action(() => PopupPull(sb))); return; }
      try { if (web.CoreWebView2 != null) web.CoreWebView2.ExecuteScriptAsync("window.DBF_POPPULL && window.DBF_POPPULL(" + v + ")"); } catch { }
    }
    public void PopupCut(string n) {
      int v; if (!int.TryParse(n, out v)) return;
      if (InvokeRequired) { BeginInvoke(new Action(() => PopupCut(n))); return; }
      try { if (web.CoreWebView2 != null) web.CoreWebView2.ExecuteScriptAsync("window.DBF_POPCUT && window.DBF_POPCUT(" + v + ")"); } catch { }
    }

    // (no clipboard: nothing is copied or pasted since Oct 24; the copy code left on Oct 25)

    // ---------- the window's size and place, kept between starts ----------
    // (sizes are in screen pixels: 1100 wide means 1100 at 100% scaling, 1650 at 150%)
    [DllImport("user32.dll")] static extern int GetDpiForWindow(IntPtr h);
    int Px(int v) { int dpi = 96; try { dpi = GetDpiForWindow(Handle); } catch { } if (dpi < 96) dpi = 96; return (int)Math.Round(v * dpi / 96.0); }
    string BoundsFile { get { return Path.Combine(here, "window2.txt") /* (new name: the window got smaller, so everyone starts at the new size once) */; } }
    Rectangle SavedBounds() {
      var wa = Screen.FromHandle(Handle).WorkingArea;
      int w = Math.Min(Px(1000), wa.Width - 40), h = Math.Min(Px(540), wa.Height - 40); // (look B: the ring, the coach line, the night line, two switches)
      var r = new Rectangle(wa.Left + (wa.Width - w) / 2, wa.Top + (wa.Height - h) / 2, w, h);
      try {
        var p = File.ReadAllText(BoundsFile).Split(',');
        var s = new Rectangle(int.Parse(p[0]), int.Parse(p[1]), int.Parse(p[2]), int.Parse(p[3]));
        foreach (var sc in Screen.AllScreens) if (sc.WorkingArea.IntersectsWith(new Rectangle(s.X + 40, s.Y + 10, Math.Max(1, s.Width - 80), 40))) return s;
      } catch { }
      return r;
    }
    void SaveBounds() {
      if (WindowState != FormWindowState.Normal || !shownOnce) return;
      try { File.WriteAllText(BoundsFile, Bounds.X + "," + Bounds.Y + "," + Bounds.Width + "," + Bounds.Height); } catch { }
    }
  }
}
