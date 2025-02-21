import sys
import json
from PyPDF2 import PdfMerger

# ✅ Read JSON data from Electron
try:
    data = json.loads(sys.argv[1])  # Parse JSON input
except Exception as e:
    print(json.dumps({"status": "error", "message": f"Invalid JSON input: {str(e)}"}))
    sys.exit(2)

resume_path = data.get("resume")
cover_letter_path = data.get("cover_letter")
output_path = data.get("output")

# ✅ Validate file paths
if not resume_path or not cover_letter_path or not output_path:
    print(json.dumps({"status": "error", "message": "Missing file paths!"}))
    sys.exit(2)

# ✅ Merge PDFs
try:
    merger = PdfMerger()
    merger.append(resume_path)
    merger.append(cover_letter_path)
    merger.write(output_path)
    merger.close()
    
    # ✅ Only return JSON response
    print(json.dumps({"status": "success", "message": "PDFs merged successfully!", "output": output_path}))
    sys.exit(0)
except Exception as e:
    print(json.dumps({"status": "error", "message": f"PDF merge failed: {str(e)}"}))
    sys.exit(2)
