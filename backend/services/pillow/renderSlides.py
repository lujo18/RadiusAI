
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from typing import List
import io
from pathlib import Path

from models.slide import PostSlide, TextElement, BackgroundConfig
# --- Text Layout Helper ---
class TextLayout:
	def __init__(self, width: int, height: int, padding: int = 80):
		self.width = width
		self.height = height
		self.padding = padding
		self.max_text_width = width - (padding * 2)

	def wrap_text(self, text: str, font: ImageFont.FreeTypeFont) -> List[str]:
		# Split on explicit newlines first
		paragraphs = text.split('\n')
		lines = []
		temp_img = Image.new('RGB', (1, 1))
		draw = ImageDraw.Draw(temp_img)
		for para in paragraphs:
			words = para.split()
			current_line = []
			for word in words:
				test_line = ' '.join(current_line + [word])
				bbox = draw.textbbox((0, 0), test_line, font=font)
				line_width = bbox[2] - bbox[0]
				if line_width <= self.max_text_width:
					current_line.append(word)
				else:
					if current_line:
						lines.append(' '.join(current_line))
					current_line = [word]
			if current_line:
				lines.append(' '.join(current_line))
			# Add explicit line break between paragraphs (except after last)
			if para != paragraphs[-1]:
				lines.append('')
		return lines

	def draw_text_block(
		self,
		draw: ImageDraw.Draw,
		text: str,
		font: ImageFont.FreeTypeFont,
		fill: str,
		alignment: str = 'center',
		vertical_align: str = 'middle',
		line_spacing: float = 1.5
	):
		lines = TextLayout.wrap_text(self, text, font)
		line_height = font.size * line_spacing
		total_height = len(lines) * line_height
		# Vertical position
		if vertical_align == 'top':
			y = self.padding
		elif vertical_align == 'middle':
			y = (self.height - total_height) / 2
		else:
			y = self.height - total_height - self.padding
		for line in lines:
			bbox = draw.textbbox((0, 0), line, font=font)
			line_width = bbox[2] - bbox[0]
			if alignment == 'left':
				x = self.padding
			elif alignment == 'center':
				x = (self.width - line_width) / 2
			else:
				x = self.width - line_width - self.padding
			draw.text((x, y), line, font=font, fill=fill)
			y += line_height

