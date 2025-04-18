'use client';

import { useState, useRef, useEffect } from 'react';
import { MdPets } from 'react-icons/md';
import { IoMdArrowDropdown } from 'react-icons/io';

interface BreedFilterProps {
  selectedBreeds: string[];
  onBreedsChange: (breeds: string[]) => void;
}

export default function BreedFilter({ selectedBreeds, onBreedsChange }: BreedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if dropdown would go off screen
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const dropdownHeight = 400; // max height of dropdown
      const viewportHeight = window.innerHeight;
      
      if (rect.bottom + dropdownHeight > viewportHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [isOpen]);

  const toggleBreed = (breed: string) => {
    if (selectedBreeds.includes(breed)) {
      onBreedsChange(selectedBreeds.filter(b => b !== breed));
    } else {
      onBreedsChange([...selectedBreeds, breed]);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border border-neutral-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-coral text-sm bg-white min-w-[120px]"
      >
        <MdPets className="text-neutral-dark" />
        <span className="text-neutral-dark">
          {selectedBreeds.length ? `${selectedBreeds.length} breeds` : 'Dog Breeds'}
        </span>
        <IoMdArrowDropdown className={`text-neutral-dark transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className={`absolute ${
            dropdownPosition === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'
          } right-0 w-[300px] bg-white border border-neutral-light rounded-lg shadow-lg z-50`}
        >
          <div className="p-4 max-h-[400px] overflow-y-auto">
            {/* Size Categories */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-sm text-neutral-darker">SIZE CATEGORIES</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Tiny (under 5 lbs)',
                  'Small (5-20 lbs)',
                  'Medium (21-50 lbs)',
                  'Large (51-90 lbs)',
                  'Extra Large (90+ lbs)'
                ].map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleBreed(size)}
                    className={`text-left px-2 py-1 rounded text-sm ${
                      selectedBreeds.includes(size)
                        ? 'bg-primary-coral text-white'
                        : 'hover:bg-neutral-lightest'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Small Breeds */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-sm text-neutral-darker">POPULAR SMALL BREEDS</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Dachshund',
                  'French Bulldog',
                  'Pug',
                  'Yorkshire Terrier',
                  'Chihuahua',
                  'Shih Tzu'
                ].map((breed) => (
                  <button
                    key={breed}
                    onClick={() => toggleBreed(breed)}
                    className={`text-left px-2 py-1 rounded text-sm ${
                      selectedBreeds.includes(breed)
                        ? 'bg-primary-coral text-white'
                        : 'hover:bg-neutral-lightest'
                    }`}
                  >
                    {breed}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Medium Breeds */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-sm text-neutral-darker">POPULAR MEDIUM BREEDS</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Border Collie',
                  'Bulldog',
                  'Beagle',
                  'Cocker Spaniel',
                  'Australian Shepherd',
                  'Corgi'
                ].map((breed) => (
                  <button
                    key={breed}
                    onClick={() => toggleBreed(breed)}
                    className={`text-left px-2 py-1 rounded text-sm ${
                      selectedBreeds.includes(breed)
                        ? 'bg-primary-coral text-white'
                        : 'hover:bg-neutral-lightest'
                    }`}
                  >
                    {breed}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Large Breeds */}
            <div>
              <h3 className="font-semibold mb-2 text-sm text-neutral-darker">POPULAR LARGE BREEDS</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'German Shepherd',
                  'Golden Retriever',
                  'Labrador Retriever',
                  'Husky',
                  'Doberman',
                  'Rottweiler'
                ].map((breed) => (
                  <button
                    key={breed}
                    onClick={() => toggleBreed(breed)}
                    className={`text-left px-2 py-1 rounded text-sm ${
                      selectedBreeds.includes(breed)
                        ? 'bg-primary-coral text-white'
                        : 'hover:bg-neutral-lightest'
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