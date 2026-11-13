import { Component, type ReactNode } from 'react'

/**
 * If WebGL is unavailable (very old devices, some locked-down browsers), the
 * letter should still open. This swaps the 3D canvas for a soft CSS glow.
 */
export class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return <div aria-hidden="true" className="canvas-fallback pointer-events-none fixed inset-0 z-0" />
    }
    return this.props.children
  }
}
