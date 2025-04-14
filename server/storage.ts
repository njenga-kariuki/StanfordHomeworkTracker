import { 
  users, courses, assignments, summaries, settings,
  type User, type InsertUser,
  type Course, type InsertCourse,
  type Assignment, type InsertAssignment,
  type Summary, type InsertSummary,
  type Settings, type InsertSettings
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCanvasToken(id: number, canvasToken: string): Promise<User | undefined>;
  
  // Course methods
  getCourses(userId: number): Promise<Course[]>;
  getCourseByName(userId: number, name: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, active: boolean): Promise<Course | undefined>;
  
  // Assignment methods
  getAssignmentsByDate(userId: number, startDate: Date, endDate: Date): Promise<Assignment[]>;
  getAssignmentsByCourse(courseId: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignmentProcessed(id: number, processedContent: string): Promise<Assignment | undefined>;
  deleteAssignmentsByCourse(courseId: number): Promise<void>;
  
  // Summary methods
  getSummaries(userId: number): Promise<Summary[]>;
  createSummary(summary: InsertSummary): Promise<Summary>;
  
  // Settings methods
  getSettings(userId: number): Promise<Settings | undefined>;
  createSettings(setting: InsertSettings): Promise<Settings>;
  updateSettings(userId: number, settings: Partial<InsertSettings>): Promise<Settings | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private assignments: Map<number, Assignment>;
  private summaries: Map<number, Summary>;
  private userSettings: Map<number, Settings>;
  
  private currentUserId: number;
  private currentCourseId: number;
  private currentAssignmentId: number;
  private currentSummaryId: number;
  private currentSettingsId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.assignments = new Map();
    this.summaries = new Map();
    this.userSettings = new Map();
    
    this.currentUserId = 1;
    this.currentCourseId = 1;
    this.currentAssignmentId = 1;
    this.currentSummaryId = 1;
    this.currentSettingsId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, lastLoginAt: null };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserCanvasToken(id: number, canvasToken: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, canvasToken, lastLoginAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Course methods
  async getCourses(userId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      course => course.userId === userId
    );
  }
  
  async getCourseByName(userId: number, name: string): Promise<Course | undefined> {
    return Array.from(this.courses.values()).find(
      course => course.userId === userId && course.name === name
    );
  }
  
  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.currentCourseId++;
    const newCourse: Course = { ...course, id };
    this.courses.set(id, newCourse);
    return newCourse;
  }
  
  async updateCourse(id: number, active: boolean): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, active };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }
  
  // Assignment methods
  async getAssignmentsByDate(userId: number, startDate: Date, endDate: Date): Promise<Assignment[]> {
    // Get all courses for this user
    const userCourses = await this.getCourses(userId);
    const courseIds = userCourses.filter(c => c.active).map(c => c.id);
    
    // Filter assignments by course and date range
    return Array.from(this.assignments.values()).filter(assignment => {
      return courseIds.includes(assignment.courseId) && 
             assignment.dueDate !== null &&
             assignment.dueDate >= startDate &&
             assignment.dueDate <= endDate;
    });
  }
  
  async getAssignmentsByCourse(courseId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      assignment => assignment.courseId === courseId
    );
  }
  
  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const id = this.currentAssignmentId++;
    const newAssignment: Assignment = { ...assignment, id };
    this.assignments.set(id, newAssignment);
    return newAssignment;
  }
  
  async updateAssignmentProcessed(id: number, processedContent: string): Promise<Assignment | undefined> {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;
    
    const updatedAssignment = { 
      ...assignment, 
      processed: true, 
      processedContent 
    };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }
  
  async deleteAssignmentsByCourse(courseId: number): Promise<void> {
    for (const [id, assignment] of this.assignments.entries()) {
      if (assignment.courseId === courseId) {
        this.assignments.delete(id);
      }
    }
  }
  
  // Summary methods
  async getSummaries(userId: number): Promise<Summary[]> {
    return Array.from(this.summaries.values()).filter(
      summary => summary.userId === userId
    );
  }
  
  async createSummary(summary: InsertSummary): Promise<Summary> {
    const id = this.currentSummaryId++;
    const newSummary: Summary = { 
      ...summary, 
      id, 
      createdAt: new Date() 
    };
    this.summaries.set(id, newSummary);
    return newSummary;
  }
  
  // Settings methods
  async getSettings(userId: number): Promise<Settings | undefined> {
    return Array.from(this.userSettings.values()).find(
      setting => setting.userId === userId
    );
  }
  
  async createSettings(setting: InsertSettings): Promise<Settings> {
    const id = this.currentSettingsId++;
    const newSettings: Settings = { ...setting, id };
    this.userSettings.set(id, newSettings);
    return newSettings;
  }
  
  async updateSettings(userId: number, updatedSettings: Partial<InsertSettings>): Promise<Settings | undefined> {
    const settings = Array.from(this.userSettings.values()).find(
      setting => setting.userId === userId
    );
    
    if (!settings) return undefined;
    
    const newSettings = { ...settings, ...updatedSettings };
    this.userSettings.set(settings.id, newSettings);
    return newSettings;
  }
}

// Export storage instance
export const storage = new MemStorage();
