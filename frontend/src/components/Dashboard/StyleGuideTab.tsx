import { useStyleGuideStore } from '@/store';

export default function StyleGuideTab() {
  const styleGuide = useStyleGuideStore((state) => state.content);
  const setContent = useStyleGuideStore((state) => state.setContent);
  const saveContent = useStyleGuideStore((state) => state.saveContent);
  const resetToDefault = useStyleGuideStore((state) => state.resetToDefault);
  const isDirty = useStyleGuideStore((state) => state.isDirty);

  const handleSave = () => {
    saveContent(styleGuide);
    // TODO: Also save to backend API
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Master Style Guide</h1>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Your Brand Guidelines</h2>
        <p className="text-gray-400 mb-6">
          This style guide controls how all your carousels are generated. Edit it to match your brand voice and visual identity.
          {isDirty && <span className="text-yellow-400 ml-2">• Unsaved changes</span>}
        </p>
        
        <textarea
          value={styleGuide}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 min-h-[300px] focus:outline-none focus:border-primary-500 font-mono text-sm"
        />
        
        <div className="flex gap-4 mt-4">
          <button 
            onClick={handleSave}
            className="bg-primary-500 hover:bg-primary-600 px-6 py-3 rounded-lg font-semibold"
          >
            Save Changes
          </button>
          <button 
            onClick={resetToDefault}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
          >
            Reset to Default
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Quick Settings</h3>
          <div className="space-y-4">
            <Setting label="Carousel Length" value="8-10 slides" />
            <Setting label="Primary Font" value="Inter Bold" />
            <Setting label="Accent Color" value="#ff4f8b" />
            <Setting label="Background Style" value="Dark Gradient" />
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Connected Accounts</h3>
          <div className="space-y-4">
            <ConnectedAccount platform="Instagram" username="@yourhandle" status="Connected" />
            <ConnectedAccount platform="TikTok" username="@yourhandle" status="Connected" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Setting({ label, value }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function ConnectedAccount({ platform, username, status }: any) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <div className="font-semibold">{platform}</div>
        <div className="text-sm text-gray-400">{username}</div>
      </div>
      <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
        {status}
      </span>
    </div>
  );
}
