import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface StudentStats {
  flashcardsCompleted: number;
  studyStreak: number;
  averageScore: number;
  timeSpent: string;
  totalSubjects: number;
  completedLessons: number;
  upcomingTests: number;
  achievements: number;
}

interface SubjectProgress {
  name: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  nextLesson?: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'flashcard' | 'test' | 'lesson' | 'achievement';
  title: string;
  subject: string;
  time: string;
  score?: number;
  icon: React.ReactNode;
  color: string;
}

export const useStudentData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const loadStudentStats = useCallback(async () => {
    if (!user) {
      console.log('⚠️ Aucun utilisateur connecté, impossible de charger les données');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      console.log('🔄 Chargement des données pour l\'utilisateur:', user.id);

      // Charger les statistiques depuis l'API
      const statsResponse = await fetch(`http://localhost:8081/api/students/${user.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        console.log('✅ Statistiques chargées depuis l\'API:', data);
        setStats(data);
      } else {
        console.error('❌ Erreur API stats:', statsResponse.status, statsResponse.statusText);
        throw new Error(`Erreur API stats: ${statsResponse.status}`);
      }

      // Charger la progression des matières
      const subjectsResponse = await fetch(`http://localhost:8081/api/students/${user.id}/subjects/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (subjectsResponse.ok) {
        const data = await subjectsResponse.json();
        console.log('✅ Progression des matières chargée depuis l\'API:', data);
        setSubjectProgress(data);
      } else {
        console.error('❌ Erreur API subjects:', subjectsResponse.status, subjectsResponse.statusText);
        throw new Error(`Erreur API subjects: ${subjectsResponse.status}`);
      }

      // Charger l'activité récente
      const activityResponse = await fetch(`http://localhost:8081/api/students/${user.id}/recent-activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (activityResponse.ok) {
        const data = await activityResponse.json();
        console.log('✅ Activité récente chargée depuis l\'API:', data);
        setRecentActivity(data);
      } else {
        console.error('❌ Erreur API activity:', activityResponse.status, activityResponse.statusText);
        throw new Error(`Erreur API activity: ${activityResponse.status}`);
      }

    } catch (err) {
      console.error('❌ Erreur lors du chargement des données étudiant:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // En cas d'erreur, ne pas définir de données par défaut
      // pour forcer l'utilisateur à voir qu'il y a un problème
      setStats(null);
      setSubjectProgress([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    await loadStudentStats();
  }, [loadStudentStats]);

  const updateStats = useCallback(async (newStats: Partial<StudentStats>) => {
    if (!user || !stats) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:8081/api/students/${user.id}/stats`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStats)
      });

      if (response.ok) {
        setStats(prev => prev ? { ...prev, ...newStats } : null);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour des statistiques:', err);
    }
  }, [user, stats]);

  useEffect(() => {
    loadStudentStats();
  }, [loadStudentStats]);

  return {
    loading,
    error,
    stats,
    subjectProgress,
    recentActivity,
    refreshData,
    updateStats
  };
};
