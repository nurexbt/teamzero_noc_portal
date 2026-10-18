import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export function launchWinbox(ip, username, password) {
  return new Promise((resolve, reject) => {
    let winboxPath = path.resolve("tools", "winbox64.exe");
    if (!fs.existsSync(winboxPath)) {
      winboxPath = path.resolve("tools", "winbox.exe");
    }
    if (!fs.existsSync(winboxPath)) {
      winboxPath = path.join(os.homedir(), "Downloads", "WinBox.exe");
    }

    const cleanIp = (ip || "").trim();
    const cleanUser = (username || "admin").trim();
    const cleanPass = password || "";

    const b64Path = Buffer.from(winboxPath, "utf8").toString("base64");
    const b64Ip = Buffer.from(cleanIp, "utf8").toString("base64");
    const b64User = Buffer.from(cleanUser, "utf8").toString("base64");
    const b64Pass = Buffer.from(cleanPass, "utf8").toString("base64");

    const psCode = `
$p = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64Path}'))
$ip = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64Ip}'))
$u = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64User}'))
$pass = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64Pass}'))
Start-Process -FilePath $p -ArgumentList @($ip, $u, $pass)
`;

    const encoded = Buffer.from(psCode, "utf16le").toString("base64");
    const command = `powershell.exe -NoProfile -WindowStyle Hidden -EncodedCommand ${encoded}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Winbox launcher error:", error, stderr);
        return reject(error);
      }
      console.log(`[WinBox Launch] Opened: ${winboxPath} -> ${cleanIp} as ${cleanUser}`);
      resolve({ path: winboxPath, ip: cleanIp, username: cleanUser });
    });
  });
}
