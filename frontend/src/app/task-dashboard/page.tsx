"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import GanttChart from '@/components/GanttChart';
import { getProjectMembers } from '@/services/Project.service';

interface TaskDashboardProps {
  
}

export default function TaskDashboard() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const projectId = params?.projectId as string;
  const [users, setUsers] = useState([]);
  const [darkMode, setDarkMode] = useState(false); // or get from your theme context
  const [currentView, setCurrentView] = useState<'list' | 'gantt' | 'board'>('list');

  // Fetch project members for assignee data
  useEffect(() => {
    const fetchUsers = async () => {
      if (workspaceId && projectId) {
        try {
          const response = await getProjectMembers(workspaceId, projectId);
          if (response?.data?.members) {
            setUsers(response.data.members);
          }
        } catch (error) {
          console.error('Error fetching project members:', error);
        }
      }
    };

    fetchUsers();
  }, [workspaceId, projectId]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* View Toggle Buttons */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Project Tasks</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentView('list')}
            className={`px-4 py-2 rounded-md ${
              currentView === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setCurrentView('gantt')}
            className={`px-4 py-2 rounded-md ${
              currentView === 'gantt'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Gantt Chart
          </button>
          <button
            onClick={() => setCurrentView('board')}
            className={`px-4 py-2 rounded-md ${
              currentView === 'board'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Board View
          </button>
        </div>
      </div>

      {/* Render appropriate view */}
      {currentView === 'list' && (
        <div>
          {/* Your existing task list component */}
        </div>
      )}

      {currentView === 'gantt' && (
        <GanttChart
          workspaceId={workspaceId}
          projectId={projectId}
          users={users}
          darkMode={darkMode}
        />
      )}

      {currentView === 'board' && (
        <div>
          {/* Your kanban board component */}
        </div>
      )}
    </div>
  );
}