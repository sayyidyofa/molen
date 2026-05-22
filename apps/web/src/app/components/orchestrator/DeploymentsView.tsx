import { useState } from "react";
import { useParams } from "react-router";
import { useCommittedVersions } from "../../hooks/useMolenApi";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { EnvironmentCard } from "./EnvironmentCard";
import { DeploymentModal } from "./DeploymentModal";
import { MoreVertical, Eye, Rocket, GitCommit, Calendar, User } from "lucide-react";

export function DeploymentsView() {
  const { id } = useParams();
  const versionsQuery = useCommittedVersions(id!);
  const versions = versionsQuery.data || [];

  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [targetEnvironment, setTargetEnvironment] = useState<
    "Development" | "Staging" | "Production"
  >("Development");

  const handleDeploy = (versionId: string, env: "Development" | "Staging" | "Production") => {
    setSelectedVersionId(versionId);
    setTargetEnvironment(env);
    setDeployModalOpen(true);
  };

  const getEnvBadge = (env: "Development" | "Staging" | "Production") => {
    const colors = {
      Development: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
      Staging: "border-amber-500/40 text-amber-400 bg-amber-500/10",
      Production: "border-red-500/40 text-red-400 bg-red-500/10",
    };
    return colors[env];
  };

  const currentVersions = {
    Development: "v1.1",
    Staging: "v2.0",
    Production: "v1.2",
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="space-y-6 p-6 max-w-screen-2xl mx-auto w-full">
        {/* Environment Cards Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Active Deployments
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Live orchestrator versions across all environments
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <EnvironmentCard
              environment="Development"
              activeVersion={currentVersions.Development}
              throughput={1247}
              isHealthy={true}
              onManage={() => handleDeploy(currentVersions.Development, "Development")}
            />
            <EnvironmentCard
              environment="Staging"
              activeVersion={currentVersions.Staging}
              throughput={3821}
              isHealthy={true}
              onManage={() => handleDeploy(currentVersions.Staging, "Staging")}
            />
            <EnvironmentCard
              environment="Production"
              activeVersion={currentVersions.Production}
              throughput={12456}
              isHealthy={true}
              onManage={() => handleDeploy(currentVersions.Production, "Production")}
            />
          </div>
        </div>

        {/* Version History Section */}
        <Card className="border-border/40 bg-card/40 backdrop-blur">
          <CardHeader className="border-b border-border/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitCommit className="h-4 w-4 text-primary" />
                  Version History
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  All committed orchestrator versions for this graph
                </p>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px] px-2 py-1">
                {versions.length} Versions
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/30">
                  <TableHead className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Version
                  </TableHead>
                  <TableHead className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Commit Message
                  </TableHead>
                  <TableHead className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Author
                  </TableHead>
                  <TableHead className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Created
                  </TableHead>
                  <TableHead className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Environments
                  </TableHead>
                  <TableHead className="text-right text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version: any) => (
                  <TableRow
                    key={version.id}
                    className="border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    <TableCell className="font-mono font-semibold text-sm">
                      v{version.version}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-xs text-foreground/90 truncate">
                        {version.commit_message || "No commit message"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {version.author || "System"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {version.committed_at ? new Date(version.committed_at).toLocaleDateString() : "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {version.environments && Array.isArray(version.environments) && version.environments.length > 0 ? (
                          version.environments.map((env: any) => (
                            <Badge
                              key={env}
                              variant="outline"
                              className={`${getEnvBadge(env) || ""} text-[9px] px-1.5 py-0`}
                            >
                              {String(env).slice(0, 4).toUpperCase()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50">Not deployed</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-muted/40"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-popover border-border/50 min-w-44"
                        >
                          <DropdownMenuItem className="text-xs cursor-pointer">
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            View Graph (Read-only)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs cursor-pointer"
                            onClick={() => handleDeploy(version.id, "Development")}
                          >
                            <Rocket className="mr-2 h-3.5 w-3.5 text-cyan-400" />
                            Deploy to Development
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs cursor-pointer"
                            onClick={() => handleDeploy(version.id, "Staging")}
                          >
                            <Rocket className="mr-2 h-3.5 w-3.5 text-amber-400" />
                            Deploy to Staging
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs cursor-pointer"
                            onClick={() => handleDeploy(version.id, "Production")}
                          >
                            <Rocket className="mr-2 h-3.5 w-3.5 text-red-400" />
                            Deploy to Production
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selectedVersionId && (
        <DeploymentModal
          open={deployModalOpen}
          onOpenChange={setDeployModalOpen}
          version={selectedVersionId}
          environment={targetEnvironment}
          currentVersion={currentVersions[targetEnvironment]}
        />
      )}
    </div>
  );
}
