import { useState, useEffect, useRef } from 'react';
import { FaSearch } from 'react-icons/fa';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: { text: string; place_name: string; center: [number, number] }) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter address...",
  className = "",
  id,
  name,
  'aria-label': ariaLabel,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add click outside listener to close suggestions
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value.trim() || value.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=US&types=address,place,locality,neighborhood`
        );
        const data = await response.json();
        setSuggestions(data.features || []);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full pl-10 ${className}`}
          autoComplete="off"
          id={id}
          name={name}
          aria-label={ariaLabel}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={id ? `${id}-suggestions` : undefined}
          aria-autocomplete="list"
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-coral"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-neutral-light max-h-60 overflow-y-auto"
          id={id ? `${id}-suggestions` : undefined}
          role="listbox"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              className="w-full text-left px-4 py-2 hover:bg-neutral-lightest transition-colors text-sm"
              onClick={() => {
                onSelect(suggestion);
                setShowSuggestions(false);
              }}
              role="option"
              aria-selected={false}
            >
              <div className="font-medium">{suggestion.text}</div>
              <div className="text-xs text-gray-500">{suggestion.place_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 