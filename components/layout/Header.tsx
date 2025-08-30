
import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { StarIcon, FireIcon, UserCircleIcon } from '@heroicons/react/24/solid';

const Header: React.FC = () => {
  const { userProgress } = useAppContext();
  const xpToNextLevel = userProgress.level * 100;
  const xpProgressPercent = (userProgress.xp / xpToNextLevel) * 100;

  return (
    <header className="bg-primary p-4 flex justify-end items-center border-b border-secondary">
      <div className="flex items-center space-x-6 text-text-primary">
        <div className="flex items-center">
          <StarIcon className="h-5 w-5 text-yellow-400 mr-2" />
          <span>Level {userProgress.level}</span>
        </div>
        <div className="w-32">
            <div className="text-sm text-text-secondary mb-1">{userProgress.xp} / {xpToNextLevel} XP</div>
            <div className="w-full bg-secondary rounded-full h-1.5">
                <div className="bg-accent h-1.5 rounded-full" style={{ width: `${xpProgressPercent}%` }}></div>
            </div>
        </div>
        <div className="flex items-center">
          <FireIcon className="h-5 w-5 text-orange-500 mr-1" />
          <span>{userProgress.streak} Day Streak</span>
        </div>
        <UserCircleIcon className="h-8 w-8 text-text-secondary cursor-pointer"/>
      </div>
    </header>
  );
};

export default Header;
