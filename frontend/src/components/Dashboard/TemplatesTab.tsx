import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiLayers } from 'react-icons/fi';
import { useTemplates, useCreateTemplate, useDeleteTemplate } from '@/lib/api/hooks';
import TemplateCreator from '@/components/TemplateCreator/index';


export default function TemplatesTab() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Fetch templates from API
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const createTemplateMutation = useCreateTemplate();
  const deleteTemplateMutation = useDeleteTemplate();

  const handleSaveTemplate = async (template: any) => {
    try {
      console.log('Creating template:', template);
      await createTemplateMutation.mutateAsync(template);
      console.log('Template created successfully');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template. Please check the console for details.');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplateMutation.mutateAsync(templateId);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Templates</h1>
          <p className="text-gray-400">Create and manage slide templates for A/B testing</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-500 hover:bg-primary-600 px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
        >
          <FiLayers />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-3 gap-6">
        {templatesLoading ? (
          // Loading skeletons
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          ))
        ) : templates && templates.length > 0 ? (
          templates.map((template: any) => (
          <div 
            key={template.id}
            className={`bg-gray-800/50 border rounded-xl p-6 cursor-pointer transition hover:border-primary-500 ${
              template.isDefault ? 'border-primary-500' : 'border-gray-700'
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">{template.name}</h3>
                <span className="text-xs text-gray-400 uppercase">{template.category}</span>
              </div>
              {template.isDefault && (
                <span className="text-xs bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full">
                  Default
                </span>
              )}
              {template.status === 'testing' && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                  Testing
                </span>
              )}
            </div>

            {/* Performance Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Posts</span>
                <span className="font-semibold">{template.performance?.totalPosts || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Avg Engagement</span>
                <span className="font-semibold text-green-400">{template.performance?.avgEngagementRate || 0}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Avg Saves</span>
                <span className="font-semibold">{template.performance?.avgSaves || 0}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-700">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/template/${template.id}`);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition"
              >
                Edit
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTemplate(template.id);
                }}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))
        ) : (
          // Empty state
          <div className="col-span-3 text-center py-12">
            <FiLayers className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No templates yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg transition"
            >
              Create Your First Template
            </button>
          </div>
        )}

        {/* Create New Card */}
        <div 
          onClick={() => setShowCreateModal(true)}
          className="bg-gray-800/30 border border-dashed border-gray-600 rounded-xl p-6 cursor-pointer transition hover:border-primary-500 flex flex-col items-center justify-center min-h-[300px]"
        >
          <FiLayers className="text-6xl text-gray-600 mb-4" />
          <p className="text-gray-400 font-semibold">Create New Template</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-4 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-primary-400 mb-2">
            {templates?.filter((t: any) => t.status === 'active').length || 0}
          </div>
          <div className="text-sm text-gray-400">Active Templates</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {templates && templates.length > 0
              ? (templates.reduce((sum: number, t: any) => sum + (t.performance?.avgEngagementRate || 0), 0) / templates.length).toFixed(1)
              : '0.0'}%
          </div>
          <div className="text-sm text-gray-400">Avg Engagement Rate</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {templates?.reduce((sum: number, t: any) => sum + (t.performance?.totalPosts || 0), 0) || 0}
          </div>
          <div className="text-sm text-gray-400">Total Posts Generated</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {templates?.filter((t: any) => t.status === 'testing').length || 0}
          </div>
          <div className="text-sm text-gray-400">A/B Tests Running</div>
        </div>
      </div>

      {/* Template Creator Modal */}
      {showCreateModal && (
        <TemplateCreator 
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveTemplate}
        />
      )}
    </div>
  );
}
