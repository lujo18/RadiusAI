def sanitize_text(text: str) -> str:
    """Force AI text into ASCII-friendly characters for Pillow rendering."""
    if not text:
        return ""
    replacements = {
        "—": "-",  # em-dash
        "–": "-",  # en-dash
        "“": '"',  # curly open quote
        "”": '"',  # curly close quote
        "‘": "'",  # curly open single quote
        "’": "'",  # curly close single quote
        "…": "...",  # ellipsis
        "\\n": "",
        "\\n\\n": "",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    # Remove any remaining non-ASCII characters that might crash Pillow
    return "".join(c for c in text if ord(c) < 128)
