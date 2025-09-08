import React from 'react';

interface TrajectoryPanelProps {
  className?: string;
}

export const TrajectoryPanel: React.FC<TrajectoryPanelProps> = ({ 
  className = '' 
}) => {
  return (
    <div className={`trajectory-panel ${className}`}>
      <h3>Trajectory Planning</h3>
      <p>Trajectory panel component - implementation pending</p>
    </div>
  );
};
