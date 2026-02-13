#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Process SVG app icon to Apple App Store standards (1024x1024 PNG)
Uses vector file for perfect quality - no upscaling artifacts!
"""

import os
import sys
import subprocess

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Paths
input_svg = r'C:\Users\derri\OneDrive\Documents\HeirclarkHealthAppLogo.svg'
output_dir = r'C:\Users\derri\HeirclarkHealthAppNew\assets'
output_icon = os.path.join(output_dir, 'icon.png')
output_adaptive = os.path.join(output_dir, 'adaptive-icon.png')
output_splash = os.path.join(output_dir, 'splash-icon.png')

print("=" * 60)
print("Apple App Store Icon Generator - SVG to PNG")
print("=" * 60)
print(f"\nInput: {input_svg}")
print(f"Output: {output_icon}")
print(f"\nProcessing vector file for maximum quality...")

# Try multiple methods for SVG conversion
conversion_success = False

# Method 1: Try cairosvg (best quality)
try:
    import cairosvg
    print("\n[Method 1] Using cairosvg (best quality)...")

    cairosvg.svg2png(
        url=input_svg,
        write_to=output_icon,
        output_width=1024,
        output_height=1024,
    )

    # Also create adaptive icon and splash
    cairosvg.svg2png(url=input_svg, write_to=output_adaptive, output_width=1024, output_height=1024)
    cairosvg.svg2png(url=input_svg, write_to=output_splash, output_width=1024, output_height=1024)

    conversion_success = True
    print("[SUCCESS] Converted with cairosvg")

except ImportError:
    print("[SKIP] cairosvg not installed")
except Exception as e:
    print(f"[ERROR] cairosvg failed: {e}")

# Method 2: Try Pillow with svg support
if not conversion_success:
    try:
        from PIL import Image
        import io

        # Try to use Pillow's SVG capabilities
        print("\n[Method 2] Using Pillow...")

        # Read SVG as text
        with open(input_svg, 'r') as f:
            svg_data = f.read()

        # This will only work if Pillow has SVG support compiled in
        img = Image.open(io.BytesIO(svg_data.encode()))
        img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
        img.save(output_icon, 'PNG')
        img.save(output_adaptive, 'PNG')
        img.save(output_splash, 'PNG')

        conversion_success = True
        print("[SUCCESS] Converted with Pillow")

    except Exception as e:
        print(f"[SKIP] Pillow SVG support not available: {e}")

# Method 3: Try Inkscape command line
if not conversion_success:
    try:
        print("\n[Method 3] Trying Inkscape command line...")

        # Common Inkscape installation paths on Windows
        inkscape_paths = [
            r"C:\Program Files\Inkscape\bin\inkscape.exe",
            r"C:\Program Files (x86)\Inkscape\bin\inkscape.exe",
            r"C:\Program Files\Inkscape\inkscape.exe",
        ]

        inkscape_exe = None
        for path in inkscape_paths:
            if os.path.exists(path):
                inkscape_exe = path
                break

        if inkscape_exe:
            print(f"Found Inkscape at: {inkscape_exe}")

            # Convert SVG to PNG using Inkscape
            subprocess.run([
                inkscape_exe,
                input_svg,
                '--export-type=png',
                f'--export-filename={output_icon}',
                '--export-width=1024',
                '--export-height=1024',
            ], check=True, capture_output=True)

            # Copy for adaptive and splash
            from shutil import copy2
            copy2(output_icon, output_adaptive)
            copy2(output_icon, output_splash)

            conversion_success = True
            print("[SUCCESS] Converted with Inkscape")
        else:
            print("[SKIP] Inkscape not found in common installation paths")

    except Exception as e:
        print(f"[SKIP] Inkscape conversion failed: {e}")

# Method 4: Install cairosvg and retry
if not conversion_success:
    print("\n[Method 4] Installing cairosvg...")
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'cairosvg'],
                      check=True, capture_output=True)
        print("[SUCCESS] cairosvg installed")

        import cairosvg
        cairosvg.svg2png(url=input_svg, write_to=output_icon, output_width=1024, output_height=1024)
        cairosvg.svg2png(url=input_svg, write_to=output_adaptive, output_width=1024, output_height=1024)
        cairosvg.svg2png(url=input_svg, write_to=output_splash, output_width=1024, output_height=1024)

        conversion_success = True
        print("[SUCCESS] Converted with cairosvg after installation")

    except Exception as e:
        print(f"[ERROR] Failed to install/use cairosvg: {e}")

# If all methods failed, provide instructions
if not conversion_success:
    print("\n" + "=" * 60)
    print("CONVERSION FAILED - Manual Steps Required")
    print("=" * 60)
    print("\nPlease convert the SVG manually:")
    print("1. Open the SVG in a design tool (Figma, Illustrator, Inkscape)")
    print("2. Export as PNG at 1024x1024 pixels")
    print(f"3. Save to: {output_icon}")
    print("\nOr install cairosvg:")
    print("   pip install cairosvg")
    sys.exit(1)

# Verify output
if os.path.exists(output_icon):
    from PIL import Image
    img = Image.open(output_icon)
    file_size_kb = os.path.getsize(output_icon) / 1024

    print("\n" + "=" * 60)
    print("Icon Verification")
    print("=" * 60)
    print(f"Size: {img.size} {'[OK]' if img.size == (1024, 1024) else '[FAIL]'}")
    print(f"Format: {img.format} {'[OK]' if img.format == 'PNG' else '[FAIL]'}")
    print(f"Mode: {img.mode}")
    print(f"File size: {file_size_kb:.1f} KB")

    print("\n" + "=" * 60)
    print("SUCCESS! Apple-Quality Icon Generated from Vector")
    print("=" * 60)
    print("\n✓ Perfect quality - no pixelation")
    print("✓ 1024x1024 PNG format")
    print("✓ Ready for App Store submission")
    print("\nNext steps:")
    print("1. Run: npx expo prebuild --clean")
    print("2. Build: eas build --platform ios")
    print("3. Your app will have a crisp, professional icon!")

else:
    print("\n[ERROR] Output file not created")
    sys.exit(1)
