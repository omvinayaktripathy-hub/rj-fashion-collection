import os
import zipfile
from pathlib import Path

root_dir = Path(r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection")
out_zip = Path(r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection-TryOn-Updated.zip")

exclude_dirs = {
    "node_modules",
    ".git",
    "__pycache__",
    ".pytest_cache",
    "temp_ai_cache"
}

print(f"Creating clean production ZIP at {out_zip}...")
file_count = 0

with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(root_dir):
        # Filter directories in-place to prevent walking them
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if f.endswith((".pyc", ".tmp", ".log")):
                continue
            full_path = Path(root) / f
            rel_path = full_path.relative_to(root_dir)
            rel_str = str(rel_path).replace("\\", "/")
            
            # Skip temporary try-on files to keep ZIP clean and lightweight
            if "public/uploads/tryon/temp" in rel_str and (f.startswith("result_") or f.startswith("user_")):
                continue
                
            z.write(full_path, rel_path)
            file_count += 1

size_mb = out_zip.stat().st_size / (1024 * 1024)
print(f"Successfully packaged {file_count} files into {out_zip} ({size_mb:.2f} MB)")
