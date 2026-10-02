import React from 'react';
import { UserProfile, Translations } from '../types';
import { HomeView } from './home/HomeView';

interface DashboardPreviewProps {
  user: UserProfile;
  t: Translations['welcome'];
  appName: string;
  onLogout: () => void;
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({
  user,
  onLogout,
}) => {
  return (
    <HomeView
      currentUser={user}
      onUpdateProfile={() => {}}
      onLogout={onLogout}
    />
  );
};
