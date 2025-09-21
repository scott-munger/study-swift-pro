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
import Forum from "./pages/Forum";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTest from "./pages/AdminTest";
import SimpleTest from "./pages/SimpleTest";
import AdminModeration from "./pages/AdminModeration";
import AdminUsers from "./pages/AdminUsers";
import AdminSubjects from "./pages/AdminSubjects";
import AdminFlashcards from "./pages/AdminFlashcards";
import SimpleAdminDashboard from "./pages/SimpleAdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
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
          <BrowserRouter future={{ v7_relativeSplatPath: true }}>
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/flashcards" element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TUTOR']} redirectTo="/profile">
                  <Flashcards />
                </ProtectedRoute>
              } />
              <Route path="/forum" element={<Forum />} />
              
              {/* Routes basées sur les rôles */}
              <Route path="/dashboard" element={<RoleBasedRedirect />} />
              <Route path="/student/dashboard" element={
                <ProtectedRoute allowedRoles={['STUDENT']} redirectTo="/profile">
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              
              {/* Routes admin */}
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/test" element={<AdminTest />} />
              <Route path="/simple-test" element={<SimpleTest />} />
              <Route path="/admin/moderation" element={<AdminModeration />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/subjects" element={<AdminSubjects />} />
              <Route path="/admin/flashcards" element={<AdminFlashcards />} />
              
              {/* Routes admin simples */}
              <Route path="/simple-admin/dashboard" element={<SimpleAdminDashboard />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
