# How to Kill a Process on a Port (Windows)

## Quick Solutions

### Option 1: Kill All Node.js Processes (Easiest)
```bash
# Double-click this file:
kill-metro.bat

# Or run in terminal:
taskkill /F /IM node.exe
```
**Use when:** Metro/Expo is stuck

---

### Option 2: Kill Specific Port (Recommended)

**Using PowerShell (Best):**
```powershell
# Kill Metro bundler (port 8081)
.\kill-port.ps1 -Port 8081

# Kill any port
.\kill-port.ps1 -Port 3000
```

**Using Batch File:**
```bash
# Double-click kill-port.bat
# Then enter the port number (default: 8081)
```

---

## Manual Methods

### Method 1: Find Process ID, Then Kill

**Step 1: Find what's using the port**
```bash
netstat -ano | findstr :8081
```

Output example:
```
TCP    0.0.0.0:8081     0.0.0.0:0      LISTENING       12345
```
The last number (12345) is the PID.

**Step 2: Kill the process**
```bash
taskkill /F /PID 12345
```

---

### Method 2: One-Liner PowerShell

```powershell
# Kill process on port 8081
Get-NetTCPConnection -LocalPort 8081 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Kill process on port 3000
Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

### Method 3: Task Manager (GUI)

1. Press **Ctrl+Shift+Esc** to open Task Manager
2. Go to **Details** tab
3. Find **node.exe** (sort by name)
4. Right-click → **End Task**
5. If multiple node.exe, end all of them

---

### Method 4: Using CMD Commands

**Kill all Node.js:**
```cmd
taskkill /F /IM node.exe
```

**Kill specific PID:**
```cmd
taskkill /F /PID 12345
```

**Kill multiple PIDs:**
```cmd
taskkill /F /PID 12345 /PID 67890
```

---

## Common Ports and What Uses Them

| Port | Service | Kill Command |
|------|---------|--------------|
| 8081 | Metro Bundler (Expo/React Native) | `.\kill-port.ps1 -Port 8081` |
| 3000 | React Dev Server | `.\kill-port.ps1 -Port 3000` |
| 5000 | Flask / Python Dev Server | `.\kill-port.ps1 -Port 5000` |
| 8000 | Django / Python Dev Server | `.\kill-port.ps1 -Port 8000` |
| 4000 | Node.js / Express | `.\kill-port.ps1 -Port 4000` |
| 19000 | Expo Dev Tools | `.\kill-port.ps1 -Port 19000` |
| 19001 | Expo Dev Server | `.\kill-port.ps1 -Port 19001` |

---

## Troubleshooting

### "Access Denied" Error

**Solution:** Run as Administrator

```powershell
# Right-click PowerShell → "Run as Administrator"
.\kill-port.ps1 -Port 8081
```

Or:
```cmd
# Right-click Command Prompt → "Run as Administrator"
taskkill /F /IM node.exe
```

---

### "No process found"

**Cause:** Port is already free or you entered wrong port

**Check if port is actually in use:**
```bash
netstat -ano | findstr :8081
```

If no output, the port is free.

---

### Multiple Node.js Processes

**Kill all at once:**
```bash
taskkill /F /IM node.exe
```

**Or kill selectively:**
1. Find all PIDs: `netstat -ano | findstr node`
2. Kill specific PIDs: `taskkill /F /PID 1234 /PID 5678`

---

### Process Keeps Coming Back

**Cause:** Another process or Windows service is auto-restarting it

**Solution:**
1. Check Task Scheduler for auto-restart tasks
2. Check Windows Services (services.msc)
3. Look for package.json scripts with `--watch` or auto-restart
4. Check for nodemon, pm2, or forever processes

---

## Automation: Add to package.json

```json
{
  "scripts": {
    "kill-metro": "taskkill /F /IM node.exe",
    "kill-port": "powershell -Command \"Get-NetTCPConnection -LocalPort 8081 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\"",
    "start:clean": "npm run kill-metro && npx expo start --clear"
  }
}
```

Then run:
```bash
npm run kill-metro
npm run start:clean
```

---

## Linux/Mac Equivalent

**Find process on port:**
```bash
lsof -i :8081
```

**Kill process:**
```bash
kill -9 $(lsof -t -i:8081)
```

**Or:**
```bash
fuser -k 8081/tcp
```

---

## Prevention Tips

1. **Always stop servers properly**
   - Use Ctrl+C in terminal (not closing window)
   - Run exit commands if available

2. **Use scripts to auto-cleanup**
   ```json
   "start": "npm run kill-metro && expo start"
   ```

3. **Set up process managers**
   - PM2 with proper cleanup
   - Nodemon with proper signals

4. **Close terminals properly**
   - Don't force-close terminals with running processes
   - Always Ctrl+C first

---

## Quick Reference Commands

```bash
# Kill all Node.js
taskkill /F /IM node.exe

# Find what's on port 8081
netstat -ano | findstr :8081

# Kill specific PID
taskkill /F /PID 12345

# PowerShell - Kill port 8081
Get-NetTCPConnection -LocalPort 8081 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# List all Node.js processes
tasklist | findstr node.exe
```

---

## For Your Specific Issue (Metro Bundler)

**Quick fix when Metro won't stop:**

```bash
# Method 1: Kill all Node.js (nuclear option)
taskkill /F /IM node.exe

# Method 2: Kill just port 8081
.\kill-port.ps1 -Port 8081

# Method 3: Also kill Expo ports
.\kill-port.ps1 -Port 8081
.\kill-port.ps1 -Port 19000
.\kill-port.ps1 -Port 19001

# Then start fresh
npx expo start --clear
```

---

## Error Messages and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Port 8081 already in use" | Metro already running | `taskkill /F /IM node.exe` |
| "EADDRINUSE" | Another process using port | Use kill-port.ps1 |
| "Access denied" | Need admin rights | Run terminal as admin |
| "Process not found" | Wrong PID or already dead | Check `netstat -ano` again |

---

## Files in This Project

- **kill-metro.bat** - Quick kill all Node.js (double-click to run)
- **kill-port.bat** - Interactive port killer (asks for port number)
- **kill-port.ps1** - PowerShell script (most reliable)
- **KILL_PORT_GUIDE.md** - This guide

---

## Pro Tip: Keyboard Shortcut

Create a shortcut on your desktop:

1. Right-click desktop → New → Shortcut
2. Location: `C:\Windows\System32\cmd.exe /k taskkill /F /IM node.exe`
3. Name: "Kill Metro"
4. Right-click shortcut → Properties → Advanced → Run as administrator
5. Assign hotkey: Ctrl+Alt+K

Now **Ctrl+Alt+K** instantly kills Metro!
