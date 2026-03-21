import { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold transition-all transform animate-in slide-in-from-bottom flex items-center justify-between gap-4 border ${
              toast.type === 'success' ? 'bg-card text-foreground border-green-500/30' : 'bg-destructive text-destructive-foreground border-destructive'
            }`}
          >
            <span>{toast.message}</span>
            <button 
              onClick={() => setToasts(t => t.filter(x => x.id !== toast.id))}
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
