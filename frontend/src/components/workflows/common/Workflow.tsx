"use client";

import {
  ReactFlow,
  Background,
  ReactFlowProvider,
  useReactFlow,
  useNodesInitialized,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TemplateNode } from "./TemplateNode";
import { BrandNode } from "./BrandNode";
import { CtaNode } from "./CtaNode";
import { AIGenerateNode } from "./AIGenerateNode";
import { useState, useEffect, useMemo, useRef } from "react";

// Stable outside component to avoid nodeTypes reference changing on each render
const NODE_TYPES = {
  template: TemplateNode,
  brand: BrandNode,
  cta: CtaNode,
  ai: AIGenerateNode,
};

const EDGES = [
  { id: "e12", source: "n1", target: "n2", animated: true },
  { id: "e23", source: "n2", target: "n3", animated: true },
  { id: "e34", source: "n3", target: "n4", animated: true },
];

// Horizontal gap between columns (node width w-80 = 320px + 120px breathing room)
const COL_X = [0, 440, 880] as const;
// Vertical gap between Brand and CTA nodes
const ROW_GAP = 20;

type WorkflowProps = {
  brandId: string;
  selectedTemplateId: string | null;
  selectedCtaId: string | null;
  onTemplateSelect: (templateId: string | null) => void;
  onCtaSelect: (ctaId: string | null) => void;
  handleGenerate: () => void;
};

type Positions = {
  n1: { x: number; y: number };
  n2: { x: number; y: number };
  n3: { x: number; y: number };
  n4: { x: number; y: number };
};

function WorkflowCanvas({
  brandId,
  selectedTemplateId,
  selectedCtaId,
  onTemplateSelect,
  onCtaSelect,
  handleGenerate,
}: WorkflowProps) {
  const { fitView, getNodes } = useReactFlow();
  const initialized = useNodesInitialized();

  // Start with rough guesses so the initial render isn't jumbled
  const [positions, setPositions] = useState<Positions>({
    n1: { x: COL_X[0], y: 80 },
    n2: { x: COL_X[1], y: 0 },
    n3: { x: COL_X[1], y: 300 },
    n4: { x: COL_X[2], y: 100 },
  });

  // Track last computed positions to prevent infinite update loops
  const lastRef = useRef<Positions | null>(null);

  useEffect(() => {
    if (!initialized) return;

    const ns = getNodes();
    const measuredH = (id: string) => ns.find((n) => n.id === id)?.measured?.height;

    const brandH = measuredH("n2");
    const ctaH = measuredH("n3");

    // Wait until both dynamic-content nodes are measured
    if (!brandH || !ctaH) return;

    const templateH = measuredH("n1") ?? 180;
    const aiH = measuredH("n4") ?? 80;

    const midColH = brandH + ROW_GAP + ctaH;

    const next: Positions = {
      n1: { x: COL_X[0], y: Math.round(Math.max(0, (midColH - templateH) / 2)) },
      n2: { x: COL_X[1], y: 0 },
      n3: { x: COL_X[1], y: brandH + ROW_GAP },
      n4: { x: COL_X[2], y: Math.round(Math.max(0, (midColH - aiH) / 2)) },
    };

    // Only update state if positions actually changed (prevents render loops)
    const last = lastRef.current;
    if (
      last &&
      last.n1.y === next.n1.y &&
      last.n3.y === next.n3.y &&
      last.n4.y === next.n4.y
    ) return;

    lastRef.current = next;
    setPositions(next);
    requestAnimationFrame(() => fitView({ padding: 0.1, maxZoom: 1, duration: 150 }));
  }, [initialized, getNodes, fitView]);

  const nodes: Node[] = useMemo(
    () => [
      {
        id: "n1",
        position: positions.n1,
        type: "template",
        data: { brandId, selectedTemplateId, onTemplateSelect },
      },
      {
        id: "n2",
        position: positions.n2,
        type: "brand",
        data: { brandId },
      },
      {
        id: "n3",
        position: positions.n3,
        type: "cta",
        data: { brandId, selectedCtaId, onCtaSelect },
      },
      {
        id: "n4",
        position: positions.n4,
        type: "ai",
        data: { onGenerate: handleGenerate },
      },
    ],
    [positions, brandId, selectedTemplateId, onTemplateSelect, selectedCtaId, onCtaSelect, handleGenerate]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={EDGES}
      nodeTypes={NODE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.1, maxZoom: 1 }}
      proOptions={{ hideAttribution: true }}
      panOnDrag={false}
      panOnScroll={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      nodesConnectable={false}
      nodesDraggable={false}
      nodesFocusable={false}
    >
      <Background />
    </ReactFlow>
  );
}

export const Workflow = (props: WorkflowProps) => (
  <div style={{ height: "80vh", width: "100%" }}>
    <ReactFlowProvider>
      <WorkflowCanvas {...props} />
    </ReactFlowProvider>
  </div>
);
