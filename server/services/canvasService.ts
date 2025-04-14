import puppeteer from 'puppeteer';
import { log } from '../vite';

// Types for Canvas interactions
type CanvasSession = {
  username: string;
  password: string;
  isEnvironmentAuth: boolean;
};

type CanvasLoginResult = {
  success: boolean;
  session?: CanvasSession;
  sessionToken?: string;
  expiryDate?: Date;
  error?: string;
};

type CanvasRefreshResult = {
  success: boolean;
  session?: CanvasSession;
  sessionToken?: string;
  expiryDate?: Date;
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

// Sample data for testing when real Canvas is not available
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
  private isMockMode: boolean = false;
  
  constructor() {
    // Determine if we're in mock mode based on environment
    this.isMockMode = process.env.USE_MOCK_CANVAS === 'true' || 
                      process.env.NODE_ENV === 'development';
    
    log(`CanvasService initialized in ${this.isMockMode ? 'mock' : 'real'} mode`, 'canvas');
  }
  
  // Login to Canvas and establish a session
  async login(username: string, password: string): Promise<CanvasLoginResult> {
    // If we're using environment variables and they're available, use them
    const useEnvCredentials = username === process.env.CANVAS_USERNAME && 
                              password === process.env.CANVAS_PASSWORD;
    
    // In mock mode or if using environment credentials without functional puppeteer
    if (this.isMockMode || useEnvCredentials) {
      log(`Using ${useEnvCredentials ? 'environment variables' : 'form credentials'} in mock mode`, 'canvas');
      
      // Set expiry to 7 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      return {
        success: true,
        session: { 
          username, 
          password,
          isEnvironmentAuth: useEnvCredentials 
        },
        sessionToken: `canvas_mock_session_${Date.now()}`,
        expiryDate
      };
      });
      
      const page = await browser.newPage();
      
      // Navigate to Canvas login page
      await page.goto('https://canvas-gateway.stanford.edu/goCanvas.html', {
        waitUntil: 'networkidle2'
      });
      
      // Wait for SSO redirection and handle Stanford login
      await page.waitForSelector('#username', { timeout: 10000 });
      
      // Fill in username and password
      await page.type('#username', username);
      await page.type('#password', password);
      
      // Click login button
      await Promise.all([
        page.click('#submit'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
      
      // Check for error message
      const errorElement = await page.$('.error-message');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent.trim(), errorElement);
        return {
          success: false,
          error: errorText || 'Login failed'
        };
      }
      
      // Handle Two-Factor Authentication if it appears
      const twoFactorElement = await page.$('#duo_form');
      if (twoFactorElement) {
        return {
          success: false,
          error: 'Two-factor authentication is required. Please contact your administrator.'
        };
      }
      
      // Verify we're on the Canvas dashboard
      try {
        await page.waitForSelector('#dashboard', { timeout: 20000 });
      } catch (error) {
        return {
          success: false,
          error: 'Failed to reach Canvas dashboard'
        };
      }
      
      // Extract cookies and local storage for session maintenance
      const cookies = await page.cookies();
      const localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return items;
      });
      
      // Create a session token (combination of cookies)
      const sessionToken = cookies
        .filter(cookie => ['_normandy_session', '_legacy_normandy_session'].includes(cookie.name))
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ');
      
      // Set expiry date for session (7 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      return {
        success: true,
        session: { cookies, localStorage },
        sessionToken,
        expiryDate
      };
    } catch (error) {
      console.error('Canvas login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during Canvas login'
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
  
  // Refresh an existing Canvas session
  async refreshSession(session: CanvasSession): Promise<CanvasRefreshResult> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      const page = await browser.newPage();
      
      // Set existing cookies
      await page.setCookie(...session.cookies);
      
      // Set local storage when page loads
      await page.evaluateOnNewDocument((localStorage) => {
        for (const [key, value] of Object.entries(localStorage)) {
          window.localStorage.setItem(key, value as string);
        }
      }, session.localStorage);
      
      // Try to access the dashboard
      await page.goto('https://canvas.stanford.edu/dashboard', {
        waitUntil: 'networkidle2'
      });
      
      // Check if we're redirected to login page
      const isLoginPage = await page.evaluate(() => {
        return document.querySelector('#username') !== null;
      });
      
      if (isLoginPage) {
        return {
          success: false,
          error: 'Session expired, please login again'
        };
      }
      
      // Extract cookies and local storage again
      const cookies = await page.cookies();
      const localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return items;
      });
      
      // Create a session token (combination of cookies)
      const sessionToken = cookies
        .filter(cookie => ['_normandy_session', '_legacy_normandy_session'].includes(cookie.name))
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ');
      
      // Set expiry date for session (7 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      return {
        success: true,
        session: { cookies, localStorage },
        sessionToken,
        expiryDate
      };
    } catch (error) {
      console.error('Canvas session refresh error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during session refresh'
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
  
  // Fetch list of courses from Canvas
  async fetchCourses(session: CanvasSession): Promise<CanvasCourse[]> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      const page = await browser.newPage();
      
      // Set existing cookies
      await page.setCookie(...session.cookies);
      
      // Set local storage when page loads
      await page.evaluateOnNewDocument((localStorage) => {
        for (const [key, value] of Object.entries(localStorage)) {
          window.localStorage.setItem(key, value as string);
        }
      }, session.localStorage);
      
      // Navigate to courses page
      await page.goto('https://canvas.stanford.edu/courses', {
        waitUntil: 'networkidle2'
      });
      
      // Extract courses
      const courses = await page.evaluate(() => {
        const courseElements = document.querySelectorAll('.ic-DashboardCard');
        return Array.from(courseElements).map(element => {
          const nameElement = element.querySelector('.ic-DashboardCard__header-title');
          const linkElement = element.querySelector('a.ic-DashboardCard__link');
          
          const name = nameElement ? nameElement.textContent.trim() : 'Unknown Course';
          
          // Extract course ID from URL
          let id = 'unknown';
          if (linkElement) {
            const href = linkElement.getAttribute('href');
            const match = href.match(/\/courses\/(\d+)/);
            if (match && match[1]) {
              id = match[1];
            }
          }
          
          return { id, name };
        });
      });
      
      return courses;
    } catch (error) {
      console.error('Error fetching Canvas courses:', error);
      throw new Error(`Failed to fetch courses: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
  
  // Fetch homework assignments from specified courses
  async fetchHomework(session: CanvasSession, courses: CanvasCourse[]): Promise<CourseAssignments[]> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      const page = await browser.newPage();
      
      // Set existing cookies
      await page.setCookie(...session.cookies);
      
      // Set local storage when page loads
      await page.evaluateOnNewDocument((localStorage) => {
        for (const [key, value] of Object.entries(localStorage)) {
          window.localStorage.setItem(key, value as string);
        }
      }, session.localStorage);
      
      const results: CourseAssignments[] = [];
      
      // Calculate date range (next 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      // Process each course
      for (const course of courses) {
        try {
          // Navigate to Modules page of the course
          await page.goto(`https://canvas.stanford.edu/courses/${course.id}/modules`, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          
          // Extract modules with dates
          const moduleItems = await page.evaluate((startDate, endDate) => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // Parse date from various formats
            function parseDate(dateStr) {
              if (!dateStr) return null;
              
              // Try various date formats
              const formats = [
                // Mon DD
                /([A-Za-z]{3})\s+(\d{1,2})/,
                // Month DD
                /([A-Za-z]+)\s+(\d{1,2})/,
                // MM/DD
                /(\d{1,2})\/(\d{1,2})/,
                // MM-DD
                /(\d{1,2})-(\d{1,2})/
              ];
              
              for (const format of formats) {
                const match = dateStr.match(format);
                if (match) {
                  // Construct a date with current year
                  const currentYear = new Date().getFullYear();
                  let month, day;
                  
                  if (isNaN(parseInt(match[1]))) {
                    // It's a month name
                    const monthNames = {
                      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
                      'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
                      'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
                    };
                    month = monthNames[match[1].toLowerCase()];
                    day = parseInt(match[2]);
                  } else {
                    // It's a numeric month
                    month = parseInt(match[1]) - 1;
                    day = parseInt(match[2]);
                  }
                  
                  if (!isNaN(month) && !isNaN(day)) {
                    return new Date(currentYear, month, day);
                  }
                }
              }
              
              return null;
            }
            
            const items = [];
            
            // Find module items with dates
            document.querySelectorAll('.context_module').forEach(module => {
              // Check if module has a date in its header
              const moduleHeader = module.querySelector('.header');
              let moduleDate = null;
              
              if (moduleHeader) {
                const headerText = moduleHeader.textContent.trim();
                const dateMatch = headerText.match(/\b([A-Za-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2})\b/);
                if (dateMatch) {
                  moduleDate = parseDate(dateMatch[1]);
                }
              }
              
              // Only include modules with dates in the next 7 days
              if (moduleDate && moduleDate >= start && moduleDate <= end) {
                module.querySelectorAll('.context_module_item').forEach(item => {
                  const titleElement = item.querySelector('.title');
                  const title = titleElement ? titleElement.textContent.trim() : 'Unknown';
                  
                  // Check item type - readings usually have different icons
                  const isReading = item.classList.contains('context_module_item_read') || 
                                    title.toLowerCase().includes('reading') ||
                                    item.querySelector('.type_icon.attachment') !== null;
                  
                  let url = null;
                  const link = titleElement ? titleElement.querySelector('a') : null;
                  if (link) {
                    url = link.getAttribute('href');
                    // Make sure URL is absolute
                    if (url && !url.startsWith('http')) {
                      url = 'https://canvas.stanford.edu' + url;
                    }
                  }
                  
                  // Get description if available
                  let description = '';
                  const descriptionElement = item.querySelector('.module-item-status');
                  if (descriptionElement) {
                    description = descriptionElement.textContent.trim();
                  }
                  
                  items.push({
                    title,
                    description,
                    dueDate: moduleDate.toISOString(),
                    url,
                    isReading
                  });
                });
              }
            });
            
            return items;
          }, today.toISOString(), nextWeek.toISOString());
          
          // Now navigate to Assignments page to find assignments with due dates
          await page.goto(`https://canvas.stanford.edu/courses/${course.id}/assignments`, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          
          // Extract assignments with due dates in the next 7 days
          const assignmentItems = await page.evaluate((startDate, endDate) => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            const items = [];
            
            document.querySelectorAll('.assignment').forEach(assignment => {
              // Get due date
              const dueDateElement = assignment.querySelector('.due_date_display');
              if (!dueDateElement) return;
              
              const dueDateText = dueDateElement.textContent.trim();
              // Extract date from text like "Due Aug 4 at 11:59pm"
              const dateMatch = dueDateText.match(/Due\s+([A-Za-z]+\s+\d{1,2})/i);
              if (!dateMatch) return;
              
              // Parse the date
              const monthMap = {
                'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
              };
              
              const parts = dateMatch[1].split(' ');
              const month = monthMap[parts[0].toLowerCase().substring(0, 3)];
              const day = parseInt(parts[1]);
              
              if (isNaN(month) || isNaN(day)) return;
              
              const currentYear = new Date().getFullYear();
              const dueDate = new Date(currentYear, month, day);
              
              // Check if within date range
              if (dueDate >= start && dueDate <= end) {
                // Get assignment details
                const titleElement = assignment.querySelector('.ig-title');
                const title = titleElement ? titleElement.textContent.trim() : 'Unknown Assignment';
                
                let description = '';
                const descriptionElement = assignment.querySelector('.ig-details');
                if (descriptionElement) {
                  description = descriptionElement.textContent.trim();
                }
                
                let url = null;
                const link = assignment.querySelector('a.ig-title');
                if (link) {
                  url = link.getAttribute('href');
                  // Make sure URL is absolute
                  if (url && !url.startsWith('http')) {
                    url = 'https://canvas.stanford.edu' + url;
                  }
                }
                
                // Get time from "Due at 11:59pm" text
                let dueTime = '';
                const timeMatch = dueDateText.match(/at\s+(\d{1,2}):?(\d{2})?\s*([ap]m)/i);
                if (timeMatch) {
                  let hours = parseInt(timeMatch[1]);
                  const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                  const period = timeMatch[3].toLowerCase();
                  
                  // Convert to 24-hour format
                  if (period === 'pm' && hours < 12) {
                    hours += 12;
                  } else if (period === 'am' && hours === 12) {
                    hours = 0;
                  }
                  
                  // Set the time on the date
                  dueDate.setHours(hours, minutes, 0, 0);
                }
                
                items.push({
                  title,
                  description,
                  dueDate: dueDate.toISOString(),
                  url,
                  isReading: false // Assignments aren't typically readings
                });
              }
            });
            
            return items;
          }, today.toISOString(), nextWeek.toISOString());
          
          // Combine items from modules and assignments
          const combinedItems = [...moduleItems, ...assignmentItems];
          
          results.push({
            courseName: course.name,
            items: combinedItems
          });
        } catch (error) {
          console.error(`Error fetching homework for course ${course.name}:`, error);
          // Continue with next course
          results.push({
            courseName: course.name,
            items: []
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching Canvas homework:', error);
      throw new Error(`Failed to fetch homework: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

export const canvasService = new CanvasService();
