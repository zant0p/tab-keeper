#!/usr/bin/env python3
"""Generate Tab Keeper extension icons"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """Create a simple icon with TK logo"""
    # Create image with blue background
    img = Image.new('RGB', (size, size), color='#4285F4')
    draw = ImageDraw.Draw(img)
    
    # Draw white circle in center
    margin = size // 8
    draw.ellipse([margin, margin, size - margin, size - margin], fill='white')
    
    # Draw "TK" text in center
    try:
        # Try to load a bold font
        font_size = size // 2
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        # Fallback to default
        font = ImageFont.load_default()
    
    # Get text bounding box
    text = "TK"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center the text
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    # Draw text in blue
    draw.text((x, y), text, fill='#4285F4', font=font)
    
    # Save
    img.save(output_path, 'PNG')
    print(f"Created {output_path} ({size}x{size})")

# Create icons directory
os.makedirs('icons', exist_ok=True)

# Generate all required sizes
create_icon(16, 'icons/icon16.png')
create_icon(48, 'icons/icon48.png')
create_icon(128, 'icons/icon128.png')

print("\n✅ Icons generated successfully!")
