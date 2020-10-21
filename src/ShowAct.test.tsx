import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

// We’ll test it using React DOM. To make sure that the behavior matches what
// happens in the browser, we’ll wrap the code rendering and updating it into
// ReactTestUtils.act() calls:

describe("Counter", () => {
  let container: null | HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container as Node);
    container = null;
  });

  it.only("can render and update a counter", () => {
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
});
