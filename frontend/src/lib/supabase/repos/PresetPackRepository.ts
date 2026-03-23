import { supabase } from '../client';
import type { PresetPack, PresetImage, CreatePresetPackRequest, CreatePresetImageRequest } from '@/types/presetPack';

export class PresetPackRepository {
  // Preset Packs
  static async createPresetPack(data: CreatePresetPackRequest): Promise<PresetPack> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: pack, error } = await supabase
      .from('preset_packs' as any)
      .insert({
        name: data.name,
        description: data.description,
        accessibility: data.accessibility,
        number_of_images: 0,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return pack as unknown as PresetPack;
  }

  static async getPresetPacks(accessibility?: 'global' | 'private'): Promise<PresetPack[]> {
    let query = supabase.from('preset_packs' as any).select('*').order('created_at', { ascending: false });
    
    if (accessibility) {
      query = query.eq('accessibility', accessibility);
    }

    

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as unknown as PresetPack[]) || [];
  }

  static async getUserPrivatePacks(): Promise<PresetPack[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('preset_packs' as any)
      .select('*')
      .eq('accessibility', 'private')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as unknown as PresetPack[]) || [];
  }

  static async getPresetPack(id: string): Promise<PresetPack | null> {
    const { data, error } = await supabase
      .from('preset_packs' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as unknown as PresetPack;
  }

  static async updatePresetPack(id: string, updates: Partial<PresetPack>): Promise<PresetPack> {
    const { data, error } = await supabase
      .from('preset_packs' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as PresetPack;
  }

  static async deletePresetPack(id: string): Promise<void> {
    const { error } = await supabase
      .from('preset_packs' as any)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // Preset Images
  static async uploadPresetImage(data: CreatePresetImageRequest): Promise<PresetImage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Convert to WebP and upload to storage
    const fileExt = 'webp';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${data.pack_id}/${fileName}`;

    // Convert image to WebP blob
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    const webpBlob = await new Promise<Blob>((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert image'));
        }, 'image/webp', 0.9);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(data.file);
    });

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('preset_pack')
      .upload(filePath, webpBlob, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('preset_pack')
      .getPublicUrl(filePath);

    // Create image record
    const { data: image, error: dbError } = await supabase
      .from('preset_images' as any)
      .insert({
        pack_id: data.pack_id,
        url: urlData.publicUrl,
        storage_path: filePath,
        tags: data.tags,
        vibe: data.vibe,
        objects: data.objects,
        composition: data.composition,
        color_palette: data.color_palette,
        aesthetic_score: data.aesthetic_score,
      })
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);

    // Update pack image count
    await this.updatePackImageCount(data.pack_id);

    return image as unknown as PresetImage;
  }

  static async getPresetImages(
    packId: string,
    { page = 1, limit = 20 }: { page?: number; limit?: number } = {}
  ): Promise<{ images: PresetImage[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from('preset_images' as any)
      .select('*', { count: 'exact', head: true })
      .eq('pack_id', packId);

    if (countError) throw new Error(countError.message);
    const total = count || 0;

    // Get paginated images
    const { data: images, error } = await supabase
      .from('preset_images' as any)
      .select('*')
      .eq('pack_id', packId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      images: (images as unknown as PresetImage[]) || [],
      total,
      hasMore: offset + limit < total,
    };
  }

  static async deletePresetImage(id: string): Promise<void> {
    // Get image data first to delete from storage
    const { data: image, error: getError } = await supabase
      .from('preset_images' as any)
      .select('storage_path, pack_id')
      .eq('id', id)
      .single();

    if (getError) throw new Error(getError.message);
    const imageData = image as unknown as { storage_path: string; pack_id: string };

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('preset_pack')
      .remove([imageData.storage_path]);

    if (storageError) throw new Error(storageError.message);

    // Delete from database
    const { error: dbError } = await supabase
      .from('preset_images' as any)
      .delete()
      .eq('id', id);

    if (dbError) throw new Error(dbError.message);

    // Update pack image count
    await this.updatePackImageCount(imageData.pack_id);
  }

  private static async updatePackImageCount(packId: string): Promise<void> {
    const { count, error } = await supabase
      .from('preset_images' as any)
      .select('*', { count: 'exact', head: true })
      .eq('pack_id', packId);

    if (error) return; // Fail silently

    await supabase
      .from('preset_packs' as any)
      .update({ number_of_images: count || 0 })
      .eq('id', packId);
  }
}