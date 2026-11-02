import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ImportResult } from "@/services/jsonImport";
import { Check, Copy } from "lucide-react";

interface JsonImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  instructions: string;
  onImport: (json: string) => Promise<ImportResult>;
  onImported: () => void;
}

export function JsonImportDialog({
  open,
  onOpenChange,
  title,
  instructions,
  onImport,
  onImported,
}: JsonImportDialogProps) {
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(instructions);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copying instructions:", err);
      setError("Could not copy to the clipboard.");
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setJson("");
      setError(null);
    }
    onOpenChange(next);
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const { imported, skipped } = await onImport(json);
      onImported();
      handleOpenChange(false);
      alert(
        `Imported ${imported}.` +
          (skipped.length
            ? `\nSkipped ${skipped.length} that already exist: ${skipped.join(", ")}`
            : ""),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Dev mode only. Paste a JSON list. Entries whose name already exists
            are skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "Copied" : "Copy instructions"}
          </Button>
          <Textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder="Paste JSON here"
            aria-invalid={!!error}
            className="font-mono text-xs min-h-40 max-h-80 overflow-y-auto"
            spellCheck={false}
          />
          {error && <p className="text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!json.trim() || importing}>
            {importing ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
