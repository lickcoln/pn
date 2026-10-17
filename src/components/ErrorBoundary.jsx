import React from 'react'

/**
 * Keeps one broken part of the page from blanking the whole site. `section` boundaries show a small
 * notice in place of the part that failed; the page-level boundary (`page`) offers a reload.
 */
export default class ErrorBoundary extends React.Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Part of the page failed to render:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children

    if (this.props.page) {
      return (
        <div role="alert" className="min-h-screen bg-black text-neutral-200 flex flex-col items-center justify-center gap-4 px-6 text-center font-sans">
          <h1 className="text-3xl font-bold tracking-wide">PARANOID NOISE</h1>
          <p className="text-neutral-400">Something went wrong while loading the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-sm"
          >
            Reload the page
          </button>
        </div>
      )
    }

    return (
      <div role="alert" className="py-10 px-4 text-center text-neutral-400 font-tech text-sm">
        This part of the page could not be displayed.{' '}
        <button onClick={() => this.setState({ failed: false })} className="text-red-400 hover:text-red-300 underline">
          Try again
        </button>
      </div>
    )
  }
}
