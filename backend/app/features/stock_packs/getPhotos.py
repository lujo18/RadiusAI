"""
Stock Packs Photo Retrieval - feature shim.
Delegates to the shared manifest for image selection.
"""

import random

from app.shared.utils.stockPacks.manifest import getStockImage

standard_layout = [random.choice(["ac","as"]), "as"]


def queryStockPackUrls(stock_pack_id: str, slides: int):
    """Get stock pack URLs for specified number of slides."""
    photos = []

    i = 0
    for layout in standard_layout:
        photos.append(getStockImage(stock_pack_id, layout))
        i += 1

    while i < slides:
        photos.append(getStockImage(stock_pack_id, random.choice(["as", "ps", "ss"])))
        i += 1

    return photos
