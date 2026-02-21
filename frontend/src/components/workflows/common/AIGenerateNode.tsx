"use client";

import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiOpenai, SiOpenaigym } from 'react-icons/si';

export interface AIGenerateNodeData {
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export type AIGenerateNodeProps = NodeProps & {
  data: AIGenerateNodeData;
};

const AIGenerateNodeComponent: React.FC<AIGenerateNodeProps> = ({ data }) => {
  const { onGenerate } = data;

  const [isGenerating, setIsGenerating] = useState(false)

  const handleClick = () => {
    if (onGenerate && !isGenerating) {
      setIsGenerating(true)
      onGenerate();

      setTimeout(() => setIsGenerating(false), 2000);
    }
  };

  return (
    <div className="bg-primary rounded-lg p-1 shadow-sm border border-border hover:shadow-md transition-shadow">
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-primary border border-background"
      />

      <Button
        variant="secondary"
        size="lg"
        className='p-4'
        onClick={handleClick}
        disabled={isGenerating}
        
      >
        Generate
        <SiOpenai className={` text-primary ${isGenerating ? 'animate-pulse' : ''}`} />
      </Button>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 bg-primary border border-background"
      />
    </div>
  );
};

export const AIGenerateNode = memo(AIGenerateNodeComponent);