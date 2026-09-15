import { Component } from 'react';
import type { ReactNode } from 'react';

// Keep the directory available if the optional scene bundle cannot load.
export default class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch() { this.props.onError(); }

  render() { return this.state.failed ? null : this.props.children; }
}
