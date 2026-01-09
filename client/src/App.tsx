import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useStore } from "@/lib/store";
import { useEffect } from "react";

import Home from "@/pages/Home";
import Inventory from "@/pages/Inventory";
import Equipment from "@/pages/Equipment";
import Chat from "@/pages/Chat";
import Timeline from "@/pages/Timeline";
import Login from "@/pages/Login";
import Employees from "@/pages/Employees";
import Menu from "@/pages/Menu";
import NotFound from "@/pages/not-found";
import Sales from "@/pages/Sales";
import Schedule from "@/pages/Schedule";
// 👇 1. IMPORTAMOS LA NUEVA PÁGINA
import WeeklyTasks from "@/pages/WeeklyTasks";

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

      {/* 8. EMPLOYEES (Rosa) */}
     <Route path="/employees">
         {() => (currentUser?.role === 'manager' ||
                 currentUser?.role === 'lead' ||
                 currentUser?.isSystemAdmin)
          ? <PrivateRoute component={Employees} categoryColor="#E91E63" /> 
           : <NotFound />
         }
      </Route>
     
      {/* 9. SALES (Registro de Ventas) */}
      <Route path="/sales">
         {() => <PrivateRoute component={Sales} categoryColor="#00E676" />}
      </Route>

      {/* 10. OPERATIONS HUB (Calendario unificado) */}
      <Route path="/schedule">
        {() => <PrivateRoute component={Schedule} categoryColor="#3B82F6" />}
      </Route>

      {/* 👇 11. NUEVA RUTA: WEEKLY TASKS (Morado) */}
      {/* Esta es la parte que faltaba para que funcione el botón */}
      <Route path="/tasks">
        {() => <PrivateRoute component={WeeklyTasks} categoryColor="#A855F7" />}
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