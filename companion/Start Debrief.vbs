' Starts Debrief Companion (older shortcuts point here; the app moves them to itself). A second start just brings its window to the front.
' Pass /quiet (the old Start with Windows shortcut does) to start in the background without opening the window.
Set sh = CreateObject("WScript.Shell")
dir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
extra = ""
If WScript.Arguments.Count > 0 Then
  If LCase(WScript.Arguments(0)) = "/quiet" Then extra = " --quiet"
End If
sh.Run """" & dir & "\Debrief Companion.exe""" & extra, 1, False
