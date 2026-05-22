import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Card } from "../ui/card";
import { Plus, Trash2 } from "lucide-react";
import { RuleTypeView, DataType, SchemaProperty, TypeColors } from "../../types/ruleEngine";
import { Badge } from "../ui/badge";

interface RuleTypeDialogProps {
  trigger: React.ReactNode;
  initialData?: RuleTypeView;
  onSubmit: (data: RuleTypeView) => void;
}

export function RuleTypeDialog({ trigger, initialData, onSubmit }: RuleTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    baseType: initialData?.baseType || DataType.STRING,
    description: initialData?.description || "",
    schema: initialData?.schema || ([] as SchemaProperty[]),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialData?.id || `rt-${Date.now()}`,
      ...formData,
      schema: formData.baseType === DataType.OBJECT ? formData.schema : undefined,
    });
    setOpen(false);
  };

  const addSchemaProperty = () => {
    setFormData({
      ...formData,
      schema: [...formData.schema, { key: "", type: DataType.STRING }],
    });
  };

  const updateSchemaProperty = (index: number, updates: Partial<SchemaProperty>) => {
    const newSchema = [...formData.schema];
    newSchema[index] = { ...newSchema[index], ...updates };
    setFormData({ ...formData, schema: newSchema });
  };

  const deleteSchemaProperty = (index: number) => {
    const newSchema = formData.schema.filter((_, i) => i !== index);
    setFormData({ ...formData, schema: newSchema });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-popover border-border/50 max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Rule Type" : "New Rule Type"}</DialogTitle>
          <DialogDescription>
            Define the input structure for your typed rules
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Type Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Transaction, Person"
                required
                className="bg-input border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseType">Base Type</Label>
              <Select
                value={formData.baseType}
                onValueChange={(value: DataType) =>
                  setFormData({ ...formData, baseType: value })
                }
              >
                <SelectTrigger className="bg-input border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DataType).map((type) => {
                    const colors = TypeColors[type];
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`${colors.bg} ${colors.color} ${colors.border} text-xs`}
                          >
                            {type}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this rule type..."
              className="bg-input border-border/50 min-h-20"
            />
          </div>

          {formData.baseType === DataType.OBJECT && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Schema Properties</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addSchemaProperty}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Add Property
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-auto">
                {formData.schema.map((prop, index) => (
                  <Card key={index} className="p-3 border-border/50 bg-card/30">
                    <div className="grid grid-cols-[1fr,1fr,auto] gap-3 items-center">
                      <Input
                        placeholder="Property name"
                        value={prop.key}
                        onChange={(e) =>
                          updateSchemaProperty(index, { key: e.target.value })
                        }
                        className="bg-input border-border/50 h-9"
                      />

                      <Select
                        value={prop.type}
                        onValueChange={(value: DataType) =>
                          updateSchemaProperty(index, { type: value })
                        }
                      >
                        <SelectTrigger className="bg-input border-border/50 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            DataType.STRING,
                            DataType.NUMBER,
                            DataType.DATETIME,
                            DataType.BOOLEAN,
                          ].map((type) => {
                            const colors = TypeColors[type];
                            return (
                              <SelectItem key={type} value={type}>
                                <Badge
                                  variant="outline"
                                  className={`${colors.bg} ${colors.color} ${colors.border} text-xs`}
                                >
                                  {type}
                                </Badge>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSchemaProperty(index)}
                        className="h-9 w-9 hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {formData.schema.length === 0 && (
                  <Card className="p-6 border-dashed border-border/50 bg-card/30">
                    <p className="text-sm text-muted-foreground text-center">
                      No properties defined. Click "Add Property" to start.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {initialData ? "Update Type" : "Create Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
