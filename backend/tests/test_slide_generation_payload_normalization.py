import pytest

from app.features.templates.schemas import Template
from app.features.user.schemas import BrandSettings
from backend.services.slides import slide_generation as slide_generation_mod


def test_normalize_template_model_passthrough():
    template = Template(id="tmpl_1", name="Template", content_rules={"k": "v"})

    normalized = slide_generation_mod._normalize_template_input(template)

    assert normalized is template


def test_normalize_template_dict_supports_content_rules_alias():
    normalized = slide_generation_mod._normalize_template_input(
        {
            "id": "tmpl_2",
            "name": "Alias Template",
            "contentRules": {"topic": "growth"},
        }
    )

    assert normalized.id == "tmpl_2"
    assert normalized.content_rules == {"topic": "growth"}


def test_normalize_template_dict_requires_id():
    with pytest.raises(ValueError, match="missing required field: id"):
        slide_generation_mod._normalize_template_input({"name": "No ID"})


def test_normalize_brand_settings_dict_to_model():
    normalized = slide_generation_mod._normalize_brand_settings_input(
        {"name": "Radius", "niche": "marketing"}
    )

    assert isinstance(normalized, BrandSettings)
    assert normalized.name == "Radius"
    assert normalized.niche == "marketing"
