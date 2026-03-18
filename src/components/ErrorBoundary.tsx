import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("React error boundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center bg-bg-primary p-8">
          <div className="max-w-lg rounded border border-error/30 bg-error/5 p-6">
            <h1 className="mb-2 text-lg font-bold text-error">Something went wrong</h1>
            <p className="mb-4 text-sm text-text-secondary">
              The application encountered an unexpected error.
            </p>
            <pre className="mb-4 max-h-48 overflow-auto rounded bg-bg-secondary p-3 text-xs text-text-primary">
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded bg-accent px-4 py-1.5 text-sm text-accent-text hover:bg-accent-hover"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
