import React from "react";
import CategoryCard from './CategoryCard';

interface Step1BasicInfoProps {
  name: string;
  setName: (name: string) => void;
  category: string;
  setCategory: (category: string) => void;
  isDefault: boolean;
  setIsDefault: (isDefault: boolean) => void;
}

export default function Step1BasicInfo({ 
  name, 
  setName, 
  category, 
  setCategory, 
  isDefault, 
  setIsDefault 
}: Step1BasicInfoProps) {
  return (
    <div className="p-6 overflow-y-auto h-full space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Template Name</label>
        <input 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Bold Questions, Minimal Quotes"
          className="w-full bg-muted border border rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-5 h-5 accent-primary"
          />
          <span className="text-sm font-semibold">Set as default template</span>
        </label>
        <p className="text-xs text-muted-foreground mt-1 ml-7">
          This template will be used for new posts unless specified
        </p>
      </div>
    </div>
  );
}
