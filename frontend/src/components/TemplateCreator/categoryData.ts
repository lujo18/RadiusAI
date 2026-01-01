// Local category data and types for TemplateCreator

export type TemplateCategory = "listicle" | "quote" | "story" | "educational" | "comparison";

export const TEMPLATE_CATEGORIES: Record<string, {
  name: string;
  icon: string;
  bestFor: string;
  structure: string[];
  hookStyles: string[];
}> = {
  listicle: {
    name: "Listicle",
    icon: "📝",
    bestFor: "How-to, tips, recommendations",
    structure: ["hook", "intro", "point", "point", "point", "point", "cta"],
    hookStyles: ["number", "question"],
  },
  quote: {
    name: "Bold Quotes",
    icon: "💬",
    bestFor: "Motivation, inspiration",
    structure: ["hook", "quote", "quote", "quote", "cta"],
    hookStyles: ["statement"],
  },
  story: {
    name: "Story Arc",
    icon: "📖",
    bestFor: "Personal experiences, case studies",
    structure: ["hook", "setup", "conflict", "resolution", "lesson", "cta"],
    hookStyles: ["question", "statement"],
  },
  educational: {
    name: "Educational",
    icon: "🎓",
    bestFor: "Tutorials, explainers",
    structure: ["hook", "problem", "solution", "example", "example", "cta"],
    hookStyles: ["question"],
  },
  comparison: {
    name: "Before/After",
    icon: "🔄",
    bestFor: "Transformations, results",
    structure: ["hook", "before", "problem", "solution", "after", "cta"],
    hookStyles: ["statement"],
  },
};
