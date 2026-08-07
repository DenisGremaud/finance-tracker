import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "ft_theme"

interface ThemeContextValue {
  theme: Theme
  /** What is actually painted right now, once "system" is resolved. */
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function resolve(theme: Theme): "light" | "dark" {
  return theme === "system" ? (prefersDark() ? "dark" : "light") : theme
}

function apply(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark")
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system"
  )
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => resolve(theme))

  useEffect(() => {
    const next = resolve(theme)
    setResolvedTheme(next)
    apply(next)
  }, [theme])

  // Follow the OS while the user hasn't pinned a preference.
  useEffect(() => {
    if (theme !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const next = prefersDark() ? "dark" : "light"
      setResolvedTheme(next)
      apply(next)
    }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}
