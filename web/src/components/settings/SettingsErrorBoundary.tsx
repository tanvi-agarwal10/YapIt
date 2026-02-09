import React from 'react';

type State = { hasError: boolean };

export class SettingsErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          Settings failed to render. Please refresh the page.
        </div>
      );
    }

    return this.props.children;
  }
}
