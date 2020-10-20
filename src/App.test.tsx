import React from "react";
import { findByText, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "./apiRequest";
import App from "./App";
import { act } from "react-dom/test-utils";

jest.mock("./apiRequest");
const apiMock = api as jest.Mocked<typeof api>;

describe("App", () => {
  /**
   * This is what we want to test:
   * - User enters a search query
   * - User clicks on search button
   * - User sees a loading text when searching
   * - API is called for users
   * - User sees the search result with users
   */

  describe("Should show fetched users from search", () => {
    beforeEach(() => {
      apiMock.fetchUser.mockReset();
      apiMock.fetchUser.mockImplementationOnce((query) =>
        Promise.resolve([{ username: `${query} Testsson`, id: "1" }])
      );
    });

    it("First try with act", async () => {
      render(<App />);
      const inputElement = screen.getByPlaceholderText("Enter username");
      const searchButton = screen.getByText("Search");

      /**
       * Selector queryBy* returns the first matching node for a query
       * and null if no elements match. This is useful for asserting an
       * element that is not present.
       */
      expect(screen.queryByText("Searching...")).not.toBeInTheDocument();

      void userEvent.type(inputElement, "Testuser");
      void userEvent.click(searchButton);

      /**
       * This works, but we get warnings in the console:
       * Warning: An update to App inside a test was not wrapped in act(...).
       */
      // expect(screen.getByText("Searching...")).toBeInTheDocument();

      /**
       * We wrap our code with act, but we still get the warning
       */
      // act(() => {
      //   expect(screen.getByText("Searching...")).toBeInTheDocument();
      // });

      /**
       * This is because the test completes before the async request to
       * our backend does. We need to wrap our code in an async act.
       */
      await act(async () =>
        expect(screen.getByText("Searching...")).toBeInTheDocument()
      );

      /**
       * The act warning from React is there to tell us that something
       * happened to our component when we weren't expecting anything to happen.
       * So you're supposed to wrap every interaction you make with your
       * component in act to let React know that we expect our component
       * to perform some updates and when you don't do that and there are updates,
       * React will warn us that unexpected updates happened.
       * This helps us avoid bugs like the one described above.
       *
       * The async act allows us to wait on promises to resolve and state
       * updates to complete. We can now expect the result.
       */
      expect(
        screen.getByText("Search results for Testuser")
      ).toBeInTheDocument();
      expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
    });

    /**
     * The test above works. But we should treat this act warning as an
     * error. The reason for that is because we use the (recommended by React)
     * Testing Library in our unit tests. The async utilities in React Testing Library
     * wraps act, meaning there is no need to use act in our tests.
     *
     * https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning
     *
     * Use one of React Testing Library's async utilities to wait for the component
     * to re-render then you'll be fine.
     *
     * Lets try the same test with the async util "waitFor" instead!
     */

    it("Second try with waitFor", async () => {
      render(<App />);
      const inputElement = screen.getByPlaceholderText("Enter username");
      const searchButton = screen.getByText("Search");

      expect(screen.queryByText("Searching...")).not.toBeInTheDocument();

      void userEvent.type(inputElement, "Testuser");
      void userEvent.click(searchButton);

      expect(screen.getByText("Searching...")).toBeInTheDocument();

      /**
       * If you need to wait for an element to appear, the async wait utilities allow
       * you to wait for an assertion to be satisfied before proceeding.
       * The wait utilities retry until the query passes or times out (1000ms). The async
       * methods return a Promise, so you must always use await or .then(done) when calling them.
       *
       * We wait until the callback does not throw an error. In this case, that means
       * it'll wait until the mock function has been called once.
       */
      await waitFor(() => {
        expect(
          screen.getByText("Search results for Testuser")
        ).toBeInTheDocument();
        expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
        expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
      });
    });

    /**
     * The above test is an improvement. We utilize the React Testing Libraries
     * async utilities instead of using act to handle state updates and async code.
     *
     * But we can do better!
     *
     * Let's say the fetchMock.fetchUser was called twice and the test fails.
     * Then we'll have to wait for the waitFor timeout (default is 1000ms) before
     * we see that test failure. By putting a single assertion in there, we can
     * both wait for the UI to settle to the state we want to assert on,
     * and also fail faster if one of the assertions do end up failing.
     */
    it("Third try with single assertion in waitFor", async () => {
      render(<App />);
      const inputElement = screen.getByPlaceholderText("Enter username");
      const searchButton = screen.getByText("Search");

      expect(screen.queryByText("Searching...")).not.toBeInTheDocument();

      void userEvent.type(inputElement, "Testuser");
      void userEvent.click(searchButton);

      expect(screen.getByText("Searching...")).toBeInTheDocument();

      await waitFor(() =>
        expect(
          screen.getByText("Search results for Testuser")
        ).toBeInTheDocument()
      );

      expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
      expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
    });

    /**
     * This feels good. But we can utilize React Testing Library more
     * and do even better!
     *
     * The selector find* uses waitFor under the hood (combination of getBy* and waitFor),
     * is simpler and the error message you get will be better. Use find* any time you want to
     * query for something that may not be available right away.
     */

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

    it("AAA: Fourth try with findBy", async () => {
      render(<App />);
      const inputElement = screen.getByPlaceholderText("Enter username");
      const searchButton = screen.getByText("Search");
      const searchMessage = screen.queryByText("Searching...");

      void userEvent.type(inputElement, "Testuser");
      void userEvent.click(searchButton);

      /**
       * One can argue that this AAA-format sometimes makes it harder
       * to understand what is happening behind the scenes (state updates).
       * We need to select searchMessage in the Arrange and then Assert
       * on it after the Act block.
       */
      expect(searchMessage).not.toBeInTheDocument();
      expect(screen.getByText("Searching...")).toBeInTheDocument();
      await screen.findByText("Search results for Testuser");
      expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
      expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
    });
  });
});
