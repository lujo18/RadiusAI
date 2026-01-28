"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface DynamicFormFieldProps {
  value: any;
  onChange: (value: any) => void;
  fieldName: string;
  depth?: number;
}

const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  value,
  onChange,
  fieldName,
  depth = 0,
}) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const padding = depth * 4;

  // Determine type
  const isNull = value === null || value === undefined;
  const isArray = Array.isArray(value);
  const isObject = typeof value === "object" && !isArray && !isNull;
  const isBoolean = typeof value === "boolean";
  const isNumber = typeof value === "number";
  const isString = typeof value === "string";

  if (isArray) {
    return (
      <div className="space-y-2" style={{ paddingLeft: `${padding}px` }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-secondary rounded"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
          <Label className="font-semibold text-primary">{fieldName} (Array)</Label>
          <span className="text-xs text-muted-foreground">
            {value.length} item{value.length !== 1 ? "s" : ""}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const newArray = [...value, ""];
              onChange(newArray);
            }}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {expanded && (
          <div className="space-y-2 pl-4 border-l border-border">
            {value.map((item: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    {typeof item === "object" ? (
                      <DynamicFormField
                        value={item}
                        onChange={(newVal) => {
                          const updated = [...value];
                          updated[idx] = newVal;
                          onChange(updated);
                        }}
                        fieldName={`Item ${idx + 1}`}
                        depth={depth + 1}
                      />
                    ) : (
                      <Input
                        value={item}
                        onChange={(e) => {
                          const updated = [...value];
                          updated[idx] = e.target.value;
                          onChange(updated);
                        }}
                        placeholder={`Item ${idx + 1}`}
                        className="text-sm"
                      />
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      const updated = value.filter((_: any, i: number) => i !== idx);
                      onChange(updated);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isObject) {
    return (
      <div className="space-y-2" style={{ paddingLeft: `${padding}px` }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-secondary rounded"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
          <Label className="font-semibold text-primary">{fieldName}</Label>
          <span className="text-xs text-muted-foreground">
            {Object.keys(value).length} field{Object.keys(value).length !== 1 ? "s" : ""}
          </span>
        </div>

        {expanded && (
          <div className="space-y-2 pl-4 border-l border-border">
            {Object.entries(value).map(([key, val]: [string, any]) => (
              <DynamicFormField
                key={key}
                value={val}
                onChange={(newVal) => {
                  onChange({ ...value, [key]: newVal });
                }}
                fieldName={key}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isBoolean) {
    return (
      <div className="flex items-center gap-2" style={{ paddingLeft: `${padding}px` }}>
        <Label className="text-sm">{fieldName}</Label>
        <select
          value={value ? "true" : "false"}
          onChange={(e) => onChange(e.target.value === "true")}
          className="px-2 py-1 border border-border rounded text-sm bg-background"
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </div>
    );
  }

  if (isNumber) {
    return (
      <div className="flex flex-col gap-1" style={{ paddingLeft: `${padding}px` }}>
        <Label className="text-sm">{fieldName}</Label>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(isNaN(Number(e.target.value)) ? 0 : Number(e.target.value))}
          placeholder={fieldName}
          className="text-sm"
        />
      </div>
    );
  }

  if (isString) {
    const isLongText = value.length > 50;
    return (
      <div className="flex flex-col gap-1" style={{ paddingLeft: `${padding}px` }}>
        <Label className="text-sm">{fieldName}</Label>
        {isLongText ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={fieldName}
            rows={3}
            className="text-sm font-mono"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={fieldName}
            className="text-sm"
          />
        )}
      </div>
    );
  }

  // Null/undefined
  return (
    <div
      className="flex flex-col gap-1 opacity-50"
      style={{ paddingLeft: `${padding}px` }}
    >
      <Label className="text-sm text-muted-foreground">{fieldName}</Label>
      <Input disabled value="(empty)" className="text-sm" />
    </div>
  );
};

interface DynamicJSONFormProps {
  data: any;
  onChange: (data: any) => void;
  title?: string;
}

export const DynamicJSONForm: React.FC<DynamicJSONFormProps> = ({
  data,
  onChange,
  title = "Configuration",
}) => {
  // Ensure data is an object
  const safeData = typeof data === "object" && !Array.isArray(data) && data !== null ? data : {};

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(safeData).map(([key, val]) => (
            <DynamicFormField
              key={key}
              value={val}
              onChange={(newVal) => {
                onChange({ ...safeData, [key]: newVal });
              }}
              fieldName={key}
              depth={0}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicFormField;
