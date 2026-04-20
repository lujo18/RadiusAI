"use client";

import { useEffect, useId, useMemo, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";

type MermaidProps = {
  chart: string;
  className?: string;
};

function normalizeChart(chart: string): string {
  return chart.trim();
}

export default function Mermaid({ chart, className }: MermaidProps) {
  const reactId = useId();
  const graphId = useMemo(() => `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [reactId]);
  const { resolvedTheme } = useTheme();
  const mermaidTheme = resolvedTheme === "dark" ? "dark" : "default";
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const source = normalizeChart(chart);

    async function renderDiagram(): Promise<void> {
      if (!source) {
        setSvg("");
        setError("Empty Mermaid diagram.");
        return;
      }

      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: mermaidTheme,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        });

        // Mermaid render IDs must be unique per render pass.
        const renderId = `${graphId}-${Math.random().toString(36).slice(2, 10)}`;
        const result = await mermaid.render(renderId, source);

        if (cancelled) {
          return;
        }

        setSvg(result.svg);
        setError("");
      } catch {
        if (cancelled) {
          return;
        }

        setSvg("");
        setError("Unable to render Mermaid diagram.");
      }
    }

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, graphId, mermaidTheme]);

  if (error) {
    return (
      <figure className={`my-8 rounded-xl border border-border/60 bg-card/40 p-4 ${className || ""}`}>
        <figcaption className="mb-2 text-xs uppercase tracking-wide text-foreground/60">Diagram fallback</figcaption>
        <pre className="overflow-x-auto text-sm text-foreground/85">
          <code>{chart}</code>
        </pre>
        <p className="mt-3 text-xs text-foreground/60">{error}</p>
      </figure>
    );
  }

  return (
    <figure
      className={`my-8 rounded-xl border border-border/60 bg-card/40 p-4 ${className || ""}`}
      role="img"
      aria-label="Rendered Mermaid diagram"
      aria-busy={!svg}
    >
      {svg ? (
        <div
          className="overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <p className="text-sm text-foreground/65">Rendering diagram…</p>
      )}
    </figure>
  );
}
