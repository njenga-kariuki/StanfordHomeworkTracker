import { log } from '../vite';

// Types for Canvas interactions
type CanvasSession = {
  username: string;
  password: string;
};

type CanvasLoginResult = {
  success: boolean;
  session?: CanvasSession;
  error?: string;
};

type CanvasCourse = {
  id: string;
  name: string;
};

type AssignmentItem = {
  title: string;
  description?: string;
  dueDate?: string;
  url?: string;
  isReading?: boolean;
};

type CourseAssignments = {
  courseName: string;
  items: AssignmentItem[];
};

// Sample data for testing
const MOCK_COURSES = [
  { id: "course_1", name: "GSB101: Data-Driven Decision Making" },
  { id: "course_2", name: "GSB202: Organizational Leadership" },
  { id: "course_3", name: "GSB301: Financial Markets" },
  { id: "course_4", name: "GSB504: Business Strategy" }
];

const MOCK_ASSIGNMENTS = [
  {
    courseName: "GSB101: Data-Driven Decision Making",
    items: [
      {
        title: "Case Study: Netflix Analytics",
        description: "Analyze how Netflix uses data for content decisions",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        isReading: false
      },
      {
        title: "Reading: Introduction to Big Data",
        description: "Chapters 1-3 on data analytics fundamentals",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        isReading: true
      }
    ]
  },
  {
    courseName: "GSB202: Organizational Leadership",
    items: [
      {
        title: "Leadership Analysis Paper",
        description: "Analyze leadership styles at a Fortune 500 company",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        isReading: false
      }
    ]
  },
  {
    courseName: "GSB504: Business Strategy",
    items: [
      {
        title: "Case Study: Tesla's Market Strategy",
        description: "Analyze Tesla's approach to market disruption and innovation",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        isReading: false
      },
      {
        title: "Reading: Competitive Strategy",
        description: "Read Porter's Five Forces model and prepare discussion points",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        isReading: true
      },
      {
        title: "Group Project: Market Analysis",
        description: "With your assigned group, prepare a market analysis for an emerging industry",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isReading: false
      }
    ]
  }
];

class CanvasService {
  // Login to Canvas and establish a session
  async login(username: string, password: string): Promise<CanvasLoginResult> {
    try {
      log(`Attempting Canvas login with ${username}`, 'canvas');
      
      // For simplicity, we'll accept any non-empty credentials
      if (!username || !password) {
        return {
          success: false,
          error: 'Username and password are required'
        };
      }
      
      // Use environment variables if available
      const envUsername = process.env.CANVAS_USERNAME;
      const envPassword = process.env.CANVAS_PASSWORD;
      
      if (envUsername && envPassword) {
        // Validate against environment variables
        if (username !== envUsername || password !== envPassword) {
          return {
            success: false,
            error: 'Invalid username or password'
          };
        }
      }
      
      return {
        success: true,
        session: { username, password }
      };
    } catch (error) {
      log(`Canvas login error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'canvas');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during Canvas login'
      };
    }
  }
  
  // Get list of courses
  async fetchCourses(session: CanvasSession): Promise<CanvasCourse[]> {
    log(`Fetching courses for ${session.username}`, 'canvas');
    return MOCK_COURSES;
  }
  
  // Get assignments for courses
  async fetchHomework(session: CanvasSession, courses: CanvasCourse[]): Promise<CourseAssignments[]> {
    log(`Fetching assignments for ${session.username}`, 'canvas');
    return MOCK_ASSIGNMENTS;
  }
}

export const canvasService = new CanvasService();
