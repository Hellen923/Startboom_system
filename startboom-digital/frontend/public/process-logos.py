#!/usr/bin/env python3
"""
Script to remove black background from CoreMint logos and make them transparent
Requires: pip install pillow
"""

from PIL import Image
import os

def remove_black_background(input_path, output_path, threshold=30):
    """
    Remove black background from an image and make it transparent.
    
    Args:
        input_path: Path to input image
        output_path: Path to save output image (PNG)
        threshold: How close to black (0-255). Lower = stricter black match
    """
    # Open image and convert to RGBA
    img = Image.open(input_path).convert('RGBA')
    
    # Get pixel data
    data = img.getdata()
    
    # Create new pixel data with transparency
    new_data = []
    for item in data:
        # If pixel is close to black (dark), make it transparent
        if item[0] < threshold and item[1] < threshold and item[2] < threshold:
            new_data.append((0, 0, 0, 0))  # Transparent
        else:
            new_data.append(item)  # Keep original
    
    # Update image data
    img.putdata(new_data)
    
    # Save as PNG
    img.save(output_path, 'PNG')
    print(f"✓ Created: {output_path}")

def main():
    # Define input and output files
    files_to_process = [
        ('coremint.jpg', 'coremint-transparent.png'),
        ('coremint lightmod.jpeg', 'coremint-lightmode-transparent.png'),
        ('darkmode logo.jpeg', 'coremint-darkmode-transparent.png')
    ]
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("CoreMint Logo Background Remover")
    print("=" * 50)
    
    for input_file, output_file in files_to_process:
        input_path = os.path.join(script_dir, input_file)
        output_path = os.path.join(script_dir, output_file)
        
        if os.path.exists(input_path):
            try:
                remove_black_background(input_path, output_path, threshold=30)
            except Exception as e:
                print(f"✗ Error processing {input_file}: {e}")
        else:
            print(f"⚠ File not found: {input_file}")
    
    print("\n" + "=" * 50)
    print("Done! Use the -transparent.png files in your app.")
    print("\nNext steps:")
    print("1. Update Layout.js to use new transparent logo files")
    print("2. Update LandingPage.js to use new transparent logo files")

if __name__ == '__main__':
    main()
