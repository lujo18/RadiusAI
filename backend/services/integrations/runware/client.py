import asyncio
from runware import Runware, IImageInference

from app.core.config import settings


async def main():
    # SDK reads RUNWARE_API_KEY automatically
    api_key = settings.RUNWARE_DEV_KEY
    if not api_key:
        raise ValueError("RUNWARE_DEV_KEY is not configured")
    runware = Runware(api_key)
    await runware.connect()

    request = IImageInference(
        positivePrompt="A serene mountain landscape at sunset",
        negativePrompt="",
        model="runware:400@3",
        width=1080,
        height=1920,
        includeCost=True,
    )

    images = await runware.imageInference(requestImage=request)
    print(f"Generated image: {images[0].imageURL}")


if __name__ == "__main__":
    asyncio.run(main())
