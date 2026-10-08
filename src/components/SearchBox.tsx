import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Search input with DEBOUNCE:
// we wait until the user stops typing for 300 ms before searching, so typing
// "keyboard" sends 1 request instead of 8.
// ---------------------------------------------------------------------------

export const DEBOUNCE_MS = 300;

interface Props {
  value: string; // the search text currently in the URL
  onSearch: (text: string) => void;
}

export function SearchBox({ value, onSearch }: Props) {
  const [text, setText] = useState(value); // what the user is typing right now

  // If the URL changes from outside (Back button, "Clear all"), show that text.
  useEffect(() => {
    setText(value);
  }, [value]);

  // Debounce: every keystroke restarts the timer; the search runs only after a pause.
  useEffect(() => {
    if (text === value) return; // nothing new to search
    const timer = setTimeout(() => onSearch(text), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="search">
      <label htmlFor="search" className="field-label">
        Search orders
      </label>
      <input
        id="search"
        type="search"
        value={text}
        placeholder="Order ID, customer, email or product"
        autoComplete="off"
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}
