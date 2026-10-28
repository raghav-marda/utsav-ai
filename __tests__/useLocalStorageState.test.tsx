// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLocalStorageState } from "../lib/useLocalStorageState";

const FALLBACK: Record<string, boolean> = {};

afterEach(() => window.localStorage.clear());

describe("useLocalStorageState", () => {
  it("returns the fallback when nothing is stored", () => {
    const { result } = renderHook(() => useLocalStorageState("k1", FALLBACK));
    expect(result.current[0]).toBe(FALLBACK);
  });

  it("returns a referentially stable value once data is stored (no render loop)", () => {
    window.localStorage.setItem("k2", JSON.stringify({ a: true }));
    let renders = 0;
    const { result, rerender } = renderHook(() => {
      renders++;
      return useLocalStorageState<Record<string, boolean>>("k2", FALLBACK);
    });
    const first = result.current[0];
    rerender();
    expect(result.current[0]).toBe(first);
    expect(first).toEqual({ a: true });
    expect(renders).toBeLessThan(10);
  });

  it("persists updates and re-renders with the new value", () => {
    const { result } = renderHook(() => useLocalStorageState<Record<string, boolean>>("k3", FALLBACK));
    act(() => result.current[1]((prev) => ({ ...prev, x: true })));
    expect(result.current[0]).toEqual({ x: true });
    expect(JSON.parse(window.localStorage.getItem("k3")!)).toEqual({ x: true });
  });

  it("falls back on corrupt stored JSON", () => {
    window.localStorage.setItem("k4", "{not json");
    const { result } = renderHook(() => useLocalStorageState("k4", FALLBACK));
    expect(result.current[0]).toBe(FALLBACK);
  });
});
