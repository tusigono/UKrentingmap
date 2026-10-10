"""Convert the user's TfL PDF to the same cropped, vector map.

Requires PyMuPDF. Usage: python3 convert_map.py /path/to/standard-tube-map.pdf
"""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
import pymupdf as fitz

root = Path(__file__).resolve().parent
with fitz.open(sys.argv[1]) as doc:
    page = doc[0]
    svg = page.get_svg_image(text_as_path=True)

# Match the previous PNG crop so all stored marker coordinates stay aligned.
# Station names become vector outlines and need no locally installed fonts.
ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
element = ET.fromstring(svg)
element.set('width', '1190.55')
element.set('height', '724')
element.set('viewBox', '0 60 1190.55 724')
element.set('id', 'mapImage')
element.set('class', 'map-img')
element.set('role', 'img')
element.set('aria-label', '使用者提供的 TfL 地鐵向量圖，2026 年 9 月版本')
(root / 'tube-map.svg').write_text(ET.tostring(element, encoding='unicode'), encoding='utf-8')
print('Converted vector map with outlined station labels.')
