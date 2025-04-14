import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomeworkTracker from "@/pages/HomeworkTracker";
import PdfSummarizer from "@/pages/PdfSummarizer";
import Settings from "@/pages/Settings";
import Header from "@/components/Header";
import TabNavigation from "@/components/TabNavigation";
import Toast from "@/components/Toast";
import { useEffect, useState } from "react";
import { apiRequest } from "./lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function App() {
  const [location, setLocation] = useLocation();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const { toast } = useToast();

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiRequest('GET', '/api/auth/status');
        const data = await res.json();
        setAuthenticated(data.authenticated);
        if (data.authenticated) {
          setUsername(data.username);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Handle authentication status
  useEffect(() => {
    if (authenticated === false) {
      // Show login modal or redirect to login page
      // For this version, we'll use a simple prompt
      const promptLogin = async () => {
        try {
          const username = prompt('Enter Canvas username:');
          const password = prompt('Enter Canvas password:');
          
          if (!username || !password) {
            toast({
              title: "Authentication Failed",
              description: "Username and password are required",
              variant: "destructive"
            });
            return;
          }
          
          const res = await apiRequest('POST', '/api/auth/canvas', { username, password });
          const data = await res.json();
          
          if (data.sessionValid) {
            toast({
              title: "Authentication Successful",
              description: "Connected to Canvas"
            });
            setAuthenticated(true);
            setUsername(username);
          }
        } catch (error) {
          console.error('Login error:', error);
          toast({
            title: "Authentication Failed",
            description: error instanceof Error ? error.message : "Login failed",
            variant: "destructive"
          });
        }
      };
      
      promptLogin();
    }
  }, [authenticated, toast]);

  // Determine current tab based on route
  let currentTab = 'homework';
  if (location === '/pdf-summarizer') currentTab = 'summarize';
  if (location === '/settings') currentTab = 'settings';

  // Handle tab change
  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'homework':
        setLocation('/');
        break;
      case 'summarize':
        setLocation('/pdf-summarizer');
        break;
      case 'settings':
        setLocation('/settings');
        break;
    }
  };

  return (
    <>
      <Header username={username} />
      <TabNavigation currentTab={currentTab} onTabChange={handleTabChange} />
      
      <main className="container mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={HomeworkTracker} />
          <Route path="/pdf-summarizer" component={PdfSummarizer} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <Toast />
      <Toaster />
    </>
  );
}

export default App;
