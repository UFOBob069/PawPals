'use client';

import { useState } from 'react';
import { BREED_CATEGORIES } from '@/lib/breedCategories';

interface BreedFilterProps {
  selectedBreeds: string[];
  onChange: (breeds: string[]) => void;
}

export default function BreedFilter({ selectedBreeds, onChange }: BreedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleBreedSelect = (breed: string) => {
    if (selectedBreeds.includes(breed)) {
      onChange(selectedBreeds.filter(b => b !== breed));
    } else {
      onChange([...selectedBreeds, breed]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg"
      >
        <span className="text-gray-700">
          {selectedBreeds.length > 0 
            ? `${selectedBreeds.length} breed${selectedBreeds.length > 1 ? 's' : ''} selected`
            : 'Select breeds'}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto z-10">
          <div className="p-2">
            {/* Size Categories */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Size Categories</h3>
              <div className="space-y-1">
                {BREED_CATEGORIES.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleBreedSelect(size)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      selectedBreeds.includes(size)
                        ? 'bg-primary-coral text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Small Breeds */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Small Breeds</h3>
              <div className="space-y-1">
                {BREED_CATEGORIES.smallBreeds.map((breed) => (
                  <button
                    key={breed}
                    onClick={() => handleBreedSelect(breed)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      selectedBreeds.includes(breed)
                        ? 'bg-primary-coral text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {breed}
                  </button>
                ))}
              </div>
            </div>

            {/* Medium Breeds */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Medium Breeds</h3>
              <div className="space-y-1">
                {BREED_CATEGORIES.mediumBreeds.map((breed) => (
                  <button
                    key={breed}
                    onClick={() => handleBreedSelect(breed)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      selectedBreeds.includes(breed)
                        ? 'bg-primary-coral text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {breed}
                  </button>
                ))}
              </div>
            </div>

            {/* Large Breeds */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Large Breeds</h3>
              <div className="space-y-1">
                {BREED_CATEGORIES.largeBreeds.map((breed) => (
                  <button
                    key={breed}
                    onClick={() => handleBreedSelect(breed)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      selectedBreeds.includes(breed)
                        ? 'bg-primary-coral text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {breed}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 