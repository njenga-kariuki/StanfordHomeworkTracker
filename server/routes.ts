import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bodyParser from "body-parser";
import session from "express-session";
import createMemoryStore from "memorystore";
import { z } from "zod";
import { canvasService } from "./services/canvasService";
import { llmService } from "./services/llmService";
import { zapierService } from "./services/zapierService";
import { AssignmentsByDate, ProcessPdfRequest } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure sessions
  app.use(session({
    secret: process.env.SESSION_SECRET || 'REDACTED_SESSION_SECRET',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 days
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));

  // Parse request bodies
  app.use(bodyParser.json({ limit: '50mb' }));
  
  // ---------------------------
  // Canvas Authentication Routes
  // ---------------------------
  app.post('/api/auth/canvas', async (req: Request, res: Response) => {
    try {
      const credentials = z.object({
        username: z.string(),
        password: z.string()
      }).parse(req.body);
      
      // Try to log in to Canvas
      const canvasSession = await canvasService.login(credentials.username, credentials.password);
      
      if (!canvasSession.success) {
        return res.status(401).json({ message: canvasSession.error });
      }
      
      // Store the session in express-session
      req.session.canvasSession = canvasSession.session;
      req.session.username = credentials.username;
      
      // Update user canvas token in storage or create new user
      let user = await storage.getUserByUsername(credentials.username);
      if (user) {
        user = await storage.updateUserCanvasToken(user.id, canvasSession.sessionToken);
      } else {
        user = await storage.createUser({
          username: credentials.username,
          password: 'canvas-auth', // Not storing actual passwords
          canvasToken: canvasSession.sessionToken
        });
        
        // Initialize user settings
        await storage.createSettings({
          userId: user.id,
          driveFolderPath: "GSB/Course Summaries",
          fileNameFormat: "[Course] - [Date] Summary",
          lastCanvasScan: null,
          canvasSessionExpiry: canvasSession.expiryDate
        });
      }
      
      return res.status(200).json({ 
        message: 'Successfully logged in to Canvas',
        sessionValid: true,
        expiryDate: canvasSession.expiryDate
      });
    } catch (error) {
      console.error('Canvas login error:', error);
      return res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Invalid request'
      });
    }
  });
  
  app.get('/api/auth/status', (req: Request, res: Response) => {
    if (req.session.canvasSession) {
      return res.status(200).json({ 
        authenticated: true,
        username: req.session.username
      });
    } else {
      return res.status(200).json({ authenticated: false });
    }
  });
  
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
  
  app.post('/api/auth/refresh', async (req: Request, res: Response) => {
    if (!req.session.canvasSession) {
      return res.status(401).json({ message: 'Not authenticated with Canvas' });
    }
    
    try {
      const refreshResult = await canvasService.refreshSession(req.session.canvasSession);
      
      if (!refreshResult.success) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: refreshResult.error });
      }
      
      req.session.canvasSession = refreshResult.session;
      
      // Update the user's session token
      if (req.session.username) {
        const user = await storage.getUserByUsername(req.session.username);
        if (user) {
          await storage.updateUserCanvasToken(user.id, refreshResult.sessionToken);
          
          // Update session expiry in settings
          const userSettings = await storage.getSettings(user.id);
          if (userSettings) {
            await storage.updateSettings(user.id, {
              canvasSessionExpiry: refreshResult.expiryDate
            });
          }
        }
      }
      
      return res.status(200).json({ 
        message: 'Session refreshed successfully',
        expiryDate: refreshResult.expiryDate
      });
    } catch (error) {
      console.error('Session refresh error:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to refresh session'
      });
    }
  });
  
  // ---------------------------
  // Canvas Data Routes
  // ---------------------------
  app.get('/api/canvas/courses', async (req: Request, res: Response) => {
    if (!req.session.canvasSession) {
      return res.status(401).json({ message: 'Not authenticated with Canvas' });
    }
    
    try {
      const courses = await canvasService.fetchCourses(req.session.canvasSession);
      
      // Store courses for the user
      if (req.session.username) {
        const user = await storage.getUserByUsername(req.session.username);
        if (user) {
          // Get existing courses
          const existingCourses = await storage.getCourses(user.id);
          
          // Add new courses
          for (const course of courses) {
            const existingCourse = existingCourses.find(c => c.name === course.name);
            if (!existingCourse) {
              await storage.createCourse({
                userId: user.id,
                canvasId: course.id,
                name: course.name,
                active: true
              });
            }
          }
        }
      }
      
      return res.status(200).json(courses);
    } catch (error) {
      console.error('Error fetching Canvas courses:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch courses'
      });
    }
  });
  
  app.get('/api/canvas/homework', async (req: Request, res: Response) => {
    if (!req.session.canvasSession) {
      return res.status(401).json({ message: 'Not authenticated with Canvas' });
    }
    
    try {
      // We need the user to get their active courses
      if (!req.session.username) {
        return res.status(400).json({ message: 'Username not found in session' });
      }
      
      const user = await storage.getUserByUsername(req.session.username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get active courses for this user
      const userCourses = await storage.getCourses(user.id);
      const activeCourses = userCourses.filter(c => c.active);
      
      // Fetch assignments for each course
      const homeworkData = await canvasService.fetchHomework(
        req.session.canvasSession,
        activeCourses.map(c => ({ id: c.canvasId, name: c.name }))
      );
      
      // Process each course's assignments
      for (const courseData of homeworkData) {
        const course = activeCourses.find(c => c.name === courseData.courseName);
        if (!course) continue;
        
        // Clear existing assignments for this course
        await storage.deleteAssignmentsByCourse(course.id);
        
        // Process assignments with Claude
        if (courseData.items.length > 0) {
          const processedContent = await llmService.processCanvasContent(
            courseData.courseName,
            courseData.items
          );
          
          // Create new assignment records
          for (const item of courseData.items) {
            await storage.createAssignment({
              courseId: course.id,
              title: item.title,
              description: item.description || "",
              dueDate: item.dueDate ? new Date(item.dueDate) : null,
              url: item.url || "",
              isReading: item.isReading || false,
              processed: true,
              processedContent: processedContent
            });
          }
        }
      }
      
      // Update last scan time
      await storage.updateSettings(user.id, {
        lastCanvasScan: new Date()
      });
      
      // Get assignments for next 7 days
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      const assignments = await storage.getAssignmentsByDate(user.id, today, nextWeek);
      
      // Group assignments by date and course
      const assignmentsByDate: AssignmentsByDate[] = [];
      
      // Group assignments by date
      const assignmentMap = new Map<string, {
        date: string;
        dateObj: Date;
        assignments: Map<number, { 
          courseId: number;
          courseName: string;
          assignments: typeof assignments;
        }>;
      }>();
      
      for (const assignment of assignments) {
        if (!assignment.dueDate) continue;
        
        const dateStr = assignment.dueDate.toISOString().split('T')[0];
        
        if (!assignmentMap.has(dateStr)) {
          assignmentMap.set(dateStr, {
            date: dateStr,
            dateObj: new Date(assignment.dueDate),
            assignments: new Map()
          });
        }
        
        const dateGroup = assignmentMap.get(dateStr)!;
        
        // Find the course for this assignment
        const course = activeCourses.find(c => c.id === assignment.courseId);
        if (!course) continue;
        
        if (!dateGroup.assignments.has(course.id)) {
          dateGroup.assignments.set(course.id, {
            courseId: course.id,
            courseName: course.name,
            assignments: []
          });
        }
        
        dateGroup.assignments.get(course.id)!.assignments.push(assignment);
      }
      
      // Convert map to array
      for (const [_, dateGroup] of assignmentMap) {
        assignmentsByDate.push({
          date: dateGroup.date,
          dateObj: dateGroup.dateObj,
          assignments: Array.from(dateGroup.assignments.values())
        });
      }
      
      // Sort by date
      assignmentsByDate.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      
      return res.status(200).json({
        assignmentsByDate,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error fetching Canvas homework:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch homework'
      });
    }
  });
  
  app.post('/api/courses/update', async (req: Request, res: Response) => {
    if (!req.session.username) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const schema = z.object({
        courses: z.array(z.object({
          id: z.number(),
          active: z.boolean()
        }))
      });
      
      const { courses } = schema.parse(req.body);
      
      const user = await storage.getUserByUsername(req.session.username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update each course
      for (const course of courses) {
        await storage.updateCourse(course.id, course.active);
      }
      
      // Get updated courses
      const updatedCourses = await storage.getCourses(user.id);
      
      return res.status(200).json(updatedCourses);
    } catch (error) {
      console.error('Error updating courses:', error);
      return res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Invalid request'
      });
    }
  });
  
  // ---------------------------
  // PDF Summarization Routes
  // ---------------------------
  app.post('/api/pdf/summarize', async (req: Request, res: Response) => {
    if (!req.session.username) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const schema = z.object({
        courseName: z.string(),
        readingDate: z.string(),
        files: z.array(z.object({
          name: z.string(),
          content: z.string() // base64 encoded
        }))
      });
      
      const data = schema.parse(req.body) as ProcessPdfRequest;
      
      const user = await storage.getUserByUsername(req.session.username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Process each PDF file
      const results = [];
      
      for (const file of data.files) {
        try {
          // Extract text from PDF
          const pdfText = await llmService.extractTextFromPdf(file.content);
          
          // Summarize with Gemini
          const summary = await llmService.summarizePdfWithGemini(pdfText);
          
          // Get user settings for Google Drive integration
          const userSettings = await storage.getSettings(user.id);
          if (!userSettings) {
            throw new Error('User settings not found');
          }
          
          // Format filename according to user settings
          let fileName = userSettings.fileNameFormat;
          fileName = fileName.replace('[Course]', data.courseName);
          fileName = fileName.replace('[Date]', data.readingDate);
          
          // Create Google Doc via Zapier
          const docResult = await zapierService.createGoogleDoc({
            content: summary,
            fileName: fileName,
            folderPath: userSettings.driveFolderPath
          });
          
          // Store summary in database
          const summaryRecord = await storage.createSummary({
            userId: user.id,
            courseName: data.courseName,
            fileName: file.name,
            summaryDate: new Date(data.readingDate),
            summaryContent: summary,
            googleDocId: docResult.docId || "",
            googleDocUrl: docResult.docUrl || ""
          });
          
          results.push({
            fileName: file.name,
            success: true,
            summaryId: summaryRecord.id,
            googleDocUrl: docResult.docUrl
          });
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          results.push({
            fileName: file.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return res.status(200).json({ results });
    } catch (error) {
      console.error('Error summarizing PDFs:', error);
      return res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Invalid request'
      });
    }
  });
  
  app.get('/api/pdf/summaries', async (req: Request, res: Response) => {
    if (!req.session.username) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const user = await storage.getUserByUsername(req.session.username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const summaries = await storage.getSummaries(user.id);
      
      // Sort by created date, newest first
      summaries.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      return res.status(200).json(summaries);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch summaries'
      });
    }
  });
  
  // ---------------------------
  // Settings Routes
  // ---------------------------
  app.get('/api/settings', async (req: Request, res: Response) => {
    if (!req.session.username) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const user = await storage.getUserByUsername(req.session.username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const userSettings = await storage.getSettings(user.id);
      
      if (!userSettings) {
        return res.status(404).json({ message: 'Settings not found' });
      }
      
      return res.status(200).json(userSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch settings'
      });
    }
  });
  
  app.post('/api/settings', async (req: Request, res: Response) => {
    if (!req.session.username) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const schema = z.object({
        driveFolderPath: z.string().optional(),
        fileNameFormat: z.string().optional()
      });
      
      const data = schema.parse(req.body);
      
      const user = await storage.getUserByUsername(req.session.username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedSettings = await storage.updateSettings(user.id, data);
      
      if (!updatedSettings) {
        return res.status(404).json({ message: 'Settings not found' });
      }
      
      return res.status(200).json(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      return res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Invalid request'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
