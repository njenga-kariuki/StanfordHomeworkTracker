import { useEffect, useState } from "react";

export type ToastState = {
  visible: boolean;
  message: string;
  type: 'info' | 'success' | 'error';
};

export default function Toast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info'
  });
  
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);
  
  // Expose the showToast function to the window
  useEffect(() => {
    const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      setToast({ visible: true, message, type });
    };
    
    window.showToast = showToast;
    
    return () => {
      delete window.showToast;
    };
  }, []);
  
  if (!toast.visible) {
    return null;
  }
  
  const bgColor = toast.type === 'info' 
    ? 'bg-[#1A237E]' 
    : toast.type === 'success' 
      ? 'bg-[#4CAF50]' 
      : 'bg-[#F44336]';
  
  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg flex items-center z-50`}
    >
      <span className="material-icons mr-2">
        {toast.type === 'info' 
          ? 'info' 
          : toast.type === 'success' 
            ? 'check_circle' 
            : 'error'}
      </span>
      <span>{toast.message}</span>
    </div>
  );
}

// Add showToast method to window object type
declare global {
  interface Window {
    showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  }
}
