import { useState, useRef } from "react";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import {
  Check, X, Lightbulb
} from "lucide-react";
import {
  RuleTypeView,
  TypeColors,
} from "../../types/ruleEngine";
import { getVariablesForRuleType, validateRuleExpression } from "../../state/ruleEngineState";

interface CodeLogicEditorProps {
  ruleType: RuleTypeView;
  value: string;
  onChange: (value: string) => void;
}

export function CodeLogicEditor({ ruleType, value, onChange }: CodeLogicEditorProps) {
  const [showIntellisense, setShowIntellisense] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const variables = getVariablesForRuleType(ruleType);
  const validation = validateRuleExpression(value);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(newValue);

    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastTwoChars = textBeforeCursor.slice(-2);

    if (lastTwoChars === "{{") {
      setShowIntellisense(true);
    } else if (!textBeforeCursor.includes("{{") || textBeforeCursor.includes("}}")) {
      setShowIntellisense(false);
    }
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const cursorPos = e.currentTarget.selectionStart;

    const textBeforeCursor = value.substring(0, cursorPos);
    const lastTwoChars = textBeforeCursor.slice(-2);

    if (lastTwoChars === "{{") {
      setShowIntellisense(true);
    } else if (!textBeforeCursor.includes("{{") || textBeforeCursor.includes("}}")) {
      setShowIntellisense(false);
    }
  };

  const insertSuggestion = (suggestion: string) => {
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart;
      const textBefore = value.substring(0, cursorPos - 2); // Remove {{
      const textAfter = value.substring(cursorPos);
      const newValue = `${textBefore}{{${suggestion}}}${textAfter}`;
      onChange(newValue);
      setShowIntellisense(false);

      // Set cursor position after insertion
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = textBefore.length + suggestion.length + 4;
          textareaRef.current.selectionStart = newPos;
          textareaRef.current.selectionEnd = newPos;
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Code Expression</span>
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-xs">
            Pro-Code
          </Badge>
        </div>

        {validation.valid ? (
          <div className="flex items-center gap-1.5 text-green-500">
            <Check className="h-3 w-3" />
            <span className="text-xs">Valid Syntax</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-red-500">
            <X className="h-3 w-3" />
            <span className="text-xs">Invalid Syntax</span>
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onSelect={handleSelect}
          placeholder='Type {{ to see available variables, e.g., {{input.amount}} > 5000 and {{input.email}} contains("@trusted.com")'
          className="border-border/50 min-h-32 font-mono text-sm leading-relaxed resize-none"
          style={{
            backgroundColor: "#0f172a",
            color: "#e2e8f0",
            caretColor: "#ffffff",
          }}
        />

        {/* Intellisense Popover */}
        {showIntellisense && (
          <Card className="absolute z-50 mt-1 p-2 bg-popover border-border/50 shadow-xl max-w-sm">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/30">
              <Lightbulb className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Available Variables</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-auto">
              {variables.map((v) => {
                const colors = TypeColors[v.type];
                return (
                  <button
                    key={v.path}
                    type="button"
                    onClick={() => insertSuggestion(v.path)}
                    className="w-full flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="font-mono text-sm" style={{ color: "#10b981", fontWeight: 600 }}>
                      {v.path}
                    </span>
                    <Badge
                      variant="outline"
                      className={`${colors.bg} ${colors.color} ${colors.border} text-[10px]`}
                    >
                      {v.type}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Validation Errors */}
      {!validation.valid && validation.errors && (
        <Card className="p-3 bg-destructive/10 border-destructive/30">
          <div className="space-y-1">
            {validation.errors.map((error) => (
              <div key={error} className="flex items-start gap-2">
                <X className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                <span className="text-xs text-destructive">{error}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Reference */}
      <Card className="p-3 bg-muted/30 border-border/50">
        <div className="text-xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Variables:</span>
            <code style={{ color: "#10b981", fontWeight: 600 }}>{"{{input.field}}"}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Functions:</span>
            <code style={{ color: "#6366f1" }}>contains()</code>
            <code style={{ color: "#6366f1" }}>starts_with()</code>
            <code style={{ color: "#6366f1" }}>between()</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Logic:</span>
            <code style={{ color: "#a855f7", fontWeight: 700 }}>AND</code>
            <code style={{ color: "#a855f7", fontWeight: 700 }}>OR</code>
            <code style={{ color: "#a855f7", fontWeight: 700 }}>NOT</code>
          </div>
        </div>
      </Card>
    </div>
  );
}
