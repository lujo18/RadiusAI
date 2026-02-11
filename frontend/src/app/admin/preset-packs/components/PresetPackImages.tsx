'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateImageForm } from './CreateImageForm';
import {
  usePresetImages,
  useDeletePresetImage,
} from '@/features/presetPacks/hooks';
import type { PresetPack, PresetImage } from '@/types/presetPack';

interface PresetPackImagesProps {
  pack: PresetPack;
  onBack: () => void;
}

export function PresetPackImages({ pack, onBack }: PresetPackImagesProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data: imagesData, isLoading } = usePresetImages(pack.id, currentPage, pageSize);
  const deleteImageMutation = useDeletePresetImage();

  const handleDeleteImage = async (image: PresetImage) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }
    deleteImageMutation.mutate(image.id);
  };

  const renderImageCard = (image: PresetImage) => (
    <Card key={image.id} className="glass-card overflow-hidden">
      <div className="aspect-square relative group">
        <img
          src={image.url}
          alt="Preset image"
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center">
          <Button
            variant="destructive"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleDeleteImage(image)}
            disabled={deleteImageMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-3 space-y-2">
        <div className="flex flex-wrap gap-1">
          {image.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {image.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{image.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="text-xs text-foreground/60 space-y-1">
          <div><span className="font-medium">Vibe:</span> {image.vibe}</div>
          <div><span className="font-medium">Composition:</span> {image.composition}</div>
          <div><span className="font-medium">Score:</span> {(image.aesthetic_score * 100).toFixed(0)}%</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="btn-ghost"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Packs
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {pack.name}
            </h1>
            <p className="text-foreground/60 mb-4">{pack.description}</p>
            <div className="flex items-center space-x-4">
              <Badge variant={pack.accessibility === 'global' ? 'default' : 'secondary'}>
                {pack.accessibility}
              </Badge>
              <span className="text-sm text-foreground/60">
                {pack.number_of_images} images
              </span>
            </div>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Images
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Images to {pack.name}</DialogTitle>
                <DialogDescription>
                  Upload and tag new images for this preset pack
                </DialogDescription>
              </DialogHeader>
              <CreateImageForm 
                packId={pack.id} 
                onSuccess={() => setCreateDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="glass-card overflow-hidden">
              <div className="aspect-square bg-foreground/10 animate-pulse" />
              <CardContent className="p-3 space-y-2">
                <div className="h-4 bg-foreground/10 rounded animate-pulse" />
                <div className="h-3 bg-foreground/10 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !imagesData || imagesData.images.length === 0 ? (
        <Card className="glass-card text-center py-12">
          <CardContent>
            <ImageIcon className="w-12 h-12 mx-auto text-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No images yet
            </h3>
            <p className="text-foreground/60 mb-6">
              Add your first images to this preset pack
            </p>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="btn-primary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Images
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {imagesData.images.map(renderImageCard)}
          </div>

          {/* Pagination */}
          {imagesData.total > pageSize && (
            <div className="flex justify-center items-center space-x-4">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="btn-ghost"
              >
                Previous
              </Button>
              
              <span className="text-foreground/60">
                Page {currentPage} of {Math.ceil(imagesData.total / pageSize)}
              </span>
              
              <Button
                variant="outline"
                disabled={!imagesData.hasMore}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="btn-ghost"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}