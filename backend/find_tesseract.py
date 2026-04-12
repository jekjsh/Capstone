#!/usr/bin/env python
"""
Find Tesseract installation on Windows
"""
import os
import subprocess
import sys
from pathlib import Path

def find_tesseract():
    """Search for tesseract.exe on Windows"""
    print("Searching for Tesseract installation...")
    
    # Check common paths
    common_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        r'C:\Tesseract-OCR\tesseract.exe',
        r'C:\Users\Josh Deus\AppData\Local\Programs\Tesseract-OCR\tesseract.exe',
    ]
    
    print("\n1. Checking common paths:")
    for path in common_paths:
        exists = os.path.exists(path)
        status = "✅ FOUND" if exists else "❌ Not found"
        print(f"   {status}: {path}")
        if exists:
            return path
    
    # Try running tesseract command to get its location
    print("\n2. Checking system PATH:")
    try:
        result = subprocess.run(['tesseract', '--version'], capture_output=True, text=True, timeout=5)
        print("   ✅ Tesseract works in system PATH")
        print("   But trying to find exact location...")
        
        # Try to find via registry or other methods
        result = subprocess.run(['where', 'tesseract'], capture_output=True, text=True, shell=True)
        if result.stdout.strip():
            path = result.stdout.strip().split('\n')[0]
            if os.path.exists(path):
                return path
    except Exception as e:
        print(f"   Error checking system PATH: {e}")
    
    # Search entire C: drive (slow but thorough)
    print("\n3. Searching C: drive (this may take a moment)...")
    try:
        for drive_path in Path('C:\\').glob('**/tesseract.exe'):
            print(f"   ✅ FOUND: {drive_path}")
            return str(drive_path)
    except Exception as e:
        print(f"   Search failed: {e}")
    
    print("\n❌ Could not find tesseract.exe")
    return None

if __name__ == '__main__':
    path = find_tesseract()
    if path:
        print(f"\n✅ Tesseract path: {path}")
        print(f"\nAdd this to your code:")
        print(f"pytesseract.pytesseract.pytesseract_cmd = r'{path}'")
    else:
        print("\n⚠️  Tesseract not found!")
        print("Please install from: https://github.com/UB-Mannheim/tesseract/wiki")
