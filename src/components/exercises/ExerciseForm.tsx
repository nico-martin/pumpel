import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const BODY_PARTS = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
  'Cardio',
  'Full Body',
];

interface ExerciseFormProps {
  name: string;
  bodyPart: string;
  weightUnit: 'kg' | 'lb';
  steps: string;
  description: string;
  onNameChange: (value: string) => void;
  onBodyPartChange: (value: string) => void;
  onWeightUnitChange: (value: 'kg' | 'lb') => void;
  onStepsChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  autoFocusName?: boolean;
}

export function ExerciseForm({
  name,
  bodyPart,
  weightUnit,
  steps,
  description,
  onNameChange,
  onBodyPartChange,
  onWeightUnitChange,
  onStepsChange,
  onDescriptionChange,
  autoFocusName = false,
}: ExerciseFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-foreground block mb-1 text-left">
          Name
        </label>
        <Input
          placeholder="Exercise name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoFocus={autoFocusName}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground block mb-1 text-left">
          Body Part
        </label>
        <Select value={bodyPart} onValueChange={onBodyPartChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select body part" />
          </SelectTrigger>
          <SelectContent>
            {BODY_PARTS.map((part) => (
              <SelectItem key={part} value={part}>
                {part}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1 text-left">
            Weight Unit
          </label>
          <Select value={weightUnit} onValueChange={(value: 'kg' | 'lb') => onWeightUnitChange(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="lb">lb</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1 text-left">
            Step Size
          </label>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="1"
            value={steps}
            onChange={(e) => onStepsChange(e.target.value)}
            min="0.1"
            step="0.1"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground block mb-1 text-left">
          Description (optional)
        </label>
        <Textarea
          placeholder="Exercise instructions or notes..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
