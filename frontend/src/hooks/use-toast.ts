// Simple toast hook - can be replaced with proper toast implementation later
export const useToast = () => {
  const toast = ({ title, description, variant }: { 
    title: string; 
    description?: string; 
    variant?: "default" | "destructive" 
  }) => {
    console.log(`[${variant || 'default'}] ${title}: ${description || ''}`);
    // For now just log to console
    // TODO: Replace with actual toast implementation (Sonner, react-hot-toast, etc.)
  };

  return { toast };
};