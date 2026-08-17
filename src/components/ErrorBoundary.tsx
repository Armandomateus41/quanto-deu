import { Component, type ErrorInfo, type ReactNode } from "react"
import { btnPrimary } from "../lib/ui"

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-page px-5 text-center text-ink">
          <p className="text-[1.25rem] tracking-tight">Algo deu errado.</p>
          <p className="mt-2 max-w-sm text-[14px] text-muted">
            Recarregue a página. Seus itens salvos neste dispositivo não são
            apagados por este erro.
          </p>
          <button
            type="button"
            className={`${btnPrimary} mt-6`}
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
