from PIL import Image, ImageDraw, ImageFont, ImageFilter
from typing import List
import io
from backend.models.slide import PostSlide, TextElement, BackgroundConfig
# --- Text Layout Helper ---
class TextLayout:
	def __init__(self, width: int, height: int, padding: int = 80):
		self.width = width
		self.height = height
		self.padding = padding
		self.max_text_width = width - (padding * 2)

	def wrap_text(self, text: str, font: ImageFont.FreeTypeFont) -> List[str]:
		words = text.split()
		lines = []
		current_line = []
		temp_img = Image.new('RGB', (1, 1))
		draw = ImageDraw.Draw(temp_img)
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
      'Tiktok Sans': 'TikTokSans-Regular.ttf',
			'Inter Bold': 'Inter-Bold.ttf',
			'Inter': 'Inter-Regular.ttf',
			'Plus Jakarta Sans': 'PlusJakartaSans-Bold.ttf',
			'Montserrat': 'Montserrat-Bold.ttf',
		}
		font_file = font_map.get(family, 'TikTokSans-Regular.ttf')  # Default to TikTok Sans
		
		# Scale font size to match Konva's pixel-based rendering
		# Konva fontSize is in pixels, Pillow uses points at 72 DPI
		# For 1080x1920 output, use direct pixel size (no scaling needed)
		scaled_size = size
		
		try:
			return ImageFont.truetype(f"fonts/{font_file}", scaled_size)
		except Exception:
			return ImageFont.load_default()

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
			# Load and paste background image
			try:
				from PIL import Image as PILImage
				import requests
				from io import BytesIO
				
				response = requests.get(bg_config.image_url)
				bg_img = PILImage.open(BytesIO(response.content))
				bg_img = bg_img.resize((self.width, self.height), PILImage.LANCZOS)
				img.paste(bg_img, (0, 0))
				
				# Add subtle overlay for text readability (matching Konva's 0.3 opacity)
				overlay = Image.new('RGBA', (self.width, self.height), (0, 0, 0, 77))  # 77 = 30% of 255
				img.paste(overlay, (0, 0), overlay)
			except Exception as e:
				print(f"Failed to load background image: {e}")
				# Fallback to gray
				ImageDraw.Draw(img).rectangle([(0, 0), (self.width, self.height)], fill='#333333')

	def _get_wrapped_lines(self, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list:
		"""Helper to wrap text into lines"""
		words = text.split()
		lines = []
		current_line = []
		
		temp_draw = ImageDraw.Draw(Image.new('RGB', (1, 1)))
		
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
		
		# Create shadow layer if needed
		if el.shadow_color and el.shadow_blur:
			shadow_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
			shadow_draw = ImageDraw.Draw(shadow_layer)
			
			shadow_rgb = ImageColor.getrgb(el.shadow_color)
			shadow_alpha = int((el.shadow_opacity or 1.0) * 255)
			shadow_fill = (*shadow_rgb, shadow_alpha)
			
			y = el.y + (el.shadow_offset_y or 0)
			for line in lines:
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
				for dx in range(-stroke_width, stroke_width + 1):
					for dy in range(-stroke_width, stroke_width + 1):
						if dx != 0 or dy != 0:
							stroke_draw.text((el.x + dx, y + dy), line, font=font, fill=stroke_rgb)
				y += line_height
			
			img = Image.alpha_composite(img, stroke_layer)
		
		# Draw main text on top
		main_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
		main_draw = ImageDraw.Draw(main_layer)
		color_rgb = ImageColor.getrgb(el.color)
		
		y = el.y
		for line in lines:
			main_draw.text((el.x, y), line, font=font, fill=color_rgb)
			y += line_height
		
		img = Image.alpha_composite(img, main_layer)
		
		return img.convert('RGB')
	
	def _draw_wrapped_text(self, draw: ImageDraw.Draw, el: TextElement, font: ImageFont.FreeTypeFont):
		"""Draw text with wrapping support based on element width"""
		from PIL import ImageColor
		
		# Get wrapping width from element or use default padding
		max_width = el.width if hasattr(el, 'width') and el.width else (self.width - 160)
		
		# Wrap text to fit width
		words = el.content.split()
		lines = []
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
		
		# Draw each line
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
		"""Render PostSlide to PNG bytes (matches Konva's buildStageForExport)"""
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
		
		# Output as PNG bytes
		buf = io.BytesIO()
		img.save(buf, format='PNG', quality=95, optimize=True)
		return buf.getvalue()

	def render_slides(self, slides: List[PostSlide]) -> List[bytes]:
		"""Batch render multiple PostSlides"""
		return [self.render_slide(slide) for slide in slides]
