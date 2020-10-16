import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "./apiRequest";
import App from "./App";
import { act } from "react-dom/test-utils";

jest.mock("./apiRequest");
const apiMock = api as jest.Mocked<typeof api>;

describe("App", () => {
  it.skip("should render UI", () => {
    render(<App />);
    const pageTitle = screen.getByText("Search a user");
    const inputElement = screen.getByPlaceholderText("Enter username");
    const searchButton = screen.getByText("Search");

    /**
     * NOTE:
     * toBeDefined() also works
     */
    expect(pageTitle).toBeInTheDocument();
    expect(inputElement).toBeInTheDocument();
    expect(searchButton).toBeInTheDocument();
  });

  it("should show status for is searching", async () => {
    apiMock.fetchUser.mockResolvedValueOnce([]);

    const { debug } = render(<App />);
    const inputElement = screen.getByPlaceholderText("Enter username");
    const searchButton = screen.getByText("Search");

    /**
     * Selector queryBy* queries return the first matching node for a query,
     * and return null if no elements match.
     * This is useful for asserting an element that is not present.
     */
    expect(screen.queryByText("Searching...")).not.toBeInTheDocument();

    void userEvent.type(inputElement, "username");
    void userEvent.click(searchButton);

    /**
     * This wont work. We need to wait for the element to appear
     * after a state update (see below).
     */
    // expect(loadingText).toBeInTheDocument();

    /**
     * This would work, but we get warnings in the console:
     * Warning: An update to App inside a test was not wrapped in act(...).
     *
     * This is because the test completes before the async request does.
     * We need to wrap our code in an async act:
     *
     * await act(async () => {
     *  expect(screen.queryByText("Searching...")).toBeInTheDocument();
     * });
     *
     * But we should see this warning as an error because we are using Testing Library.
     * If you use one of React Testing Library's async utilities (which wrap act)
     * to wait for the component to re-render then you'll be fine. (See below)
     */
    // expect(screen.queryByText("Searching...")).toBeInTheDocument();

    /**
     * We need to wait for the element to appear in the DOM.
     * It appears after a state update.
     *
     * We can use waitFor and it wraps act so we dont need to do that.
     */
    waitFor(() => {
      // debug();
      // console.log("waitFor callback");

      expect(screen.queryByText("Searching...")).toBeInTheDocument();

      /**
       * This will work as well.
       * waitFor is intended for things that have a non-deterministic
       * amount of time between the action you performed and the assertion passing.
       * Because of this, the callback can be called (or checked for errors)
       * a non-deterministic number of times and frequency
       * (it's called both on an interval as well as when there are DOM mutations).
       *
       * So this means that your side-effect could run multiple times!
       * First time DOM mutaion => getByText('Searching...) equals true.
       * Second time DOM mutation => getByText('No search results for username') equals true.
       */
      expect(screen.getByText("Searching...")).toBeInTheDocument();
      expect(
        screen.getByText("No search results for username")
      ).toBeInTheDocument();
    });

    /**
     * If you return a promise in the waitFor callback (either explicitly or
     * implicitly with async syntax), then the waitFor utility will not call
     * your callback again until that promise rejects. This allows you to waitFor
     * things that must be checked asynchronously.
     *
     * We wait until the callback does not throw an error. In this case, that means
     * it'll wait until the mock function has been called once.
     */
    await waitFor(() => {
      /**
       * Therefore this will fail because the state is updated
       * before the async api call is called
       */
      // expect(screen.getByText("Searching...")).toBeInTheDocument();
      expect(
        screen.getByText("No search results for username")
      ).toBeInTheDocument();
    });

    // // Or we could use a find instead of above
    // All the async utils are built on top of waitFor.
    // https://kentcdodds.com/blog/common-mistakes-with-react-testing-library#using-waitfor-to-wait-for-elements-that-can-be-queried-with-find
    // await screen.findByText("Searching...");
  });

  // it("AAA format: should show status for is searching", async () => {
  //   apiMock.fetchUser.mockResolvedValueOnce([]);
  //   render(<App />);
  //   const inputElement = screen.getByPlaceholderText("Enter username");
  //   const searchButton = screen.getByText("Search");
  //   const loadingText = screen.queryByText("Searching...");

  //   void userEvent.type(inputElement, "username");
  //   await userEvent.click(searchButton);

  //   /**
  //    * One can argue that this AAA-format sometimes makes it harder
  //    * to understand what is happening behind the scenes (state updates).
  //    * Compare to the test above .
  //    */
  //   expect(loadingText).not.toBeInTheDocument();
  //   waitFor(() => expect(loadingText).toBeInTheDocument());
  // });
});
