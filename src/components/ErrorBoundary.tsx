import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Melophile component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-[100dvh] w-full bg-[#0d0e15] text-[#e3e1ec] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-16 h-16 bg-[#fde400] border-[3px] border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center mb-5 -rotate-3">
            <span className="font-display font-black text-[#201c00] text-3xl tracking-tight">M</span>
          </div>
          <h1 className="font-display text-3xl text-white uppercase tracking-wide mb-2">
            Something interrupted Melophile
          </h1>
          <p className="text-xs sm:text-sm text-[#b9cacb] max-w-sm mb-6 leading-relaxed">
            {this.state.error?.message || 'A visual render glitch occurred. Try reloading to continue listening.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] px-6 py-2.5 bg-[#00f0ff] hover:bg-[#5ef6ff] text-[#00363a] border-2 border-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-base tracking-wider uppercase cursor-pointer transition-all"
            >
              Reload Melophile
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.clear();
                } catch {}
                window.location.reload();
              }}
              className="min-h-[44px] px-5 py-2.5 bg-[#1e1f27] hover:bg-[#292931] text-[#e3e1ec] border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display text-sm tracking-wider uppercase cursor-pointer transition-all"
            >
              Reset Cache &amp; Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

