"use client";
import React from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  multiSelect?: boolean;
}

const Filter: React.FC<FilterProps> = ({
  title,
  options,
  selectedValues,
  onChange,
  multiSelect = true,
}) => {
  const handleOptionClick = (value: string) => {
    if (multiSelect) {
      if (selectedValues.includes(value)) {
        onChange(selectedValues.filter((val) => val !== value));
      } else {
        onChange([...selectedValues, value]);
      }
    } else {
      onChange(selectedValues.includes(value) ? [] : [value]);
    }
  };

  const handleResetClick = () => {
    onChange([]);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-700">{title}</h3>
        {selectedValues.length > 0 && (
          <button
            onClick={handleResetClick}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            リセット
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleOptionClick(option.value)}
            className={`px-3 py-1 text-sm rounded-full border ${
              selectedValues.includes(option.value)
                ? 'bg-blue-100 border-blue-300 text-blue-800'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Filter;