import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";

interface NewOrchestratorDialogProps {
  onCreate: (name: string, description: string) => void;
}

export function NewOrchestratorDialog({ onCreate }: NewOrchestratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = () => {
    onCreate(newName, newDesc);
    setOpen(false);
    setNewName("");
    setNewDesc("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" />
          New Orchestrator
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-popover border-border/50">
        <DialogHeader>
          <DialogTitle>New Orchestrator</DialogTitle>
          <DialogDescription>
            Create a new fraud-detection pipeline. You can add nodes on the canvas after creation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Pipeline Name</Label>
            <Input
              placeholder="e.g. High-Value Transaction Check"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-input border-border/50"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Description{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              placeholder="What does this pipeline detect?"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="bg-input border-border/50 min-h-20 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            Create & Open Editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
