import { useCanvasData } from "@/hooks/useCanvasData";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HomeworkTracker() {
  const {
    courses,
    dateGroups,
    lastUpdated,
    isLoading,
    isError,
    isScanning,
    scanHomework
  } = useCanvasData();
  
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  // Canvas login credentials
  const [canvasCredentials, setCanvasCredentials] = useState({
    username: '',
    password: ''
  });

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    
    try {
      const response = await fetch('/api/auth/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(canvasCredentials)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to authenticate with Canvas');
      }
      
      // On successful login, scan for homework
      scanHomework();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCanvasCredentials(prev => ({ ...prev, [name]: value }));
  };

  // Filter assignments by selected course
  const filteredDateGroups = selectedCourse === "all"
    ? dateGroups
    : dateGroups.map(dateGroup => ({
        ...dateGroup,
        courseTasks: dateGroup.courseTasks.filter(
          courseTask => courseTask.courseName === selectedCourse
        )
      })).filter(dateGroup => dateGroup.courseTasks.length > 0);

  return (
    <div>
      {/* Show Canvas Login Form if not authenticated */}
      {isError && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            <span className="material-icons text-[#F44336] mr-2">error_outline</span>
            <h2 className="text-lg font-medium">Canvas Authentication Required</h2>
          </div>
          
          {loginError && (
            <div className="mb-4 p-3 bg-[#F44336] bg-opacity-10 text-[#F44336] rounded">
              <p className="text-sm">{loginError}</p>
            </div>
          )}
          
          <p className="text-sm text-gray-600 mb-4">
            Please sign in with your Stanford Canvas credentials to access your homework assignments.
          </p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="canvas-username" className="block text-sm font-medium text-gray-700 mb-1">
                Canvas Username
              </label>
              <input
                id="canvas-username"
                name="username"
                type="text"
                required
                value={canvasCredentials.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8C1515] focus:border-[#8C1515]"
                placeholder="Stanford Username"
              />
            </div>
            
            <div>
              <label htmlFor="canvas-password" className="block text-sm font-medium text-gray-700 mb-1">
                Canvas Password
              </label>
              <input
                id="canvas-password"
                name="password"
                type="password"
                required
                value={canvasCredentials.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8C1515] focus:border-[#8C1515]"
                placeholder="Stanford Password"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#8C1515] text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium hover:bg-[#B83A4B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8C1515] disabled:opacity-50 flex items-center justify-center"
              >
                {loginLoading ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                    Connecting...
                  </>
                ) : (
                  "Connect to Canvas"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Status Card (only show when authenticated) */}
      {!isError && (
        <div className="card bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Weekly Homework Status</h2>
              <p className="text-sm text-gray-600">
                Last updated: <span>{lastUpdated || "Never"}</span>
              </p>
            </div>
            <div className="flex items-center">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4CAF50] bg-opacity-10 text-[#4CAF50]"
              >
                <span className="w-2 h-2 rounded-full bg-[#4CAF50] mr-1.5"></span>
                Connected to Canvas
              </span>
              <button
                onClick={() => scanHomework()}
                disabled={isScanning}
                className="ml-4 bg-[#8C1515] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#B83A4B] transition-colors flex items-center shadow-sm disabled:opacity-50"
              >
                <span className="material-icons text-sm mr-1.5">
                  {isScanning ? "hourglass_empty" : "sync"}
                </span>
                {isScanning ? "Scanning..." : "Scan Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Filter - Only show when not in error state */}
      {!isError && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCourse("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              selectedCourse === "all"
                ? "bg-[#8C1515] text-white"
                : "bg-white text-neutral-text hover:bg-gray-100"
            } transition-colors`}
          >
            All Courses
          </button>
          
          {courses?.map(course => (
            <button
              key={course.id}
              onClick={() => setSelectedCourse(course.name)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                selectedCourse === course.name
                  ? "bg-[#8C1515] text-white"
                  : "bg-white text-neutral-text hover:bg-gray-100"
              } transition-colors`}
            >
              {course.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8C1515]"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      )}

      {/* Assignments By Date - Empty State - Only show when authenticated */}
      {!isError && !isLoading && filteredDateGroups.length === 0 && (
        <div id="empty-state" className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <span className="material-icons text-4xl">assignment</span>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
          <p className="mt-1 text-sm text-gray-500">No upcoming assignments found for the next 7 days.</p>
          <div className="mt-6">
            <button
              onClick={() => scanHomework()}
              disabled={isScanning}
              type="button"
              className="inline-flex items-center rounded-md bg-[#8C1515] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#B83A4B] disabled:opacity-50"
            >
              <span className="material-icons text-sm mr-1.5">
                {isScanning ? "hourglass_empty" : "sync"}
              </span>
              {isScanning ? "Scanning..." : "Scan Canvas Now"}
            </button>
          </div>
        </div>
      )}

      {/* Display assignments by date - Only when authenticated */}
      {!isError && !isLoading && filteredDateGroups.map(dateGroup => (
        <div className="mb-8" key={dateGroup.date}>
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-medium">
              {dateGroup.status === 'today' 
                ? 'Today' 
                : dateGroup.status === 'tomorrow' 
                  ? 'Tomorrow' 
                  : ''} - {dateGroup.dateDisplay}
            </h2>
            <span className={`ml-3 text-xs font-medium px-2.5 py-0.5 rounded-full ${
              dateGroup.status === 'today' 
                ? 'bg-[#FFC107] bg-opacity-10 text-[#FFC107]' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {dateGroup.courseTasks.reduce(
                (total, course) => total + course.assignments.length, 0
              )} assignments due
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dateGroup.courseTasks.map(courseTask => (
              <div className="card bg-white rounded-lg shadow overflow-hidden" key={courseTask.id}>
                <div className="bg-[#8C1515] px-4 py-3 text-white">
                  <h3 className="font-medium">{courseTask.courseName}</h3>
                </div>
                <div className="p-4">
                  <ul className="space-y-4">
                    {courseTask.assignments.map(assignment => (
                      <li className="border-b border-gray-100 pb-3 last:border-0 last:pb-0" key={assignment.id}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-neutral-text">{assignment.title}</h4>
                            {assignment.description && (
                              <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                            )}
                            {assignment.url && (
                              <div className="mt-2 flex items-center">
                                <span className="material-icons text-sm text-gray-500 mr-1">
                                  {assignment.isReading ? 'menu_book' : 'attach_file'}
                                </span>
                                <a 
                                  href={assignment.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-[#2196F3] hover:underline"
                                >
                                  View on Canvas
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <span className="text-sm text-gray-500">
                              {new Date(assignment.dueDate).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
