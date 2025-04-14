export const STANFORD_RED = '#8C1515';
export const STANFORD_LIGHT_RED = '#B83A4B';
export const DEEP_BLUE = '#1A237E';
export const LIGHT_BLUE = '#2196F3';
export const NEUTRAL_BG = '#F5F7FA';
export const NEUTRAL_TEXT = '#333333';
export const SUCCESS = '#4CAF50';
export const WARNING = '#FFC107';
export const ERROR = '#F44336';

export const DEFAULT_COURSES = [
  "Business Finance I",
  "Strategic Leadership",
  "Data Analytics",
  "Marketing Management"
];

export type DateGroup = {
  date: string;
  dateDisplay: string;
  status: 'today' | 'tomorrow' | 'upcoming' | 'past';
  courseTasks: CourseTask[];
};

export type CourseTask = {
  id: number;
  courseName: string;
  assignments: Assignment[];
};

export type Assignment = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  url?: string;
  isReading: boolean;
};

export type Summary = {
  id: number;
  fileName: string;
  courseName: string;
  summaryDate: string;
  googleDocUrl?: string;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
};

export type UploadFile = {
  id: string;
  name: string;
  content: string; // base64
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
};

export type Settings = {
  driveFolderPath: string;
  fileNameFormat: string;
  lastCanvasScan: string | null;
  canvasSessionExpiry: string | null;
};

export type Course = {
  id: number;
  name: string;
  active: boolean;
};
