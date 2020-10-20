# Demo of React testing library

Det här är det vi vill testa:

- Användaren anger en söksträng
- Användaren klickar på sökknappen
- Användaren ser en text om att en sökning pågår
- Vid lyckad sökning visas sökresultaten från användaren.

---

Vi börjar med att sätta upp mockar för vårt API-request.

```typescript
jest.mock("./apiRequest");
const apiMock = api as jest.Mocked<typeof api>;

beforeEach(() => {
  apiMock.fetchUser.mockReset();

  apiMock.fetchUser.mockImplementationOnce((query) =>
    Promise.resolve([{ username: `${query} Testsson`, id: "1" }])
  );
});
```

## Första testet med act

```typescript
it("First try with act", async () => {
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

  /**
   * Det nedan fungerar, men vi får varningar i terminalen:
   * Warning: An update to App inside a test was not wrapped in act(...).
   */
  // expect(screen.getByText("Searching...")).toBeInTheDocument();

  /**
   * Vi wrappar vår kod med act, men vi får fortfarande varningen...
   */
  // act(() => {
  //   expect(screen.getByText("Searching...")).toBeInTheDocument();
  // });

  /**
   * Vi får varningen eftersom testet körs klart innan det asynkrona
   * request till backenden hinner göra det. Vi behöver wrappa vår kod
   * med async act.
   */
  await act(async () =>
    expect(screen.getByText("Searching...")).toBeInTheDocument()
  );

  /**
   * Async act tillåter oss att vänta på att promises ska resolvas
   * och statet uppdateras. Nu kan vi förvänta oss korrekt resultat!
   */
  expect(screen.getByText("Search results for Testuser")).toBeInTheDocument();
  expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
});
```

## Andra testet med waitFor

Första testet fungerar! Men vi ska se varningen om act som ett fel eftersom
vi använder React Testing Library. RTL är det testverktyg som React rekommenderar
att använda. När vi behöver vänta på att element ska dyka upp eller försvinna,
finns det synkrona hjälpfunktioner som vi kan använda.

De funktionerna använder act så det är ingenting som vi ska behöva använda.

Vi kan istället använda "waitFor" från RTL till att vänta på våra renderingar!

```typescript
it("Second try with waitFor", async () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText("Enter username");
  const searchButton = screen.getByText("Search");

  expect(screen.queryByText("Searching...")).not.toBeInTheDocument();

  void userEvent.type(inputElement, "Testuser");
  void userEvent.click(searchButton);

  expect(screen.getByText("Searching...")).toBeInTheDocument();

  /**
   * waitFor tillåter oss att vänta på att ett visst värde är tillfredsställt innan
   * vi går vidare. Funktionen väntar tills värdet har hittats eller tills att en timeout
   * (1000ms default) går ut.
   *
   * Funktionen returnerar ett promise så vi måste alltid använda await eller
   * .then(done) när vi använder funktionen.
   */
  await waitFor(() => {
    expect(screen.getByText("Search results for Testuser")).toBeInTheDocument();
    expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
    expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
  });
});
```

## Tredje testet med ett påstående/en expect i waitFor

Andra testet är en förbättring. Vi utnyttjar React Testing Libraries asynkrona
funktioner istället för att använda act till att hantera stateuppdateringar och
asynkron kod.

Men vi kan göra det ännu bättre!

Säg att att requestet till backend skulle ha skickats två gånger. Då skulle
vårt test gå sönder (vilket vi vill). Dock innebär det nu att vi behöver vänta
tills timeouten tar slut (1000ms) innan testet falerar.

Om vi istället bara gör ett påstående inuti waitFor kan vi vänta på att
gränssnittet renderas till det state som vi förväntar oss och också
falera snabbare om ett av påståendena inte blir lyckat.

```typescript
it("Third try with single assertion in waitFor", async () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText("Enter username");
  const searchButton = screen.getByText("Search");

  expect(screen.queryByText("Searching...")).not.toBeInTheDocument();

  void userEvent.type(inputElement, "Testuser");
  void userEvent.click(searchButton);

  expect(screen.getByText("Searching...")).toBeInTheDocument();

  await waitFor(() =>
    expect(screen.getByText("Search results for Testuser")).toBeInTheDocument()
  );

  expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
  expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
});
```

## Fjärde testet med findBy\*

Testet ovanför känns bra! Det finns en sak till som vi ska göra.

Selectorn find* är en kombination av waitFor och getBy*.
Den är enklare att skriva och felmeddelandet som vi får är bättre.

Vi ska alltid använda find\* när vi vill fråga efter någonting som
kanske inte är tillgängligt direkt.

```typescript
it("Fourth try with findBy", async () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText("Enter username");
  const searchButton = screen.getByText("Search");

  expect(screen.queryByText("Searching...")).not.toBeInTheDocument();

  void userEvent.type(inputElement, "Testuser");
  void userEvent.click(searchButton);

  expect(screen.getByText("Searching...")).toBeInTheDocument();
  await screen.findByText("Search results for Testuser");
  expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
  expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
});
```

### Samma test uppdelat i AAA block

Ibland tycker jag att det blir svårare att hänga med på vad som
händer med stateuppdateringar när det ligger i det här formatet.
I vissa fall tycker jag att det är enklare att läsa uppifrån och
ned i testet och då lägga expect().not.toBeInTheDocument() innan
vi gör vår sökning.

```typescript
it("AAA: Fourth try with findBy", async () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText("Enter username");
  const searchButton = screen.getByText("Search");
  const searchMessage = screen.queryByText("Searching...");

  void userEvent.type(inputElement, "Testuser");
  void userEvent.click(searchButton);

  expect(searchMessage).not.toBeInTheDocument();
  expect(screen.getByText("Searching...")).toBeInTheDocument();
  await screen.findByText("Search results for Testuser");
  expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
  expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
});
```
