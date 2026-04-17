import sys
import json
import types


def test_generate_slideshow_auto_basic():
    # Stub external integration modules before importing the code under test
    # 1) Fake shared AI client
    ai_mod = types.ModuleType("app.lib.ai_client")

    fake_variation = {
        "variations": [
            {
                "slides": [
                    {
                        "slide_number": 1,
                        "layout_type": "example",
                        "text_elements": {"title": "Hello"},
                    }
                ],
                "caption": "cap",
                "hashtags": [],
                "background_query": "bg",
            }
        ]
    }

    class FakeAIClient:
        def call_ai(self, **kwargs):
            return json.dumps(fake_variation)

    ai_mod.ai_client = FakeAIClient()
    sys.modules["app.lib.ai_client"] = ai_mod

    # 2) Fake Unsplash helper
    unsplash_mod = types.ModuleType("app.features.integrations.unsplash")
    unsplash_mod.queryUnsplashUrls = lambda query, n: [f"http://example.com/{i}.jpg" for i in range(n)]
    sys.modules["app.features.integrations.unsplash"] = unsplash_mod

    # 3) Fake slide layouts
    slide_layouts = types.ModuleType("app.features.generate.genai.slide_layouts")

    def get_all_layout_schemas():
        return {"example": {}}

    slide_layouts.get_all_layout_schemas = get_all_layout_schemas
    slide_layouts.SLIDE_LAYOUTS = {"example": {"name": "example", "text_elements": [{"id": "title"}]}}
    slide_layouts.SlideLayout = dict
    sys.modules["app.features.generate.genai.slide_layouts"] = slide_layouts

    # 4) Fake prompts assembler
    prompts_mod = types.ModuleType("app.features.generate.genai.gpt_oss_prompts")
    prompts_mod.assemble_generation_prompt = lambda **kwargs: "simple prompt"
    sys.modules["app.features.generate.genai.gpt_oss_prompts"] = prompts_mod

    # 5) Fake sanitizer
    sanit_mod = types.ModuleType("app.util.llm_output_sanitizer")
    sanit_mod.sanitize_text = lambda t: t
    sys.modules["app.util.llm_output_sanitizer"] = sanit_mod

    # 6) Fake posts.schemas types
    posts_mod = types.ModuleType("app.features.posts.schemas")

    class LayoutConfig:
        def __init__(self, aspect_ratio, width, height):
            self.aspect_ratio = aspect_ratio
            self.width = width
            self.height = height


    class PostContent:
        def __init__(self, slides, layout, caption, hashtags):
            self.slides = slides
            self.layout = layout
            self.caption = caption
            self.hashtags = hashtags


    posts_mod.LayoutConfig = LayoutConfig
    posts_mod.PostContent = PostContent
    sys.modules["app.features.posts.schemas"] = posts_mod

    # 7) Fake a minimal client/prompts/usages modules used at import-time
    client_mod = types.ModuleType("app.features.generate.genai.client")
    client_mod.client = types.SimpleNamespace()
    sys.modules["app.features.generate.genai.client"] = client_mod
    sys.modules["app.features.generate.genai.prompts"] = types.ModuleType("app.features.generate.genai.prompts")
    setattr(sys.modules["app.features.generate.genai.prompts"], "SYSTEM_PROMPT", "SYSTEM")
    sys.modules["app.features.usage.service"] = types.ModuleType("app.features.usage.service")
    setattr(sys.modules["app.features.usage.service"], "track_slides_generated", lambda *a, **k: None)
    sys.modules["app.features.stock_packs"] = types.ModuleType("app.features.stock_packs")
    setattr(sys.modules["app.features.stock_packs"], "queryStockPackUrls", lambda *a, **k: None)
    sys.modules["app.features.user.schemas"] = types.ModuleType("app.features.user.schemas")
    setattr(sys.modules["app.features.user.schemas"], "BrandSettings", object)

    # 8) Fake google.genai.types used in module imports
    google_mod = types.ModuleType("google.genai")
    google_mod.types = types.SimpleNamespace()
    sys.modules["google.genai"] = google_mod

    # Import and run the function under test
    from app.features.generate.genai.generate_slideshow import generate_slideshow_auto

    result = generate_slideshow_auto("topic", brandSettings=None, count=1)
    assert isinstance(result, list)
    assert len(result) == 1
    assert hasattr(result[0], "slides")
    assert result[0].caption == "cap"
