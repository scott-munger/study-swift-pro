import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { FlashcardProvider } from "@/contexts/FlashcardContext";
import Navbar from "./components/layout/Navbar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Flashcards from "./pages/Flashcards";
import Forum from "./pages/Forum";
import Admin from "./pages/Admin";
import AdminModeration from "./pages/AdminModeration";
import AdminUsersFixed from "./pages/AdminUsersFixed";
import AdminUsersUnified from "./pages/AdminUsersUnified";
import AdminSubjects from "./pages/AdminSubjects";
import AdminFlashcards from "./pages/AdminFlashcards";
import AdminForumImages from "./pages/AdminForumImages";
import AdminTests from "./pages/AdminTests";
import AdminFlashcardsCRUD from "./pages/AdminFlashcardsCRUD";
import ModernAdminDashboard from "./pages/ModernAdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import KnowledgeTests from "./pages/KnowledgeTests";
import KnowledgeTest from "./pages/KnowledgeTest";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminProvider>
        <FlashcardProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_relativeSplatPath: true }}>
            <Navbar />
            <Routes>
              <Route path="/" element={
                <ProtectedRoute allowedRoles={['STUDENT','TUTOR','ADMIN']} redirectTo="/login">
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/flashcards" element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TUTOR']} redirectTo="/">
                  <Flashcards />
                </ProtectedRoute>
              } />
              <Route path="/knowledge-tests" element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TUTOR', 'ADMIN']} redirectTo="/">
                  <KnowledgeTests />
                </ProtectedRoute>
              } />
              <Route path="/knowledge-test/:testId" element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TUTOR', 'ADMIN']} redirectTo="/">
                  <KnowledgeTest />
                </ProtectedRoute>
              } />
              <Route path="/forum" element={<Forum />} />
              
              {/* Routes basées sur les rôles */}
              <Route path="/dashboard" element={<RoleBasedRedirect />} />
              <Route path="/profile" element={
                <ProtectedRoute redirectTo="/login">
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/student/dashboard" element={
                <ProtectedRoute allowedRoles={['STUDENT']} redirectTo="/">
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              
              {/* Routes admin */}
              <Route path="/admin" element={
                <ProtectedRoute redirectTo="/login">
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute redirectTo="/login">
                  <ModernAdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard-modern" element={
                <ProtectedRoute redirectTo="/login">
                  <ModernAdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/moderation" element={
                <ProtectedRoute redirectTo="/login">
                  <AdminModeration />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute redirectTo="/login">
                  <AdminUsersFixed />
                </ProtectedRoute>
              } />
              <Route path="/admin/users-unified" element={
                <ProtectedRoute redirectTo="/login">
                  <AdminUsersUnified />
                </ProtectedRoute>
              } />
              <Route path="/admin/subjects" element={
                <ProtectedRoute redirectTo="/login">
                  <AdminSubjects />
                </ProtectedRoute>
              } />
              <Route path="/admin/flashcards" element={
                <ProtectedRoute redirectTo="/login">
                  <AdminFlashcards />
                </ProtectedRoute>
              } />
              <Route path="/admin/forum-images" element={
                <ProtectedRoute redirectTo="/login">
                  <AdminForumImages />
                </ProtectedRoute>
              } />
        <Route path="/admin/tests" element={
          <ProtectedRoute redirectTo="/login">
            <AdminTests />
          </ProtectedRoute>
        } />
        <Route path="/admin/flashcards-crud" element={
          <ProtectedRoute redirectTo="/login">
            <AdminFlashcardsCRUD />
          </ProtectedRoute>
        } />
              
              
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </FlashcardProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
