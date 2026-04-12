#!/usr/bin/env python
"""
Create a simple test image with text for OCR testing
"""
import cv2
import numpy as np
from pathlib import Path

# Create a blank white image
img = np.ones((400, 600, 3), dtype=np.uint8) * 255

# Add text
font = cv2.FONT_HERSHEY_SIMPLEX
font_scale = 1
font_color = (0, 0, 0)  # Black
thickness = 2

text_lines = [
    "INVOICE #2026-001",
    "Date: April 12, 2026",
    "Customer: John Doe",
    "Address: 123 Main Street",
    "Item: Product A - $100.00",
    "Valid until: June 15, 2026"
]

y_offset = 50
for line in text_lines:
    cv2.putText(img, line, (30, y_offset), font, font_scale, font_color, thickness)
    y_offset += 50

# Save the image
output_path = Path(__file__).parent / "test_invoice.png"
cv2.imwrite(str(output_path), img)
print(f"✅ Test image created: {output_path}")
