import { useState, useEffect } from 'react';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export function Autocomplete({ value, onChange, options, placeholder }: AutocompleteProps) {
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    onChange(inputValue);
    setFilteredOptions(options.filter(option => option.toLowerCase().includes(inputValue.toLowerCase())));
    setIsOpen(true);
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-gray-800 text-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map(option => (
            <li
              key={option}
              onClick={() => handleOptionClick(option)}
              className="p-2 hover:bg-blue-600 cursor-pointer"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
