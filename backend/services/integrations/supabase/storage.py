"""
Supabase Storage operations for slide images and thumbnails.
Mirrors frontend StorageRepository.ts pattern.
"""

from typing import Any, Dict, List, Optional, Tuple
from io import BytesIO
from PIL import Image
from app.features.integrations.supabase.client import get_supabase


DEFAULT_IMAGE_EXTENSION = "avif"
DEFAULT_IMAGE_CONTENT_TYPE = "image/avif"
FALLBACK_IMAGE_EXTENSION = "webp"
FALLBACK_IMAGE_CONTENT_TYPE = "image/webp"


def _file_extension_from_content_type(content_type: str) -> str:
    normalized = (content_type or "").lower()
    if normalized == "image/avif":
        return "avif"
    if normalized == "image/webp":
        return "webp"
    return FALLBACK_IMAGE_EXTENSION


def _content_type_from_extension(extension: str) -> str:
    normalized = extension.lower().lstrip(".")
    if normalized == "avif":
        return "image/avif"
    return FALLBACK_IMAGE_CONTENT_TYPE


def _resolve_post_file_name(user_id: str, post_id: str, base_name: str) -> str:
    """Resolve existing extension for a post asset, preferring AVIF for new writes."""
    supabase = get_supabase()
    folder_path = f"{user_id}/{post_id}/"
    files = supabase.storage.from_("slides").list(folder_path) or []

    preferred_extensions = [
        DEFAULT_IMAGE_EXTENSION,
        FALLBACK_IMAGE_EXTENSION,
    ]

    for extension in preferred_extensions:
        expected_name = f"{base_name}.{extension}"
        if any(file.get("name") == expected_name for file in files):
            return f"{folder_path}{expected_name}"

    return f"{folder_path}{base_name}.{DEFAULT_IMAGE_EXTENSION}"


def _encode_to_avif_with_fallback(image_data: bytes) -> Tuple[bytes, str]:
    """Encode image to AVIF when available; otherwise fallback to WebP."""
    image = Image.open(BytesIO(image_data))
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")

    output = BytesIO()
    try:
        image.save(output, format="AVIF", optimize=True)
        return output.getvalue(), DEFAULT_IMAGE_CONTENT_TYPE
    except Exception:
        output = BytesIO()
        image.save(output, format="WEBP", optimize=True)
        return output.getvalue(), FALLBACK_IMAGE_CONTENT_TYPE


def _encode_processed_image_with_fallback(
    image: Image.Image, preferred_format: str
) -> Tuple[bytes, str]:
    output = BytesIO()
    try:
        image.save(output, format=preferred_format, optimize=True)
        return output.getvalue(), _content_type_from_extension(preferred_format)
    except Exception:
        output = BytesIO()
        image.save(output, format="WEBP", optimize=True)
        return output.getvalue(), FALLBACK_IMAGE_CONTENT_TYPE


# ==================== UPLOAD OPERATIONS ====================


def upload_slide_image(
    user_id: str,
    post_id: str,
    slide_index: int,
    image_data: bytes,
    content_type: str = DEFAULT_IMAGE_CONTENT_TYPE,
) -> str:
    """
    Upload a single slide image to Supabase Storage as AVIF/WebP.

    Args:
        user_id: User UUID
        post_id: Post UUID
        slide_index: Slide number (0-based index)
        image_data: Image file bytes
        content_type: MIME type (default: image/avif)

    Returns:
        Public URL of uploaded image
    """
    supabase = get_supabase()

    extension = _file_extension_from_content_type(content_type)
    file_name = f"{user_id}/{post_id}/slide-{slide_index}.{extension}"

    # Upload to 'slides' bucket
    response = supabase.storage.from_("slides").upload(
        path=file_name,
        file=image_data,
        file_options={"content-type": content_type, "upsert": "true"},
    )

    # Get public URL
    public_url = supabase.storage.from_("slides").get_public_url(file_name)

    return public_url


def upload_slide_images(
    user_id: str, post_id: str, slide_images: List[bytes]
) -> List[str]:
    """
    Upload multiple slide images.

    Args:
        user_id: User UUID
        post_id: Post UUID
        slide_images: List of image bytes

    Returns:
        List of public URLs
    """
    urls = []

    for index, image_data in enumerate(slide_images):
        url = upload_slide_image(user_id, post_id, index, image_data)
        urls.append(url)

    return urls


def upload_thumbnail(
    user_id: str,
    post_id: str,
    thumbnail_data: bytes,
    content_type: str = DEFAULT_IMAGE_CONTENT_TYPE,
) -> str:
    """
    Upload a thumbnail image as AVIF/WebP.

    Args:
        user_id: User UUID
        post_id: Post UUID
        thumbnail_data: Thumbnail image bytes
        content_type: MIME type (default: image/avif)

    Returns:
        Public URL of uploaded thumbnail
    """
    supabase = get_supabase()

    extension = _file_extension_from_content_type(content_type)
    file_name = f"{user_id}/{post_id}/thumbnail.{extension}"

    response = supabase.storage.from_("slides").upload(
        path=file_name,
        file=thumbnail_data,
        file_options={"content-type": content_type, "upsert": "true"},
    )

    public_url = supabase.storage.from_("slides").get_public_url(file_name)

    return public_url


