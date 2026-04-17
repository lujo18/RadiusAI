"""Minimal pandas shim for test environments that don't have pandas installed.

This provides a very small subset of pandas used by the project's
`text_to_dataframe` helpers: `read_csv` returning a lightweight DataFrame-like
object. It's intentionally small and should only be used for tests where
installing full pandas isn't available.
"""
import csv
from typing import List, Dict, Any, IO


class DataFrame:
    def __init__(self, rows: List[Dict[str, Any]]):
        self._rows = rows
        self.columns = list(rows[0].keys()) if rows else []

    def to_dict(self, orient: str = "records"):
        if orient == "records":
            return self._rows
        # simple column-oriented dict
        return {c: [r.get(c) for r in self._rows] for c in self.columns}

    def __len__(self):
        return len(self._rows)

    def __getitem__(self, key):
        # return column values list
        return [r.get(key) for r in self._rows]


def read_csv(fp: IO[str]) -> DataFrame:
    reader = csv.DictReader(fp)
    rows = [dict(r) for r in reader]
    return DataFrame(rows)
