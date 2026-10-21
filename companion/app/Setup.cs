// The Debrief icons (desktop, Start menu, start with Windows) and moving over from the PowerShell app (0.5 and older).
using System;
using System.Diagnostics;
using System.IO;
using System.Management;
using System.Runtime.InteropServices;

namespace Debrief {
  static class Setup {
    const string LinkName = "Debrief Companion.lnk";
    static string Exe { get { return Process.GetCurrentProcess().MainModule.FileName; } }
    // (only the installed copy, in your user folder's "Debrief Companion", ever touches the icons; a test copy anywhere else never does)
    public static bool Installed(string here) {
      var home = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Debrief Companion");
      if (TestLinks != null && Environment.GetEnvironmentVariable("DBF_HOME") != null) home = Environment.GetEnvironmentVariable("DBF_HOME"); // (tests: a pretend home)
      return string.Equals(Path.GetFullPath(here).TrimEnd('\\'), Path.GetFullPath(home).TrimEnd('\\'), StringComparison.OrdinalIgnoreCase);
    }
    // (tests: pretend Desktop, Start menu and Startup folders inside DBF_LINKS_DIR, so a test never touches your real icons)
    static readonly string TestLinks = Environment.GetEnvironmentVariable("DBF_LINKS_DIR");
    static string Folder(Environment.SpecialFolder f) {
      if (TestLinks == null) return Environment.GetFolderPath(f);
      var d = Path.Combine(TestLinks, f.ToString()); Directory.CreateDirectory(d); return d;
    }

    static void MakeLink(string path, string here, string args, string what) {
      var t = Type.GetTypeFromProgID("WScript.Shell"); dynamic ws = Activator.CreateInstance(t);
      try {
        dynamic l = ws.CreateShortcut(path);
        l.TargetPath = Exe; l.Arguments = args; l.WorkingDirectory = here; l.IconLocation = Exe + ",0"; l.Description = what;
        l.Save();
      } finally { Marshal.FinalReleaseComObject(ws); }
    }

    // The installer's job: a Debrief icon on the desktop and in the Start menu (search "Debrief" finds it).
    public static void MakeIcons(string here) {
      if (!Installed(here)) return;
      foreach (var f in new[] { Environment.SpecialFolder.DesktopDirectory, Environment.SpecialFolder.Programs })
        try { MakeLink(Path.Combine(Folder(f), LinkName), here, "", "Debrief Companion: your pull recap in WoW"); } catch (Exception e) { Program.Log("icon: " + e.Message); }
      Refresh();
    }

    // Start with Windows, quietly, so the app is always running on raid night. Made once: delete it from your Startup folder and it stays gone.
    public static void SetAutostart(string here) {
      if (!Installed(here)) return;
      var mark = Path.Combine(here, "autostart-set");
      if (File.Exists(mark)) return;
      try {
        MakeLink(Path.Combine(Folder(Environment.SpecialFolder.Startup), LinkName), here, "--quiet", "Debrief Companion, started quietly with Windows");
        File.WriteAllText(mark, "The Start with Windows shortcut was made once. Delete it from your Startup folder to stop it.");
      } catch (Exception e) { Program.Log("autostart: " + e.Message); }
    }

    // Moving over: the PowerShell app's shortcuts (wscript + Start Debrief.vbs, or powershell + companion.ps1) now open this app.
    // Only our own shortcuts, the ones that point into this folder; a deleted one stays deleted.
    public static void MoveShortcuts(string here) {
      if (!Installed(here)) return;
      var changed = false;
      try {
        var t = Type.GetTypeFromProgID("WScript.Shell"); dynamic ws = Activator.CreateInstance(t);
        try {
          foreach (var f in new[] { Environment.SpecialFolder.DesktopDirectory, Environment.SpecialFolder.Programs, Environment.SpecialFolder.Startup }) {
            var p = Path.Combine(Folder(f), LinkName);
            if (!File.Exists(p)) continue;
            dynamic l = ws.CreateShortcut(p);
            string target = l.TargetPath, args = l.Arguments, icon = l.IconLocation;
            if (string.Equals(target, Exe, StringComparison.OrdinalIgnoreCase) && icon.StartsWith(Exe, StringComparison.OrdinalIgnoreCase)) continue;
            var ours = (args ?? "").IndexOf(here.TrimEnd('\\'), StringComparison.OrdinalIgnoreCase) >= 0 || (icon ?? "").StartsWith(here.TrimEnd('\\'), StringComparison.OrdinalIgnoreCase)
              || (target ?? "").StartsWith(here.TrimEnd('\\'), StringComparison.OrdinalIgnoreCase);
            if (!ours) continue;
            var quiet = f == Environment.SpecialFolder.Startup || (args ?? "").IndexOf("quiet", StringComparison.OrdinalIgnoreCase) >= 0 || (args ?? "").IndexOf("NoWindow", StringComparison.OrdinalIgnoreCase) >= 0;
            l.TargetPath = Exe; l.Arguments = quiet ? "--quiet" : ""; l.WorkingDirectory = here; l.IconLocation = Exe + ",0";
            l.Save(); changed = true;
          }
        } finally { Marshal.FinalReleaseComObject(ws); }
      } catch (Exception e) { Program.Log("move shortcuts: " + e.Message); }
      if (changed) { Program.Log("shortcuts now open the app"); Refresh(); }
    }

    // (the PowerShell app from this folder, if it's still running, holds the port: stop it)
    public static void StopOldApp() {
      try {
        using (var s = new ManagementObjectSearcher("SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name = 'powershell.exe' OR Name = 'pwsh.exe'"))
          foreach (ManagementObject o in s.Get()) {
            var cl = o["CommandLine"] as string;
            if (cl == null || cl.IndexOf("companion.ps1", StringComparison.OrdinalIgnoreCase) < 0) continue;
            if (cl.IndexOf(Program.Here, StringComparison.OrdinalIgnoreCase) < 0) continue; // (only the copy in this folder)
            try { Process.GetProcessById(Convert.ToInt32(o["ProcessId"])).Kill(); Program.Log("stopped the old app"); } catch { }
          }
      } catch (Exception e) { Program.Log("old app check: " + e.Message); }
    }

    [DllImport("shell32.dll")] static extern void SHChangeNotify(int e, uint f, IntPtr a, IntPtr b);
    static void Refresh() { try { SHChangeNotify(0x8000000, 0x1000, IntPtr.Zero, IntPtr.Zero); } catch { } } // (SHCNE_ASSOCCHANGED: Windows redraws the icons)
  }
}