def upload_video(
    user_id: str, post_id: str, video_data: bytes, content_type: str = "video/mp4"
) -> str:
    """
    Upload a video file for a post.

    Args:
        user_id: User UUID
        post_id: Post UUID
        video_data: Video file bytes
        content_type: MIME type (default: video/mp4)

    Returns:
        Public URL of uploaded video
    """
    supabase = get_supabase()

    file_name = f"{user_id}/{post_id}/video.mp4"

    response = supabase.storage.from_("slides").upload(
        path=file_name,
        file=video_data,
        file_options={"content-type": content_type, "upsert": "true"},
    )

    public_url = supabase.storage.from_("slides").get_public_url(file_name)

    return public_url


# ==================== DELETE OPERATIONS ====================


def delete_slide_images(user_id: str, post_id: str) -> bool:
    """
    Delete all slide images for a post.

    Args:
        user_id: User UUID
        post_id: Post UUID

    Returns:
        True if successful
    """
    supabase = get_supabase()

    folder_path = f"{user_id}/{post_id}/"

    # List all files in the folder
    response = supabase.storage.from_("slides").list(folder_path)

    if not response:
        return True  # No files to delete

    # Get file paths
    file_paths = [f"{folder_path}{file['name']}" for file in response]

    if not file_paths:
        return True

    # Delete all files
    supabase.storage.from_("slides").remove(file_paths)

    return True


def delete_single_slide(user_id: str, post_id: str, slide_index: int) -> bool:
    """
    Delete a single slide image.

    Args:
        user_id: User UUID
        post_id: Post UUID
        slide_index: Slide number to delete

    Returns:
        True if successful
    """
    supabase = get_supabase()

    file_names = [
        f"{user_id}/{post_id}/slide-{slide_index}.{extension}"
        for extension in ("avif", "webp")
    ]

    supabase.storage.from_("slides").remove(file_names)

    return True


def delete_thumbnail(user_id: str, post_id: str) -> bool:
    """
    Delete thumbnail for a post.

    Args:
        user_id: User UUID
        post_id: Post UUID

    Returns:
        True if successful
    """
    supabase = get_supabase()

    file_names = [
        f"{user_id}/{post_id}/thumbnail.{extension}" for extension in ("avif", "webp")
    ]

    supabase.storage.from_("slides").remove(file_names)

    return True


# ==================== GET OPERATIONS ====================


def get_slide_image_url(user_id: str, post_id: str, slide_index: int) -> str:
    """
    Get public URL for a slide image.

    Args:
        user_id: User UUID
        post_id: Post UUID
        slide_index: Slide number

    Returns:
        Public URL
    """
    supabase = get_supabase()

    file_name = _resolve_post_file_name(user_id, post_id, f"slide-{slide_index}")

    public_url = supabase.storage.from_("slides").get_public_url(file_name)

    return public_url


def get_thumbnail_url(user_id: str, post_id: str) -> str:
    """
    Get public URL for thumbnail.

    Args:
        user_id: User UUID
        post_id: Post UUID

    Returns:
        Public URL
    """
    supabase = get_supabase()

    file_name = _resolve_post_file_name(user_id, post_id, "thumbnail")

    public_url = supabase.storage.from_("slides").get_public_url(file_name)

    return public_url


def list_post_files(user_id: str, post_id: str) -> List[Dict]:
    """
    List all files for a post.

    Args:
        user_id: User UUID
        post_id: Post UUID

    Returns:
        List of file metadata dicts
    """
    supabase = get_supabase()

    folder_path = f"{user_id}/{post_id}/"

    response = supabase.storage.from_("slides").list(folder_path)

    return response or []


# ==================== IMAGE PROCESSING ====================


def generate_thumbnail(
    image_data: bytes, size: tuple = (300, 300), format: str = "AVIF"
) -> Tuple[bytes, str]:
    """
    Generate a thumbnail from an image.
    Resizes to specified dimensions while maintaining aspect ratio.

    Args:
        image_data: Original image bytes
        size: Thumbnail dimensions (width, height)
        format: Output format (PNG, JPEG, etc.)

    Returns:
        Tuple of thumbnail bytes and content type
    """
    # Open image from bytes
    img = Image.open(BytesIO(image_data))

    # Resize with high-quality resampling
    img.thumbnail(size, Image.Resampling.LANCZOS)

    return _encode_processed_image_with_fallback(img, format)


