' Starts Debrief Companion without a black window. A second start just opens its window again.
' Pass /quiet (the Start with Windows shortcut does) to start in the background without opening the window.
Set sh = CreateObject("WScript.Shell")
dir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
extra = ""
If WScript.Arguments.Count > 0 Then
  If LCase(WScript.Arguments(0)) = "/quiet" Then extra = " -NoWindow"
End If
sh.Run "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & dir & "\companion.ps1""" & extra, 0, False
