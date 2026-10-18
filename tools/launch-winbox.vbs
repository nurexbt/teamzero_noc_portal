Set objArgs = WScript.Arguments
If objArgs.Count > 0 Then
    strUrl = objArgs(0)
    Set objShell = CreateObject("WScript.Shell")
    strScript = "D:\teamuser portal\free-react-tailwind-admin-dashboard-main\tools\winbox-protocol-handler.ps1"
    strCmd = "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & strScript & """ """ & strUrl & """"
    objShell.Run strCmd, 0, False
End If
