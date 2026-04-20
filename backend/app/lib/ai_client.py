from typing import Any, Literal

from app.lib.groq.client import get_groq_client
from app.lib.openrouter.client import get_openrouter_client


AIProvider = Literal["groq", "openrouter"]


class AIClient:
    """Provider-switching chat completion facade for Groq and OpenRouter."""

    def call_ai(
        self,
        provider: AIProvider,
        model_id: str,
        system_prompt: str | None = None,
        main_prompt: str | None = None,
        temperature: float = 0.7,
        top_p: float = 0.95,
        max_completion_tokens: int = 6000,
        response_format: dict[str, Any] | None = None,
        messages: list[dict[str, Any]] | None = None,
        **kwargs: Any,
    ) -> str:
        provider_name = provider.lower()

        request_messages = messages
        if request_messages is None:
            if system_prompt is None or main_prompt is None:
                raise ValueError(
                    "Either `messages` or both `system_prompt` and `main_prompt` are required"
                )
            request_messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": main_prompt},
            ]

        payload: dict[str, Any] = {
            "model": model_id,
            "messages": request_messages,
            "temperature": temperature,
            "top_p": top_p,
            "max_completion_tokens": max_completion_tokens,
            **kwargs,
        }
        if response_format is not None:
            payload["response_format"] = response_format

        payload = {k: v for k, v in payload.items() if v is not None}

        if provider_name == "groq":
            response = get_groq_client().chat.completions.create(**payload)
            response_text = response.choices[0].message.content
        elif provider_name == "openrouter":
            openrouter_payload = dict(payload)
            if (
                "max_completion_tokens" in openrouter_payload
                and "max_tokens" not in openrouter_payload
            ):
                openrouter_payload["max_tokens"] = openrouter_payload.pop(
                    "max_completion_tokens"
                )

            response = get_openrouter_client().chat_completions_create(
                **openrouter_payload
            )
            response_text = (
                response.get("choices", [{}])[0].get("message", {}).get("content")
            )
        else:
            raise ValueError(f"Unsupported AI provider: {provider}")

        if not response_text:
            raise ValueError("AI response content is empty")

        return response_text

    # Alias kept for callers that prefer camelCase naming.
    def callAi(
        self,
        provider: AIProvider,
        model_id: str,
        system_prompt: str | None = None,
        main_prompt: str | None = None,
        **kwargs: Any,
    ) -> str:
        return self.call_ai(
            provider=provider,
            model_id=model_id,
            system_prompt=system_prompt,
            main_prompt=main_prompt,
            **kwargs,
        )


ai_client = AIClient()
