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
      menu.Items.Add("Settings", null, (a, b) => ShowSettings()); // (the settings window (Nov 3))
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
      LoadHotkey(); // (the recap key picked before, made live again for this start)
      WatchForeground(); // (Ctrl + a letter is held only while WoW or Debrief is in front (Nov 3))
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
      try { File.WriteAllText(LastPopFile, json); } catch { } // (kept for the recap hotkey after a restart (Nov 1))
    }
    string LastPopFile { get { return Path.Combine(here, "lastpop.json"); } }

    // ---------- the settings window (Nov 3, the studio's settings-brief.md): from the tray, the Companion window's Settings button and the pop-up's gear ----------
    SettingsForm settings;
    public void ShowSettings() {
      if (InvokeRequired) { BeginInvoke(new Action(ShowSettings)); return; }
      if (Program.EdgeFallback || web.CoreWebView2 == null) { ShowInFront(); return; }
      if (settings == null || settings.IsDisposed) { settings = new SettingsForm(this, port, web.CoreWebView2.Environment); settings.FormClosed += (a, b) => settings = null; }
      settings.ShowFront();
    }
    // (Setup's WoW folder: Change. Pick the WoW folder, _retail_ or its Logs; the Logs folder is kept in logs-path.txt, as when it was pasted in the window)
    public string PickWowDir() {
      if (InvokeRequired) return (string)Invoke(new Func<string>(PickWowDir));
      using (var d = new FolderBrowserDialog { Description = "Pick your World of Warcraft folder (the one with _retail_ in it)", ShowNewFolderButton = false }) {
        IWin32Window owner = settings != null && !settings.IsDisposed ? (IWin32Window)settings : this;
        if (d.ShowDialog(owner) != DialogResult.OK) return "";
        string p = d.SelectedPath.TrimEnd('\\'); string n = Path.GetFileName(p);
        var logs = n.Equals("Logs", StringComparison.OrdinalIgnoreCase) ? p : n.Equals("_retail_", StringComparison.OrdinalIgnoreCase) ? Path.Combine(p, "Logs") : Directory.Exists(Path.Combine(p, "_retail_")) ? Path.Combine(p, @"_retail_\Logs") : null;
        if (logs == null) return "";
        try { File.WriteAllText(Path.Combine(here, "logs-path.txt"), logs); } catch { return ""; }
        return logs;
      }
    }
    // (Sample recap: the made-up pull in the pop-up, never kept as your last recap)
    public void ShowSample() {
      if (InvokeRequired) { BeginInvoke(new Action(ShowSample)); return; }
      if (Program.EdgeFallback || web.CoreWebView2 == null) return;
      string json; try { json = File.ReadAllText(Path.Combine(here, "sample-pop.json")); } catch { return; }
      if (popup == null) popup = new PopupForm(this, here, port, web.CoreWebView2.Environment);
      popup.ShowRecap(json);
    }

    // (the pop-up's Stop at death: the main page rebuilds the coach box at that setting and sends it back)
    public void PopupPull(string sb) {
      long v; if (!long.TryParse(sb, out v)) return;
      if (InvokeRequired) { BeginInvoke(new Action(() => PopupPull(sb))); return; }
      try { if (web.CoreWebView2 != null) web.CoreWebView2.ExecuteScriptAsync("window.DBF_POPPULL && window.DBF_POPPULL(" + v + ")"); } catch { }
    }
    public void PopupKey(string sb) {
      long v; if (!long.TryParse(sb, out v)) return;
      if (InvokeRequired) { BeginInvoke(new Action(() => PopupKey(sb))); return; }
      try { if (web.CoreWebView2 != null) web.CoreWebView2.ExecuteScriptAsync("window.DBF_POPKEY && window.DBF_POPKEY(" + v + ")"); } catch { }
    }
    public void PopupCut(string n) {
      int v; if (!int.TryParse(n, out v)) return;
      if (InvokeRequired) { BeginInvoke(new Action(() => PopupCut(n))); return; }
      try { if (web.CoreWebView2 != null) web.CoreWebView2.ExecuteScriptAsync("window.DBF_POPCUT && window.DBF_POPCUT(" + v + ")"); } catch { }
    }

    // (no clipboard: nothing is copied or pasted since Oct 24; the copy code left on Oct 25)
    // (an update is ready (Oct 25): a note by the clock, once per version; clicking it opens the window, where Update now is)
    bool balloonHooked;
    public void UpdateReady(string v) {
      Action a = () => {
        if (!balloonHooked) { balloonHooked = true; tray.BalloonTipClicked += (s, e) => ShowInFront(); }
        tray.ShowBalloonTip(8000, "Debrief " + v + " is ready", "Update when it suits you, not mid-raid: open Debrief and press Update now.", ToolTipIcon.None);
      };
      try { if (InvokeRequired) BeginInvoke(a); else a(); } catch { }
    }

    // ---------- the recap hotkey (Nov 1, Flex: "having a windows hotkey that opens the recap is my best option"): a key combo Windows hands
    // to Debrief from anywhere, the game included, that shows the newest recap over the game or hides it. Nothing is sent to WoW. ----------
    [DllImport("user32.dll")] static extern bool RegisterHotKey(IntPtr h, int id, uint mods, uint vk);
    [DllImport("user32.dll")] static extern bool UnregisterHotKey(IntPtr h, int id);
    const int HotkeyId = 0xD0B1;
    int hkMods, hkVk; bool hkOn, hkTaken, hkWant = true, hkFail, fgOk = true; string hkName = "";
    string HotkeyFile { get { return Path.Combine(here, "hotkey.txt"); } } // ("mods,vk,name": mods 1 Alt, 2 Ctrl, 4 Shift; e.g. "2,82,Ctrl + R")
    // (Ctrl + a letter, like Ctrl + R, is every browser's own key (refresh), so it's held only while WoW or one of Debrief's windows is in front
    // (Nov 3, the studio's settings-cleanup-brief.md); other keys work anywhere, as before)
    bool HkWowOnly { get { return hkMods == 2 && hkVk >= 65 && hkVk <= 90; } }
    void HkApply() {
      bool want = hkWant && hkVk != 0 && (!HkWowOnly || fgOk);
      if (want && !hkOn) { hkOn = RegisterHotKey(Handle, HotkeyId, (uint)hkMods | 0x4000 /* MOD_NOREPEAT */, (uint)hkVk); hkFail = !hkOn; }
      else if (!want && hkOn) { UnregisterHotKey(Handle, HotkeyId); hkOn = false; }
    }
    // (mods -1: let go of it while the window listens for a new one; -2: take the saved one back)
    public string SetHotkey(int mods, int vk, string name) {
      if (InvokeRequired) return (string)Invoke(new Func<string>(() => SetHotkey(mods, vk, name)));
      if (mods == -1) { hkWant = false; HkApply(); return ""; }
      if (mods == -2) { hkWant = true; HkApply(); return ""; }
      if ((mods & 7) == 0 || vk <= 0) return "needs"; // (a plain key: WoW uses those)
      if (hkOn) { UnregisterHotKey(Handle, HotkeyId); hkOn = false; }
      if (!RegisterHotKey(Handle, HotkeyId, (uint)mods | 0x4000, (uint)vk)) { hkWant = true; HkApply(); return "taken"; } // (the old one back)
      hkOn = true; hkTaken = false; hkFail = false; hkWant = true; hkMods = mods; hkVk = vk; hkName = name ?? "";
      try { File.WriteAllText(HotkeyFile, mods + "," + vk + "," + hkName); } catch { }
      HkApply(); // (a WoW-only key is let go again until WoW is in front)
      return "";
    }
    public System.Collections.Generic.Dictionary<string, object> HotkeyInfo() {
      bool working = hkOn || (hkWant && HkWowOnly && !fgOk && !hkFail); // (a WoW-only key waiting for WoW counts as on)
      return new System.Collections.Generic.Dictionary<string, object> { { "name", hkName }, { "on", working }, { "chosen", File.Exists(HotkeyFile) }, { "taken", hkTaken }, { "wowOnly", HkWowOnly } };
    }
    void LoadHotkey() {
      // (the recap key is the only way back to a recap since the card left WoW, so it starts as Ctrl + R when nothing else has it (Flex, Nov 3: "make
      // Ctrl+r the default"); if another program does, the window asks for another. Ctrl + Shift + D was the start before: anyone still on it never
      // picked a key, so they move to Ctrl + R once (hotkey-r.txt marks it done); a key someone picked stays)
      var moved = Path.Combine(here, "hotkey-r.txt"); bool first = !File.Exists(moved);
      try { if (first) File.WriteAllText(moved, "Ctrl + R is the start (Nov 3)"); } catch { }
      try { if (first && File.Exists(HotkeyFile) && File.ReadAllText(HotkeyFile).StartsWith("6,68,")) File.Delete(HotkeyFile); } catch { }
      if (!File.Exists(HotkeyFile)) {
        if (RegisterHotKey(Handle, HotkeyId, 2 | 0x4000, 82)) { hkOn = true; hkMods = 2; hkVk = 82; hkName = "Ctrl + R"; try { File.WriteAllText(HotkeyFile, "2,82," + hkName); } catch { } }
        else if (first && RegisterHotKey(Handle, HotkeyId, 6 | 0x4000, 68)) { hkOn = true; hkMods = 6; hkVk = 68; hkName = "Ctrl + Shift + D"; try { File.WriteAllText(HotkeyFile, "6,68," + hkName); } catch { } } // (Ctrl + R taken: keep the old start)
        else { hkTaken = true; Program.Log("the recap key Ctrl + R is taken by another program"); }
        return;
      }
      try { var p = File.ReadAllText(HotkeyFile).Split(new[] { ',' }, 3); int m = int.Parse(p[0]), v = int.Parse(p[1]); hkMods = m; hkVk = v; hkName = p[2];
        hkOn = RegisterHotKey(Handle, HotkeyId, (uint)m | 0x4000, (uint)v); hkFail = !hkOn; if (!hkOn) Program.Log("recap key " + hkName + " is taken by another program"); } catch { }
    }
    // (which window is in front: WoW, or one of Debrief's own (the pop-up, Settings, this window, where Ctrl + R would reload the page))
    delegate void WinEventProc(IntPtr hook, uint ev, IntPtr hwnd, int idObject, int idChild, uint thread, uint time);
    [DllImport("user32.dll")] static extern IntPtr SetWinEventHook(uint min, uint max, IntPtr mod, WinEventProc proc, uint pid, uint tid, uint flags);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    WinEventProc fgProc; uint myPid;
    void WatchForeground() {
      myPid = (uint)Process.GetCurrentProcess().Id;
      fgProc = (h, e, w, o, c, t, tm) => OnForeground(w); // (kept in a field so it isn't collected)
      SetWinEventHook(3 /* EVENT_SYSTEM_FOREGROUND */, 3, IntPtr.Zero, fgProc, 0, 0, 0 /* WINEVENT_OUTOFCONTEXT */);
      OnForeground(GetForegroundWindow());
    }
    void OnForeground(IntPtr w) {
      bool ok = false;
      try { uint pid; GetWindowThreadProcessId(w, out pid); if (pid == myPid) ok = true; else using (var p = Process.GetProcessById((int)pid)) ok = p.ProcessName.StartsWith("Wow", StringComparison.OrdinalIgnoreCase); } catch { }
      if (ok == fgOk) return; fgOk = ok; HkApply();
    }
    protected override void WndProc(ref Message m) {
      if (m.Msg == 0x0312 /* WM_HOTKEY */ && (int)m.WParam == HotkeyId) { ToggleRecap(); return; }
      base.WndProc(ref m);
    }
    // (shown: hide it; hidden: the last recap again, over the game and without taking focus; none yet since Debrief started: the page sends the newest
    // pull or key in this log; none there (a new log after WoW restarts): the last recap kept beside the app; none ever: a note by the clock (Nov 1))
    async void ToggleRecap() {
      if (Program.EdgeFallback || web.CoreWebView2 == null) return;
      if (popup != null && popup.Visible) { popup.Hide(); return; }
      if (popup != null && popup.HasRecap) { popup.ShowAgain(); return; }
      string r = ""; try { r = await web.CoreWebView2.ExecuteScriptAsync("!!(window.DBF_POPLAST && window.DBF_POPLAST())"); } catch { }
      if (r == "true") return;
      string saved = null; try { if (File.Exists(LastPopFile)) saved = File.ReadAllText(LastPopFile); } catch { }
      if (!string.IsNullOrEmpty(saved)) { Popup(saved, true); return; }
      try { tray.ShowBalloonTip(5000, "No recap yet", "Your recap appears here after your first boss pull, key or practice on a dummy.", ToolTipIcon.None); } catch { }
    }

    // ---------- the window's size and place, kept between starts ----------
    // (sizes are in screen pixels: 1100 wide means 1100 at 100% scaling, 1650 at 150%)
    [DllImport("user32.dll")] static extern int GetDpiForWindow(IntPtr h);
    int Px(int v) { int dpi = 96; try { dpi = GetDpiForWindow(Handle); } catch { } if (dpi < 96) dpi = 96; return (int)Math.Round(v * dpi / 96.0); }
    string BoundsFile { get { return Path.Combine(here, "window2.txt") /* (new name: the window got smaller, so everyone starts at the new size once) */; } }
    Rectangle SavedBounds() {
      var wa = Screen.FromHandle(Handle).WorkingArea;
      int w = Math.Min(Px(1045), wa.Width - 40), h = Math.Min(Px(634), wa.Height - 40); // (your character's season at a glance (Nov 3): the size Flex uses)
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
