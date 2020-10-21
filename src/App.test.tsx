import React from "react";
import { act } from "react-dom/test-utils";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as api from "./apiRequest";
import App from "./App";

jest.mock("./apiRequest");
const apiMock = api as jest.Mocked<typeof api>;

describe("App", () => {
  beforeEach(() => {
    apiMock.fetchUser
      .mockReset()
      .mockImplementationOnce((query) =>
        Promise.resolve([{ username: `${query} Testsson`, id: "1" }])
      );
  });

  it.skip("should call API", () => {
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

  it.only("should call API fix act warning", async () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText("Enter username");
    const searchButton = screen.getByText("Search");

    void userEvent.type(inputElement, "Testuser");

    act(() => {
      void userEvent.click(searchButton);
    });

    expect(screen.getByText("Searching...")).toBeInTheDocument();

    await act(async () => {
      expect(apiMock.fetchUser).toHaveBeenCalledWith("Testuser");
    });
  });

  it("should call API fix act warning", async () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText("Enter username");
    const searchButton = screen.getByText("Search");

    void userEvent.type(inputElement, "Testuser");
    void userEvent.click(searchButton);

    expect(screen.getByText("Searching...")).toBeInTheDocument();
    expect(apiMock.fetchUser).toHaveBeenCalledWith("Testuser");
    await waitForElementToBeRemoved(() => screen.getByText("Searching..."));
  });

  it("should call API and show search result", async () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText("Enter username");
    const searchButton = screen.getByText("Search");

    void userEvent.type(inputElement, "Testuser");
    void userEvent.click(searchButton);

    await waitFor(() => {
      expect(
        screen.getByText("Search results for Testuser")
      ).toBeInTheDocument();
      expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
      expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
    });
  });

  it("should call API and show search result", async () => {
    render(<App />);
    const inputElement = screen.getByPlaceholderText("Enter username");
    const searchButton = screen.getByText("Search");

    void userEvent.type(inputElement, "Testuser");
    void userEvent.click(searchButton);

    await waitFor(() =>
      expect(
        screen.getByText("Search results for Testuser")
      ).toBeInTheDocument()
    );

    expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
    expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
  });

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

  // it("AAA: Fourth try with findBy", async () => {
  //   render(<App />);
  //   const inputElement = screen.getByPlaceholderText("Enter username");
  //   const searchButton = screen.getByText("Search");
  //   const searchMessage = screen.queryByText("Searching...");

  //   void userEvent.type(inputElement, "Testuser");
  //   void userEvent.click(searchButton);

  //   /**
  //    * One can argue that this AAA-format sometimes makes it harder
  //    * to understand what is happening behind the scenes (state updates).
  //    * We need to select searchMessage in the Arrange and then Assert
  //    * on it after the Act block.
  //    */
  //   expect(searchMessage).not.toBeInTheDocument();
  //   expect(screen.getByText("Searching...")).toBeInTheDocument();
  //   await screen.findByText("Search results for Testuser");
  //   expect(screen.getByText("Testuser Testsson")).toBeInTheDocument();
  //   expect(apiMock.fetchUser).toHaveBeenCalledTimes(1);
  // });
});
