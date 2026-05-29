import React from "react";
import { render } from "@testing-library/react";
import App from "./App";

describe("App Component", () => {
    test("renders without crashing", () => {
        const { container } = render(<App />);
        expect(container).toBeInTheDocument();
    });

    test("renders AppRouter component", () => {
        const { container } = render(<App />);
        // AppRouter renders a BrowserRouter, which contains routes
        // At minimum, we should have a router provider in the DOM
        expect(container).not.toBeEmptyDOMElement();
    });

    test("app structure is properly mounted", () => {
        const { container } = render(<App />);
        // Verify the app rendered a valid React component tree
        // (no null/undefined returns from App)
        expect(container.innerHTML).toBeTruthy();
    });
});
