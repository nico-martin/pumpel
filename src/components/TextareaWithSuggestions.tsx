import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface TextareaWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function TextareaWithSuggestions({
  value,
  onChange,
  suggestions,
  placeholder,
  rows = 3,
  className,
}: TextareaWithSuggestionsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim()) {
      const filtered = suggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSuggestions(suggestions);
      setShowSuggestions(false);
    }
  }, [value, suggestions]);

  useEffect(() => {
    if (showSuggestions && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showSuggestions]);

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setFilteredSuggestions(suggestions);
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const suggestionDropdown = showSuggestions && filteredSuggestions.length > 0 && (
    <div 
      className="fixed z-50 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
      }}
    >
      <div className="p-1">
        {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full justify-start text-left h-auto py-2 px-2 whitespace-pre-wrap"
            onClick={() => handleSelectSuggestion(suggestion)}
          >
            <span className="text-xs line-clamp-2">{suggestion}</span>
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      <Textarea
        ref={textareaRef}
        placeholder={placeholder}
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        rows={rows}
      />
      {createPortal(suggestionDropdown, document.body)}
    </div>
  );
}