def optimize_image(
    image_data: bytes,
    max_size: tuple = (1080, 1920),
    quality: int = 85,
    format: str = "AVIF",
) -> Tuple[bytes, str]:
    """
    Optimize image size and quality for web delivery.

    Args:
        image_data: Original image bytes
        max_size: Maximum dimensions (width, height)
        quality: JPEG quality (1-100, only for JPEG)
        format: Output format

    Returns:
        Tuple of optimized image bytes and content type
    """
    img = Image.open(BytesIO(image_data))

    # Resize if larger than max_size
    if img.width > max_size[0] or img.height > max_size[1]:
        img.thumbnail(max_size, Image.Resampling.LANCZOS)

    output = BytesIO()
    try:
        if format.upper() == "JPEG":
            img.save(output, format=format, quality=quality, optimize=True)
            return output.getvalue(), "image/jpeg"
        return _encode_processed_image_with_fallback(img, format)
    except Exception:
        output = BytesIO()
        img.save(output, format="WEBP", optimize=True)
        return output.getvalue(), FALLBACK_IMAGE_CONTENT_TYPE


# ==================== COMBINED OPERATIONS ====================


def upload_post_images(
    user_id: str, post_id: str, slide_images: List[bytes], generate_thumb: bool = True
) -> Dict[str, Any]:
    """
    Upload all slide images and generate/upload thumbnail.
    This is the main function to use after rendering slides.

    Args:
        user_id: User UUID
        post_id: Post UUID
        slide_images: List of slide image bytes
        generate_thumb: Whether to auto-generate thumbnail from first slide

    Returns:
        Dict with 'slide_urls' (list) and 'thumbnail_url' (str)
    """
    # Encode and upload all slides using AVIF with WebP fallback.
    slide_urls = []
    for index, image_data in enumerate(slide_images):
        encoded_image, content_type = _encode_to_avif_with_fallback(image_data)
        slide_urls.append(
            upload_slide_image(
                user_id=user_id,
                post_id=post_id,
                slide_index=index,
                image_data=encoded_image,
                content_type=content_type,
            )
        )

    thumbnail_url = None

    if generate_thumb and len(slide_images) > 0:
        # Generate thumbnail from first slide
        thumbnail_data, thumbnail_content_type = generate_thumbnail(slide_images[0])

        # Upload thumbnail
        thumbnail_url = upload_thumbnail(
            user_id,
            post_id,
            thumbnail_data,
            content_type=thumbnail_content_type,
        )

    return {"slide_urls": slide_urls, "thumbnail_url": thumbnail_url}


def upload_post_images_optimized(
    user_id: str,
    post_id: str,
    slide_images: List[bytes],
    optimize: bool = True,
    max_size: tuple = (1080, 1920),
) -> Dict[str, Any]:
    """
    Upload slide images with optimization for faster loading.

    Args:
        user_id: User UUID
        post_id: Post UUID
        slide_images: List of slide image bytes
        optimize: Whether to optimize images before upload
        max_size: Maximum dimensions for optimization

    Returns:
        Dict with 'slide_urls' and 'thumbnail_url'
    """
    optimized_images = slide_images

    if optimize:
        optimized_images = []
        for img_data in slide_images:
            optimized_data, _ = optimize_image(img_data, max_size=max_size)
            optimized_images.append(optimized_data)

    return upload_post_images(user_id, post_id, optimized_images)


# ==================== BATCH OPERATIONS ====================


def delete_all_post_assets(user_id: str, post_id: str) -> bool:
    """
    Delete all assets (slides, thumbnail, videos) for a post.
    Use when deleting a post entirely.

    Args:
        user_id: User UUID
        post_id: Post UUID

    Returns:
        True if successful
    """
    return delete_slide_images(user_id, post_id)


def copy_post_images(user_id: str, source_post_id: str, dest_post_id: str) -> List[str]:
    """
    Copy slide images from one post to another.
    Useful for duplicating posts or creating variants.

    Args:
        user_id: User UUID
        source_post_id: Source post UUID
        dest_post_id: Destination post UUID

    Returns:
        List of new slide URLs
    """
    supabase = get_supabase()

    # List source files
    source_folder = f"{user_id}/{source_post_id}/"
    files = supabase.storage.from_("slides").list(source_folder)

    new_urls = []

    for file in files:
        source_path = f"{source_folder}{file['name']}"

        # Download file
        response = supabase.storage.from_("slides").download(source_path)

        # Determine destination path
        extension = (
            file["name"].split(".")[-1].lower()
            if "." in file["name"]
            else DEFAULT_IMAGE_EXTENSION
        )

        if "slide-" in file["name"]:
            # Extract slide index
            slide_index = file["name"].split("slide-")[1].split(".")[0]
            dest_path = f"{user_id}/{dest_post_id}/slide-{slide_index}.{extension}"
        elif "thumbnail" in file["name"]:
            dest_path = f"{user_id}/{dest_post_id}/thumbnail.{extension}"
        else:
            continue

        # Upload to destination
        supabase.storage.from_("slides").upload(
            path=dest_path,
            file=response,
            file_options={
                "content-type": _content_type_from_extension(extension),
                "upsert": "true",
            },
        )

        # Get public URL
        public_url = supabase.storage.from_("slides").get_public_url(dest_path)
        new_urls.append(public_url)

    return new_urls
