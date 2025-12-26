import { FiX } from 'react-icons/fi';
import BrandSettingsForm from './BrandSettingsForm';
import type { BrandSettings } from '@/types';
import { useCreateProfile } from '@/lib/api/hooks';

interface CreateProfileDialogProps {
  onClose: () => void;
}

export default function CreateProfileDialog({ onClose }: CreateProfileDialogProps) {
  const createProfileMutation = useCreateProfile();

  const handleSubmit = async (brandSettings: BrandSettings) => {
    try {
      await createProfileMutation.mutateAsync(brandSettings);
      onClose();
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert('Failed to create profile');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader title="Create Brand Profile" onClose={onClose} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <BrandSettingsForm
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={createProfileMutation.isPending}
            submitLabel="Create Profile"
          />
        </div>
      </div>
    </div>
  );
}

function DialogHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex justify-between items-center p-6 border-b border-gray-700">
      <h2 className="text-2xl font-bold">{title}</h2>
      <button
        onClick={onClose}
        className="p-2 hover:bg-gray-800 rounded-lg transition"
      >
        <FiX className="text-2xl" />
      </button>
    </div>
  );
}
