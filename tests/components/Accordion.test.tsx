import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "@/components/ui/Accordion";

const items = [
  { q: "Question 1", a: "Answer 1" },
  { q: "Question 2", a: "Answer 2" },
];

describe("Accordion", () => {
  it("renders all questions", () => {
    render(<Accordion items={items} />);
    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.getByText("Question 2")).toBeInTheDocument();
  });

  it("hides answers by default", () => {
    render(<Accordion items={items} />);
    expect(screen.queryByText("Answer 1")).not.toBeVisible();
  });

  it("reveals an answer when its question is clicked", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    await user.click(screen.getByText("Question 1"));
    expect(screen.getByText("Answer 1")).toBeVisible();
  });
});
