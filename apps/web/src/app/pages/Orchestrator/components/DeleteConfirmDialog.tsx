import { AlertTriangle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

interface DeleteConfirmDialogProps {
  id: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({ id, onClose, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-popover border-border/50 max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-full bg-destructive/15 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete Orchestrator</DialogTitle>
          </div>
          <DialogDescription>
            This action cannot be undone. The pipeline and all its node configurations will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete Pipeline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
