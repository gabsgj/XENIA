
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Syllabus, StudyPlan, UserProgress, StudyTask } from '../types';

interface AppContextType {
  syllabus: Syllabus | null;
  setSyllabus: (syllabus: Syllabus | null) => void;
  studyPlan: StudyPlan | null;
  setStudyPlan: (plan: StudyPlan | null) => void;
  userProgress: UserProgress;
  updateUserProgress: (updates: Partial<UserProgress>) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  completeTask: (taskId: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const initialProgress: UserProgress = {
  xp: 0,
  level: 1,
  streak: 0,
  tasksCompleted: 0,
  achievements: [],
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [syllabus, setSyllabusState] = useState<Syllabus | null>(null);
  const [studyPlan, setStudyPlanState] = useState<StudyPlan | null>(null);
  const [userProgress, setUserProgressState] = useState<UserProgress>(initialProgress);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedSyllabus = localStorage.getItem('xenia-syllabus');
      if (savedSyllabus) setSyllabusState(JSON.parse(savedSyllabus));

      const savedPlan = localStorage.getItem('xenia-studyPlan');
      if (savedPlan) setStudyPlanState(JSON.parse(savedPlan));

      const savedProgress = localStorage.getItem('xenia-userProgress');
      if (savedProgress) setUserProgressState(JSON.parse(savedProgress));
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  const setSyllabus = (newSyllabus: Syllabus | null) => {
    setSyllabusState(newSyllabus);
    localStorage.setItem('xenia-syllabus', JSON.stringify(newSyllabus));
  };
  
  const setStudyPlan = (newPlan: StudyPlan | null) => {
    setStudyPlanState(newPlan);
    localStorage.setItem('xenia-studyPlan', JSON.stringify(newPlan));
  };

  const updateUserProgress = useCallback((updates: Partial<UserProgress>) => {
    setUserProgressState(prev => {
      const newState = { ...prev, ...updates };
      localStorage.setItem('xenia-userProgress', JSON.stringify(newState));
      return newState;
    });
  }, []);
  
  const completeTask = useCallback((taskId: string) => {
    setStudyPlanState(prevPlan => {
      if (!prevPlan) return null;
      const newTasks = prevPlan.tasks.map(task => 
        task.id === taskId ? { ...task, isCompleted: true } : task
      );
      const newPlan = { ...prevPlan, tasks: newTasks };
      localStorage.setItem('xenia-studyPlan', JSON.stringify(newPlan));
      
      setUserProgressState(prevProgress => {
          const xpGained = 10;
          const newXp = prevProgress.xp + xpGained;
          const xpToNextLevel = prevProgress.level * 100;
          let newLevel = prevProgress.level;
          if (newXp >= xpToNextLevel) {
              newLevel += 1;
          }
          const newProgress = {
              ...prevProgress,
              xp: newXp,
              level: newLevel,
              tasksCompleted: prevProgress.tasksCompleted + 1,
              // Basic streak logic
              streak: prevProgress.streak + 1,
          };
          localStorage.setItem('xenia-userProgress', JSON.stringify(newProgress));
          return newProgress;
      });
      return newPlan;
    });
  }, []);

  const value = {
    syllabus,
    setSyllabus,
    studyPlan,
    setStudyPlan,
    userProgress,
    updateUserProgress,
    isLoading,
    setIsLoading,
    error,
    setError,
    completeTask
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
