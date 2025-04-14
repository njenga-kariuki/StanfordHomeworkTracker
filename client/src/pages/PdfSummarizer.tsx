import { usePdfSummarize } from "@/hooks/usePdfSummarize";
import { useCanvasData } from "@/hooks/useCanvasData";
import { useRef } from "react";

export default function PdfSummarizer() {
  const {
    summaries,
    uploadedFiles,
    courseName,
    readingDate,
    isLoading,
    isProcessing,
    handleFileUpload,
    setCourseName,
    setReadingDate,
    processPdfs
  } = usePdfSummarize();
  
  const { courses } = useCanvasData();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
        handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
      }
    }
  };
  
  const handleSubmit = () => {
    if (!courseName) {
      window.showToast("Please select a course", "error");
      return;
    }
    if (!readingDate) {
      window.showToast("Please select a reading date", "error");
      return;
    }
    if (uploadedFiles.length === 0) {
      window.showToast("Please upload at least one PDF file", "error");
      return;
    }
    
    processPdfs();
  };
  
  const showFileMetadata = uploadedFiles.length > 0;
  const showProcessingStatus = isProcessing || uploadedFiles.some(file => 
    file.status === 'processing' || file.status === 'completed'
  );
  
  return (
    <div>
      <div className="card bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">PDF Summarizer</h2>
        <p className="text-gray-600 mb-6">Upload academic readings to generate summaries with Gemini 2.5 Pro. Summaries will be saved to your Google Drive.</p>
        
        {/* Upload Section */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".pdf" 
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <span className="material-icons text-4xl">upload_file</span>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Upload PDF Files</h3>
            <p className="mt-1 text-sm text-gray-500">Drag and drop or click to select files</p>
            <button 
              type="button" 
              className="mt-4 inline-flex items-center rounded-md bg-[#8C1515] px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#B83A4B] focus:outline-none"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="material-icons text-sm mr-1.5">upload</span>
              Select Files
            </button>
          </label>
        </div>
        
        {/* File Metadata Section */}
        {showFileMetadata && (
          <div id="file-metadata-section" className="mb-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">File Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="course-name" className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                <select 
                  id="course-name" 
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#8C1515] focus:ring-[#8C1515]"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                >
                  <option value="">Select a course</option>
                  {courses?.map(course => (
                    <option key={course.id} value={course.name}>{course.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="file-date" className="block text-sm font-medium text-gray-700 mb-1">Reading Date</label>
                <input 
                  type="date" 
                  id="file-date" 
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#8C1515] focus:ring-[#8C1515]"
                  value={readingDate}
                  onChange={(e) => setReadingDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Process Button */}
        {showFileMetadata && (
          <div className="flex justify-end">
            <button 
              id="process-files" 
              className="inline-flex items-center rounded-md bg-[#8C1515] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#B83A4B] focus:outline-none disabled:opacity-50"
              onClick={handleSubmit}
              disabled={isProcessing || !courseName || !readingDate}
            >
              <span className="material-icons text-sm mr-1.5">smart_toy</span>
              Summarize with Gemini
            </button>
          </div>
        )}
      </div>
      
      {/* Processing Status */}
      {showProcessingStatus && (
        <div id="processing-status" className="card bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Processing Files</h3>
          
          {uploadedFiles.map(file => (
            <div className="mb-4 last:mb-0" key={file.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="material-icons text-gray-500 mr-2">picture_as_pdf</span>
                  <span className="font-medium">{file.name}</span>
                </div>
                {file.status === 'completed' && (
                  <span className="material-icons text-[#4CAF50]">check_circle</span>
                )}
                {file.status === 'processing' && (
                  <div className="loading-spinner h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                )}
                {file.status === 'failed' && (
                  <span className="material-icons text-[#F44336]">error</span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${
                    file.status === 'completed' 
                      ? 'bg-[#4CAF50]' 
                      : file.status === 'failed' 
                        ? 'bg-[#F44336]' 
                        : 'bg-[#2196F3]'
                  }`} 
                  style={{ width: `${file.progress}%` }}
                ></div>
              </div>
              {file.error && (
                <p className="text-sm text-[#F44336] mt-1">{file.error}</p>
              )}
            </div>
          ))}
          
          <div className="mt-6 text-sm text-gray-600">
            <p>Summaries will be saved to Google Drive as:</p>
            <p className="font-medium">"{courseName} - {readingDate} Summary.docx"</p>
          </div>
        </div>
      )}
      
      {/* Recent Summaries */}
      <div className="card bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Recent Summaries</h3>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8C1515]"></div>
            <p className="mt-4 text-gray-600">Loading summaries...</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No summaries found</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaries.map(summary => (
                  <tr key={summary.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="material-icons text-blue-500 mr-2">description</span>
                        {summary.googleDocUrl ? (
                          <a 
                            href={summary.googleDocUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {summary.fileName}
                          </a>
                        ) : (
                          <span className="text-sm">{summary.fileName}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.courseName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(summary.summaryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4CAF50] bg-opacity-10 text-[#4CAF50]">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
