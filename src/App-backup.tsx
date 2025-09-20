import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import Navbar from "./components/layout/Navbar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Flashcards from "./pages/Flashcards";
import Tutors from "./pages/Tutors";
import Forum from "./pages/Forum";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminModeration from "./pages/AdminModeration";
import TutorDashboard from "./pages/TutorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import NotFound from "./pages/NotFound";
import DatabaseTest from "./components/DatabaseTest";
import FunctionalityTest from "./components/FunctionalityTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/tutors" element={<Tutors />} />
              <Route path="/forum" element={<Forum />} />
              
              {/* Routes basées sur les rôles */}
              <Route path="/dashboard" element={<RoleBasedRedirect />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/tutor/dashboard" element={<TutorDashboard />} />
              <Route path="/tutor/students" element={<TutorDashboard />} />
              
              {/* Routes admin */}
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/moderation" element={<AdminModeration />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;



