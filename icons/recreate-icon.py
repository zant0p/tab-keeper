#!/usr/bin/env python3
"""Recreate Tab Keeper icon with proper Chrome Enterprise specs"""

from PIL import Image, ImageDraw, ImageFont

def create_enterprise_icon():
    """
    Create 128x128 icon with:
    - 96x96 actual icon (centered)
    - 16px transparent padding on all sides
    - Works on light and dark backgrounds
    """
    
    # Create 128x128 transparent canvas
    size = 128
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Icon size: 96x96 (centered with 16px padding)
    icon_size = 96
    padding = 16
    
    # Draw blue circle (96x96)
    # Blue color that works on light/dark backgrounds
    blue = (66, 133, 244, 255)  # Google Blue
    
    # Main circle
    margin = padding + 8  # 8px margin inside the 96x96 area
    circle_bbox = [
        margin, margin, 
        size - margin, size - margin
    ]
    draw.ellipse(circle_bbox, fill=blue)
    
    # Add subtle white outer glow for dark backgrounds
    # 2px glow around the circle
    for i in range(2, 0, -1):
        glow_bbox = [
            margin - i, margin - i,
            size - margin + i, size - margin + i
        ]
        draw.ellipse(glow_bbox, fill=(255, 255, 255, 60))  # Subtle white glow
    
    # Draw "TK" text in white (high contrast on blue)
    try:
        # Try to load a bold font
        font_size = 48
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "TK"
    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center the text
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    # Draw text in white (contrasts well with blue)
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    # Save
    output_path = 'icons/icon128.png'
    img.save(output_path, 'PNG')
    print(f"✅ Created {output_path}")
    print(f"   Size: {size}x{size}")
    print(f"   Icon: 96x96 centered")
    print(f"   Padding: 16px transparent")
    print(f"   Format: PNG with alpha channel")
    
    return img

if __name__ == '__main__':
    create_enterprise_icon()
