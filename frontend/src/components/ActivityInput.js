import React, { useState, useEffect } from "react";
import axios from "axios";

function ActivityInput({ index, value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.trim() === "") return setSuggestions([]);
      try {
        const res = await axios.get(
          `http://localhost:8080/Itinerary/autocomplete?input=${query}`
        );
        setSuggestions(res.data);
        console.log(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(index, e.target.value); // update parent state
        }}
        placeholder={`Activity ${index + 1}`}
      />
      {suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            background: "white",
            border: "1px solid #ccc",
            width: "100%",
            listStyle: "none",
            padding: 0,
            margin: 0,
            zIndex: 10,
          }}
        >
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              style={{ padding: "5px", cursor: "pointer" }}
              onClick={() => {
                setQuery(s.description);
                onChange(index, s.description);
                setSuggestions([]);
              }}
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ActivityInput;
