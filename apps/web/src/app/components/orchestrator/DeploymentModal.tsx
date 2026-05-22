import { useState } from "react";
import { usePromoteDeployment } from "../../hooks/useMolenApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AlertTriangle, Rocket } from "lucide-react";
import { toast } from "sonner";

interface DeploymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: string;
  environment: "Development" | "Staging" | "Production";
  currentVersion?: string;
}

export function DeploymentModal({
  open,
  onOpenChange,
  version,
  environment,
  currentVersion,
}: DeploymentModalProps) {
  const [inboundTopic, setInboundTopic] = useState("fraud-events-inbound");
  const [outboundTopic, setOutboundTopic] = useState("fraud-events-outbound");
  const [isDeploying, setIsDeploying] = useState(false);
  const promote = usePromoteDeployment();

  const isOverride = currentVersion && currentVersion !== version;

  const handleDeploy = () => {
    setIsDeploying(true);
    promote.mutate({
      name: environment, // or orchestrator name, but the API expects 'name'
      versionId: version,
    }, {
      onSuccess: () => {
        toast.success("Deployment successful", {
          description: `Version is now active on ${environment}`,
        });
        setIsDeploying(false);
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast.error("Deployment failed", {
          description: error.message,
        });
        setIsDeploying(false);
      }
    });
  };

  const envColors = {
    Development: "text-cyan-400",
    Staging: "text-amber-400",
    Production: "text-red-400",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover border-border/50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Deploy to {environment}
          </DialogTitle>
          <DialogDescription>
            Promote version <span className="font-mono text-foreground">{version}</span> to the{" "}
            <span className={envColors[environment]}>{environment}</span> environment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isOverride && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-red-400 font-medium">Version Override Warning</p>
                <p className="text-red-300/80">
                  This will replace the currently active version{" "}
                  <Badge variant="outline" className="border-red-500/40 text-red-300 bg-red-500/10 text-[10px] mx-1">
                    {currentVersion}
                  </Badge>
                  with {version}. The Rust engine will restart to load the new graph definition.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                Inbound Redpanda Topic
              </label>
              <Select value={inboundTopic} onValueChange={setInboundTopic}>
                <SelectTrigger className="h-9 text-xs bg-input border-border/50 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="fraud-events-inbound" className="text-xs font-mono">
                    fraud-events-inbound
                  </SelectItem>
                  <SelectItem value="fraud-events-inbound-v2" className="text-xs font-mono">
                    fraud-events-inbound-v2
                  </SelectItem>
                  <SelectItem value="transaction-stream" className="text-xs font-mono">
                    transaction-stream
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                Outbound Redpanda Topic
              </label>
              <Select value={outboundTopic} onValueChange={setOutboundTopic}>
                <SelectTrigger className="h-9 text-xs bg-input border-border/50 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/50">
                  <SelectItem value="fraud-events-outbound" className="text-xs font-mono">
                    fraud-events-outbound
                  </SelectItem>
                  <SelectItem value="fraud-events-outbound-v2" className="text-xs font-mono">
                    fraud-events-outbound-v2
                  </SelectItem>
                  <SelectItem value="enriched-transactions" className="text-xs font-mono">
                    enriched-transactions
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground">Deployment Process</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed ml-1">
              <li>Serialize graph definition to Rust-compatible format</li>
              <li>Publish control message to Redpanda control topic</li>
              <li>Rust engine consumes message and validates schema</li>
              <li>Hot-swap orchestrator logic (zero downtime)</li>
              <li>Confirm version activation via health check</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeploying}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs gap-1.5"
          >
            <Rocket className="h-3.5 w-3.5" />
            {isDeploying ? "Deploying..." : "Confirm & Deploy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
