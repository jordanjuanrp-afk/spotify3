import React, { useState, useEffect, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      event.preventDefault();
      setError(event.error || new Error(event.message));
    };
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      setError(new Error(String(event.reason)));
    };

    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", rejectionHandler);
    return () => {
      window.removeEventListener("error", handler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
  }, []);

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black text-white p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠</span>
          </div>
          <h1 className="text-xl font-bold mb-2">Algo deu errado</h1>
          <p className="text-zinc-400 text-sm mb-4">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#1db954] hover:bg-[#1ed760] text-black font-bold py-2 px-6 rounded-full text-sm transition"
          >
            Recarregar
          </button>
          <pre className="mt-4 text-xs text-zinc-600 text-left bg-zinc-900 p-3 rounded overflow-auto max-h-32">
            {error.message}
          </pre>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ErrorBoundary;
