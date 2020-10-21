# Demo av tester

1. Visa ett exempel där act används utan och med React Testing Library
2. Visa upp en sökapplikation som kommer vara grund för testerna vi går igenom.
3. Köra samma test på olika sätt och förklara hur vi kan göra de bättre. Jag kommer ta med olika selectorer och förklara när de är bra att använda.

# 1. Vad gör Act?

Vi har en komponent:

```typescript
const Counter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `You clicked ${count} times`;
  });

  return (
    <div>
      <label>You clicked {count} times</label>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
};
```

Det som händer i Reacts lifecycle är följande:

1. Appen renderas
2. useEffect körs

Om användaren trycker på knappen så:

3. setState körs och appen renderas
4. useEffect körs.

Vi skriver ett test mha ReactDOM:

```typescript
let container: null | HTMLDivElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container as Node);
  container = null;
});

it("can render and update a counter", () => {
  // Test first render and effect
  act(() => {
    ReactDOM.render(<Counter />, container);
  });
  const button = container!.querySelector("button");
  const label = container!.querySelector("label");

  expect(label!.textContent).toBe("You clicked 0 times");
  expect(document.title).toBe("You clicked 0 times");

  // Test second render and effect
  act(() => {
    button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(label!.textContent).toBe("You clicked 1 times");
  expect(document.title).toBe("You clicked 1 times");
});
```

Utan `act` så skulle testet ovan falera:

- `document.title` skulle vara tom sträng efter första render eftersom `useEffect` inte har körts efter första renderingen.
- `document.title` skulle vara "You clicked 0 times" efter första klicket på knappen.

Händelser så som rendering, användarenhändelser eller hämtning av data kan ses som en enhet av interaktion i gränssnittet. I exemplet ovan är ett exempel på en sådan enhet:

1. Användaren trycker på knappen
2. Räknaren uppdateras med ett via `useState`
3. Appen renderas
4. React kör vår sidoeffekt `useEffect` efter att DOMen har uppdaterats.

`Act` säkerställer att alla uppdateringar relaterade till en händelse blir färdiga och finns i DOMen innan vi testar koden (dvs det som händer i webbläsaren). På det sättet skriver vi tester som körs mer likt det som våra användare kommer uppleva när de användaren applikationen.

Men vi använder React Testing Library som rekommenderas av React att använda. När vi behöver vänta på att element ska dyka upp eller försvinna i DOMen, asynkron kod köras klart eller något annat som inte är tillgängligt direkt så har React Testing Library asynkrona hjälpfunktioner för det.

De funktionerna använder i sig `act` så det är ingenting som vi manuellt ska behöva använda i våra tester. Förutom vid några speciella tillfällen. Jag kommer visa ett sådant exempel när jag visar sökapplikationen. Det finns att läsa om alla tillfällen för den intresserade:
https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning#other-use-cases-for-manually-calling-act.

Vi skriver om testet ovan med React Testing Library. Vi använder hjälpfunktionen waitFor\* .

waitFor tillåter oss att vänta på att ett visst värde är tillfredsställt innan vi går vidare. Funktionen väntar tills värdet har "hittats" eller tills en timeout (1000ms default) går ut.

Funktionen returnerar ett promise så vi måste alltid använda await eller .then(done) när vi använder funktionen.

```typescript
it("can render and update a counter", async () => {
  render(<Counter />);
  const button = screen.getByText("Click me");
  const label = screen.getByText("You clicked 0 times");

  expect(label).toBeInTheDocument();
  expect(document.title).toBe("You clicked 0 times");

  void userEvent.click(button);

  await waitFor(() => expect(document.title).toBe("You clicked 1 times"));
  expect(label).toHaveTextContent("You clicked 1 times");
});
```

#

# 2. Sökapplikation

Vi har en söksida där vi kan söka efter användare. Vi har ett mockat API och söker vi på:

- Error => får vi ett fel kastat
- Unknown => får vi ett tomtsökresultat
- Allt annat => får vi sökresultat

Appen kan förbättras med exempelvis useReducer för att få ner antalet uppdateringar/renderingar av statet osv, men vi kör KISS!

```typescript
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
```

#

Det här är det vi vill testa:

- Användaren anger en söksträng
- Användaren klickar på sökknappen
- Användaren ser en text om att en sökning pågår
- Vid lyckad sökning visas sökresultaten från användaren.

#

Vi börjar med att sätta upp mockar för vårt API-request.

```typescript
jest.mock("./apiRequest");
const apiMock = api as jest.Mocked<typeof api>;

beforeEach(() => {
  apiMock.fetchUser
    .mockReset()
    .mockImplementationOnce((query) =>
      Promise.resolve([{ username: `${query} Testsson`, id: "1" }])
    );
});
```

Vi skriver ett test:

