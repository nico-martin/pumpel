import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllExercises,
  createExercise,
  updateExercise,
  deleteExercise,
} from "@/db/exercises";
import { getSetsByExerciseId } from "@/db/sets";
import { getUser } from "@/db/user";
import type { Exercise } from "@/db/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Edit, ChevronLeft, Plus } from "lucide-react";
import {
  ExerciseForm,
  type WeightUnit,
} from "@/components/exercises/ExerciseForm";

export function ExercisesPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBodyPart, setEditBodyPart] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWeightUnit, setEditWeightUnit] = useState<WeightUnit>("kg");
  const [editSteps, setEditSteps] = useState("1");
  const [editDefaultWeight, setEditDefaultWeight] = useState("0");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    loadExercises();
    loadUserName();
  }, []);

  const loadUserName = async () => {
    const user = await getUser();
    if (user) {
      setUserName(user.name);
    }
  };

  const loadExercises = async () => {
    try {
      setLoading(true);
      const allExercises = await getAllExercises();
      const sortedExercises = allExercises.sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      setExercises(sortedExercises);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditName("");
    setEditBodyPart("");
    setEditDescription("");
    setEditWeightUnit("kg");
    setEditSteps("1");
    setEditDefaultWeight("0");
    setShowCreateDialog(true);
  };

  const handleEditClick = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setEditName(exercise.name);
    setEditBodyPart(exercise.bodyPart || "");
    setEditDescription(exercise.description || "");
    setEditWeightUnit(exercise.weightUnit || "kg");
    setEditSteps(exercise.steps?.toString() || "1");
    setEditDefaultWeight(exercise.defaultWeight?.toString() || "0");
  };

  const handleCreateSave = async () => {
    if (!editName.trim()) return;

    const steps = parseFloat(editSteps);
    if (isNaN(steps) || steps <= 0) {
      alert("Steps must be a positive number");
      return;
    }

    const defaultWeight = parseFloat(editDefaultWeight);
    if (isNaN(defaultWeight) || defaultWeight < 0) {
      alert("Default weight must be a non-negative number");
      return;
    }

    try {
      await createExercise({
        name: editName.trim(),
        bodyPart: editBodyPart.trim() || undefined,
        description: editDescription.trim() || undefined,
        weightUnit: editWeightUnit,
        steps: steps,
        defaultWeight: defaultWeight,
      });
      setShowCreateDialog(false);
      await loadExercises();
    } catch (error) {
      console.error("Error creating exercise:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingExercise || !editName.trim()) return;

    const steps = parseFloat(editSteps);
    if (isNaN(steps) || steps <= 0) {
      alert("Steps must be a positive number");
      return;
    }

    const defaultWeight = parseFloat(editDefaultWeight);
    if (isNaN(defaultWeight) || defaultWeight < 0) {
      alert("Default weight must be a non-negative number");
      return;
    }

    try {
      await updateExercise(editingExercise.id, {
        name: editName.trim(),
        bodyPart: editBodyPart.trim() || undefined,
        description: editDescription.trim() || undefined,
        weightUnit: editWeightUnit,
        steps: steps,
        defaultWeight: defaultWeight,
      });
      setEditingExercise(null);
      await loadExercises();
    } catch (error) {
      console.error("Error updating exercise:", error);
    }
  };

  const handleDeleteClick = async (exerciseId: string) => {
    // Check if exercise is used in any sets
    const sets = await getSetsByExerciseId(exerciseId);
    if (sets.length > 0) {
      setDeleteError(
        `Cannot delete this exercise. It is used in ${sets.length} set(s).`,
      );
      setDeleteConfirmId(exerciseId);
      return;
    }

    setDeleteError(null);
    setDeleteConfirmId(exerciseId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId || deleteError) return;

    try {
      await deleteExercise(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadExercises();
    } catch (error) {
      console.error("Error deleting exercise:", error);
    }
  };

  // Group exercises by body part
  const groupedExercises = exercises.reduce(
    (acc, exercise) => {
      const bodyPart = exercise.bodyPart || "Uncategorized";
      if (!acc[bodyPart]) {
        acc[bodyPart] = [];
      }
      acc[bodyPart].push(exercise);
      return acc;
    },
    {} as Record<string, Exercise[]>,
  );

  // Sort body part groups
  const sortedBodyParts = Object.keys(groupedExercises).sort((a, b) => {
    // Put "Uncategorized" at the end
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

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
          onClick={() => navigate("/")}
          className="shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Exercises</h1>
      </div>
      <p className="text-muted-foreground mb-6 ml-12">
        {userName}'s exercise library
      </p>

      <Button onClick={handleCreateClick} size="lg" className="w-full mb-6">
        <Plus className="h-5 w-5 mr-2" />
        Create New Exercise
      </Button>

      {exercises.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No exercises yet. Click the button above to create your first one!
        </p>
      ) : (
        <div className="space-y-6">
          {sortedBodyParts.map((bodyPart) => (
            <div key={bodyPart}>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                {bodyPart}
              </h2>
              <div className="space-y-3">
                {groupedExercises[bodyPart].map((exercise) => (
                  <Card key={exercise.id} size="sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex flex-col items-start gap-0.5">
                          <span>{exercise.name}</span>
                          <div className="flex gap-2 text-xs text-muted-foreground font-normal">
                            <span>
                              {exercise.weightUnit} / {exercise.steps} step
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => handleEditClick(exercise)}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="destructive"
                            onClick={() => handleDeleteClick(exercise.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    {exercise.description && (
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          {exercise.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Exercise</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="mt-2">
            <ExerciseForm
              name={editName}
              bodyPart={editBodyPart}
              weightUnit={editWeightUnit}
              steps={editSteps}
              defaultWeight={editDefaultWeight}
              description={editDescription}
              onNameChange={setEditName}
              onBodyPartChange={setEditBodyPart}
              onWeightUnitChange={setEditWeightUnit}
              onStepsChange={setEditSteps}
              onDefaultWeightChange={setEditDefaultWeight}
              onDescriptionChange={setEditDescription}
              autoFocusName={true}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateSave}>
              Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <AlertDialog
        open={!!editingExercise}
        onOpenChange={() => setEditingExercise(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Exercise</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="mt-2">
            <ExerciseForm
              name={editName}
              bodyPart={editBodyPart}
              weightUnit={editWeightUnit}
              steps={editSteps}
              defaultWeight={editDefaultWeight}
              description={editDescription}
              onNameChange={setEditName}
              onBodyPartChange={setEditBodyPart}
              onWeightUnitChange={setEditWeightUnit}
              onStepsChange={setEditSteps}
              onDefaultWeightChange={setEditDefaultWeight}
              onDescriptionChange={setEditDescription}
              autoFocusName={true}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteError ? "Cannot Delete Exercise" : "Delete Exercise"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ||
                "Are you sure you want to delete this exercise? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {deleteError ? (
              <AlertDialogAction onClick={() => setDeleteConfirmId(null)}>
                OK
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  variant="destructive"
                >
                  Delete
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
