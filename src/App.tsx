import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ChatBot from "@/components/ui/ChatBot";
import { AdminProvider } from "@/contexts/AdminContext";
import { FlashcardProvider } from "@/contexts/FlashcardContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PWAInstallBanner } from "@/components/ui/PWAInstallBanner";
import Navbar from "./components/layout/Navbar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Flashcards from "./pages/Flashcards";
import Forum from "./pages/Forum";
import AdminModeration from "./pages/AdminModeration";
import AdminUsersFixed from "./pages/AdminUsersFixed";
import AdminUsersUnified from "./pages/AdminUsersUnified";
import AdminSubjects from "./pages/AdminSubjects";
import AdminFlashcards from "./pages/AdminFlashcards";
import AdminForumImages from "./pages/AdminForumImages";
import AdminTests from "./pages/AdminTests";
import AdminFlashcardsCRUD from "./pages/AdminFlashcardsCRUD";
import AdminDashboardUnified from "./pages/AdminDashboardUnified";
import StudentDashboard from "./pages/StudentDashboard";
import ModernStudentDashboard from "./pages/ModernStudentDashboard";
import KnowledgeTests from "./pages/KnowledgeTests";
import KnowledgeTest from "./pages/KnowledgeTest";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import ModernProfile from "./pages/ModernProfile";
import TestLogin from "./pages/TestLogin";
import FindTutors from "./pages/FindTutors";
import AdminTutors from "./pages/AdminTutors";
import BecomeTutor from "./pages/BecomeTutor";
import TutorDashboard from "./pages/TutorDashboard";
import Messages from "./pages/Messages";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <TooltipProvider delayDuration={300}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <AdminProvider>
                  <FlashcardProvider>
                  <Toaster />
                  <Sonner />
                  <PWAInstallBanner />
                  <Navbar />
                  <ChatBot />
                  <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/test-login" element={<TestLogin />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
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
              
              {/* Route Politiques de Confidentialité */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              
              {/* Route Tuteurs */}
              <Route path="/tutors" element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TUTOR', 'ADMIN']} redirectTo="/login">
                  <FindTutors />
                </ProtectedRoute>
              } />
              
              {/* Route Messages */}
              <Route path="/messages" element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TUTOR', 'ADMIN']} redirectTo="/login">
                  <Messages />
                </ProtectedRoute>
              } />
              
              {/* Route Devenir Tuteur */}
              <Route path="/become-tutor" element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TUTOR', 'ADMIN']} redirectTo="/login">
                  <BecomeTutor />
                </ProtectedRoute>
              } />
              
              {/* Routes basées sur les rôles */}
              <Route path="/dashboard" element={<RoleBasedRedirect />} />
              <Route path="/profile" element={
                <ProtectedRoute redirectTo="/login">
                  <ModernProfile />
                </ProtectedRoute>
              } />
              <Route path="/student/dashboard" element={
                <ProtectedRoute allowedRoles={['STUDENT']} redirectTo="/">
                  <ModernStudentDashboard />
                </ProtectedRoute>
              } />
              
              {/* Routes tuteur */}
              <Route path="/tutor/dashboard" element={
                <ProtectedRoute allowedRoles={['TUTOR']} redirectTo="/login">
                  <TutorDashboard />
                </ProtectedRoute>
              } />
              
              {/* Routes admin */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/login">
                  <AdminDashboardUnified />
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/login">
                  <AdminDashboardUnified />
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard-modern" element={
                <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/login">
                  <AdminDashboardUnified />
                </ProtectedRoute>
              } />
              <Route path="/admin/moderation" element={
                <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/login">
                  <AdminModeration />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/login">
                  <AdminUsersFixed />
                </ProtectedRoute>
              } />
              <Route path="/admin/users-unified" element={
                <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/login">
                  <AdminUsersUnified />
                </ProtectedRoute>
              } />
              <Route path="/admin/subjects" element={
                <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/login">
                  <AdminSubjects />
                </ProtectedRoute>
              } />
              <Route path="/admin/flashcards" element={
                <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/login">
                  <AdminFlashcards />
                </ProtectedRoute>
              } />
              <Route path="/admin/forum-images" element={
                <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/login">
                  <AdminForumImages />
                </ProtectedRoute>
              } />
        <Route path="/admin/tests" element={
          <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/login">
            <AdminTests />
          </ProtectedRoute>
        } />
        <Route path="/admin/flashcards-crud" element={
          <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/login">
            <AdminFlashcardsCRUD />
          </ProtectedRoute>
        } />
        <Route path="/admin/tutors" element={
          <ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/login">
            <AdminTutors />
          </ProtectedRoute>
        } />
              
              <Route path="*" element={<NotFound />} />
                  </Routes>
                  </FlashcardProvider>
                </AdminProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
