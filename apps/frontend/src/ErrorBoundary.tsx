import { Component, type ErrorInfo, type ReactNode } from "react";
import "./ErrorBoundary.css";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error in app tree:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="eb-screen">
          <div className="eb-card">
            <div className="eb-title">Something broke</div>
            <p className="eb-text">
              An unexpected error crashed this page. Your work in the editor is
              saved in this browser, so reloading is safe.
            </p>
            <div className="eb-actions">
              <button className="eb-reload" onClick={() => window.location.reload()}>
                Reload page
              </button>
              <a className="eb-home" href="/">
                Back to home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
