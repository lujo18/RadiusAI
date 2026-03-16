"use client";

/**
 * DynamicJSONForm — clean, fully-editable form over an arbitrary JSON object.
 *
 * Fixes over the previous version:
 *  • Null / undefined values are treated as editable empty strings (never disabled)
 *  • Leaf inputs use local state → parent re-renders don't cause focus loss
 *  • Humanized labels (snake_case → "Sentence Case")
 *  • Clean card-per-section layout at top level
 *  • Array items have proper inline add / remove controls
 *  • Boolean fields use a Switch (not a raw <select>)
 */

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Stable leaf inputs ───────────────────────────────────────────────────

interface LeafStringInputProps {
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

const LeafStringInput: React.FC<LeafStringInputProps> = ({
  value,
  onChange,
  placeholder,
  multiline,
}) => {
  const [local, setLocal] = useState<string>(value ?? "");
  const externalRef = useRef(value);

  useEffect(() => {
    if (value !== externalRef.current) {
      externalRef.current = value;
      setLocal(value ?? "");
    }
  }, [value]);

  const handleChange = (next: string) => {
    setLocal(next);
    onChange(next);
  };

  if (multiline) {
    return (
      <Textarea
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="text-sm resize-none"
      />
    );
  }

  return (
    <Input
      value={local}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      className="text-sm h-9"
    />
  );
};

interface LeafNumberInputProps {
  value: number | null | undefined;
  onChange: (v: number) => void;
}

const LeafNumberInput: React.FC<LeafNumberInputProps> = ({
  value,
  onChange,
}) => {
  const [local, setLocal] = useState<string>(
    value === null || value === undefined ? "" : String(value),
  );
  const externalRef = useRef(value);

  useEffect(() => {
    if (value !== externalRef.current) {
      externalRef.current = value;
      setLocal(value === null || value === undefined ? "" : String(value));
    }
  }, [value]);

  const handleChange = (raw: string) => {
    setLocal(raw);
    const n = parseFloat(raw);
    if (!isNaN(n)) onChange(n);
    else if (raw === "" || raw === "-") onChange(0);
  };

  return (
    <Input
      type="number"
      value={local}
      onChange={(e) => handleChange(e.target.value)}
      className="text-sm h-9"
    />
  );
};

// ─── Core recursive field renderer ────────────────────────────────────────

interface FieldProps {
  fieldName: string;
  value: unknown;
  onChange: (v: unknown) => void;
  depth: number;
}

const Field: React.FC<FieldProps> = ({ fieldName, value, onChange, depth }) => {
  const [expanded, setExpanded] = useState(true);

  const isNull = value === null || value === undefined;
  const isArray = Array.isArray(value);
  const isObject = typeof value === "object" && !isArray && !isNull;
  const isBoolean = typeof value === "boolean";
  const isNumber = typeof value === "number";

  // ── Array ──────────────────────────────────────────────────────────────
  if (isArray) {
    const arr = value as unknown[];
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
          <Label className="text-sm font-medium">{humanize(fieldName)}</Label>
          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
            {arr.length} items
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-auto"
            onClick={() => onChange([...arr, ""])}
            title="Add item"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {expanded && (
          <div className="pl-4 border-l-2 border-border space-y-2">
            {arr.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-1">
                No items yet — click + to add one
              </p>
            )}
            {arr.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="flex-1">
                  {typeof item === "object" && item !== null ? (
                    <Field
                      fieldName={`Item ${idx + 1}`}
                      value={item}
                      onChange={(v) => {
                        const next = [...arr];
                        next[idx] = v;
                        onChange(next);
                      }}
                      depth={depth + 1}
                    />
                  ) : (
                    <LeafStringInput
                      value={item as string}
                      onChange={(v) => {
                        const next = [...arr];
                        next[idx] = v;
                        onChange(next);
                      }}
                      placeholder={`Item ${idx + 1}`}
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0 mt-1"
                  onClick={() => onChange(arr.filter((_, i) => i !== idx))}
                  title="Remove item"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Object ─────────────────────────────────────────────────────────────
  if (isObject) {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj);

    if (depth === 0) {
      return (
        <Card className="overflow-hidden">
          <CardHeader
            className="py-3 px-4 cursor-pointer select-none bg-muted/30 hover:bg-muted/50 transition-colors"
            onClick={() => setExpanded((p) => !p)}
          >
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              {humanize(fieldName)}
              <Badge variant="secondary" className="text-xs">
                {entries.length} field{entries.length !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          {expanded && (
            <CardContent className="p-4 space-y-4">
              {entries.map(([k, v]) => (
                <Field
                  key={k}
                  fieldName={k}
                  value={v}
                  onChange={(nv) => onChange({ ...obj, [k]: nv })}
                  depth={depth + 1}
                />
              ))}
            </CardContent>
          )}
        </Card>
      );
    }

    return (
      <div className="space-y-1.5">
        <button
          type="button"
          className="flex items-center gap-2 text-left w-full group"
          onClick={() => setExpanded((p) => !p)}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <Label className="text-sm font-medium cursor-pointer group-hover:text-primary transition-colors">
            {humanize(fieldName)}
          </Label>
          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
            {entries.length} field{entries.length !== 1 ? "s" : ""}
          </Badge>
        </button>
        {expanded && (
          <div className="pl-4 border-l-2 border-border space-y-3">
            {entries.map(([k, v]) => (
              <Field
                key={k}
                fieldName={k}
                value={v}
                onChange={(nv) => onChange({ ...obj, [k]: nv })}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Boolean ────────────────────────────────────────────────────────────
  if (isBoolean) {
    return (
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm">{humanize(fieldName)}</Label>
        <Switch
          checked={value as boolean}
          onCheckedChange={(v) => onChange(v)}
        />
      </div>
    );
  }

  // ── Number ─────────────────────────────────────────────────────────────
  if (isNumber) {
    return (
      <div className="space-y-1">
        <Label className="text-sm">{humanize(fieldName)}</Label>
        <LeafNumberInput value={value as number} onChange={(v) => onChange(v)} />
      </div>
    );
  }

  // ── String or Null (always editable) ───────────────────────────────────
  const strVal = isNull ? "" : (value as string);
  const isLong = strVal.length > 60;

  return (
    <div className="space-y-1">
      <Label className={cn("text-sm", isNull && "text-muted-foreground")}>
        {humanize(fieldName)}
      </Label>
      <LeafStringInput
        value={strVal}
        onChange={(v) => onChange(v)}
        placeholder={`Enter ${humanize(fieldName).toLowerCase()}…`}
        multiline={isLong}
      />
    </div>
  );
};

// ─── Public component ──────────────────────────────────────────────────────

export interface DynamicJSONFormProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  title?: string;
}

export const DynamicJSONForm: React.FC<DynamicJSONFormProps> = ({
  data,
  onChange,
  title = "Configuration",
}) => {
  const safe =
    typeof data === "object" && !Array.isArray(data) && data !== null
      ? (data as Record<string, unknown>)
      : {};

  const entries = Object.entries(safe);

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No fields configured yet.
          </CardContent>
        </Card>
      ) : (
        <>
          {entries.map(([key, val]) => {
            const isTopObj =
              typeof val === "object" && val !== null && !Array.isArray(val);

            if (isTopObj) {
              return (
                <Field
                  key={key}
                  fieldName={key}
                  value={val}
                  onChange={(nv) => onChange({ ...safe, [key]: nv })}
                  depth={0}
                />
              );
            }

            return (
              <Card key={key} className="overflow-hidden">
                <CardContent className="p-4">
                  <Field
                    fieldName={key}
                    value={val}
                    onChange={(nv) => onChange({ ...safe, [key]: nv })}
                    depth={1}
                  />
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
};

export default DynamicJSONForm;
