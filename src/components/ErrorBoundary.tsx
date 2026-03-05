import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Ops! Algo deu errado.</h1>
          <p className="text-slate-400 max-w-md mb-8 font-medium">
            Ocorreu um erro inesperado na interface. Tente recarregar a página ou limpe o cache do navegador.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20 active:scale-95"
          >
            Recarregar Sistema
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
