
from backend.util.stockPacks.manifest import getStockImage


standard_layout = ["ac", "as"]

def queryStockPackUrls(stock_pack_id: str, slides: int):
  photos = [];
  
  i = 0
  for layout in standard_layout:
    photos.append(getStockImage(stock_pack_id, layout))
    i += 1;

  while i < slides:
    photos.append(getStockImage(stock_pack_id, "ss"))
    i += 1

  return photos