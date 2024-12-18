import React from "react";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Hydration error:", error, errorInfo);
  }
  render() {
    if ((this.state as { hasError: boolean }).hasError) {
      return <h1>Something went wrong during hydration.</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
