import { ReactFlow, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TemplateNode } from "./TemplateNode";
import { BrandNode } from "./BrandNode";
import { CtaNode } from "./CtaNode";
import { StockPackNode } from "./StockPackNode";
import { useState, useEffect, useMemo } from "react";
import { AIGenerateNode } from "./AIGenerateNode";

type WorkflowProps = {
    brandId: string;
    selectedTemplateId: string | null;
    selectedCtaId: string | null;
    selectedPackId: string | null;
    onTemplateSelect: (templateId: string | null) => void;
    onCtaSelect: (ctaId: string | null) => void;
    onPackSelect: (bucketDirectory: string | null) => void;
    handleGenerate: () => void;
  };

export const Workflow = ({brandId, selectedTemplateId, selectedCtaId, selectedPackId, onTemplateSelect, onCtaSelect, onPackSelect, handleGenerate}: WorkflowProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Mobile breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const nodetype = {
    template: TemplateNode,
    brand: BrandNode,
    cta: CtaNode,
    stockpack: StockPackNode,
    ai: AIGenerateNode
  }

  const initialNodes = useMemo(() => [
    {
      id: "n1",
      position: { x: isMobile ? 50 : 50, y: isMobile ? 50 : 200 },
      data: {brandId, selectedTemplateId, onTemplateSelect},
      type: "template",
    },
    {
      id: "n2",
      position: { x: isMobile ? 50 : 450, y: isMobile ? 250 : 100 },
      data: {brandId},
      type: "brand",
    },
    {
      id: "n3",
      position: { x: isMobile ? 50 : 450, y: isMobile ? 450 : 350 },
      data: {brandId, selectedCtaId, onCtaSelect},
      type: "cta",
    },
    {
      id: "n5",
      position: { x: isMobile ? 50 : 850, y: isMobile ? 650 : 350 },
      data: {selectedPackId, onPackSelect},
      type: "stockpack",
    },
    {
      id: "n4",
      position: { x: isMobile ? 50 : 1250, y: isMobile ? 650 : 250 },
      data: {onGenerate: handleGenerate},
      type: "ai",
    },
  ], [brandId, selectedTemplateId, onTemplateSelect, selectedCtaId, onCtaSelect, selectedPackId, onPackSelect, handleGenerate, isMobile]);

  const initialEdges = useMemo(() => [
    {
      id: "n1-n2",
      source: "n1",
      target: "n2",
      type: "default",
      animated: true
    },
    {
      id: "n2-n3",
      source: "n2",
      target: "n3",
      type: "default",
      animated: true
    },
    {
      id: "n3-n5",
      source: "n3",
      target: "n5",
      type: "default",
      animated: true
    },
    {
      id: "n5-n4",
      source: "n5",
      target: "n4",
      type: "default",
      animated: true
    },
  ], []);

  const defaultViewport = { x: 0, y: 0, zoom: isMobile ? 0.75 : 0.95 }

  return (
    <div style={{ height: "80vh", width: "100%" }}>
      <ReactFlow
      nodes={initialNodes}
      edges={initialEdges}
      nodeTypes={nodetype}
      defaultViewport={defaultViewport}
      proOptions={{ hideAttribution: true }}
      panOnDrag={false}
      panOnScroll={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      panOnScrollMode={undefined}
      nodesConnectable={false}
      nodesDraggable={false}
      nodesFocusable={false}

      >
      <Background />
      {/* <Controls /> */}
      </ReactFlow>
    </div>
  );
};
