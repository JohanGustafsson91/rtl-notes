import React, { useEffect, useState } from "react";
import { fetchUser } from "./apiRequest";
import "./App.css";

/**
 * This is a search example with a mocked backend.
 *
 * We will test this logic in different ways and try to
 * explain RTL selectors.
 *
 * The state below could utilize useReducer to avoid some
 * state updates, but we keep it simple now.
 */

// console.log(`App render
// [query] = ${query}
// [searchState] = ${searchState}
// [searchResult] = ${searchResult}
// `);

const App = () => {
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState>("IDLE");
  const [searchResult, setSearchResult] = useState<Array<User>>([]);

  useEffect(() => {
    if (query === "" && searchState === "FULFILLED") {
      setSearchState("IDLE");
    }
  }, [query, searchState]);

  const handleSearch = async () => {
    setSearchState("PENDING");
    setSearchResult([]);

    try {
      const users = await fetchUser(query);
      setSearchResult(users);
      setSearchState("FULFILLED");
    } catch (_) {
      setSearchState("REJECTED");
    }
  };

  return (
    <div className="App">
      <h1>Search a user</h1>
      <input
        placeholder="Enter username"
        onChange={(e) => setQuery(e.target.value)}
        value={query}
      />
      <button disabled={!query} onClick={handleSearch}>
        Search
      </button>

      {searchState === "PENDING" && <p>Searching...</p>}

      {searchState === "FULFILLED" && searchResult.length > 0 && (
        <div>
          <h3>Search results for {query}</h3>
          {searchResult.map((item) => (
            <p key={item.id}>{item.username}</p>
          ))}
        </div>
      )}

      {searchState === "FULFILLED" && searchResult.length === 0 && (
        <div>
          <h3>No search results for {query}</h3>
        </div>
      )}

      {searchState === "REJECTED" && (
        <p style={{ color: "red" }}>Something went wrong</p>
      )}
    </div>
  );
};

export default App;

type SearchState = "IDLE" | "PENDING" | "REJECTED" | "FULFILLED";

interface User {
  username: string;
  id: string;
}
