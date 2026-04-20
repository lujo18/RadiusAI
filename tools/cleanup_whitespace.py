"""Simple whitespace cleanup utility for the repo.

Removes trailing whitespace and ensures files end with a single newline.
Run from repo root with the venv Python to apply changes.
"""
import os

ROOT = os.path.join(os.path.dirname(__file__), "..")

def clean_file(path: str) -> bool:
    changed = False
    with open(path, "rb") as f:
        data = f.read()
    try:
        text = data.decode("utf-8")
    except Exception:
        return False
    lines = text.splitlines()
    new_lines = [line.rstrip() for line in lines]
    new_text = "\n".join(new_lines) + "\n"
    if new_text != text:
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(new_text)
        return True
    return False

def main():
    changed_files = []
    for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, "backend")):
        for fn in filenames:
            if fn.endswith(('.py', '.pyi')):
                path = os.path.join(dirpath, fn)
                if clean_file(path):
                    changed_files.append(path)
    print(f"Cleaned {len(changed_files)} files")

if __name__ == '__main__':
    main()
