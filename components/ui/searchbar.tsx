import { Input } from "./input";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

function SearchBar({
  placeholder = "Search...",
  onSearch,
  className,
}: SearchBarProps) {
  return (
    <Input
      placeholder={placeholder}
      className={className}
      onChange={(e) => onSearch && onSearch(e.target.value)}
    />
  );
}

export default SearchBar;
