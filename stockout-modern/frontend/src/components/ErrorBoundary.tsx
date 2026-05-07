import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface State {
  hasError: boolean
  error: Error | null
}

interface Props {
  children: React.ReactNode
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[Stocky] Erreur attrapée par ErrorBoundary:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  handleHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 text-zinc-200">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Oups, quelque chose a planté</h1>
            <p className="text-sm text-zinc-400">
              On a rencontré une erreur inattendue. Recharger la page règle souvent le problème.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)' }}
            >
              <RefreshCw size={14} /> Recharger
            </button>
            <button
              onClick={this.handleHome}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-zinc-300 border border-white/10 hover:bg-white/5 transition-all"
            >
              <Home size={14} /> Accueil
            </button>
          </div>
          {this.state.error && (
            <details className="text-left bg-white/5 border border-white/10 rounded-xl p-3 text-xs">
              <summary className="cursor-pointer text-zinc-400 select-none">
                Détails techniques
              </summary>
              <pre className="mt-2 text-zinc-500 whitespace-pre-wrap break-words font-mono text-[11px]">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack?.split('\n').slice(0, 6).join('\n')}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }
}
