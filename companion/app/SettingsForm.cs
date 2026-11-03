// The settings window (Nov 3, the studio's settings-brief.md, Flex: "i want it to look nicer and be more organized", then "Yes, send it"): every
// setting of the recap pop-up, on this PC (the addon in WoW only keeps the combat log on). It's settings.html in a window of its own: about
// 1120 x 740, never smaller than 760 x 520, its own title bar drawn by the page (drag it to move), any edge to resize. Opened from the pop-up's
// gear, the Settings button in the Companion window and the tray menu. Everything saves as you go, in the app's own storage.
using System;
using System.Drawing;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Debrief {
  class SettingsForm : Form {
    readonly MainForm main; readonly int port; readonly CoreWebView2Environment env;
    readonly WebView2 web = new WebView2();
    const int EdgeW = 6;

    public SettingsForm(MainForm main, int port, CoreWebView2Environment env) {
      this.main = main; this.port = port; this.env = env;
      Text = "Debrief settings";
      using (var s = typeof(SettingsForm).Assembly.GetManifestResourceStream("debrief.ico")) { Icon = new Icon(s); }
      FormBorderStyle = FormBorderStyle.None; StartPosition = FormStartPosition.Manual; AutoScaleMode = AutoScaleMode.None;
      BackColor = Color.FromArgb(0x12, 0x14, 0x18); Padding = new Padding(EdgeW); // (a thin frame all round to resize from)
      web.Dock = DockStyle.Fill; web.DefaultBackgroundColor = BackColor;
      Controls.Add(web);
      var wa = Screen.FromControl(main).WorkingArea; int dpi = Dpi(), w = Math.Min(Px(1120, dpi), wa.Width - 40), h = Math.Min(Px(740, dpi), wa.Height - 40);
      MinimumSize = new Size(Math.Min(Px(760, dpi), wa.Width), Math.Min(Px(520, dpi), wa.Height));
      SetBounds(wa.Left + (wa.Width - w) / 2, wa.Top + (wa.Height - h) / 2, w, h);
      Load += async (a, b) => await Start();
    }

    async Task Start() {
      try {
        await web.EnsureCoreWebView2Async(env);
        var cw = web.CoreWebView2;
        cw.Settings.UserAgent = cw.Settings.UserAgent + " " + Server.AppMark + Program.Version;
        cw.Settings.AreDevToolsEnabled = Environment.GetEnvironmentVariable("DBF_DEV") != null;
        cw.Settings.IsStatusBarEnabled = false; cw.Settings.AreDefaultContextMenusEnabled = false; cw.Settings.IsZoomControlEnabled = false;
        try { cw.Settings.IsNonClientRegionSupportEnabled = true; } catch { /* (older WebView2: the title bar can't be dragged) */ }
        cw.NewWindowRequested += (a, e) => { e.Handled = true; };
        cw.NavigationStarting += (a, e) => { if (!e.Uri.StartsWith("http://localhost:" + port + "/")) e.Cancel = true; };
        cw.WebMessageReceived += (a, e) => {
          string m; try { m = e.TryGetWebMessageAsString() ?? ""; } catch { return; }
          if (m == "close") Close();
          else if (m == "setup") main.ShowInFront(); // (Run the setup again: the Companion window, where the recap key and the first steps are)
        };
        cw.Navigate("http://localhost:" + port + "/settings");
      } catch (Exception e) { Program.Log("settings: " + e.Message); }
    }

    public void ShowFront() { if (!Visible) Show(); if (WindowState == FormWindowState.Minimized) WindowState = FormWindowState.Normal; Activate(); BringToFront(); }

    protected override void WndProc(ref Message m) {
      if (m.Msg == 0x0084 /* WM_NCHITTEST */) { // (every edge and corner resizes it)
        long lp = m.LParam.ToInt64(); var p = PointToClient(new Point((short)(lp & 0xffff), (short)((lp >> 16) & 0xffff)));
        int e = EdgeW + 2; bool L = p.X < e, R = p.X >= ClientSize.Width - e, T = p.Y < e, B = p.Y >= ClientSize.Height - e;
        int hit = T && L ? 13 : T && R ? 14 : B && L ? 16 : B && R ? 17 : L ? 10 : R ? 11 : T ? 12 : B ? 15 : 0;
        if (hit != 0) { m.Result = (IntPtr)hit; return; }
      }
      base.WndProc(ref m);
    }
    [System.Runtime.InteropServices.DllImport("user32.dll")] static extern int GetDpiForWindow(IntPtr h);
    int Dpi() { int d = 96; try { d = GetDpiForWindow(main.Handle); } catch { } return d < 96 ? 96 : d; }
    static int Px(int v, int dpi) { return (int)Math.Round(v * dpi / 96.0); }
  }
}
