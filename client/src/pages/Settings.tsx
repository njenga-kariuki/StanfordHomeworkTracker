import { useSettings } from "@/hooks/useSettings";

export default function Settings() {
  const {
    courses,
    driveFolderPath,
    fileNameFormat,
    sessionExpiry,
    lastScan,
    isLoading,
    isUpdatingSettings,
    isUpdatingCourses,
    isRefreshingSession,
    setDriveFolderPath,
    setFileNameFormat,
    updateSettings,
    toggleCourse,
    refreshSession,
    refetchCourses
  } = useSettings();

  const handleUpdateSettings = () => {
    updateSettings();
  };

  const handleRefreshCourses = async () => {
    await refetchCourses();
  };

  return (
    <div>
      {/* Canvas Courses Settings */}
      <div className="card bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-medium mb-6">Canvas Courses</h2>
        <p className="text-gray-600 mb-6">Select which Canvas courses to track for homework and assignments.</p>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="loading-spinner h-6 w-6 border-2 border-[#8C1515] border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {courses.map(course => (
              <div className="flex items-center" key={course.id}>
                <input 
                  id={`course-${course.id}`}
                  type="checkbox" 
                  className="h-4 w-4 text-[#8C1515] focus:ring-[#8C1515] border-gray-300 rounded"
                  checked={course.active}
                  onChange={() => toggleCourse(course.id)}
                  disabled={isUpdatingCourses}
                />
                <label htmlFor={`course-${course.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                  {course.name}
                </label>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-between border-t border-gray-200 pt-6">
          <button 
            className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            onClick={handleRefreshCourses}
            disabled={isLoading}
          >
            <span className="material-icons text-sm mr-1.5">refresh</span>
            Refresh Course List
          </button>
          <button 
            className="inline-flex items-center rounded-md bg-[#8C1515] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#B83A4B] disabled:opacity-50"
            onClick={() => {}}
            disabled={isUpdatingCourses || courses.length === 0}
          >
            Save Preferences
          </button>
        </div>
      </div>
      
      {/* Canvas Connection Status */}
      <div className="card bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-medium mb-6">Canvas Connection</h2>
        <p className="text-gray-600 mb-6">Your Canvas connection status and session management.</p>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Connected to <span className="font-medium">Stanford Canvas</span></p>
              <p className="text-xs text-gray-500 mt-1">Session expires in {sessionExpiry}</p>
              <p className="text-xs text-gray-500 mt-1">Last scan: {lastScan}</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4CAF50] bg-opacity-10 text-[#4CAF50]">
              Active
            </span>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => refreshSession()}
            disabled={isRefreshingSession}
          >
            <span className="material-icons text-sm mr-1.5">
              {isRefreshingSession ? 'hourglass_empty' : 'refresh'}
            </span>
            {isRefreshingSession ? 'Refreshing...' : 'Refresh Login Session'}
          </button>
        </div>
      </div>
      
      {/* Google Drive Settings */}
      <div className="card bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-medium mb-6">Google Drive Integration</h2>
        <p className="text-gray-600 mb-6">Configure where your PDF summaries are saved in Google Drive.</p>
        
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="drive-folder" className="block text-sm font-medium text-gray-700 mb-1">Target Folder</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex items-stretch flex-grow focus-within:z-10">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-400 text-sm">folder</span>
                </div>
                <input 
                  type="text" 
                  name="drive-folder" 
                  id="drive-folder" 
                  className="focus:ring-[#8C1515] focus:border-[#8C1515] block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-gray-300" 
                  placeholder="GSB/Course Summaries"
                  value={driveFolderPath}
                  onChange={(e) => setDriveFolderPath(e.target.value)}
                />
              </div>
              <button className="relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-[#8C1515] focus:border-[#8C1515]">
                Browse
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="file-prefix" className="block text-sm font-medium text-gray-700 mb-1">Document Naming</label>
            <div className="mt-1">
              <input 
                type="text" 
                name="file-prefix" 
                id="file-prefix" 
                className="shadow-sm focus:ring-[#8C1515] focus:border-[#8C1515] block w-full sm:text-sm border-gray-300 rounded-md"
                value={fileNameFormat}
                onChange={(e) => setFileNameFormat(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">Use [Course] and [Date] as placeholders</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end border-t border-gray-200 pt-6">
          <button 
            className="inline-flex items-center rounded-md bg-[#8C1515] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#B83A4B] disabled:opacity-50"
            onClick={handleUpdateSettings}
            disabled={isUpdatingSettings}
          >
            {isUpdatingSettings ? 'Saving...' : 'Save Drive Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
