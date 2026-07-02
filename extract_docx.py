import zipfile
import xml.etree.ElementTree as ET
import os

def extract_docx_text(docx_path):
    if not os.path.exists(docx_path):
        print(f"File not found: {docx_path}")
        return
    
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Namespaces
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            paragraphs = []
            for para in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                text = ''.join(node.text for node in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text)
                if text:
                    paragraphs.append(text)
            
            print(f"Extracted {len(paragraphs)} paragraphs.")
            
            # Print first 20 paragraphs and some headings as preview
            print("\n--- FIRST 50 PARAGRAPHS PREVIEW ---")
            for i, p in enumerate(paragraphs[:50]):
                print(f"{i+1}: {p}")
                
            # Let's write the whole text to a txt file in the scratch directory so we can analyze it
            out_path = "extracted_report.txt"
            with open(out_path, "w", encoding="utf-8") as f:
                for p in paragraphs:
                    f.write(p + "\n")
            print(f"\nSaved all paragraphs to {out_path}")
            
    except Exception as e:
        print(f"Error: {e}")

extract_docx_text("caodinhieu.docx")
