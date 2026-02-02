'use client';

import { useState } from 'react';
import { Package, ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  usePresetPacks,
  useUserPrivatePacks,
} from '@/lib/api/hooks/usePresetPacks';
import type { PresetPack } from '@/types/presetPack';
import { CreatePresetPackForm } from './CreatePresetPackForm';
import { PresetPackImagesDialog } from './PresetPackImagesDialog';

interface PresetPackSelectorDialogProps {
  children: React.ReactNode;
  onSelectPack?: (pack: PresetPack) => void;
}

export function PresetPackSelectorDialog({ 
  children, 
  onSelectPack 
}: PresetPackSelectorDialogProps) {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<PresetPack | null>(null);

  const { data: globalPacks = [], isLoading: globalLoading } = usePresetPacks('global');
  const { data: privatePacks = [], isLoading: privateLoading } = useUserPrivatePacks();

  const handleSelectPack = (pack: PresetPack) => {
    onSelectPack?.(pack);
    setOpen(false);
  };

  const renderPackCard = (pack: PresetPack, showSelectButton = true) => (
    <Card key={pack.id} className="glass-card hover:bg-foreground/10 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg text-foreground">{pack.name}</CardTitle>
            <p className="text-sm text-foreground/60">{pack.description}</p>
          </div>
          <Badge variant={pack.accessibility === 'global' ? 'default' : 'secondary'}>
            {pack.accessibility}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm text-foreground/60">
          <ImageIcon className="w-4 h-4 mr-2" />
          <span>{pack.number_of_images} images</span>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPack(pack)}
            className="flex-1"
          >
            View Images
          </Button>
          {showSelectButton && (
            <Button
              size="sm"
              onClick={() => handleSelectPack(pack)}
              className="btn-primary"
            >
              Select
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (title: string, description: string, showCreate = false) => (
    <Card className="glass-card text-center py-12">
      <CardContent>
        <Package className="w-12 h-12 mx-auto text-foreground/40 mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-foreground/60 mb-6">
          {description}
        </p>
        {showCreate && (
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Pack
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const renderLoadingState = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="glass-card">
          <CardHeader>
            <div className="space-y-2">
              <div className="h-5 bg-foreground/20 rounded animate-pulse" />
              <div className="h-4 bg-foreground/10 rounded animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-foreground/10 rounded animate-pulse" />
              <div className="flex space-x-2">
                <div className="h-8 bg-foreground/10 rounded animate-pulse flex-1" />
                <div className="h-8 w-16 bg-foreground/10 rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Preset Pack</DialogTitle>
            <DialogDescription>
              Choose from global packs or your personal collection
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="global" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-md border border-border">
                <TabsTrigger 
                  value="global" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-background"
                >
                  Global Packs ({globalPacks.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="personal" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-background"
                >
                  My Packs ({privatePacks.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto mt-6">
                <TabsContent value="global" className="mt-0">
                  {globalLoading ? (
                    renderLoadingState()
                  ) : globalPacks.length === 0 ? (
                    renderEmptyState(
                      "No global packs available",
                      "There are no global preset packs available at the moment."
                    )
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {globalPacks.map(pack => renderPackCard(pack))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="personal" className="mt-0">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-foreground">Your Preset Packs</h3>
                      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="btn-primary" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Pack
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Create New Preset Pack</DialogTitle>
                            <DialogDescription>
                              Create a new personal image pack for your content
                            </DialogDescription>
                          </DialogHeader>
                          <CreatePresetPackForm 
                            onSuccess={() => setCreateDialogOpen(false)}
                            defaultAccessibility="private"
                          />
                        </DialogContent>
                      </Dialog>
                    </div>

                    {privateLoading ? (
                      renderLoadingState()
                    ) : privatePacks.length === 0 ? (
                      renderEmptyState(
                        "No personal packs yet",
                        "Create your first preset pack to organize your personal stock images.",
                        true
                      )
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {privatePacks.map(pack => renderPackCard(pack))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pack Images Dialog */}
      {selectedPack && (
        <PresetPackImagesDialog
          pack={selectedPack}
          open={!!selectedPack}
          onOpenChange={(open) => {
            if (!open) setSelectedPack(null);
          }}
        />
      )}
    </>
  );
}