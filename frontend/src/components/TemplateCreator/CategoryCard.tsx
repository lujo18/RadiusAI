import { FiCheck } from 'react-icons/fi';
import { type TemplateCategory } from '@/types/template';

interface CategoryCardProps {
  categoryKey: TemplateCategory;
  info: {
    name: string;
    icon: string;
    bestFor: string;
    structure: string[];
    hookStyles: string[];
  };
  selected: boolean;
  onSelect: () => void;
}

export default function CategoryCard({ categoryKey, info, selected, onSelect }: CategoryCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-lg border-2 transition ${
        selected 
          ? 'border-primary-500 bg-primary-500/10' 
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${selected ? 'text-primary-400' : 'text-gray-400'}`}>
          {info.icon === 'FiList' && '📋'}
          {info.icon === 'FiMessageSquare' && '💬'}
          {info.icon === 'FiBook' && '📖'}
          {info.icon === 'FiAward' && '🎓'}
          {info.icon === 'FiTrendingUp' && '📈'}
          {info.icon === 'FiSettings' && '⚙️'}
        </div>
        <div className="flex-1">
          <h4 className="font-bold mb-1">{info.name}</h4>
          <p className="text-xs text-gray-400 mb-2">{info.bestFor}</p>
          <div className="text-xs text-gray-500">
            {info.structure.length} slides • {info.hookStyles.join(', ')} hooks
          </div>
        </div>
        {selected && <FiCheck className="text-primary-400" />}
      </div>
    </button>
  );
}
