import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useStore } from "@/lib/store";
import { useEffect } from "react";

import Home from "@/pages/Home";
import Inventory from "@/pages/Inventory";
import Equipment from "@/pages/Equipment";
import Checklists from "@/pages/Checklists";
import Tasks from "@/pages/Tasks";
import Chat from "@/pages/Chat";
import Timeline from "@/pages/Timeline";
import Login from "@/pages/Login";
import Employees from "@/pages/Employees";
import Menu from "@/pages/Menu";
import NotFound from "@/pages/not-found";

function PrivateRoute({ component: Component, ...rest }: any) {
  const { currentUser } = useStore();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (!currentUser) {
      setLocation('/login');
    }
  }, [currentUser, setLocation]);

  if (!currentUser) return null;

  return <Component {...rest} />;
}

function Router() {
  const { currentUser } = useStore();
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes */}
      <Route path="/">
        {() => <PrivateRoute component={Home} />}
      </Route>
      <Route path="/inventory">
        {() => <PrivateRoute component={Inventory} />}
      </Route>
      <Route path="/equipment">
         {() => <PrivateRoute component={Equipment} />}
      </Route>
      <Route path="/checklists">
         {() => <PrivateRoute component={Checklists} />}
      </Route>
      <Route path="/tasks">
         {() => <PrivateRoute component={Tasks} />}
      </Route>
      <Route path="/menu">
         {() => <PrivateRoute component={Menu} />}
      </Route>
      <Route path="/chat">
         {() => <PrivateRoute component={Chat} />}
      </Route>
      <Route path="/timeline">
         {() => <PrivateRoute component={Timeline} />}
      </Route>
      <Route path="/employees">
         {() => currentUser?.role === 'manager' || currentUser?.role === 'lead' || currentUser?.isSystemAdmin
            ? <PrivateRoute component={Employees} /> 
            : <NotFound />
         }
      </Route>
      
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
