import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllTrainingTemplates,
  createTrainingTemplate,
  updateTrainingTemplate,
  deleteTrainingTemplate,
} from '@/db/trainingTemplates';
import { getAllExercises } from '@/db/exercises';
import type { TrainingTemplate, Exercise } from '@/db/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Plus, Trash2, Edit, GripVertical, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function TrainingTemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TrainingTemplate | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', exerciseIds: [] as string[] });
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [loadedTemplates, loadedExercises] = await Promise.all([
        getAllTrainingTemplates(),
        getAllExercises(),
      ]);
      setTemplates(loadedTemplates);
      setExercises(loadedExercises);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setFormData({ name: '', description: '', exerciseIds: [] });
    setSearchValue('');
    setEditDialogOpen(true);
  };

  const handleEdit = (template: TrainingTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      exerciseIds: template.exerciseIds,
    });
    setSearchValue('');
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingTemplate) {
        await updateTrainingTemplate(editingTemplate.id, {
          name: formData.name,
          description: formData.description,
          exerciseIds: formData.exerciseIds,
        });
      } else {
        await createTrainingTemplate({
          name: formData.name,
          description: formData.description,
          exerciseIds: formData.exerciseIds,
        });
      }
      
      setEditDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await deleteTrainingTemplate(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const addExercise = (exerciseId: string) => {
    if (!formData.exerciseIds.includes(exerciseId)) {
      setFormData({
        ...formData,
        exerciseIds: [...formData.exerciseIds, exerciseId],
      });
    }
    setSearchValue('');
  };

  const removeExercise = (index: number) => {
    const newExerciseIds = [...formData.exerciseIds];
    newExerciseIds.splice(index, 1);
    setFormData({
      ...formData,
      exerciseIds: newExerciseIds,
    });
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExerciseIds = [...formData.exerciseIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newExerciseIds.length) return;
    
    [newExerciseIds[index], newExerciseIds[targetIndex]] = [newExerciseIds[targetIndex], newExerciseIds[index]];
    
    setFormData({
      ...formData,
      exerciseIds: newExerciseIds,
    });
  };

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pt-5">
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Training Templates</h1>
      </div>
      <p className="text-muted-foreground mb-6 ml-12">Predefined training routines</p>

      <Button onClick={handleCreateNew} size="lg" className="w-full mb-6">
        <Plus className="h-5 w-5 mr-2" />
        Create New Template
      </Button>

      {templates.length === 0 ? (
        <Card size="sm">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No templates yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card key={template.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{template.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => setDeleteConfirmId(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                )}
                {template.exerciseIds.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Exercises:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {template.exerciseIds.map((exerciseId, index) => (
                        <li key={exerciseId}>
                          {index + 1}. {getExerciseName(exerciseId)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No exercises added yet</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Update your training template details.'
                : 'Create a new training template with exercises.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Upper Body Day"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this training..."
                rows={2}
              />
            </div>
            <div>
              <Label>Exercises</Label>
              {exercises.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">
                  No exercises available. Create some exercises first.
                </p>
              ) : (
                <div className="space-y-3 mt-2">
                  {/* Search and add exercises */}
                  <div className="space-y-2">
                    <Input
                      placeholder="Search exercises to add..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                    />
                    {searchValue && (
                      <div className="max-h-48 overflow-y-auto border rounded-md">
                        {exercises
                          .filter((ex) => 
                            ex.name.toLowerCase().includes(searchValue.toLowerCase()) &&
                            !formData.exerciseIds.includes(ex.id)
                          )
                          .map((exercise) => (
                            <Button
                              key={exercise.id}
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => addExercise(exercise.id)}
                            >
                              <div className="flex flex-col items-start gap-0.5">
                                <span>{exercise.name}</span>
                                {exercise.bodyPart && (
                                  <span className="text-xs text-muted-foreground">
                                    {exercise.bodyPart}
                                  </span>
                                )}
                              </div>
                            </Button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Selected exercises list with reordering */}
                  {formData.exerciseIds.length > 0 && (
                    <div className="border rounded-md p-2 space-y-1">
                      <p className="text-xs font-medium mb-2">Selected ({formData.exerciseIds.length}):</p>
                      {formData.exerciseIds.map((exerciseId, index) => {
                        const exercise = exercises.find((e) => e.id === exerciseId);
                        if (!exercise) return null;
                        
                        return (
                          <div
                            key={exerciseId}
                            className="flex items-center gap-2 p-2 bg-muted rounded-sm"
                          >
                            <div className="flex flex-col gap-1">
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                onClick={() => moveExercise(index, 'up')}
                                disabled={index === 0}
                                className="h-4 w-4 p-0"
                              >
                                <GripVertical className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                onClick={() => moveExercise(index, 'down')}
                                disabled={index === formData.exerciseIds.length - 1}
                                className="h-4 w-4 p-0"
                              >
                                <GripVertical className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-sm font-medium mr-2">{index + 1}.</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{exercise.name}</p>
                              {exercise.bodyPart && (
                                <p className="text-xs text-muted-foreground">{exercise.bodyPart}</p>
                              )}
                            </div>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => removeExercise(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
