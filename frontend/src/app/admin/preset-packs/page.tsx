'use client';

import { useState } from 'react';
import { Plus, ImageIcon, Package, Trash2, Edit3, Eye, EyeOff } from 'lucide-react';
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
import { CreatePresetPackForm } from './components/CreatePresetPackForm';
import { PresetPackImages } from './components/PresetPackImages';
import {
  usePresetPacks,
  useDeletePresetPack,
} from '@/lib/api/hooks/usePresetPacks';
import type { PresetPack } from '@/types/presetPack';

export default function PresetPacksPage() {
  const [selectedPack, setSelectedPack] = useState<PresetPack | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: allPacks = [], isLoading } = usePresetPacks();
  const { data: globalPacks = [] } = usePresetPacks('global');
  const { data: privatePacks = [] } = usePresetPacks('private');

  const deletePackMutation = useDeletePresetPack();

  const handleDeletePack = async (pack: PresetPack) => {
    if (!confirm(`Are you sure you want to delete "${pack.name}"? This will also delete all images in the pack.`)) {
      return;
    }
    deletePackMutation.mutate(pack.id);
  };

  const renderPackCard = (pack: PresetPack) => (
    <Card key={pack.id} className="glass-card hover:bg-foreground/10 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg text-foreground">{pack.name}</CardTitle>
            <p className="text-sm text-foreground/60">{pack.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={pack.accessibility === 'global' ? 'default' : 'secondary'}>
              {pack.accessibility === 'global' ? (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Global
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Private
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-foreground/60">
          <span className="flex items-center">
            <ImageIcon className="w-4 h-4 mr-2" />
            {pack.number_of_images} images
          </span>
          <span>{new Date(pack.created_at!).toLocaleDateString()}</span>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPack(pack)}
            className="flex-1"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Manage
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeletePack(pack)}
            disabled={deletePackMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (selectedPack) {
    return (
      <div className="min-h-screen bg-background">
        <PresetPackImages 
          pack={selectedPack} 
          onBack={() => setSelectedPack(null)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Preset Image Packs
              </h1>
              <p className="text-foreground/60">
                Manage system stock image packs for content generation
              </p>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Pack
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Preset Pack</DialogTitle>
                  <DialogDescription>
                    Create a new image pack for organizing stock images
                  </DialogDescription>
                </DialogHeader>
                <CreatePresetPackForm onSuccess={() => setCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
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
                      <div className="h-8 w-10 bg-foreground/10 rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : allPacks.length === 0 ? (
          <Card className="glass-card text-center py-12">
            <CardContent>
              <Package className="w-12 h-12 mx-auto text-foreground/40 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No preset packs yet
              </h3>
              <p className="text-foreground/60 mb-6">
                Create your first preset pack to organize stock images for content generation
              </p>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Pack
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="bg-card/50 backdrop-blur-md border border-border">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-background">
                All Packs ({allPacks.length})
              </TabsTrigger>
              <TabsTrigger value="global" className="data-[state=active]:bg-primary data-[state=active]:text-background">
                Global ({globalPacks.length})
              </TabsTrigger>
              <TabsTrigger value="private" className="data-[state=active]:bg-primary data-[state=active]:text-background">
                Private ({privatePacks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allPacks.map(renderPackCard)}
              </div>
            </TabsContent>

            <TabsContent value="global">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {globalPacks.map(renderPackCard)}
              </div>
            </TabsContent>

            <TabsContent value="private">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {privatePacks.map(renderPackCard)}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}