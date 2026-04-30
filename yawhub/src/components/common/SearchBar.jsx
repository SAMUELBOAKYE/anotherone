// src/components/common/SearchBar.jsx
import React, { useState, useEffect, useRef } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import "../../styles/components/SearchBar.css";

const SearchBar = ({
  onSearch,
  placeholder = "Search...",
  initialValue = "",
  onFocus,
  onBlur,
  onClear,
  disabled = false,
  size = "medium",
  variant = "default",
  autoFocus = false,
  showClearButton = true,
  showSearchIcon = true,
  loading = false,
  suggestions = [],
  onSuggestionClick,
  maxSuggestions = 5,
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm !== initialValue) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch, initialValue]);

  useEffect(() => {
    if (suggestions.length > 0 && searchTerm && isFocused) {
      const filtered = suggestions
        .filter((suggestion) =>
          suggestion.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .slice(0, maxSuggestions);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm, suggestions, isFocused, maxSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    if (onSuggestionClick) onSuggestionClick(suggestion);
  };

  const getSizeClass = () => {
    switch (size) {
      case "small":
        return "search-bar-small";
      case "large":
        return "search-bar-large";
      default:
        return "";
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case "rounded":
        return "search-bar-rounded";
      case "outline":
        return "search-bar-outline";
      case "filled":
        return "search-bar-filled";
      default:
        return "";
    }
  };

  const renderSearchIcon = () => {
    if (loading) {
      return (
        <div className="search-loading">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 1 0 10 10" />
          </svg>
        </div>
      );
    }

    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    );
  };

  return (
    <div className={`search-bar-wrapper ${className}`}>
      <div
        className={`search-bar ${getSizeClass()} ${getVariantClass()} ${isFocused ? "focused" : ""} ${disabled ? "disabled" : ""}`}
      >
        {showSearchIcon && (
          <span className="search-icon">{renderSearchIcon()}</span>
        )}

        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label="Search"
        />

        {showClearButton && searchTerm && !disabled && (
          <button
            className="search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="search-suggestions" ref={suggestionsRef}>
          <div className="suggestions-header">
            <span className="suggestions-title">Suggestions</span>
          </div>
          <ul className="suggestions-list">
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {searchTerm && !showSuggestions && suggestions.length > 0 && (
        <div className="search-no-results">
          No results found for "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default SearchBar;
