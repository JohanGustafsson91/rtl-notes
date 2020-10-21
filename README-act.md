# Demo av tester

1. Visa ett exempel där act används
2. Visa upp en sökapplikation som kommer vara grund för testerna.
3. Köra samma test på olika sätt och förklara hur vi kan göra de bättre.

#1. Act

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

Händelser så som rendering, användarenhändelser eller hämtning av data kan ses som en enhet av interaktion i gränssnittet. `Act` säkerställer att alla uppdateringar relaterade till en händelse blir färdiga och finns i DOMen innan vi testar koden (dvs det som händer i webbläsaren). På det sättet så skriver vi tester som körs mer likt det som våra användare kommer uppleva när de användaren applikationen.

Men vi använder React Testing Library som rekommenderat av React. När vi behöver vänta på att element ska dyka upp eller försvinna i DOMen, asynkron kod köras klart eller något annat som inte är tillgängligt direkt så har React Testing Library asynkrona hjälpfunktioner för det.

De funktionerna använder i sig `act` så det är ingenting som vi manuellt ska behöva använda i våra tester. Förutom vid några speciella tillfällen. Jag kommer visa ett sådant exempel när jag visar sökapplikationen.
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

  await waitFor(() => expect(label).toHaveTextContent("You clicked 1 times"));
  expect(document.title).toBe("You clicked 1 times");
});
```
