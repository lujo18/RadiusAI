export const SYSTEM_TEMPLATES = {
  template_library: [
    {
      template_id: "T-TRANSFORM-01",
      name: "The Bold Transformation",
      category: "transformation",
      content_rules: {
        goal: "Reach / Deep Engagement / Saves",
        platform_optimized: ["Instagram", "TikTok"],
        slide_count: 7,
        avg_performance: {
          estimated_engagement_lift: "+45%",
          swipe_through_rate: "42%",
          save_rate: "higher",
          benchmark: "Before-and-afters consistently top viral charts",
        },
        hook_style: "Visual Contrast + Transformation Logic",
        text_density: "Light (5-10 words per slide) / Visual-First",
        structure: {
          slide_1:
            "The Shocking Before: Raw, unfiltered before image with hook text",
          slide_2:
            "The Breakdown: Brief explanation of what changed (the method/system/habit).",
          slide_3:
            "The Progression: Midpoint visual showing early changes (week 2-3 benchmark).",
          slide_4:
            "The Proof Point: Tangible metric or visible progress (numbers work best: '15lbs down,' '3-month change').",
          slide_5:
            "The Comparison: Side-by-side 'then vs now' contrasting slides for maximum visual impact.",
          slide_6:
            "The Mindset Shift: Single powerful statement about the mental/emotional change alongside results.",
          slide_7:
            "The Actionable CTA: 'Start today. Save this post. DM me for the guide.'",
        },
        key_success_factors: [
          "High-contrast visuals (bright/warm before, confident/polished after)",
          "Authentic imagery > overly edited",
          "Specific timeframe clearly stated (30/60/90 days)",
          "Include one emotional moment in the narrative",
          "Numbers always drive saves",
        ],
        brand_integration_notes: {
          aesthetic_requirement:
            "Bold color contrast between slides (warm/cool tones work)",
          tone_compatibility: "Inspirational / Motivational works best",
          text_formatting: "Large, readable fonts on non-white backgrounds",
          suggested_brand_addition:
            "add 'transformation_claim' field (specific transformation type: 'fitness', 'business', 'lifestyle')",
        },
      },
      best_for: [
        "Fitness transformations",
        "Skincare/beauty results",
        "Business growth metrics",
        "Home renovations",
        "Productivity system overhauls",
      ],
    },

    {
      template_id: "T-EDUCATE-02",
      name: "The Step-By-Step Authority",
      category: "educational",
      content_rules: {
        goal: "Saves / Community Trust / Evergreen Value",
        platform_optimized: ["Instagram", "TikTok", "LinkedIn"],
        slide_count: 6,
        avg_performance: {
          estimated_engagement_lift: "+38%",
          save_rate: "Very High (114% vs single posts)",
          completion_rate: "78%",
          benchmark: "Educational carousels are highest-saving content type",
        },
        hook_style: "Solution Promise (e.g., 'The 5-step system to achieve X')",
        text_density:
          "Medium (10-15 words per slide) / Scannable Numbered List",
        structure: {
          slide_1:
            "The Promise Hook: 'The [number]-step [outcome] system I wish I knew earlier.' Include a numbered visual (1 → N).",
          slide_2:
            "Step 1: Core action with brief context. Visual = icon, diagram, or simplified screenshot.",
          slide_3:
            "Step 2: Build on Step 1. Add specificity or common mistake to avoid here.",
          slide_4:
            "Step 3: The often-overlooked detail that separates good from great.",
          slide_5:
            "Step 4 & 5: Compressed into one slide if <5 steps; separate if more complex.",
          slide_6:
            "The Takeaway + CTA: 'Start with Step 1 today. Screenshot this. Follow for part 2.'",
        },
        key_success_factors: [
          "Numbers = credibility (5-step, 3-part, etc.)",
          "One idea per slide rule is NON-NEGOTIABLE",
          "Use consistent numbering/icons across all slides",
          "Include at least one contrarian or surprising sub-point",
          "Specific, actionable language (avoid 'consider' or 'think about')",
        ],
        brand_integration_notes: {
          aesthetic_requirement:
            "Consistent icon set or design system across all steps",
          tone_compatibility:
            "Professional + Accessible (avoid overly academic)",
          emoji_usage:
            "Minimal (1-2 per slide max for readability on step slides)",
          suggested_brand_addition:
            "add 'step_icon_style' field (e.g., 'minimalist', 'emoji', 'detailed')",
        },
      },
      best_for: [
        "How-to guides / tutorials",
        "Business systems (client onboarding, lead gen)",
        "Health/wellness protocols",
        "Skill-building sequences",
        "Financial advice / budgeting",
      ],
    },

    {
      template_id: "T-MYTH-03",
      name: "The Myth-Busting Provocateur",
      category: "myth-busting",
      content_rules: {
        goal: "Comments / Reach / Social Proof",
        platform_optimized: ["Instagram", "TikTok"],
        slide_count: 6,
        avg_performance: {
          estimated_engagement_lift: "+52%",
          comment_rate: "Very High (sparks debate)",
          share_rate: "High (contrarian content spreads)",
          benchmark:
            "@thebirdspapaya myth format went 5M+ reach multiple times",
        },
        hook_style: "Contrarian Statement / Belief Challenge",
        text_density:
          "Heavy on Slide 1, Light after (8-12 words per reveal slide)",
        structure: {
          slide_1:
            "The Provocative Hook: 'MYTH: [common false belief]. Here's why this is destroying your [outcome].'",
          slide_2:
            "The Why It's Believed: 'Everyone says this because...' (show the cultural or social proof that perpetuates the myth).",
          slide_3:
            "The Hidden Truth: 'The real science/data says...' Bold, contrarian statement with 1-2 proof points.",
          slide_4:
            "The Alternative: 'Do THIS instead.' Specific, actionable replacement for the myth.",
          slide_5:
            "The Meta-Insight: 'Why do smart people still believe the myth?' (adds depth and relatability).",
          slide_6:
            "The Call-to-Arms: 'Comment the myth you want me to bust next. Save this post.'",
        },
        key_success_factors: [
          "Myth must be ACTUALLY widely believed (research first)",
          "Bold font + high contrast on reveal slide (slide 3)",
          "Include at least one emoji or visual that signals 'surprise' (🤯, ❌, 🚫)",
          "Don't just say 'myth.' Explain WHY people believe it (social credibility).",
          "End with a question to drive comments",
        ],
        brand_integration_notes: {
          aesthetic_requirement:
            "Use contrasting colors (red/green or bold/muted) for myth vs truth",
          tone_compatibility: "Edgy / Opinionated / Authoritative works best",
          emoji_usage:
            "Moderate to Heavy (myth-busting relies on visual 'pop')",
          forbidden_words_note:
            "Avoid 'maybe,' 'possibly,' 'could' — be definitive",
          suggested_brand_addition:
            "add 'myth_credibility_source' field (academic study, personal experience, industry research)",
        },
      },
      best_for: [
        "Health/nutrition misinformation",
        "Career/money myths",
        "Fitness/training false beliefs",
        "Marketing/business conventions",
        "Parenting/relationship advice",
        "Tech adoption rumors",
      ],
    },

    {
      template_id: "T-COMPARE-04",
      name: "The Strategic Comparison",
      category: "comparison",
      content_rules: {
        goal: "Reach / Decision Clarity / Engagement",
        platform_optimized: ["Instagram", "TikTok", "LinkedIn"],
        slide_count: 7,
        avg_performance: {
          estimated_engagement_lift: "+40%",
          save_rate: "High (users save for decision-making)",
          completion_rate: "82%",
          benchmark: "Comparisons are bookmarked for future reference",
        },
        hook_style: "Binary Choice / Side-by-Side Contrast",
        text_density:
          "Medium (10-15 words per comparison slide) / Balanced Layout",
        structure: {
          slide_1:
            "The Headline Hook: 'The difference between [Option A] and [Option B] nobody talks about.' Include visual split.",
          slide_2:
            "Comparison #1 - Cost: Side-by-side cost analysis. Which is 'cheaper'? Be clear.",
          slide_3:
            "Comparison #2 - Results: Specific outcome metric for each option (speed, quality, durability).",
          slide_4:
            "Comparison #3 - Hidden Factor: The thing most people overlook (time, maintenance, skill required).",
          slide_5:
            "Comparison #4 - Real Example: Show actual result/case study for each option.",
          slide_6:
            "The Verdict Slide: 'Choose [A] if you want X. Choose [B] if you want Y.'",
          slide_7:
            "The CTA: 'Comment which you'd choose. I'll validate your pick in the DMs.'",
        },
        key_success_factors: [
          "Use consistent left/right layout for all comparisons (reduces cognitive load)",
          "Include at least 1 metric where 'traditional choice' loses",
          "Avoid being obviously biased (even if you prefer one)",
          "Use color coding (green for winner, gray for trade-off)",
          "Include a 'hidden factor' that reframes the choice",
        ],
        brand_integration_notes: {
          aesthetic_requirement:
            "Left vs Right visual split (use brand colors to differentiate A/B)",
          tone_compatibility: "Neutral / Analytical / Authoritative",
          table_format_note:
            "Comparisons work best as visual charts, not text lists",
          suggested_brand_addition:
            "add 'comparison_bias' field (declare any financial interest in outcome)",
        },
      },
      best_for: [
        "Product comparisons (Shopify vs WooCommerce)",
        "Career path comparisons (employee vs freelancer)",
        "Approach comparisons (paid ads vs organic)",
        "Subscription/tool comparisons",
        "Strategy comparisons (short-term vs long-term growth)",
      ],
    },

    {
      template_id: "T-CURIOSITY-05",
      name: "The Cliffhanger Reveal",
      category: "curiosity",
      content_rules: {
        goal: "Reach / Completion Rate / Viral Potential",
        platform_optimized: ["Instagram", "TikTok"],
        slide_count: 5,
        avg_performance: {
          estimated_engagement_lift: "+48%",
          completion_rate: "94% (highest format)",
          replay_rate: "High",
          benchmark: "Cliffhangers drive highest completion rates",
        },
        hook_style: "Information Gap / Promise of Surprise",
        text_density: "Very Light (3-8 words per slide) / Suspense-Driven",
        structure: {
          slide_1:
            "The Setup: 'I made [outcome]. Here's what almost nobody knows about how I did it.' Visual = teaser image.",
          slide_2:
            "The Build-Up: Visual change or cryptic hint. Text: 'But first, here's where most people go wrong...'",
          slide_3:
            "The Complication: A relatable problem or unexpected twist. Text: 'Most people would [common approach]. That's the mistake.'",
          slide_4:
            "The Payoff: The surprising answer or method revealed. Text: 'Here's what actually worked.' (Big visual impact slide.)",
          slide_5:
            "The Proof + CTA: Quick social proof or result. 'Comment 'REVEAL' and I'll send the full breakdown in DMs.'",
        },
        key_success_factors: [
          "Slide 2 is CRITICAL: Visual must change or look different (teaser effect)",
          "Payoff (slide 4) must be genuinely surprising or novel",
          "Don't reveal the secret in the hook caption; let the carousel tell the story",
          "Use text overlays sparingly to maximize visual impact",
          "Include at least one emoji or arrow directing attention forward",
        ],
        brand_integration_notes: {
          aesthetic_requirement:
            "Visual continuity across teaser → reveal (same setting, progressive change)",
          tone_compatibility: "Humorous / Self-aware / Cheeky works well",
          pacing_note:
            "Each slide should feel distinct (color, tone, composition change)",
          suggested_brand_addition:
            "add 'reveal_impact_visual' field (e.g., 'before_after', 'zoomed_detail', 'transformation')",
        },
      },
      best_for: [
        "Success stories with unexpected turns",
        "Productivity/efficiency hacks",
        "Growth reversals or 'failed then succeeded' narratives",
        "Product launch reveals",
        "Personal finance breakthroughs",
      ],
    },

    {
      template_id: "T-EXPERT-06",
      name: "The Expert Authority Block",
      category: "expert",
      content_rules: {
        goal: "Reach / Trust / Lead Generation",
        platform_optimized: ["Instagram", "LinkedIn", "TikTok"],
        slide_count: 6,
        avg_performance: {
          estimated_engagement_lift: "+35%",
          save_rate: "High",
          profile_click_rate: "Higher than average",
          benchmark: "Authority-driven carousels build long-term trust",
        },
        hook_style: "Expert Insight / Research-Backed Claim",
        text_density: "Medium (12-15 words per slide) / Data-Heavy",
        structure: {
          slide_1:
            "The Credibility Hook: '[Your credentials/proof] taught me [counterintuitive insight].' Include stat or research reference.",
          slide_2:
            "The Foundational Idea: Explain the principle underpinning your insight.",
          slide_3:
            "The Data Point: Include a statistic, research finding, or case metric. Use a visual chart/infographic.",
          slide_4:
            "The Application: How this insight applies to the audience's specific situation.",
          slide_5:
            "The Actionable Insight: One specific behavior or metric they should track starting today.",
          slide_6:
            "The Authority CTA: 'I've written a detailed breakdown of this. Link in bio. Save this for reference.'",
        },
        key_success_factors: [
          "Lead with specific credential or research source (not vague authority)",
          "Data/stat should feel recent or surprising",
          "Use consistent typography for numerical data (large, bold, readable)",
          "Avoid jargon unless audience is native to the field",
          "Include at least one counter-intuitive sub-point (breaks expectations)",
        ],
        brand_integration_notes: {
          aesthetic_requirement:
            "Professional, clean design; use muted colors + 1-2 accent colors",
          tone_compatibility: "Professional / Authoritative / Accessible",
          citation_format:
            "Always cite research source (URL, author, publication)",
          suggested_brand_addition:
            "add 'expertise_category' field (e.g., 'research', 'experience', 'data') and 'credential_mention' (whether to lead with creds)",
        },
      },
      best_for: [
        "Industry insights / research breakdowns",
        "Finance / investment advice",
        "Health / medical information",
        "Business strategy insights",
        "Career advancement guidance",
      ],
    },

    {
      template_id: "T-FLIPBOOK-07",
      name: "The Stop-Motion Flipbook",
      category: "flipbook",
      content_rules: {
        goal: "Reach / Engagement / Viral Novelty",
        platform_optimized: ["Instagram"],
        slide_count: 8,
        avg_performance: {
          estimated_engagement_lift: "+55%",
          dwell_time: "Highest (viewers replay/scrub through)",
          share_rate: "Very High (novel format)",
          benchmark: "Emerging format with exponential engagement potential",
        },
        hook_style: "Visual Animation / Progressive Change",
        text_density: "Minimal (0-5 words per slide) / Visual-Driven",
        structure: {
          slide_1:
            "The Initial State: Clear, bright visual of [object/person/setting] at starting position.",
          slide_2:
            "The Subtle Shift #1: Barely perceptible change (hair moves, outfit changes slightly, background element shifts).",
          slide_3:
            "The Build #2: More noticeable progression (hands move, product rotates, expression changes).",
          slide_4:
            "The Momentum #3: Change becomes obvious (full rotation, significant visual shift, major transformation begins).",
          slide_5:
            "The Peak #4: Dramatic change point (character in new pose, product fully revealed, setting completely transformed).",
          slide_6:
            "The Continuation #5: Follow-through of the motion (movement completes, new state becomes clear).",
          slide_7:
            "The Hold #6: Final state, paused moment for viewer appreciation.",
          slide_8:
            "The Call-to-Action: 'Hold and scrub through the carousel for the full animation 🎬 Follow for more.'",
        },
        key_success_factors: [
          "CRITICAL: Consistent lighting, background, camera angle across all 8 slides",
          "Changes must be visible but not jarring (frame-by-frame smoothness matters)",
          "Optimal motion: 8-12 degree angle change per slide for smooth animation",
          "Use high-contrast elements (avoid monochrome backgrounds)",
          "Recommend starting with 5-6 frames, expand to 8 if motion is smooth",
        ],
        production_notes: {
          photography_requirement:
            "Use tripod for consistency; identical lighting/white balance across shots",
          editing_tip:
            "Use CapCut or similar to sequence images in order, review at 2x speed for smoothness",
          design_note:
            "Slight zoom or pan between frames adds fluidity without requiring object movement",
        },
        brand_integration_notes: {
          aesthetic_requirement:
            "High production value; consistent visual brand color/style throughout",
          tone_compatibility: "Creative / Playful / Modern",
          suggested_brand_addition:
            "add 'animation_motion_type' field (e.g., 'rotation', 'transformation', 'reveal')",
        },
      },
      best_for: [
        "Product reveals (packaging, usage, transformation)",
        "Fashion/styling transformations",
        "Room makeovers / renovations",
        "Character/meme content",
        "Brand storytelling with visual metaphor",
      ],
    },

    {
      template_id: "T-NARRATIVE-08",
      name: "The Vulnerable Narrative Bridge",
      category: "narrative",
      content_rules: {
        goal: "Followers / Deep Trust / Community Connection",
        platform_optimized: ["Instagram", "TikTok"],
        slide_count: 7,
        avg_performance: {
          estimated_engagement_lift: "+42%",
          save_rate: "High",
          comment_depth: "Very High (personal, meaningful comments)",
          benchmark: "Authenticity-driven content generates loyal followers",
        },
        hook_style: "Vulnerability + Relatable Problem + Transformation",
        text_density:
          "Medium-Heavy (12-18 words per slide) / Conversational Tone",
        structure: {
          slide_1:
            "The Vulnerable Hook: 'I used to [struggle/believe/feel] X until I realized Y.' Must feel honest, not polished.",
          slide_2:
            "The Relatable Breakdown: 'Here's the exact moment it clicked.' Specific situation where the old mindset broke.",
          slide_3:
            "The Turning Point: 'Then I discovered [insight/person/experience] that changed everything.'",
          slide_4:
            "The Daily Habit: 'Now I [small 1% action]. It takes 5 minutes.' Actionable, micro-level shift.",
          slide_5:
            "The Evidence: 'Before vs. After' internal state (mindset, confidence, results). Show both tangible + emotional proof.",
          slide_6:
            "The Identity Shift: 'I went from [old identity] to [new identity]. You can too.'",
          slide_7:
            "The Invitation CTA: 'Which version of you do you want to become? Comment below. Let's rebuild together.'",
        },
        key_success_factors: [
          "Vulnerability must be REAL (not manufactured for engagement)",
          "Include a specific date or timeframe ('6 months ago,' 'last summer')",
          "The 'turning point' should feel like a genuine epiphany, not marketing speak",
          "Use first-person consistently; avoid switching to advice-giving until the final CTA",
          "Show emotion through imagery (facial expression, body language, visual context)",
        ],
        brand_integration_notes: {
          aesthetic_requirement:
            "Authentic, unpolished visuals work better than overly curated (warm filters, natural lighting)",
          tone_compatibility: "Vulnerable / Inspirational / Honest",
          visual_strategy:
            "Mix personal photos, candid moments, lifestyle imagery. Avoid stock photos.",
          suggested_brand_addition:
            "add 'narrative_type' field (e.g., 'recovery', 'pivot', 'awakening') and 'vulnerability_level' (1-5 scale)",
        },
      },
      best_for: [
        "Personal development / mindset shifts",
        "Recovery stories (fitness, mental health, career)",
        "Identity transformation narratives",
        "Trust-building for coaches, therapists, mentors",
        "Wellness journeys",
      ],
    },

    {
      template_id: "T-QUESTION-09",
      name: "The Rapid-Fire Q&A Reveal",
      category: "question",
      content_rules: {
        goal: "Engagement / Comments / Saves",
        platform_optimized: ["Instagram", "TikTok"],
        slide_count: 6,
        avg_performance: {
          estimated_engagement_lift: "+44%",
          comment_rate: "Very High (questions invite answers)",
          save_rate: "High (reference material)",
          benchmark: "Interactive Q&A drives algorithmic boost",
        },
        hook_style: "Question + Surprising Answer Pattern",
        text_density: "Heavy (15-20 words per slide) / Q&A Format",
        structure: {
          slide_1:
            "The Meta Hook: 'The questions I get asked MOST in my DMs [about your niche]. Let's answer them.'",
          slide_2:
            "Question #1 + Answer: 'Q: [Most common question]' / 'A: [Direct, surprising answer in 1-2 sentences]'",
          slide_3:
            "Question #2 + Answer: A different question from audience. Make the answer somewhat contrarian.",
          slide_4:
            "Question #3 + Answer: Third question. Include a metric or specific number in the answer.",
          slide_5:
            "The Bonus Insight: 'The question NOBODY asks but should:' [Your curated, underrated question + answer]",
          slide_6:
            "The Engagement CTA: 'What's the question you want me to answer next? Drop it in the comments.'",
        },
        key_success_factors: [
          "Questions must be REAL (pulled from actual DMs or comments, not made up)",
          "Answers should be direct and concise (avoid meandering explanations)",
          "Include at least one surprising or contrarian answer (breaks expectations)",
          "Use bold formatting for Q vs A (high contrast makes scanning easy)",
          "Final 'bonus' question is your secret sauce (the thing people didn't know to ask)",
        ],
        brand_integration_notes: {
          aesthetic_requirement:
            "Q&A format benefits from clean typography and high contrast (white space critical)",
          tone_compatibility: "Helpful / Direct / Authoritative",
          emoji_usage:
            "Minimal (maybe 1 question mark icon, but keep text scannable)",
          suggested_brand_addition:
            "add 'dm_sourcing_required' flag (yes/no) and 'answer_specificity_level' (high/medium/low)",
        },
      },
      best_for: [
        "Expert Q&A / AMA formats",
        "Customer service FAQ",
        "Audience pain-point clarification",
        "Misconception correction",
        "Product/feature explanation",
      ],
    },

    {
      template_id: "T-PATTERN-10",
      name: "The Pattern Interrupt Surprise",
      category: "pattern",
      content_rules: {
        goal: "Reach / Viral Potential / Shareability",
        platform_optimized: ["Instagram", "TikTok"],
        slide_count: 5,
        avg_performance: {
          estimated_engagement_lift: "+58%",
          share_rate: "Highest format",
          viral_coefficient: "High (unexpected payoff drives word-of-mouth)",
          benchmark: "Pattern interrupts are designed for viral spread",
        },
        hook_style: "Misdirection + Surprise Pivot",
        text_density: "Very Light (5-10 words per slide) / Visual Storytelling",
        structure: {
          slide_1:
            "The Misdirection Setup: Start with an unrelated, attention-grabbing visual or statement. Viewer thinks it's one story.",
          slide_2:
            "The Build: Continue the false narrative. Viewer is fully invested in expected outcome.",
          slide_3:
            "The Plot Twist: Unexpected pivot or reveal. Visual or text suddenly shifts context.",
          slide_4:
            "The Product/Brand Reveal: Now connect the surprise back to your offer/message/product. Viewer mind = blown.",
          slide_5:
            "The Reaction CTA: 'Tag someone who'd fall for this 😂' or 'Thought it was going where? Comment below.'",
        },
        key_success_factors: [
          "Misdirection must feel AUTHENTIC (not obviously fake or too contrived)",
          "Pivot moment (slide 3-4) should feel genuinely surprising to the viewer",
          "Use emotional contrast (setup is different tone/energy than payoff)",
          "Include a second 'meta' layer (viewer realizes they were played, finds it funny)",
          "Avoid anything that feels manipulative; humor/delight is the goal, not deception",
        ],
        production_notes: {
          video_tip:
            "Use contrasting music/audio between setup and reveal for extra impact",
          timing:
            "Slides 1-2 should move quickly; pause at slide 3 for maximum surprise",
          visual_contrast:
            "Setup and payoff should have distinctly different aesthetics/colors",
        },
        brand_integration_notes: {
          aesthetic_requirement:
            "Setup can be any style; reveal must align with brand identity/colors",
          tone_compatibility: "Playful / Humorous / Irreverent works best",
          risk_level:
            "Medium (pattern interrupts can backfire if audience feels duped rather than delighted)",
          suggested_brand_addition:
            "add 'misdirection_type' field (e.g., 'emotional', 'visual', 'contextual') and 'tone_guardrail' note",
        },
      },
      best_for: [
        "Product launches (misdirect before reveal)",
        "Brand awareness / viral moments",
        "Entertainment + product hybrid content",
        "Meme-style humor + product",
        "Unexpected benefit reveals",
      ],
    },

    {
      template_id: "T-CHECKLIST-11",
      name: "One-Screen Checklist",
      category: "checklist",
      content_rules: {
        goal: "Saves / Evergreen",
        platform_optimized: ["Instagram", "TikTok"],
        slide_count: 5,
        avg_performance: {
          estimated_engagement_lift: "+40%",
          share_rate: "High",
          viral_coefficient: "Medium (High utility drives saves)",
          benchmark: "80%+ completion rate",
        },
        hook_style: "Outcome-Oriented Utility",
        text_density: "Medium (8-14 words/slide)",
        structure: {
          slide_1:
            "Hook: 'Checklist to get [specific outcome] without guessing.'",
          slide_2: "Checklist Part 1: 3–5 items (Foundations)",
          slide_3: "Checklist Part 2: 3–5 items (Optimization)",
          slide_4: "Checklist Part 3: 3–5 items (Mistakes to avoid)",
          slide_5:
            "Summary + CTA: 'Save this checklist. Use it before your next [task].'",
        },
        key_success_factors: [
          "Use clear bullets, not paragraphs",
          "All items should be binary (done/not done)",
          "Order from easiest → hardest actions",
          "Label sections clearly: 'Foundation / Optimize / Avoid'",
          "Design for screenshot readability (no tiny text)",
        ],
        production_notes: {
          video_tip: "Use a steady rhythmic track to match checking off items",
          timing:
            "Ensure the final summary slide stays on screen long enough to screenshot",
          visual_contrast:
            "Use high-contrast boxes or cards for checklist items",
        },
        brand_integration_notes: {
          aesthetic_requirement:
            "Clean, minimalist layout to maintain readability",
          tone_compatibility: "Practical / Direct",
          risk_level: "Low",
          suggested_brand_addition:
            "add 'misdirection_type' field (N/A for this format) and 'tone_guardrail' note: avoid excessive emojis to maintain authority",
        },
      },
      best_for: [
        "Launch checklist",
        "Onboarding checklist",
        "Content checklist",
        "Workout/meal prep checklist",
        "Daily system checklist",
      ],
    },
    {
      template_id: "T-MISTAKES-12",
      name: "The Mistake Map",
      category: "educational",
      content_rules: {
        goal: "Comments / Saves",
        platform_optimized: ["Instagram", "TikTok", "LinkedIn"],
        slide_count: 6,
        avg_performance: {
          estimated_engagement_lift: "+42%",
          share_rate: "High",
          viral_coefficient: "High (Pain-point resonance)",
          benchmark: "High comment volume from relatability",
        },
        hook_style: "Negative Constraint (Fear of Missing Out/Failing)",
        text_density: "Medium (10-16 words/slide)",
        structure: {
          slide_1:
            "Hook: '[N] mistakes killing your [outcome] (and what to do instead).'",
          slide_2: "Mistake #1 + quick consequence + 1-line fix",
          slide_3: "Mistake #2 + consequence + 1-line fix",
          slide_4: "Mistake #3 + consequence + 1-line fix",
          slide_5: "Bonus mistake: Less obvious, more advanced",
          slide_6:
            "CTA: 'Which mistake hits you hardest? Comment the number & save this.'",
        },
        key_success_factors: [
          "Mistakes must be specific, not generic",
          "Each slide = 1 mistake, 1 consequence, 1 fix",
          "Use numbers (#1, #2, #3…) visually big",
          "At least one 'controversial' mistake to spark replies",
          "Language should be blunt, not soft",
        ],
        production_notes: {
          video_tip:
            "Use 'error' sound effects or visual glitches for mistake reveals",
          timing: "Fast-paced delivery to keep the 'pain' high and 'fix' quick",
          visual_contrast:
            "Use red/warning colors for mistakes vs green/brand for fixes",
        },
        brand_integration_notes: {
          aesthetic_requirement: "Numbered cards with consistent layout",
          tone_compatibility: "Edgy / Direct / Honest",
          risk_level: "Low-Medium",
          suggested_brand_addition:
            "add 'misdirection_type' field (Logic-based) and 'tone_guardrail' note: ensure fixes are empowering, not just critical",
        },
      },
      best_for: [
        "Sales mistakes",
        "Fitness/nutrition mistakes",
        "Hiring/management mistakes",
        "Content strategy mistakes",
        "Money/finance mistakes",
      ],
    },
    {
      template_id: "T-DOTHIS-13",
      name: "Do This, Not That",
      category: "comparison",
      content_rules: {
        goal: "Saves / Clarity",
        platform_optimized: ["Instagram", "TikTok", "LinkedIn"],
        slide_count: 6,
        avg_performance: {
          estimated_engagement_lift: "+39%",
          share_rate: "High",
          viral_coefficient: "Medium (Visual clarity makes it sharable)",
          benchmark: "80%+ completion rate",
        },
        hook_style: "Comparison / Optimization",
        text_density: "Light-Medium (8-12 words/slide)",
        structure: {
          slide_1: "Hook: 'Do this, not that, to get [outcome] faster.'",
          slide_2:
            "Row 1: 'Not that' (common behavior) vs 'Do this' (better behavior)",
          slide_3: "Row 2: 'Not that' vs 'Do this'",
          slide_4: "Row 3: 'Not that' vs 'Do this'",
          slide_5: "Row 4: 'Not that' vs 'Do this' (advanced tweak)",
          slide_6: "CTA: 'Pick 1 to switch this week. Save as a reminder.'",
        },
        key_success_factors: [
          "Make 'Not that' obviously relatable and slightly painful",
          "Make 'Do this' clearly more specific and actionable",
          "Left = red/grey 'Not that', Right = green/brand color 'Do this'",
          "Keep each pair focused on one dimension",
          "Avoid nuance; make the choice visually and logically obvious",
        ],
        production_notes: {
          video_tip:
            "Split screen video showing the 'wrong' way vs the 'right' way side-by-side",
          timing: "Consistent rhythm for each comparison slide",
          visual_contrast: "Consistent left/right split for all comparisons",
        },
        brand_integration_notes: {
          aesthetic_requirement:
            "Clean split-screen or side-by-side card design",
          tone_compatibility: "Practical / Straightforward",
          risk_level: "Low",
          suggested_brand_addition:
            "add 'misdirection_type' field (Behavioral) and 'tone_guardrail' note: do not mock the 'Not That' behavior too harshly",
        },
      },
      best_for: [
        "Content tactics",
        "Sales scripts",
        "Study habits",
        "Training techniques",
        "Spending/saving behaviors",
      ],
    },
    {
      template_id: "T-ROADMAP-14",
      name: "The Level-Up Roadmap",
      category: "growth",
      content_rules: {
        goal: "Saves / Progress Tracking",
        platform_optimized: ["Instagram", "TikTok"],
        slide_count: 7,
        avg_performance: {
          estimated_engagement_lift: "+41%",
          share_rate: "Very High",
          viral_coefficient: "High (Gamified progression)",
          benchmark: "83% completion rate",
        },
        hook_style: "Aspirational Journey",
        text_density: "Medium (10-15 words/slide)",
        structure: {
          slide_1: "Hook: 'Roadmap from [Level 1] to [Level 4] in [niche].'",
          slide_2: "Level 1: Starting point (behaviors, metrics, mindset)",
          slide_3: "Level 2: Next stage (what changes, what you focus on)",
          slide_4: "Level 3: Advanced stage (systems, leverage, key metric)",
          slide_5:
            "Level 4: 'Pro' stage (what it actually looks like day-to-day)",
          slide_6:
            "Common plateau: Where people get stuck & how to break through",
          slide_7:
            "CTA: 'Screenshot this roadmap. Circle your level and next step.'",
        },
        key_success_factors: [
          "Each level should feel clearly different and realistic",
          "Include at least one quantifiable metric per level",
          "Visually show a ladder/steps or ascending graph",
          "Avoid vague labels like 'beginner'; use specific descriptors",
          "Make 'next step' for each level painfully obvious",
        ],
        production_notes: {
          video_tip: "Use ascending sound scales or 'level up' gaming SFX",
          timing: "Slow down slightly at Level 3 and 4 to show complexity",
          visual_contrast:
            "Step/ladder or tiered cards with progression colors",
        },
        brand_integration_notes: {
          aesthetic_requirement:
            "Hierarchical layout (Bottom to Top or Left to Right)",
          tone_compatibility: "Aspirational / Structured",
          risk_level: "Low",
          suggested_brand_addition:
            "add 'misdirection_type' field (N/A) and 'tone_guardrail' note: maintain a supportive, coaching voice",
        },
      },
      best_for: [
        "Skill progression",
        "Revenue stages",
        "Fitness levels",
        "Social media growth stages",
        "Career ladder",
      ],
    },
    {
      template_id: "T-STACK-15",
      name: "The Resource Stack",
      category: "curation",
      content_rules: {
        goal: "Saves / Shares",
        platform_optimized: ["Instagram", "TikTok", "LinkedIn"],
        slide_count: 6,
        avg_performance: {
          estimated_engagement_lift: "+43%",
          share_rate: "Very High",
          viral_coefficient: "High (Tool-based utility is highly viral)",
          benchmark: "Very high save rate",
        },
        hook_style: "The 'Starting Over' hypothetical / Authority curation",
        text_density: "Medium (8-14 words/slide)",
        structure: {
          slide_1: "Hook: 'The [niche] stack I’d use if I had to start over.'",
          slide_2: "Category 1: Tools/apps/resources + 1-line use-case each",
          slide_3: "Category 2: Tools/apps/resources + 1-line use-case each",
          slide_4: "Category 3: Tools/apps/resources + 1-line use-case each",
          slide_5: "Bonus: 1–2 underrated tools/resources nobody talks about",
          slide_6: "CTA: 'Save this stack. Comment if you want a deep-dive.'",
        },
        key_success_factors: [
          "Group tools by function (editing, outreach, analytics, etc.)",
          "Only include tools/resources you can briefly explain",
          "Include at least one free/low-cost option per category",
          "Use actual logos/icons if allowed for quick recognition",
          "Title each category clearly: 'Capture / Nurture / Convert' etc.",
        ],
        production_notes: {
          video_tip: "Screen-record the tool interfaces for a split second",
          timing: "Quick cuts between tool categories",
          visual_contrast: "Card/grid layout with tool names and 1-liners",
        },
        brand_integration_notes: {
          aesthetic_requirement:
            "Logos/Icons must be high quality and consistent size",
          tone_compatibility: "Helpful / Tactical",
          risk_level: "Low",
          suggested_brand_addition:
            "add 'misdirection_type' field (Tool-based) and 'tone_guardrail' note: ensure tools mentioned align with brand values",
        },
      },
      best_for: [
        "Creator tool stack",
        "Sales stack",
        "Productivity stack",
        "Learning/education stack",
        "Fitness/nutrition stack",
      ],
    },
    {
      template_id: "T-SCRIPT-16",
      name: "Plug-and-Play Scripts",
      category: "utility",
      content_rules: {
        goal: "Saves / Implementation",
        platform_optimized: ["Instagram", "TikTok"],
        slide_count: 6,
        avg_performance: {
          estimated_engagement_lift: "+44%",
          share_rate: "Very High",
          viral_coefficient: "Medium-High (Tangible value)",
          benchmark: "80%+ completion rate",
        },
        hook_style: "Effort Reduction / 'Steal This'",
        text_density: "Heavy (15-22 words/slide, formatted as lines)",
        structure: {
          slide_1:
            "Hook: 'Steal these scripts for [specific situation] so you don’t overthink.'",
          slide_2: "Script 1: Scenario + 3–4 lines (with fill-in brackets)",
          slide_3: "Script 2: Scenario + 3–4 lines",
          slide_4: "Script 3: Scenario + 3–4 lines",
          slide_5: "Bonus script: For a tougher/awkward scenario",
          slide_6: "CTA: 'Save these. Copy/paste, tweak brackets, then send.'",
        },
        key_success_factors: [
          "Format scripts line-by-line (easy to screenshot & copy)",
          "Use placeholders: [niche], [result], [timeframe]",
          "Keep language simple and direct, no fluff",
          "Each script handles one clear objection/goal",
          "Emphasize 'copy → tweak → send' in CTA",
        ],
        production_notes: {
          video_tip: "Use a typing sound effect as the script appears",
          timing: "Slow enough to read the full script text",
          visual_contrast: "Chat-bubble or code-block look for script sections",
        },
        brand_integration_notes: {
          aesthetic_requirement: "Must look like a UI element (SMS/DM/Code)",
          tone_compatibility: "Direct / Conversational",
          risk_level: "Low",
          suggested_brand_addition:
            "add 'misdirection_type' field (N/A) and 'tone_guardrail' note: scripts must match the user's authentic brand voice",
        },
      },
      best_for: [
        "DM scripts",
        "Sales objections",
        "Client onboarding messages",
        "Networking/intros",
        "Follow-up messages",
      ],
    },
    {
      template_id: "T-CASE-17",
      name: "Mini Case Study",
      category: "authority",
      content_rules: {
        goal: "Trust / Leads",
        platform_optimized: ["Instagram", "TikTok", "LinkedIn"],
        slide_count: 6,
        avg_performance: {
          estimated_engagement_lift: "+37%",
          share_rate: "Medium",
          viral_coefficient: "Low-Medium (High trust, lower mass-share)",
          benchmark: "High profile clicks/lead intent",
        },
        hook_style: "Result-First (Before & After)",
        text_density: "Medium (10-15 words/slide)",
        structure: {
          slide_1:
            "Hook: 'How we went from [starting metric] to [result] in [timeframe].'",
          slide_2: "Context: Who it was for + starting situation",
          slide_3: "Strategy: 1–3 levers pulled (keep it simple)",
          slide_4: "Execution: What was actually done week-to-week",
          slide_5: "Results: Metrics, screenshots, before/after graph",
          slide_6:
            "CTA: 'Comment CASE for breakdown / link in bio for full story.'",
        },
        key_success_factors: [
          "Include at least 2 clear numbers (before vs after)",
          "Show 1 image of proof (screenshot/chart/photo)",
          "Keep 'strategy' to 3 bullets max",
          "Make 'who it was for' extremely specific",
          "No mystery—show exactly what happened at a high level",
        ],
        production_notes: {
          video_tip: "Voiceover explaining the 'Aha' moment of the strategy",
          timing: "Linger on the results slide (Slide 5) to build credibility",
          visual_contrast:
            "Use data viz or mock analytics cards where possible",
        },
        brand_integration_notes: {
          aesthetic_requirement: "Professional, data-backed look",
          tone_compatibility: "Evidence-based / Confident",
          risk_level: "Medium (Must have verifiable data)",
          suggested_brand_addition:
            "add 'misdirection_type' field (N/A) and 'tone_guardrail' note: avoid sounding like a 'get rich quick' scheme",
        },
      },
      best_for: [
        "Client results",
        "Personal experiment",
        "Product feature success",
        "Ad/campaign performance",
        "Routine/protocol results",
      ],
    },
    {
      template_id: "T-ROUTINE-18",
      name: "Daily/Weekly Blueprint",
      category: "lifestyle",
      content_rules: {
        goal: "Saves / Habit Adoption",
        platform_optimized: ["Instagram", "TikTok"],
        slide_count: 5,
        avg_performance: {
          estimated_engagement_lift: "+38%",
          share_rate: "High",
          viral_coefficient: "Medium",
          benchmark: "80%+ completion rate",
        },
        hook_style: "Structure / Peace of Mind",
        text_density: "Medium (10-15 words/slide)",
        structure: {
          slide_1:
            "Hook: 'My [daily/weekly] blueprint for [outcome] without burning out.'",
          slide_2: "Block 1: Morning / Start-of-day tasks",
          slide_3: "Block 2: Deep work / Core work block",
          slide_4: "Block 3: Maintenance / admin / low-energy tasks",
          slide_5: "Block 4: Evening / reset / review / CTA",
        },
        key_success_factors: [
          "Organize by time blocks, not random tasks",
          "Label each block with goal (Focus / Output / Recovery)",
          "Keep examples concrete, not vague",
          "Make it clear user should adapt, not copy blindly",
          "Use simple timeline or column layout",
        ],
        production_notes: {
          video_tip: "Time-lapse footage of you completing the blocks",
          timing: "Calm, steady transitions",
          visual_contrast: "Timeline or 2x2 grid of blocks",
        },
        brand_integration_notes: {
          aesthetic_requirement: "Clock or calendar icons for time blocks",
          tone_compatibility: "Structured / Calm",
          risk_level: "Low",
          suggested_brand_addition:
            "add 'misdirection_type' field (N/A) and 'tone_guardrail' note: ensure the routine feels attainable",
        },
      },
      best_for: [
        "Creator daily routine",
        "Training schedule",
        "Study routine",
        "Client work schedule",
        "Marketing/content calendar",
      ],
    },
    {
      template_id: "T-CHALLENGE-19",
      name: "7-Day Challenge",
      category: "community",
      content_rules: {
        goal: "Engagement / Habit Start",
        platform_optimized: ["Instagram", "TikTok"],
        slide_count: 7,
        avg_performance: {
          estimated_engagement_lift: "+40%",
          share_rate: "High",
          viral_coefficient: "High (Network effect of 'joining' a challenge)",
          benchmark: "High comment volume ('IN')",
        },
        hook_style: "Low-Barrier Commitment",
        text_density: "Light-Medium (8-12 words/slide)",
        structure: {
          slide_1:
            "Hook: '7-day [niche] challenge to get your first quick win.'",
          slide_2: "Day 1: Simple starter action",
          slide_3: "Day 2: Slightly harder action",
          slide_4: "Day 3: Action + quick reflection prompt",
          slide_5: "Day 4–5: Stack previous days + new micro action",
          slide_6: "Day 6–7: Hardest actions + mini self-review",
          slide_7: "CTA: 'Comment “IN”, save this, and tag me on Day 7.'",
        },
        key_success_factors: [
          "Day 1 must be extremely easy (almost too easy)",
          "Each day = one clear action + 1 line of context max",
          "Visually show 'Day 1 / Day 2 / …' labels big",
          "Include accountability CTA (comment/tag/DM)",
          "Make challenge outcome very small and achievable",
        ],
        production_notes: {
          video_tip: "Show a calendar being marked off day by day",
          timing: "Fast, high-energy transitions",
          visual_contrast: "Sequential day cards with consistent style",
        },
        brand_integration_notes: {
          aesthetic_requirement: "Bold 'Day #' headers",
          tone_compatibility: "Encouraging / Energetic",
          risk_level: "Low",
          suggested_brand_addition:
            "add 'misdirection_type' field (Incentive-based) and 'tone_guardrail' note: keep tasks under 5-10 mins to prevent drop-off",
        },
      },
      best_for: [
        "Content posting challenge",
        "Outreach challenge",
        "Habit-building challenge",
        "Money/savings challenge",
        "Health/steps challenge",
      ],
    },
    {
      template_id: "T-SWIPETHREAD-20",
      name: "Swipeable Idea Thread",
      category: "reach",
      content_rules: {
        goal: "Reach / Saves",
        platform_optimized: ["Instagram", "TikTok"],
        slide_count: 8,
        avg_performance: {
          estimated_engagement_lift: "+45%",
          share_rate: "High",
          viral_coefficient: "High (Rapid consumption + utility)",
          benchmark: "High completion rate",
        },
        hook_style: "Listicle / Idea Bank",
        text_density: "Light (6-12 words/slide)",
        structure: {
          slide_1: "Hook: '[N] ideas for [target outcome] you can use today.'",
          slide_2: "Idea #1: Short title + 1-line how-to",
          slide_3: "Idea #2: Short title + 1-line how-to",
          slide_4: "Idea #3: Short title + 1-line how-to",
          slide_5: "Idea #4: Short title + 1-line how-to",
          slide_6: "Idea #5: Short title + 1-line how-to",
          slide_7: "Idea #6: Short title + 1-line how-to (advanced)",
          slide_8: "CTA: 'Save this. Try 1 idea today, 1 tomorrow.'",
        },
        key_success_factors: [
          "Keep each idea independent and executable",
          "Title bold, explanation smaller",
          "Front-load strongest 2 ideas at slides 2–3",
          "At least one 'weird' or unexpected idea to stand out",
          "Avoid generic clichés; each idea should feel fresh",
        ],
        production_notes: {
          video_tip: "Use a subtle 'swipe' sound effect between each idea",
          timing: "Very fast pace, mimicking a Twitter/X thread",
          visual_contrast: "Simple heading + subtext template reused per slide",
        },
        brand_integration_notes: {
          aesthetic_requirement: "Repetitive, easy-to-digest layout",
          tone_compatibility: "Punchy / Practical",
          risk_level: "Low",
          suggested_brand_addition:
            "add 'misdirection_type' field (Contextual) and 'tone_guardrail' note: quality over quantity; don't use filler ideas",
        },
      },
      best_for: [
        "Content ideas",
        "Offer angles",
        "Hook formulas",
        "Workout variations",
        "Study tactics",
      ],
    },
    {
      template_id: "T-VIRAL-AUTHORITY-HACK-05",
      name: "The Counter-Intuitive Authority List",
      category: "reach/authority",
      content_rules: {
        goal: "High Saves & Shares",
        platform_optimized: ["Instagram", "TikTok", "LinkedIn"],
        slide_count: 7,
        avg_performance: {
          estimated_engagement_lift: "+60%",
          share_rate: "Very High",
          viral_coefficient: "High (Relatability + Curiosity Gap)",
          benchmark: "High 'Save' to 'Like' ratio",
        },
        hook_style: "Authority Pattern Interrupt",
        text_density: "Moderate (Headline + 2-3 sentences)",
        structure: {
          slide_1:
            "Hook: 'Some weird [Niche] hacks [High-Authority Figure] gave me to [Dream Outcome].' Sub-text: '(From someone who struggled with [Pain Point] for [Time Period])'",
          slide_2:
            "1. [Hack] + 2-3 sentences explaining the counter-intuitive logic and the immediate benefit.",
          slide_3:
            "2. [Hack] + 2-3 sentences explaining the counter-intuitive logic and the immediate benefit.",
          slide_4:
            "3. [Hack] + 2-3 sentences explaining the counter-intuitive logic and the immediate benefit.",
          slide_5:
            "4. [Hack] + 2-3 sentences explaining the counter-intuitive logic and the immediate benefit.",
          slide_6:
            "5. [Hack] + 2-3 sentences explaining the counter-intuitive logic and the immediate benefit.",
          slide_7:
            "CTA: 'These changed everything for me. Save this for when you're [Negative State]. Which hack sounds the weirdest?'",
        },
        key_success_factors: [
          "The authority figure must be relevant but slightly unexpected",
          "The hacks must sound 'weird' or counter-intuitive initially to create curiosity.",
          "The sub-text on Slide 1 is non-negotiable; it builds the bridge between the expert and the audience.",
          "Each explanation must focus on 'Why it works'—logic kills skepticism.",
          "Use 'I' and 'Me' language to keep it a personal recommendation, not a lecture.",
        ],
        production_notes: {
        },
        brand_integration_notes: {
          tone_compatibility: "Vulnerable yet Informative",
          risk_level:
            "Medium (requires genuinely good 'hacks' to avoid being clickbait)",
          suggested_brand_addition:
            "Include a 'Logic Check' field to ensure the 2-3 sentences actually provide value.",
        },
      },
      best_for: [
        "Health & Wellness (Biohacks)",
        "Personal Finance (Wealth-building secrets)",
        "Career Advice (Unorthodox networking)",
        "Relationships (Psychology tricks)",
        "Marketing (Counter-intuitive growth hacks)",
      ],
    },
  ],
};
