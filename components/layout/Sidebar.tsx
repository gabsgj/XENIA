
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, DocumentTextIcon, CalendarIcon, ChatBubbleLeftRightIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const iconClasses = "h-6 w-6 mr-3";
const linkBaseClasses = "flex items-center px-4 py-3 text-text-secondary rounded-lg hover:bg-secondary hover:text-text-primary transition-colors";
const activeLinkClasses = "bg-accent text-primary font-semibold";

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-primary flex-shrink-0 p-4 border-r border-secondary">
      <div className="flex items-center mb-10">
        <AcademicCapIcon className="h-8 w-8 text-accent mr-2"/>
        <h1 className="text-2xl font-bold text-text-primary">XENIA</h1>
      </div>
      <nav className="space-y-2">
        <NavLink to="/dashboard" className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeLinkClasses : ''}`}>
          <HomeIcon className={iconClasses} />
          Dashboard
        </NavLink>
        <NavLink to="/syllabus" className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeLinkClasses : ''}`}>
          <DocumentTextIcon className={iconClasses} />
          Syllabus
        </NavLink>
        <NavLink to="/plan" className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeLinkClasses : ''}`}>
          <CalendarIcon className={iconClasses} />
          Study Plan
        </NavLink>
        <NavLink to="/tutor" className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeLinkClasses : ''}`}>
          <ChatBubbleLeftRightIcon className={iconClasses} />
          AI Tutor
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
