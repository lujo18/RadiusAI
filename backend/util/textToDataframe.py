import io
import re
import pandas as pd


def gemini_text_to_dataframe(gemini_response: str) -> pd.DataFrame:
    """
    Takes the raw string response from Gemini (even if it has extra text,
    markdown, code blocks, or missing quotes) and returns a clean DataFrame.
    """
    text = gemini_response.strip()

    # 1. Remove markdown code blocks if present
    text = re.sub(r"^```csv\s*\n|```$", "", text, flags=re.MULTILINE)
    text = re.sub(r"^```\s*\n|```$", "", text, flags=re.MULTILINE)

    # 2. Remove any leading/trailing explanation text before the header
    # (keeps everything from the first line that contains "post_id" onward)
    lines = text.splitlines()
    start_idx = 0
    for i, line in enumerate(lines):
        if "post_id" in line.lower():
            start_idx = i
            break
    text = "\n".join(lines[start_idx:])

    # 3. Fix common Gemini issues
    # - Adds quotes around fields that contain commas or newlines
    # - Handles \n inside fields (Gemini loves that)
    # Parse line by line instead of trusting csv.reader on the whole thing
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # Split by comma but respect commas inside quoted fields
        fields = []
        current = ""
        in_quotes = False
        i = 0
        while i < len(line):
            c = line[i]
            if c == '"':
                if i + 1 < len(line) and line[i + 1] == '"':  # escaped quote
                    current += '"'
                    i += 2
                else:
                    in_quotes = not in_quotes
                    i += 1
            elif c == "," and not in_quotes:
                fields.append(current.strip())
                current = ""
                i += 1
            else:
                current += c
                i += 1
        fields.append(current.strip())  # last field
        rows.append(
            [f'"{f}"' if any(x in f for x in [",", "\n", "\r"]) else f for f in fields]
        )

    if not rows:
        raise ValueError("No CSV rows found in Gemini response")

    # Re-join as properly quoted CSV string
    clean_csv_text = "\n".join(",".join(row) for row in rows)

    # Finally parse with pandas (now guaranteed clean)
    df = pd.read_csv(io.StringIO(clean_csv_text))
    return df


def simple_gemini_to_df(text: str) -> pd.DataFrame:
    text = re.sub(r"^```.*?csv\s*\n|```$", "", text, flags=re.MULTILINE | re.DOTALL)
    text = re.sub(
        r".*?post_id,", "post_id,", text, flags=re.DOTALL
    )  # remove anything before header
    return pd.read_csv(io.StringIO(text))
