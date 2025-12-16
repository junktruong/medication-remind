import os

# ==== CẤU HÌNH ====
PROJECT_DIR = os.getcwd()   # thư mục đang chạy file .py
OUTPUT_FILE = "all_code.txt"

CODE_EXTENSIONS = {
 ".js", ".ts",".tsx",
    ".cs", ".go", ".rs", ".php", ".html", ".css",
     ".yaml", ".yml", ".md"
}

EXCLUDE_DIRS = {
    ".git", "__pycache__", "node_modules",
    "venv", ".venv", "dist", "build"
}
# ==================

def should_include_file(filename: str) -> bool:
    return os.path.splitext(filename)[1].lower() in CODE_EXTENSIONS

with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
    for root, dirs, files in os.walk(PROJECT_DIR):
        # Loại thư mục không cần thiết
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for file in files:
            if should_include_file(file):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, PROJECT_DIR)

                out.write("=" * 80 + "\n")
                out.write(f"FILE: {relative_path}\n")
                out.write("=" * 80 + "\n\n")

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        out.write(f.read())
                except UnicodeDecodeError:
                    out.write("[Không đọc được file do encoding]\n")

                out.write("\n\n")

print(f"✅ Đã tổng hợp toàn bộ code vào: {OUTPUT_FILE}")
