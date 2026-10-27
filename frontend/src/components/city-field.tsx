'use client';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { City } from '@/lib/types';
import { Check, ChevronDown, MapPin, Search, X } from 'lucide-react';

export function CityField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch cities (returns all Gujarat cities with limit=100)
  const { data, isLoading } = useQuery({
    queryKey: ['cities', 'gujarat'],
    queryFn: () => api<{ cities: City[] }>('/cities'),
    staleTime: 5 * 60 * 1000,
  });

  const allCities = data?.cities ?? [];

  // Find currently selected city object based on value slug
  const selectedCity = allCities.find((city) => city.slug === value);

  // Filter cities based on search term
  const filteredCities = allCities.filter((city) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      city.name.toLowerCase().includes(term) ||
      city.slug.toLowerCase().includes(term) ||
      (term.includes('khambaliya') && city.slug.includes('khambhalia'))
    );
  });

  // Handle click outside to close dropdown and validate selection
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term so input displays the selected city name
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(city: City) {
    onChange(city.slug);
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.blur();
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(true);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredCities.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredCities.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCities[highlightedIndex]) {
        handleSelect(filteredCities[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      inputRef.current?.blur();
    }
  }

  // Display value for the input: when open and typing, show typed term; otherwise show selected city name
  const displayValue = isOpen ? searchTerm : selectedCity ? `${selectedCity.name}, Gujarat` : '';

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input container */}
      <div
        className="relative cursor-pointer"
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <MapPin className="h-4 w-4 text-blood-600" />
        </div>

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={displayValue}
          placeholder="Select Gujarat city (e.g. Bhavnagar, Ahmedabad, Surat)"
          autoComplete="off"
          className="w-full rounded-xl border border-slate-200/90 bg-white/90 pl-10 pr-16 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blood-600 focus:bg-white focus:ring-4 focus:ring-blood-500/10 disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer"
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setHighlightedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />

        {/* Right action icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {selectedCity && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="pointer-events-none text-slate-400 pl-0.5">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blood-600' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Custom Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-card-elevated backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header pill */}
          <div className="flex items-center justify-between px-3 py-1.5 mb-1 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Gujarat Cities (50K+ Population)</span>
            <span>{filteredCities.length} available</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-xs text-slate-400 gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-blood-600" />
              Loading cities…
            </div>
          ) : filteredCities.length === 0 ? (
            <div className="py-6 px-3 text-center">
              <p className="text-xs font-bold text-slate-700">No matching Gujarat city</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Please select from the approved list of Gujarat cities with &gt;50k population.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredCities.map((city, index) => {
                const isSelected = selectedCity?.slug === city.slug;
                const isHighlighted = highlightedIndex === index;

                return (
                  <button
                    key={city.slug}
                    type="button"
                    onMouseDown={(e) => {
                      // Use onMouseDown so it fires before input blur
                      e.preventDefault();
                      handleSelect(city);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex items-center justify-between w-full rounded-xl px-3 py-2 text-left text-xs sm:text-sm transition-colors ${
                      isSelected
                        ? 'bg-blood-50 font-bold text-blood-900'
                        : isHighlighted
                        ? 'bg-slate-100 font-medium text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isSelected ? 'text-blood-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{city.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Gujarat
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-blood-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
