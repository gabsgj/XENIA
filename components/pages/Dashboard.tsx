
import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import Card from '../ui/Card';
import { ChartBarIcon, CheckCircleIcon, FireIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const Dashboard: React.FC = () => {
  const { userProgress, studyPlan, syllabus } = useAppContext();
  
  const today = new Date().getDay(); // Sunday - 0, Monday - 1, etc.
  const upcomingTasks = studyPlan?.tasks.filter(task => !task.isCompleted && task.day >= today).slice(0, 3) || [];

  const masteryData = syllabus?.topics.map(topic => ({
    name: topic.topicName.substring(0, 10) + '...', // Shorten name for chart
    mastery: topic.mastery || Math.floor(Math.random() * 60) + 20, // Mock mastery
  })) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome back, Student!</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <div className="flex items-center">
                <AcademicCapIcon className="h-8 w-8 text-accent mr-4"/>
                <div>
                    <p className="text-sm text-text-secondary">Overall Mastery</p>
                    <p className="text-2xl font-bold">78%</p>
                </div>
            </div>
        </Card>
        <Card>
            <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500 mr-4"/>
                <div>
                    <p className="text-sm text-text-secondary">Tasks Completed</p>
                    <p className="text-2xl font-bold">{userProgress.tasksCompleted}</p>
                </div>
            </div>
        </Card>
        <Card>
            <div className="flex items-center">
                <FireIcon className="h-8 w-8 text-orange-500 mr-4"/>
                <div>
                    <p className="text-sm text-text-secondary">Current Streak</p>
                    <p className="text-2xl font-bold">{userProgress.streak} Days</p>
                </div>
            </div>
        </Card>
        <Card>
            <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-purple-500 mr-4"/>
                <div>
                    <p className="text-sm text-text-secondary">Level</p>
                    <p className="text-2xl font-bold">{userProgress.level}</p>
                </div>
            </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <h2 className="text-xl font-semibold mb-4">Topic Mastery</h2>
                {masteryData.length > 0 ? (
                    <div className="h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={masteryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#94A3B8" />
                                <YAxis stroke="#94A3B8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none' }} cursor={{fill: 'rgba(56, 189, 248, 0.1)'}} />
                                <Legend />
                                <Bar dataKey="mastery" fill="#38BDF8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="text-text-secondary text-center py-12">Upload a syllabus to see your topic mastery.</p>
                )}
            </Card>
        </div>
        <div>
            <Card>
                <h2 className="text-xl font-semibold mb-4">Upcoming Tasks</h2>
                {upcomingTasks.length > 0 ? (
                    <ul className="space-y-3">
                    {upcomingTasks.map(task => (
                        <li key={task.id} className="p-3 bg-primary rounded-lg">
                            <p className="font-semibold">{task.task}</p>
                            <p className="text-sm text-text-secondary">{task.topic} - {task.estimatedTime} min</p>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-text-secondary text-center py-12">No upcoming tasks. Generate a study plan to get started!</p>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
