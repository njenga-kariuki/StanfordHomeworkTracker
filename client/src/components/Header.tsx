import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface HeaderProps {
  username: string | null;
}

export default function Header({ username }: HeaderProps) {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      toast({
        title: "Refreshing data...",
        description: "Fetching latest data from Canvas"
      });
      
      await apiRequest('POST', '/api/auth/refresh');
      
      toast({
        title: "Data refreshed",
        description: "Canvas data has been updated"
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "Unable to refresh data",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  return (
    <header className="bg-[#8C1515] text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <img
            src="https://identity.stanford.edu/wp-content/uploads/sites/3/2020/07/block-s-2color.png"
            alt="Stanford Logo"
            className="h-10 mr-3"
          />
          <h1 className="text-xl md:text-2xl font-medium">GSB Homework Tracker</h1>
        </div>
        <div className="flex items-center">
          <span className="hidden md:inline-block mr-4">{username}</span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white bg-opacity-20 text-white px-3 py-1.5 rounded flex items-center hover:bg-opacity-30 transition-colors"
          >
            <span className="material-icons text-sm mr-1">
              {refreshing ? 'hourglass_empty' : 'refresh'}
            </span>
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
