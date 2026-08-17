import { afterEach, describe, expect, it } from "vitest"
import {
  StorageError,
  storageErrorMessage,
  storageGet,
  storageRemove,
  storageSet,
} from "./storage"

const memory = new Map<string, string>()
let failNext: "quota" | "unavailable" | null = null

const storage = {
  getItem: (key: string) => {
    if (failNext === "unavailable") {
      failNext = null
      throw new Error("blocked")
    }

    return memory.get(key) ?? null
  },
  setItem: (key: string, value: string) => {
    if (failNext === "quota") {
      failNext = null
      const error = new Error("full")
      error.name = "QuotaExceededError"
      throw error
    }

    if (failNext === "unavailable") {
      failNext = null
      throw new Error("blocked")
    }

    memory.set(key, value)
  },
  removeItem: (key: string) => {
    memory.delete(key)
  },
}

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: storage,
})

afterEach(() => {
  memory.clear()
  failNext = null
})

describe("storage wrapper", () => {
  it("lê, grava e remove", () => {
    storageSet("k", "v")
    expect(storageGet("k")).toBe("v")
    storageRemove("k")
    expect(storageGet("k")).toBeNull()
  })

  it("distingue quota de indisponibilidade", () => {
    failNext = "quota"
    expect(() => storageSet("k", "v")).toThrowError(StorageError)

    try {
      failNext = "quota"
      storageSet("k", "v")
    } catch (error) {
      expect(error).toBeInstanceOf(StorageError)
      expect((error as StorageError).reason).toBe("quota")
      expect(storageErrorMessage(error, "x")).toContain("cheio")
    }

    failNext = "unavailable"
    try {
      storageGet("k")
    } catch (error) {
      expect((error as StorageError).reason).toBe("unavailable")
    }
  })
})
