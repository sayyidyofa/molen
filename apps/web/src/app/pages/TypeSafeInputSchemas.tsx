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
import { useCombinedAppState, useAddSchema, useUpdateSchema, useDeleteSchema } from "../hooks/useMolenApi";
import { toast } from "sonner";
import { TypeSafeInputSchemaForm } from "../components/forms/TypeSafeInputSchemaForm";
import { DataTypeBadge } from "../components/common/DataTypeBadge";
import { InputSchema } from "../types/molen";

export function TypeSafeInputSchemas() {
  const state = useCombinedAppState();
  const addSchema = useAddSchema();
  const updateSchema = useUpdateSchema();
  const deleteSchema = useDeleteSchema();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState<InputSchema | null>(null);

  const handleDelete = (id: string, name: string) => {
    deleteSchema.mutate(id, {
      onSuccess: () => {
        toast.success(`Deleted ${name}`);
      },
      onError: (err) => {
        toast.error(`Failed to delete schema: ${err.message}`);
      }
    });
  };

  const handleCreate = () => {
    setEditingSchema(null);
    setDialogOpen(true);
  };

  const handleEdit = (schema: InputSchema) => {
    setEditingSchema(schema);
    setDialogOpen(true);
  };

  const handleSubmit = (data: InputSchema) => {
    if (editingSchema) {
      updateSchema.mutate({ id: editingSchema.id, schema: data as any }, {
        onSuccess: () => {
          toast.success(`Updated ${data.name}`);
          setDialogOpen(false);
          setEditingSchema(null);
        },
        onError: (err) => {
          toast.error(`Failed to update schema: ${err.message}`);
        }
      });
    } else {
      addSchema.mutate(data as any, {
        onSuccess: () => {
          toast.success(`Created ${data.name}`);
          setDialogOpen(false);
          setEditingSchema(null);
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
          <h1 className="mb-2">Input Schema Registry</h1>
          <p className="text-muted-foreground">
            Define raw data structures with type-safe field definitions
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
              <TableHead>Version</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Data Types</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.inputSchemas.map((schema) => {
              const uniqueTypes = Array.from(
                new Set(schema.fields.map((f) => f.dataType))
              );

              return (
                <TableRow
                  key={schema.id}
                  className="border-border/30 hover:bg-muted/30"
                >
                  <TableCell className="font-medium">{schema.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {schema.version}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {schema.fields.length} fields
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {uniqueTypes.slice(0, 3).map((type) => (
                        <DataTypeBadge key={type} dataType={type} size="sm" />
                      ))}
                      {uniqueTypes.length > 3 && (
                        <Badge variant="outline" className="border-border/50 text-xs">
                          +{uniqueTypes.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(schema.updatedAt).toLocaleDateString()}
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
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-popover border-border/50 max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchema ? "Edit Schema" : "New Schema"}
            </DialogTitle>
            <DialogDescription>
              {editingSchema
                ? "Update the input schema configuration with type-safe fields"
                : "Build your JSON schema visually with enforced data types"}
            </DialogDescription>
          </DialogHeader>
          <TypeSafeInputSchemaForm
            initialData={editingSchema || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