```typescript
it("should call API", () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText("Enter username");
  const searchButton = screen.getByText("Search");

  /**
   * Selectorn queryBy* returnerar det första matchande elementet
   * eller null om inget element hittades. Det är användbart när
   * vi vill testa att ett element inte finns i DOMen
   */
  expect(screen.queryByText("Searching...")).not.toBeInTheDocument();

  void userEvent.type(inputElement, "Testuser");
  void userEvent.click(searchButton);

  expect(screen.getByText("Searching...")).toBeInTheDocument();
  expect(apiMock.fetchUser).toHaveBeenCalledWith("Testuser");
});
```

Det här testet fungerar, men vi får varningar:

> Warning: An update to App inside a test was not wrapped in act(...).

Vad beror det här på nu då? Vi kör ju RTL....

Act varningen är inlagd av React till oss för att berätta att någonting hände i vår komponent som vi inte hade förväntat oss skulle hända. Exempel på det är asynkron kod som körs som ett resultat från ett promise eller en timeout. Vi får varningen eftersom testet körs klart innan det asynkrona request till backenden hinner göra det. React varnar oss om att det inte är säkert att interaktionen med komponenten testades korrekt (oväntad uppdatering).

Vi tänker att det vi behöver göra är att vänta på att vårat promise har resolvats. Vi vet att vi inte ska behöva köra `act` från testet ovan, men vi upptäcker att det finns en asynkron act som vi kan använda.

Den tillåter oss att vänta på att promises ska resolvas och statet uppdateras.

Vi slänger in den nedan, varningarna försvinner och allt är frid och fröj. Eller?

Hade vi nu råkat ta bort vår "setSearchState" uppdatering när vi får svar från backend så hade testet fortfarande gått igenom.

```typescript
it("should call API", async () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText("Enter username");
  const searchButton = screen.getByText("Search");

  void userEvent.type(inputElement, "Testuser");
  void userEvent.click(searchButton);

  expect(screen.getByText("Searching...")).toBeInTheDocument();

  await act(async () => {
    expect(apiMock.fetchUser).toHaveBeenCalledWith("Testuser");
  });
});
```

För att göra testet bättre och mer robust bör vi förvänta oss att texten när sökanropet laddar ska ha försvunnit efter att svar från backend har kommit.

React testing library har som sagt asynkrona hjälpfunktioner. En av de är waitFor\* som vi gått igenom ovan så vi använder den:

```typescript
it("should call API", async () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText("Enter username");
  const searchButton = screen.getByText("Search");

  void userEvent.type(inputElement, "Testuser");
  void userEvent.click(searchButton);

  expect(screen.getByText("Searching...")).toBeInTheDocument();
  expect(apiMock.fetchUser).toHaveBeenCalledWith("Testuser");
  await waitForElementToBeRemoved(() => screen.getByText("Searching..."));
});
```

Varningarna om `act` är borta och de hjälpte oss faktiskt till att hitta en eventuell bugg genom att skriva ett bättre test.

När vi stöter på en sån varning är det nästan alltid någon kod som inte körts klart i vår komponent och som vi inte har förväntat något resultat på. React är schyssta och varnar oss om de oväntade förändringarna så att vi kan skriva bättre test!

Vi fortsätter att testa av vår sökapplikation:

```typescript
it("should call API and show search result", async () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText("Enter username");
  const searchButton = screen.getByText("Search");

  void userEvent.type(inputElement, "Testuser");
  void userEvent.click(searchButton);

  await waitFor(() => {
    expect(screen.getByText("Search results for Testuser")).toBeInTheDocument();
    expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
    expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
  });
});
```

### Ett påstående/en expect i waitFor

Vi utnyttjar React Testing Libraries asynkrona funktioner till att hantera stateuppdateringar och asynkron kod istället för att använda act.

Men vi kan göra det ännu bättre!

Säg att att requestet till backend skulle ha skickats två gånger. Då skulle vårt test gå sönder (vilket vi vill). Dock innebär det nu att vi behöver vänta tills timeouten tar slut (1000ms) innan testet falerar.

Om vi istället bara gör ett påstående inuti waitFor kan vi vänta på att gränssnittet renderas till det state som vi förväntar oss och också falera snabbare om ett av påståendena inte blir lyckat.

```typescript
it("should call API and show search result", async () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText("Enter username");
  const searchButton = screen.getByText("Search");

  void userEvent.type(inputElement, "Testuser");
  void userEvent.click(searchButton);

  await waitFor(() =>
    expect(screen.getByText("Search results for Testuser")).toBeInTheDocument()
  );

  expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
  expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
});
```

### Använd findBy\*

Testet ovanför känns bra! Det finns en sak till som vi ska göra.

Selectorn find* är en kombination av waitFor och getBy*. Den är enklare att skriva och vi bör alltid använda find\* när vi vill fråga efter någonting som kanske inte är tillgängligt direkt.

```typescript
it("should call API and show search result", async () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText("Enter username");
  const searchButton = screen.getByText("Search");

  void userEvent.type(inputElement, "Testuser");
  void userEvent.click(searchButton);

  await screen.findByText("Search results for Testuser");
  expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
  expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
});
```
