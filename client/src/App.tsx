import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Inventory from "@/pages/Inventory";
import Equipment from "@/pages/Equipment";
import Checklists from "@/pages/Checklists";
import Tasks from "@/pages/Tasks";
import Chat from "@/pages/Chat";
import Timeline from "@/pages/Timeline";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/equipment" component={Equipment} />
      <Route path="/checklists" component={Checklists} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/chat" component={Chat} />
      <Route path="/timeline" component={Timeline} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
