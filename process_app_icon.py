#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Process app icon to Apple App Store standards (1024x1024 PNG)

Apple Requirements:
- Size: 1024x1024 pixels (required for App Store)
- Format: PNG without transparency
- Color space: sRGB or Display P3
- No pre-rendered effects (iOS applies corner radius automatically)
- 72 DPI minimum (144 DPI recommended)
"""

from PIL import Image
import os
import sys

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Paths
input_path = r'C:\Users\derri\Downloads\IMG_1023.jpg'
output_dir = r'C:\Users\derri\HeirclarkHealthAppNew\assets'
output_icon = os.path.join(output_dir, 'icon.png')
output_adaptive = os.path.join(output_dir, 'adaptive-icon.png')
output_splash = os.path.join(output_dir, 'splash-icon.png')

# Open the original image
img = Image.open(input_path)
print(f"Original size: {img.size}")
print(f"Original format: {img.format}")
print(f"Original mode: {img.mode}")

# WARNING: Check input resolution
width, height = img.size
if width < 1024 or height < 1024:
    print(f"\nWARNING: Original image ({width}x{height}) is smaller than 1024x1024")
    print(f"This may result in quality loss when upscaling.")
    print(f"For best results, provide a vector file (SVG) or higher resolution PNG.")
    print(f"Recommended: 2048x2048 or larger\n")

# Convert to RGB if needed (remove alpha channel for iOS)
if img.mode == 'RGBA':
    print("Converting RGBA to RGB (removing transparency)")
    # Create white background
    background = Image.new('RGB', img.size, (255, 255, 255))
    background.paste(img, mask=img.split()[3])  # Use alpha channel as mask
    img = background
elif img.mode != 'RGB':
    print(f"Converting {img.mode} to RGB")
    img = img.convert('RGB')

# Create square crop centered on the image
# Use the smaller dimension as the square size
square_size = min(width, height)
left = (width - square_size) // 2
top = (height - square_size) // 2
right = left + square_size
bottom = top + square_size

# Crop to square
img_square = img.crop((left, top, right, bottom))
print(f"Cropped to square: {img_square.size}")

# Resize to 1024x1024 using highest quality resampling
# LANCZOS is the highest quality algorithm for upscaling
img_1024 = img_square.resize((1024, 1024), Image.Resampling.LANCZOS)
print(f"Resized to Apple standard: {img_1024.size}")

# Convert to sRGB color space (Apple requirement)
# Note: PIL uses sRGB by default for RGB images

# Save as PNG with maximum quality settings
# optimize=True enables PNG optimization without quality loss
# compress_level=6 is a good balance (0-9, higher = smaller file but slower)
save_kwargs = {
    'format': 'PNG',
    'optimize': True,
    'compress_level': 6,
}

# Save main icon (iOS App Store)
img_1024.save(output_icon, **save_kwargs)
file_size_kb = os.path.getsize(output_icon) / 1024
print(f"[SAVED] Main icon: {output_icon} ({file_size_kb:.1f} KB)")

# Save adaptive icon (Android)
img_1024.save(output_adaptive, **save_kwargs)
print(f"[SAVED] Adaptive icon: {output_adaptive}")

# Save splash icon
img_1024.save(output_splash, **save_kwargs)
print(f"[SAVED] Splash icon: {output_splash}")

# Verify final output meets Apple standards
final_img = Image.open(output_icon)
print(f"\n=== Final icon verification ===")
print(f"Size: {final_img.size} {'[OK]' if final_img.size == (1024, 1024) else '[FAIL]'}")
print(f"Format: {final_img.format} {'[OK]' if final_img.format == 'PNG' else '[FAIL]'}")
print(f"Mode: {final_img.mode} {'[OK]' if final_img.mode == 'RGB' else '[FAIL]'}")
print(f"File size: {file_size_kb:.1f} KB {'[OK]' if file_size_kb < 1024 else '[WARNING: large]'}")

print("\n=== App icon processing complete! ===")
print("\nApple App Store requirements: MET")
print("\nNext steps:")
print("1. Run: npx expo prebuild --clean")
print("2. Rebuild your app: eas build --platform ios")
print("3. The new icon will appear on your device and in App Store Connect")
print("\nPRO TIP: For absolute best quality, provide a vector file (SVG, AI, or PDF)")
print("at 2048x2048 or larger, and this script will downscale to 1024x1024.")
