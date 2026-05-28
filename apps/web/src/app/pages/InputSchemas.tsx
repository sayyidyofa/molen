import { useState } from "react";
import { Button } from "../components/ui/button";
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
import { useCombinedAppState, useAddSchema, useUpdateSchema, useDeleteSchema } from "../hooks/useMolenApi";
import { toast } from "sonner";
import { InputSchemaForm } from "../components/forms/InputSchemaForm";

import { InputSchema } from "@molen/shared-types";

export function InputSchemas() {
  const state = useCombinedAppState();
  const addSchema = useAddSchema();
  const updateSchema = useUpdateSchema();
  const deleteSchema = useDeleteSchema();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState<InputSchema | undefined>(undefined);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteSchema.mutate(id, {
        onSuccess: () => {
          toast.success(`Deleted ${name}`);
        },
        onError: (err) => {
          toast.error(`Failed to delete schema: ${err.message}`);
        }
      });
    }
  };

  const handleCreate = () => {
    setEditingSchema(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (schema: InputSchema) => {
    setEditingSchema(schema);
    setDialogOpen(true);
  };

  const handleSubmit = (data: Omit<InputSchema, 'id'>) => {
    if (editingSchema) {
      updateSchema.mutate({ id: editingSchema.id, schema: data }, {
        onSuccess: () => {
          toast.success(`Updated ${data.name}`);
          setDialogOpen(false);
          setEditingSchema(undefined);
        },
        onError: (err) => {
          toast.error(`Failed to update schema: ${err.message}`);
        }
      });
    } else {
      addSchema.mutate(data, {
        onSuccess: () => {
          toast.success(`Created ${data.name}`);
          setDialogOpen(false);
          setEditingSchema(undefined);
        },
        onError: (err) => {
          toast.error(`Failed to create schema: ${err.message}`);
        }
      });
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Input Schemas</h1>
          <p className="text-muted-foreground">
            Define raw data shapes from external sources
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Schema
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead>Name</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.inputSchemas.map((schema: InputSchema) => (
              <TableRow
                key={schema.id}
                className="border-border/30 hover:bg-muted/30"
              >
                <TableCell className="font-medium">{schema.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {schema.fields.length} fields
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-muted"
                      onClick={() => handleEdit(schema)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => handleDelete(schema.id, schema.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {state.inputSchemas.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No schemas found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-popover border-border/50 max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSchema ? "Edit Schema" : "New Schema"}</DialogTitle>
            <DialogDescription>
              {editingSchema ? "Update the input schema configuration" : "Build your JSON schema visually without writing code"}
            </DialogDescription>
          </DialogHeader>
          <InputSchemaForm
            initialData={editingSchema}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
