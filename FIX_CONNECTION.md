# Fix "Failed to Connect to Local Dev" Error

## Quick Fixes (Try These First)

### 🔥 FASTEST FIX - Use Tunnel Mode

```bash
npx expo start --tunnel
```

**Why this works:** Bypasses all network/firewall issues by using ngrok tunnel.

---

### ⚡ SECOND FASTEST - USB Connection (Android)

```bash
# 1. Connect Android device via USB
# 2. Enable USB debugging on device
# 3. Run these commands:
adb devices
adb reverse tcp:8081 tcp:8081
npx expo start --localhost
```

---

## Common Causes & Fixes

### Cause 1: Firewall Blocking Connection

**FIX:** Run this as Administrator in PowerShell:

```powershell
New-NetFirewallRule -DisplayName "Expo Metro" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow -Protocol TCP -LocalPort 8081,19000,19001,19002
```

**Or run:** `fix-connection.bat` as Administrator

---

### Cause 2: Different WiFi Networks

**CHECK:**
- Computer WiFi: Settings → Network & Internet → WiFi
- Device WiFi: Settings → WiFi

**MUST BE THE SAME NETWORK!**

**If you have multiple networks:**
- Corporate/Guest networks often block device-to-device communication
- Use home network or phone hotspot instead
- Or use tunnel mode

---

### Cause 3: VPN or Proxy Interfering

**FIX:**
1. Disconnect VPN
2. Disable proxy
3. Restart Expo

Or use tunnel mode (works with VPN).

---

### Cause 4: Computer Hostname Not Resolving

**FIX:** Use IP address instead

1. Get your IP:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" like `192.168.1.100`

2. Start Expo:
   ```bash
   npx expo start --lan
   ```

3. On device, manually enter:
   ```
   exp://192.168.1.100:8081
   ```

---

### Cause 5: Metro Bundler Crashed

**CHECK:**
```bash
netstat -ano | findstr :8081
```

**If no output, Metro is not running.**

**FIX:**
```bash
# Kill and restart
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"
npx expo start --clear
```

---

### Cause 6: Router Blocking Inter-Device Communication

Some routers have "AP Isolation" or "Client Isolation" enabled, which blocks devices from talking to each other.

**CHECK:**
- Log into router admin panel (usually 192.168.1.1 or 192.168.0.1)
- Look for "AP Isolation", "Client Isolation", or "Wireless Isolation"
- Disable it

**OR:** Use tunnel mode (bypasses this entirely)

---

## Connection Methods Explained

### Tunnel Mode (ngrok)
```bash
npx expo start --tunnel
```

**Pros:**
- Works with any network configuration
- Bypasses firewalls
- Works with VPN
- Works across different networks

**Cons:**
- Slower initial connection (1-2 min to start tunnel)
- Requires internet connection
- Slightly slower reload times

**Best for:** When LAN doesn't work, or you're on corporate/guest WiFi

---

### LAN Mode (default)
```bash
npx expo start --lan
```

**Pros:**
- Fast
- Local network only
- No internet required

**Cons:**
- Requires same WiFi network
- Firewall must allow connection
- Doesn't work with VPN

**Best for:** Home network with no restrictions

---

### Localhost Mode
```bash
npx expo start --localhost
```

**Pros:**
- Most secure
- No network issues

**Cons:**
- Requires USB cable (Android)
- Doesn't work for iOS without additional setup

**Best for:** Android development with USB debugging

---

## Testing Connection

### Test 1: Can Device Ping Computer?

**On device, install "Ping" app from App Store/Play Store**

Ping your computer's IP address (e.g., `192.168.1.100`)

- ✅ If successful → Firewall issue
- ❌ If failed → Network issue (different networks, router isolation, VPN)

---

### Test 2: Can Computer See Device?

**Android:**
```bash
adb devices
```

Should show your device.

**iOS:**
Check Finder (Mac) or iTunes (Windows) - device should appear.

---

### Test 3: Is Port Open?

**On computer:**
```bash
netstat -ano | findstr :8081
```

Should show something like:
```
TCP    0.0.0.0:8081    0.0.0.0:0    LISTENING    12345
```

---

## Step-by-Step Debug Process

1. **Verify Metro is running**
   ```bash
   # Should show active port 8081
   netstat -ano | findstr :8081
   ```

2. **Get your local IP**
   ```bash
   ipconfig
   # Look for IPv4 Address: 192.168.x.x
   ```

3. **Check same WiFi**
   - Device Settings → WiFi
   - Computer Settings → Network

4. **Try tunnel mode**
   ```bash
   npx expo start --tunnel
   ```

5. **If tunnel works → Network/firewall issue with LAN**

6. **If tunnel fails → Check internet connection**

---

## Permanent Fix for Firewall

**Create a Windows Firewall rule:**

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Expo Metro Bundler" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow -Protocol TCP -LocalPort 8081

New-NetFirewallRule -DisplayName "Expo Dev Tools" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow -Protocol TCP -LocalPort 19000,19001,19002
```

**Verify:**
```powershell
Get-NetFirewallRule -DisplayName "Expo*"
```

---

## Alternative: Phone Hotspot

If nothing works on your WiFi:

1. Enable hotspot on your phone
2. Connect computer to phone's hotspot
3. Connect device to same hotspot (or use device that's hosting hotspot)
4. Run Expo:
   ```bash
   npx expo start --lan
   ```

This bypasses router restrictions entirely.

---

## For iOS: Additional Steps

**If using physical device:**

1. Make sure device and computer are on same WiFi
2. On device, shake and go to dev menu
3. Tap "Configure Bundler"
4. Enter computer's IP and port: `192.168.1.100:8081`
5. Reload

---

## Error Messages and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Could not connect to development server" | Network issue | Use tunnel mode |
| "Unable to resolve host" | DNS issue | Use IP address directly |
| "Connection timeout" | Firewall blocking | Add firewall rule |
| "Network request failed" | Different networks | Verify same WiFi |
| "Cannot connect to Metro" | Metro crashed | Restart Metro |

---

## Scripts Available

- **fix-connection.bat** - Automated troubleshooting
- **quick-start.bat** - Start with TypeScript disabled
- **reset-dev-clients.bat** - Full reset

---

## Quick Command Reference

```bash
# Tunnel mode (most reliable)
npx expo start --tunnel

# LAN mode (fastest)
npx expo start --lan

# Localhost (USB required)
npx expo start --localhost

# With cache clear
npx expo start --clear --tunnel

# Check port
netstat -ano | findstr :8081

# Get IP
ipconfig

# Kill Metro
powershell -Command "Get-Process node | Stop-Process -Force"

# Android USB
adb reverse tcp:8081 tcp:8081
```

---

## Still Not Working?

1. **Try phone hotspot method**
2. **Use tunnel mode as permanent solution**
3. **Consider EAS cloud builds** (no local connection needed)
4. **Check if corporate network has restrictions**

**Most reliable long-term solution: Use tunnel mode**
```bash
# Add to package.json
"scripts": {
  "start": "expo start --tunnel"
}
```

Then just: `npm start`
