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
import { Plus, Edit, Trash2 } from "lucide-react";
import { useCombinedAppState, useAddExtractor, useUpdateExtractor, useDeleteExtractor } from "../hooks/useMolenApi";
import { toast } from "sonner";
import { FeatureExtractorForm } from "../components/forms/FeatureExtractorForm";

import { FeatureExtractor } from "@molen/shared-types";

export function FeatureExtractors() {
  const state = useCombinedAppState();
  const addExtractor = useAddExtractor();
  const updateExtractor = useUpdateExtractor();
  const deleteExtractor = useDeleteExtractor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExtractor, setEditingExtractor] = useState<FeatureExtractor | undefined>(undefined);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteExtractor.mutate(id, {
        onSuccess: () => {
          toast.success(`Deleted ${name}`);
        },
        onError: (err) => {
          toast.error(`Failed to delete extractor: ${err.message}`);
        }
      });
    }
  };

  const handleCreate = () => {
    setEditingExtractor(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (extractor: FeatureExtractor) => {
    setEditingExtractor(extractor);
    setDialogOpen(true);
  };

  const handleSubmit = (data: Omit<FeatureExtractor, 'id'>) => {
    if (editingExtractor) {
      updateExtractor.mutate({ id: editingExtractor.id, extractor: data }, {
        onSuccess: () => {
          toast.success(`Updated ${data.name}`);
          setDialogOpen(false);
          setEditingExtractor(undefined);
        },
        onError: (err) => {
          toast.error(`Failed to update extractor: ${err.message}`);
        }
      });
    } else {
      addExtractor.mutate(data, {
        onSuccess: () => {
          toast.success(`Created ${data.name}`);
          setDialogOpen(false);
          setEditingExtractor(undefined);
        },
        onError: (err) => {
          toast.error(`Failed to create extractor: ${err.message}`);
        }
      });
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Feature Extractors</h1>
          <p className="text-muted-foreground">
            Map raw data to internal feature types
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Extractor
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead>Name</TableHead>
              <TableHead>Output Type</TableHead>
              <TableHead>Source Field</TableHead>
              <TableHead>Transformation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.featureExtractors.map((extractor: FeatureExtractor) => (
              <TableRow
                key={extractor.id}
                className="border-border/30 hover:bg-muted/30"
              >
                <TableCell className="font-medium">{extractor.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-accent/50 text-accent">
                    {extractor.outputType}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {extractor.sourceField}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {extractor.transformation}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-muted"
                      onClick={() => handleEdit(extractor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => handleDelete(extractor.id, extractor.name)}
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
        <DialogContent className="bg-popover border-border/50">
          <DialogHeader>
            <DialogTitle>{editingExtractor ? "Edit Extractor" : "New Extractor"}</DialogTitle>
            <DialogDescription>
              {editingExtractor ? "Update the feature extractor configuration" : "Create a new feature extractor to map raw data"}
            </DialogDescription>
          </DialogHeader>
          <FeatureExtractorForm
            initialData={editingExtractor}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
