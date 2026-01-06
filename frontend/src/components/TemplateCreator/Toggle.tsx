import React from "react";
import { Button } from '../ui/button';
interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold mb-2 text-gray-400">
          {label}
        </label>
      )}
      <Button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-foreground transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </Button>
    </div>
  );
}
