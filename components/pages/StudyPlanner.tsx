
import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/solid';

const StudyPlanner: React.FC = () => {
  const { studyPlan, completeTask } = useAppContext();
  const navigate = useNavigate();

  if (!studyPlan) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">No Study Plan Found</h1>
        <p className="text-text-secondary mb-6">Go to the syllabus page to generate a new plan.</p>
        <Button onClick={() => navigate('/syllabus')}>
            <SparklesIcon className="h-5 w-5 mr-2"/>
            Generate Plan
        </Button>
      </div>
    );
  }

  const tasksByDay = studyPlan.tasks.reduce((acc, task) => {
    (acc[task.day] = acc[task.day] || []).push(task);
    return acc;
  }, {} as Record<number, typeof studyPlan.tasks>);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your 7-Day Study Plan</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.entries(tasksByDay).map(([day, tasks]) => (
          <Card key={day}>
            <h2 className="text-xl font-semibold mb-4">Day {day}</h2>
            <ul className="space-y-3">
              {tasks.map(task => (
                <li key={task.id} className={`p-3 rounded-lg flex items-start transition-all ${task.isCompleted ? 'bg-green-900/50 text-text-secondary' : 'bg-primary'}`}>
                  <button 
                    onClick={() => !task.isCompleted && completeTask(task.id)}
                    disabled={task.isCompleted}
                    className={`mr-3 mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.isCompleted ? 'bg-accent border-accent' : 'border-text-secondary hover:bg-secondary'}`}
                    aria-label={task.isCompleted ? 'Task completed' : 'Mark task as complete'}
                  >
                    {task.isCompleted && <CheckIcon className="h-3 w-3 text-primary" />}
                  </button>
                  <div className={task.isCompleted ? 'line-through' : ''}>
                    <p className="font-medium">{task.task}</p>
                    <p className="text-sm text-text-secondary capitalize">{task.topic} &bull; {task.type} &bull; {task.estimatedTime} min</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StudyPlanner;
