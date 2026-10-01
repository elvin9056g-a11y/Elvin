import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

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
    console.error('Lumora ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#0e1015] text-white select-none">
          <div className="max-w-md w-full bg-[#181a20] border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Xəta baş verdi</h2>
            <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed">
              Səhifə yüklənərkən gözlənilməz problem yarandı. Zəhmət olmasa səhifəni yeniləyərək yenidən yoxlayın.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <RefreshCw size={15} />
              Səhifəni Yenilə
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
