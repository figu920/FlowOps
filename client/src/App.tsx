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

      {/* 1. INVENTARIO (Verde) */}
      <Route path="/inventory">
        {() => <PrivateRoute component={Inventory} categoryColor="#4CAF50" />}
      </Route>

      {/* 2. EQUIPAMIENTO (Amarillo/Dorado) */}
      <Route path="/equipment">
         {() => <PrivateRoute component={Equipment} categoryColor="#FFC107" />}
      </Route>

      {/* 3. CHECKLISTS (Azul Cielo) */}
      <Route path="/checklists">
         {() => <PrivateRoute component={Checklists} categoryColor="#2196F3" />}
      </Route>

      {/* 4. TASKS (Violeta) */}
      <Route path="/tasks">
         {() => <PrivateRoute component={Tasks} categoryColor="#9C27B0" />}
      </Route>

      {/* 5. MENU (Verde Azulado / Teal) */}
      <Route path="/menu">
         {() => <PrivateRoute component={Menu} categoryColor="#009688" />}
      </Route>

      {/* 6. CHAT (Blanco o Gris Claro) */}
      <Route path="/chat">
         {() => <PrivateRoute component={Chat} categoryColor="#FFFFFF" />}
      </Route>

      {/* 7. TIMELINE (Naranja) */}
      <Route path="/timeline">
         {() => <PrivateRoute component={Timeline} categoryColor="#FF9800" />}
      </Route>

      {/* 8. EMPLOYEES (Rosa) - Nota: Aquí también se añade el color dentro de la lógica de roles */}
     <Route path="/employees">
         {() => (currentUser?.role === 'manager' ||

 currentUser?.role === 'lead' ||
 currentUser?.isSystemAdmin)
          ? <PrivateRoute component={Employees} categoryColor="#E91E63" /> 
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
