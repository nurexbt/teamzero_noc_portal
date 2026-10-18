param(
    [string]$RawUrl
)

# TeamZero Solutions - Mikrotik Winbox URL Protocol Handler
# Handles winbox://[user]:[password]@[ip]:[port] or winbox://[ip]:[port]

if (-not $RawUrl) {
    exit 0
}

$clean = $RawUrl.Trim().Trim('"').Trim("'")

if ($clean.StartsWith("winbox://", [System.StringComparison]::OrdinalIgnoreCase)) {
    $clean = $clean.Substring(9).TrimEnd('/')
} elseif ($clean.StartsWith("winbox:", [System.StringComparison]::OrdinalIgnoreCase)) {
    $clean = $clean.Substring(7).TrimEnd('/')
}

# Locate WinBox executable
$possiblePaths = @(
    "D:\teamuser portal\free-react-tailwind-admin-dashboard-main\tools\WinBox.exe",
    "$env:USERPROFILE\Downloads\WinBox.exe",
    "$env:USERPROFILE\Downloads\winbox.exe",
    "C:\Program Files\Winbox\WinBox.exe",
    "C:\Program Files\Winbox\winbox.exe"
)

$winboxExe = $null
foreach ($p in $possiblePaths) {
    if (Test-Path $p) {
        $winboxExe = $p
        break
    }
}

if (-not $winboxExe) {
    $winboxExe = "winbox.exe"
}

# Parse connection arguments
if ($clean.Contains("@")) {
    $parts = $clean.Split("@", 2)
    $auth = $parts[0]
    $targetHost = $parts[1]

    if ($auth.Contains(":")) {
        $userPass = $auth.Split(":", 2)
        $user = [System.Uri]::UnescapeDataString($userPass[0])
        $pass = [System.Uri]::UnescapeDataString($userPass[1])
        Start-Process -FilePath $winboxExe -ArgumentList @($targetHost, $user, $pass)
    } else {
        $user = [System.Uri]::UnescapeDataString($auth)
        Start-Process -FilePath $winboxExe -ArgumentList @($targetHost, $user)
    }
} else {
    Start-Process -FilePath $winboxExe -ArgumentList @($clean)
}
