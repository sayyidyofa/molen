import {
  ArrowLeft,
  Play,
  Save,
  Rocket,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";

interface EditorHeaderProps {
  orchestratorName?: string;
  id?: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNavigateBack: () => void;
  onTest: () => void;
  onSave: () => void;
  onCommit: () => void;
}

export function EditorHeader({
  orchestratorName,
  id,
  activeTab,
  onTabChange,
  onNavigateBack,
  onTest,
  onSave,
  onCommit,
}: EditorHeaderProps) {
  return (
    <header className="h-14 border-b border-border/40 bg-card/30 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={onNavigateBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight">
              {orchestratorName ?? "Loading Orchestrator..."}
            </h1>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-primary/30 text-primary bg-primary/5">
              DRAFT
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            ID: {id} • Last modified 2m ago
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tabs value={activeTab} onValueChange={onTabChange} className="mr-4">
          <TabsList className="h-8 bg-muted/50 p-0.5">
            <TabsTrigger value="editor" className="h-7 text-[11px] px-3">
              Logic Graph
            </TabsTrigger>
            <TabsTrigger value="deployments" className="h-7 text-[11px] px-3">
              Deployments
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Separator orientation="vertical" className="h-6 mx-1 bg-border/40" />

        <div className="flex items-center gap-1.5 ml-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-border/60 hover:bg-muted/50"
            onClick={onTest}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Test Logic
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-border/60 hover:bg-muted/50"
            onClick={onSave}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save Draft
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs shadow-lg shadow-primary/20"
            onClick={onCommit}
          >
            <Rocket className="mr-1.5 h-3.5 w-3.5" />
            Commit Version
          </Button>
        </div>
      </div>
    </header>
  );
}
