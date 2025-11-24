def build_prompt(user_input: str):
    return f"""
You are an assistant for my app. Keep responses sharp and concise.

User request:
{user_input}
"""

def slide_prompt(user_input: str, slide_count: int): 
  return f"""
You are an expert Instagram/TikTok carousel strategist.

Output ONLY a valid CSV (no extra text, no markdown, no code blocks, no explanations). First row must be the exact header row below.

Header row (use exactly these column names):
post_id,day_of_week,publish_date,carousel_type,variant_id,slide_number,slide_text,image_search_term,caption,hashtags

Rules:
- Generate exactly ${slide_count} rows (each used for Instagram + TikTok).
- post_id format: 001, 002, 003...
- day_of_week: Monday, Tuesday, … Sunday (repeat)
- publish_date: next 7 days starting tomorrow in YYYY-MM-DD format (today is 2025-11-24, so first date is 2025-11-25)
- carousel_type: exactly one of these four → "Listicle", "Quote Thread", "Before/After Story", "Myth vs Fact"
- variant_id: A, B, C, or D (rotate fairly so we can A/B test)
  - Variant A = 7-8 slides, numbered list
  - Variant B = 5–7 bold quote slides, minimal text
  - Variant C = storytelling format with "Part 1/X" on each slide
  - Variant D = Myth → Truth format with red X and green check
- slide_number: 1 to max 10 (never exceed 10)
- slide_text: the exact text that will be overlaid. Keep under 120 characters per slide. Use line breaks with \n where needed.
- image_search_term: single Unsplash-style keyword/phrase (e.g. "dark gym motivation", "luxury watch closeup", "minimalist desk setup")
- caption: full Instagram/TikTok caption (different from slide text). Include hook + CTA + 2–3 line breaks
- hashtags: 8–12 relevant hashtags separated by spaces (no # symbol)

Niche: Fitness & mindset for men 18–35
Tone: direct, high-energy, bro-science, slightly aggressive, never corny

Example row (do NOT include in output):
025,Wednesday,2025-11-26,Listicle,A,3,"3. Wake up at 5 AM\nYour competition is still sleeping",early morning gym dark,#Fitness #GymMotivation...,"If you want to be in the top 1%...\n\nSave this and follow @yourhandle for daily alpha",Fitness GymMotivation MensPhysique etc.

You use active voice unless it's grammatically impossible. 

Now generate the full ${slide_count}-row CSV starting with the header row.

"""

