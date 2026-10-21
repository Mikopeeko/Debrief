// Debrief Companion: the small PC app that feeds the Debrief addon in WoW.
// It watches your combat log; when a boss pull ends, its window reads the pull with Debrief's own engine and puts a short
// code on your clipboard with a sound. In game, Debrief asks "See your recap?": press Ctrl+V and your recap card shows.
// Nothing here touches the game: it only reads WoWCombatLog files, writes to the clipboard and puts the addon in.
//
// Starts:  Debrief Companion.exe             opens the window (a second start brings the running one to the front)
//          Debrief Companion.exe --quiet     starts by the clock without opening the window (the Start with Windows shortcut)
//          Debrief Companion.exe --install   the installer's step: the addon, the icons, start with Windows, then opens
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace Debrief {
  static class Program {
    public static string Here, Version = "0.0.0";
    public static bool StartQuiet, EdgeFallback;
    static readonly object logLock = new object();

    public static void Log(string s) {
      try {
        lock (logLock) {
          var f = Path.Combine(Here, "debrief.log");
          if (File.Exists(f) && new FileInfo(f).Length > 256 * 1024) File.Delete(f);
          File.AppendAllText(f, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  " + s + "\r\n");
        }
      } catch { }
    }

    static bool Has(string[] args, params string[] names) { return args.Any(a => names.Any(n => string.Equals(a, n, StringComparison.OrdinalIgnoreCase))); }

    [DllImport("user32.dll")] static extern bool AllowSetForegroundWindow(int pid);

    [STAThread]
    static void Main(string[] args) {
      Here = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
      try { var vf = Path.Combine(Here, "version.txt"); if (File.Exists(vf)) Version = File.ReadAllText(vf).Trim(); } catch { }
      StartQuiet = Has(args, "--quiet", "/quiet", "-quiet", "-NoWindow", "--no-window") || Environment.GetEnvironmentVariable("DBF_NO_WINDOW") != null;
      var install = Has(args, "--install", "/install");
      int port; if (!int.TryParse(Environment.GetEnvironmentVariable("DBF_PORT"), out port)) port = 8772;

      // (the addon and start with Windows only, then stop: what the PowerShell app's -InstallOnly did)
      if (Has(args, "--install-only", "-InstallOnly")) { Setup.SetAutostart(Here); Log(Wow.InstallAddon(Here)); return; }

      Updater.CleanOld(Here);
      bool first;
      var one = new Mutex(true, @"Local\DebriefCompanion-" + port, out first);
      var showMe = new EventWaitHandle(false, EventResetMode.AutoReset, @"Local\DebriefCompanionShow-" + port);
      if (!first) {
        // (already running, say it started with Windows: the icon brings its window to the front; a quiet start does nothing)
        if (!StartQuiet) { AllowSetForegroundWindow(-1); showMe.Set(); }
        return;
      }
      Log("start " + Version + (StartQuiet ? " (quiet)" : "") + (install ? " (install)" : ""));
      Setup.StopOldApp();

      // (--updated: just updated, so no second check; a mislabelled download can never loop)
      if (!install && !Has(args, "--updated") && Environment.GetEnvironmentVariable("DBF_NO_UPDATE") == null && Updater.Run(Here)) {
        // (start the new version, with the same window choice, and stop this one)
        one.ReleaseMutex(); one.Dispose(); showMe.Dispose();
        var exe = Process.GetCurrentProcess().MainModule.FileName;
        Process.Start(new ProcessStartInfo(exe, string.Join(" ", args.Concat(new[] { "--updated" }).Select(a => "\"" + a + "\""))) { UseShellExecute = false, WorkingDirectory = Here });
        return;
      }

      Setup.MoveShortcuts(Here);
      string addon;
      if (install) { addon = Wow.InstallAddon(Here); Setup.MakeIcons(Here); }
      else addon = Wow.InstallAddon(Here);
      Setup.SetAutostart(Here);
      Log(addon);

      Application.EnableVisualStyles();
      Application.SetCompatibleTextRenderingDefault(false);
      var form = new MainForm(Here, port);
      var server = new Server(Here, port) { SetClipboard = form.CopyText, Quit = form.QuitApp };
      var up = false;
      for (int i = 0; i < 8 && !(up = server.Start()); i++) { Thread.Sleep(750); if (i == 2) Setup.StopOldApp(); }
      if (!up) {
        MessageBox.Show("Debrief Companion couldn't start: another program is using its address (port " + port + ").\n\nRestart your PC and open Debrief again.", "Debrief", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        return;
      }
      new Thread(() => { while (showMe.WaitOne()) form.ShowInFront(); }) { IsBackground = true, Name = "show" }.Start();

      if (install) {
        var ok = addon.Contains("installed in") || addon.Contains("Installed the");
        var msg = "Debrief is installed.\n\n" + addon + "\n\nIt starts with Windows by itself, quietly, and there's a Debrief icon on your desktop and in the Start menu. In WoW, type /reload if it was open.\nAfter each boss pull Debrief asks \"See your recap?\": press Ctrl+V.";
        if (Environment.GetEnvironmentVariable("DBF_SILENT") != null) Log(msg);
        else MessageBox.Show(msg, "Debrief", MessageBoxButtons.OK, ok ? MessageBoxIcon.Information : MessageBoxIcon.Warning);
      }
      form.Shown += (a, b) => form.ShowInFront();
      Application.Run(form);
      server.Stop();
      Log("quit");
      GC.KeepAlive(one);
    }

    // (no WebView2 on this PC: the old way, an Edge window in app mode, else the default browser)
    public static void OpenEdge(int port) {
      var pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86); var pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
      var edge = new[] { Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"), Path.Combine(pf, @"Microsoft\Edge\Application\msedge.exe") }.FirstOrDefault(File.Exists);
      try {
        if (edge != null) Process.Start(edge, "--app=http://localhost:" + port + "/ --window-size=1100,820");
        else Process.Start(new ProcessStartInfo("http://localhost:" + port + "/") { UseShellExecute = true });
      } catch (Exception e) { Log("edge: " + e.Message); }
    }
  }
}
