'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PresetPackSelectorDialog } from '@/components/preset-packs';
import type { PresetPack } from '@/types/presetPack';

export default function PresetPackExample() {
  const [selectedPack, setSelectedPack] = useState<PresetPack | null>(null);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-4">
        Preset Pack Selector Example
      </h1>
      
      {selectedPack && (
        <div className="mb-4 p-4 bg-card/50 rounded-lg border border-border">
          <h3 className="font-semibold text-foreground">Selected Pack:</h3>
          <p className="text-foreground/70">{selectedPack.name}</p>
          <p className="text-sm text-foreground/50">{selectedPack.description}</p>
        </div>
      )}

      <PresetPackSelectorDialog
        onSelectPack={setSelectedPack}
      >
        <Button className="btn-primary">
          Select Stock Image Pack
        </Button>
      </PresetPackSelectorDialog>
    </div>
  );
}