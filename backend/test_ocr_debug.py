#!/usr/bin/env python
"""
OCR Diagnostic Script - Test Tesseract configuration and text extraction
Run from backend directory: python test_ocr_debug.py <image_path>
"""

import sys
import os

# SET TESSERACT PATH BEFORE IMPORTING PYTESSERACT
if os.name == 'nt':  # Windows
    os.environ['PATH'] += r';C:\Program Files\Tesseract-OCR'

import pytesseract
import cv2
from pathlib import Path

# Now set pytesseract path explicitly
pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

TESSERACT_CONFIG = r'--oem 3 --psm 6'

def test_tesseract():
    """Test basic Tesseract functionality"""
    print("\n=== Testing Tesseract Installation ===")
    try:
        version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract version: {version}")
        return True
    except Exception as e:
        print(f"❌ Tesseract error: {e}")
        return False

def test_image_ocr(image_path):
    """Test OCR on a specific image"""
    print(f"\n=== Testing OCR on: {image_path} ===")
    
    if not os.path.exists(image_path):
        print(f"❌ File not found: {image_path}")
        return
    
    try:
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            print(f"❌ Failed to read image with OpenCV")
            return
        
        print(f"✅ Image loaded: {img.shape}")
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        print(f"✅ Converted to grayscale: {gray.shape}")
        
        # Test 1: Direct OCR on grayscale
        print("\n--- Test 1: Direct OCR (no preprocessing) ---")
        text1 = pytesseract.image_to_string(gray, config=TESSERACT_CONFIG)
        print(f"Extracted text length: {len(text1)} characters")
        if text1.strip():
            print(f"✅ Text extracted:\n{text1[:200]}...")
        else:
            print(f"⚠️  No text extracted")
        
        # Test 2: Thresholded OCR
        print("\n--- Test 2: Thresholded OCR ---")
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        text2 = pytesseract.image_to_string(thresh, config=TESSERACT_CONFIG)
        print(f"Extracted text length: {len(text2)} characters")
        if text2.strip():
            print(f"✅ Text extracted:\n{text2[:200]}...")
        else:
            print(f"⚠️  No text extracted")
        
        # Test 3: High OEM OCR (data-only)
        print("\n--- Test 3: Data-only OCR ---")
        text3 = pytesseract.image_to_string(gray, config=r'--oem 0 --psm 6')
        print(f"Extracted text length: {len(text3)} characters")
        if text3.strip():
            print(f"✅ Text extracted:\n{text3[:200]}...")
        else:
            print(f"⚠️  No text extracted")
        
        # Test 4: Generate debug images
        print("\n--- Saving debug images ---")
        opencv_dir = Path("debug_ocr")
        opencv_dir.mkdir(exist_ok=True)
        
        cv2.imwrite(str(opencv_dir / "original_gray.png"), gray)
        cv2.imwrite(str(opencv_dir / "thresholded.png"), thresh)
        print(f"✅ Debug images saved to {opencv_dir}/ directory")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 50)
    print("OCR Diagnostic Tool")
    print("=" * 50)
    
    # Test Tesseract first
    if not test_tesseract():
        print("\n⚠️  Tesseract is not properly installed!")
        print("Please install Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki")
        sys.exit(1)
    
    # Test image if provided
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        test_image_ocr(image_path)
    else:
        print("\nUsage: python test_ocr_debug.py <image_path>")
        print("Example: python test_ocr_debug.py test_invoice.jpg")
