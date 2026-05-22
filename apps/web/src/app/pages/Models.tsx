import { useState } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Plus, Edit, Trash2, TrendingUp } from "lucide-react";
import { useCombinedAppState, useAddModel, useUpdateModel, useDeleteModel } from "../hooks/useMolenApi";
import { toast } from "sonner";
import { ModelForm } from "../components/forms/ModelForm";

import { MLModel } from "@molen/shared-types";

export function Models() {
  const state = useCombinedAppState();
  const addModel = useAddModel();
  const updateModel = useUpdateModel();
  const deleteModel = useDeleteModel();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<MLModel | undefined>(undefined);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteModel.mutate(id, {
        onSuccess: () => {
          toast.success(`Deleted ${name}`);
        },
        onError: (err) => {
          toast.error(`Failed to delete model: ${err.message}`);
        }
      });
    }
  };

  const handleCreate = () => {
    setEditingModel(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (model: MLModel) => {
    setEditingModel(model);
    setDialogOpen(true);
  };

  const handleSubmit = (data: Omit<MLModel, 'id'>) => {
    if (editingModel) {
      updateModel.mutate({ id: editingModel.id, model: data }, {
        onSuccess: () => {
          toast.success(`Updated ${data.name}`);
          setDialogOpen(false);
          setEditingModel(undefined);
        },
        onError: (err) => {
          toast.error(`Failed to update model: ${err.message}`);
        }
      });
    } else {
      addModel.mutate(data, {
        onSuccess: () => {
          toast.success(`Created ${data.name}`);
          setDialogOpen(false);
          setEditingModel(undefined);
        },
        onError: (err) => {
          toast.error(`Failed to create model: ${err.message}`);
        }
      });
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Models</h1>
          <p className="text-muted-foreground">
            Manage machine learning models and their metrics
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Model
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead>Name</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Accuracy</TableHead>
              <TableHead>FPR</TableHead>
              <TableHead>Model URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.models.map((model: MLModel) => (
              <TableRow
                key={model.id}
                className="border-border/30 hover:bg-muted/30"
              >
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {model.version}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className={(model.accuracy || 0) >= 97 ? "text-green-500" : "text-yellow-500"}>
                      {model.accuracy}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={(model.fpr || 0) <= 1 ? "text-green-500" : "text-muted-foreground"}>
                    {model.fpr}%
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {model.modelUrl}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={model.status === "deployed" ? "default" : "secondary"}
                    className={
                      model.status === "deployed"
                        ? "bg-primary/20 text-primary border-primary/30"
                        : ""
                    }
                  >
                    {model.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-muted"
                      onClick={() => handleEdit(model)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => handleDelete(model.id, model.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-popover border-border/50 max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingModel ? "Edit Model" : "New Model"}</DialogTitle>
            <DialogDescription>
              {editingModel ? "Update the ML model configuration and metrics" : "Register a new machine learning model for fraud detection"}
            </DialogDescription>
          </DialogHeader>
          <ModelForm
            initialData={editingModel}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
