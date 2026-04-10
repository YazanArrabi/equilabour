import { useEffect, useRef, useState } from "react";
import { Input } from "./input";

interface LocationComboboxProps {
  value: string;
  onChange: (value: string) => void;
  fetchLocations: (q: string) => Promise<string[]>;
  placeholder?: string;
  className?: string;
}

export function LocationCombobox({
  value,
  onChange,
  fetchLocations,
  placeholder = "City or country",
  className,
}: LocationComboboxProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(q: string) {
    onChange(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await fetchLocations(q || "");
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 200);
  }

  function handleSelect(loc: string) {
    onChange(loc);
    setOpen(false);
    setSuggestions([]);
  }

  function handleFocus() {
    if (suggestions.length > 0) setOpen(true);
    else if (!value) {
      // Load initial suggestions on focus if empty
      fetchLocations("").then((results) => {
        setSuggestions(results);
        setOpen(results.length > 0);
      }).catch(() => {});
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <Input
        className="h-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md text-sm overflow-hidden">
          {suggestions.map((loc) => (
            <li
              key={loc}
              className="cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur before click registers
                handleSelect(loc);
              }}
            >
              {loc}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
