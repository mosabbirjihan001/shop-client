import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-md border border-error/30 bg-base-100 p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-error">Something went wrong</h1>
            <p className="mt-2 text-base-content/70">
              The page hit an error instead of rendering. Try refreshing after the latest fix.
            </p>
            <pre className="mt-4 max-h-48 overflow-auto rounded-md bg-base-200 p-3 text-xs">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
