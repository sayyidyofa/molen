import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Boxes } from "lucide-react";

interface FeatureExtractorNodeProps {
  data: {
    label: string;
    outputType: string;
  };
}

export function FeatureExtractorNode({ data }: FeatureExtractorNodeProps) {
  return (
    <Card className="w-64 border-accent/50 bg-card/95 backdrop-blur shadow-lg shadow-accent/10">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-accent/20 p-1.5">
            <Boxes className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{data.label}</div>
            <div className="text-xs text-muted-foreground">Feature Extractor</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Output Type:</span>
            <Badge variant="outline" className="border-accent/50 text-accent text-xs">
              {data.outputType}
            </Badge>
          </div>
        </div>
      </CardContent>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-accent !border-2 !border-accent/50"
      />
    </Card>
  );
}
