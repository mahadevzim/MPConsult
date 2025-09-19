import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Results from "@/pages/results";
import Admin from "@/pages/admin";
import PayoutPage from "@/pages/payout";
import SearchPage from "@/pages/search";
import NotFound from "@/pages/not-found";
import type { Process } from "@shared/schema";

function AppContent() {
  const [searchResults, setSearchResults] = useState<Process[]>([]);
  const [searchedCPF, setSearchedCPF] = useState<string>("");
  const [location, navigate] = useLocation();

  const handleSearchResults = (processes: Process[], cpf: string) => {
    setSearchResults(processes);
    setSearchedCPF(cpf);
  };

  const handleBackToSearch = () => {
    setSearchResults([]);
    setSearchedCPF("");
    navigate("/");
  };

  // Navigation functions removed since header is removed

  return (
    <div className="min-h-screen bg-background">
      <Switch>
        <Route path="/" component={() => 
          <Home 
            onSearchResults={handleSearchResults}
            searchResults={searchResults}
            searchedCPF={searchedCPF}
            onBackToSearch={handleBackToSearch}
          />
        } />
        <Route path="/results" component={() => 
          <Results 
            processes={searchResults}
            searchedCPF={searchedCPF}
            onBackToSearch={handleBackToSearch}
          />
        } />
        <Route path="/admin" component={Admin} />
        <Route path="/search" component={SearchPage} />
        <Route path="/payout" component={PayoutPage} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <AppContent />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