# --- Main Slide Renderer ---
class SlideRenderer:
	def __init__(self, width: int = 1080, height: int = 1920, padding: int = 80):
		self.width = width
		self.height = height
		self.padding = padding
		self.text_layout = TextLayout(width, height, padding)

	def _load_font(self, family: str, size: int) -> ImageFont.FreeTypeFont:
		"""
		Load font with size conversion to match Konva's pixel-based sizing.
		Konva uses pixels, Pillow uses points. Scale factor ~1.33 to match.
		"""
		font_map = {
      'Tiktok Sans': 'TikTokSans-Medium.ttf',
			'Inter Bold': 'Inter-Bold.ttf',
			'Inter': 'Inter-Regular.ttf',
			'Plus Jakarta Sans': 'PlusJakartaSans-Bold.ttf',
			'Montserrat': 'Montserrat-Bold.ttf',
		}
  
		font_file = font_map.get(family, 'TikTokSans-Medium.ttf')  # Default to TikTok Sans

		# Improved font loading with diagnostics
		project_root = Path(__file__).parent.parent.parent
		local_font_path = project_root / 'assets' / 'fonts' / font_file
		docker_font_path = Path('/app/backend/assets/fonts') / font_file

		print(f"[FontLoader] Attempting local font path: {local_font_path} exists={local_font_path.exists()}")
		print(f"[FontLoader] Attempting docker font path: {docker_font_path} exists={docker_font_path.exists()}")

		font_path = None
		if local_font_path.exists():
			font_path = local_font_path
		elif docker_font_path.exists():
			font_path = docker_font_path
		else:
			font_path = local_font_path  # Try anyway for error message

		scaled_size = size
		try:
			print(f"[FontLoader] Loading font: {font_path} size={scaled_size}")
			return ImageFont.truetype(str(font_path), scaled_size)
		except Exception as e:
			print(f"[FontLoader] Failed to load font '{font_path}' for family '{family}': {e}. Using default font.")
			return ImageFont.load_default()

	def _fetch_image_with_retry(self, url: str, max_retries: int = 3, timeout: int = 10):
		"""Fetch image from URL with retry logic and proper headers"""
		import requests
		from io import BytesIO
		import time
		
		headers = {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			'Accept': 'image/*,*/*;q=0.8',
			'Accept-Language': 'en-US,en;q=0.5',
			'DNT': '1',
			'Connection': 'keep-alive',
		}
		
		for attempt in range(max_retries):
			try:
				response = requests.get(url, headers=headers, timeout=timeout)
				response.raise_for_status()
				return BytesIO(response.content)
			except requests.exceptions.Timeout:
				print(f"[Background] Timeout fetching {url} (attempt {attempt + 1}/{max_retries})")
				if attempt < max_retries - 1:
					time.sleep(2 ** attempt)  # Exponential backoff: 1s, 2s, 4s
				else:
					raise
			except requests.exceptions.ConnectionError as e:
				print(f"[Background] Connection error: {e} (attempt {attempt + 1}/{max_retries})")
				if attempt < max_retries - 1:
					time.sleep(2 ** attempt)
				else:
					raise
			except Exception as e:
				print(f"[Background] Error fetching image: {e}")
				raise
		
		return None

	def _apply_background(self, img: Image.Image, bg_config: BackgroundConfig) -> None:
		"""Apply background matching Konva's behavior"""
		if bg_config.type == 'solid' and bg_config.color:
				from PIL import ImageColor
				color = ImageColor.getrgb(bg_config.color)
				ImageDraw.Draw(img).rectangle([(0, 0), (self.width, self.height)], fill=color)
		elif bg_config.type == 'gradient' and bg_config.gradient_colors:
				# Gradient with angle support (like Konva)
				import math
				from PIL import ImageColor
				
				color1 = ImageColor.getrgb(bg_config.gradient_colors[0])
				color2 = ImageColor.getrgb(bg_config.gradient_colors[1])
				angle = bg_config.gradient_angle or 0
				
				# Convert angle to radians for gradient calculation (matching Konva)
				radians = math.radians(angle)
				
				# Simple vertical gradient (can be enhanced for angles)
				for y in range(self.height):
						ratio = y / self.height
						r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
						g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
						b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
						ImageDraw.Draw(img).line([(0, y), (self.width, y)], fill=(r, g, b))
		elif bg_config.type == 'image' and bg_config.image_url:
				# Load and paste background image with "cover" behavior
				try:
						from PIL import Image as PILImage
						from PIL import Image as PILImageModule

						img_bytes = self._fetch_image_with_retry(bg_config.image_url)
						bg_img = PILImage.open(img_bytes).convert('RGBA')
						bg_w, bg_h = bg_img.size
						target_w, target_h = self.width, self.height

						# COVER LOGIC: Calculate scale to fill the entire target area
						scale = max(target_w / bg_w, target_h / bg_h)
						new_w = int(bg_w * scale)
						new_h = int(bg_h * scale)
						
						# Resize using Lanczos for high quality
						bg_img = bg_img.resize((new_w, new_h), PILImageModule.Resampling.LANCZOS)
						
						# Center crop the resized image to fit target dimensions exactly
						left = (new_w - target_w) // 2
						top = (new_h - target_h) // 2
						right = left + target_w
						bottom = top + target_h
						bg_img = bg_img.crop((left, top, right, bottom))

						# Create canvas and paste cropped image
						temp_bg = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 255))
						temp_bg.paste(bg_img, (0, 0), bg_img)
						
						# Add subtle overlay for text readability (30% opacity)
						overlay = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 120))
						temp_bg.paste(overlay, (0, 0), overlay)
						
						img.paste(temp_bg.convert('RGB'), (0, 0))
				except Exception as e:
						print(f"[Background] Failed to load background image after retries: {e}")
						# Fallback to dark gradient
						self._apply_background(img, BackgroundConfig(
								type='gradient',
								gradient_colors=['#1a1a2e', '#16213e']
						))

	def _get_wrapped_lines(self, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list:
		"""Helper to wrap text into lines, respecting explicit \n breaks"""
		paragraphs = text.split('\n')
		lines = []
		temp_draw = ImageDraw.Draw(Image.new('RGB', (1, 1)))
		for para in paragraphs:
			words = para.split()
			current_line = []
			for word in words:
				test_line = ' '.join(current_line + [word])
				bbox = temp_draw.textbbox((0, 0), test_line, font=font)
				line_width = bbox[2] - bbox[0]
				if line_width <= max_width:
					current_line.append(word)
				else:
					if current_line:
						lines.append(' '.join(current_line))
					current_line = [word]
			if current_line:
				lines.append(' '.join(current_line))
			if para != paragraphs[-1]:
				lines.append('')
		return lines

	def _draw_text_with_effects(self, img: Image.Image, el: TextElement, font: ImageFont.FreeTypeFont) -> Image.Image:
		"""Draw text element with stroke and shadow effects (matching Konva) WITH WRAPPING"""
		from PIL import ImageColor
		
		# Convert to RGBA for effects
		img = img.convert('RGBA')
		
		# Get wrapping width and prepare lines
		max_width = el.width if hasattr(el, 'width') and el.width else (self.width - 160)
		lines = self._get_wrapped_lines(el.content, font, max_width)
		line_height = font.size * (el.line_height if hasattr(el, 'line_height') and el.line_height else 1.2)
		
		# Get alignment
		align = 'center'
		if hasattr(el, 'align') and el.align:
			align = el.align if isinstance(el.align, str) else el.align.value
		
		# Create shadow layer if needed
		if el.shadow_color and el.shadow_blur:
			shadow_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
			shadow_draw = ImageDraw.Draw(shadow_layer)
			
			shadow_rgb = ImageColor.getrgb(el.shadow_color)
			shadow_alpha = int((el.shadow_opacity or 1.0) * 255)
			shadow_fill = (*shadow_rgb, shadow_alpha)
			
			y = el.y + (el.shadow_offset_y or 0)
			for line in lines:
				# Calculate x based on alignment
				bbox = shadow_draw.textbbox((0, 0), line, font=font)
				line_width = bbox[2] - bbox[0]
				
				if align == 'center':
					x = el.x + (max_width - line_width) / 2 + (el.shadow_offset_x or 0)
				elif align == 'right':
					x = el.x + max_width - line_width + (el.shadow_offset_x or 0)
				else:
					x = el.x + (el.shadow_offset_x or 0)
				
				shadow_draw.text((x, y), line, font=font, fill=shadow_fill)
				y += line_height
			
			shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=el.shadow_blur / 2))
			img = Image.alpha_composite(img, shadow_layer)
		
		# Create stroke layer if needed
		if el.stroke and el.stroke_width:
			stroke_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
			stroke_draw = ImageDraw.Draw(stroke_layer)
			stroke_rgb = ImageColor.getrgb(el.stroke)
			stroke_width = int(el.stroke_width)
			
			y = el.y
			for line in lines:
				# Calculate x based on alignment
				bbox = stroke_draw.textbbox((0, 0), line, font=font)
				line_width = bbox[2] - bbox[0]
				
				if align == 'center':
					x = el.x + (max_width - line_width) / 2
				elif align == 'right':
					x = el.x + max_width - line_width
				else:
					x = el.x
				
				for dx in range(-stroke_width, stroke_width + 1):
					for dy in range(-stroke_width, stroke_width + 1):
						if dx != 0 or dy != 0:
							stroke_draw.text((x + dx, y + dy), line, font=font, fill=stroke_rgb)
				y += line_height
			
			img = Image.alpha_composite(img, stroke_layer)
		
		# Draw main text on top
		main_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
		main_draw = ImageDraw.Draw(main_layer)
		color_rgb = ImageColor.getrgb(el.color)
		
		y = el.y
		for line in lines:
			# Calculate x based on alignment
			bbox = main_draw.textbbox((0, 0), line, font=font)
			line_width = bbox[2] - bbox[0]
			
			if align == 'center':
				x = el.x + (max_width - line_width) / 2
			elif align == 'right':
				x = el.x + max_width - line_width
			else:
				x = el.x
			
			main_draw.text((x, y), line, font=font, fill=color_rgb)
			y += line_height
		
		img = Image.alpha_composite(img, main_layer)
		
		return img.convert('RGB')
	
	def _draw_wrapped_text(self, draw: ImageDraw.Draw, el: TextElement, font: ImageFont.FreeTypeFont):
		"""Draw text with wrapping support based on element width and explicit \n breaks"""
		from PIL import ImageColor

		max_width = el.width if hasattr(el, 'width') and el.width else (self.width - 160)
		# Use the same logic as _get_wrapped_lines for \n support
		paragraphs = el.content.split('\n')
		lines = []
		for para in paragraphs:
			words = para.split()
			current_line = []
			for word in words:
				test_line = ' '.join(current_line + [word])
				bbox = draw.textbbox((0, 0), test_line, font=font)
				line_width = bbox[2] - bbox[0]
				if line_width <= max_width:
					current_line.append(word)
				else:
					if current_line:
						lines.append(' '.join(current_line))
					current_line = [word]
			if current_line:
				lines.append(' '.join(current_line))
			if para != paragraphs[-1]:
				lines.append('')

		color = ImageColor.getrgb(el.color)
		line_height = font.size * (el.line_height if hasattr(el, 'line_height') and el.line_height else 1.2)
		y = el.y

		for line in lines:
			# Calculate x position based on alignment
			if hasattr(el, 'align') and el.align:
				align = el.align if isinstance(el.align, str) else el.align.value
				bbox = draw.textbbox((0, 0), line, font=font)
				line_width = bbox[2] - bbox[0]

				if align == 'center':
					x = el.x + (max_width - line_width) / 2
				elif align == 'right':
					x = el.x + max_width - line_width
				else:
					x = el.x
			else:
				x = el.x

			draw.text((x, y), line, font=font, fill=color)
			y += line_height
	
	def render_slide(self, slide_design: PostSlide) -> bytes:
		"""Render PostSlide to WebP bytes (matches Konva's buildStageForExport)"""
		img = Image.new('RGB', (self.width, self.height), color='#0B0B0C')
		
		# Background
		self._apply_background(img, slide_design.background)
		
		# Elements
		for el in slide_design.elements:
			if el.type == 'text':
				font = self._load_font(el.font_family, el.font_size)
				
				# If element has stroke or shadow, use effects rendering
				if (el.stroke and el.stroke_width) or (el.shadow_color and el.shadow_blur):
					img = self._draw_text_with_effects(img, el, font)
				else:
					# Draw text with wrapping support
					draw = ImageDraw.Draw(img)
					self._draw_wrapped_text(draw, el, font)
		
		# Output as WebP bytes
		buf = io.BytesIO()
		img.save(buf, format='WEBP', quality=85, method=6)
		return buf.getvalue()

	def render_slides(self, slides: List[PostSlide]) -> List[bytes]:
		"""Batch render multiple PostSlides in parallel"""
		from concurrent.futures import ThreadPoolExecutor
		
		# Render slides in parallel (up to 4 concurrent renders)
		with ThreadPoolExecutor(max_workers=4) as executor:
			rendered = list(executor.map(self.render_slide, slides))
		
		return rendered
