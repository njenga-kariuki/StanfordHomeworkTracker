import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Anthropic client
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-dummy-key',
});

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || 'dummy-key');

// Type for Canvas assignment items
type CanvasItem = {
  title: string;
  description?: string;
  dueDate?: string;
  url?: string;
  isReading?: boolean;
};

class LLMService {
  // Process Canvas content with Claude
  async processCanvasContent(courseName: string, items: CanvasItem[]): Promise<string> {
    try {
      // Format the content for Claude
      let prompt = `Please organize this raw Canvas information (assignments, readings, links for ${courseName}) into a clear, concise summary of tasks and materials for the student:\n\n`;
      
      // Add each item to the prompt
      items.forEach(item => {
        prompt += `Title: ${item.title}\n`;
        if (item.description) prompt += `Description: ${item.description}\n`;
        if (item.dueDate) {
          const date = new Date(item.dueDate);
          prompt += `Due Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
        }
        if (item.url) prompt += `URL: ${item.url}\n`;
        prompt += `Type: ${item.isReading ? 'Reading' : 'Assignment'}\n\n`;
      });
      
      // Call Anthropic API
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2, // Low temperature for more deterministic output
      });
      
      // Check the content and return the processed text
      const content = response.content[0];
      if ('text' in content) {
        return content.text;
      } else {
        return 'Content processed successfully';
      }
    } catch (error: unknown) {
      console.error('Error processing Canvas content with Claude:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Claude processing failed: ${errorMessage}`);
    }
  }
  
  // Extract text from PDF
  async extractTextFromPdf(pdfBase64: string): Promise<string> {
    try {
      // For now, we'll skip the actual PDF extraction due to compatibility issues
      // In a production environment, you would use a more robust solution like a
      // dedicated PDF microservice or a library better suited for server-side
      
      // This is a placeholder that returns enough text to continue the flow
      // In reality, we'd extract the actual text from the PDF
      
      console.log('PDF received for processing, length:', pdfBase64.length);
      
      // Return a placeholder message with metadata
      return `
        This is placeholder text for the PDF extraction.
        The PDF was received (${pdfBase64.substring(0, 100)}...)
        
        In a production environment, this would contain the actual
        text extracted from the PDF document. For this prototype,
        we'll simulate having extracted content so we can test the
        summarization features with Gemini.
        
        PDF files typically contain text, images, formatting, and structure.
        The extraction process would analyze all pages and retrieve readable content.
      `;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error extracting text from PDF:', errorMessage);
      throw new Error(`PDF text extraction failed: ${errorMessage}`);
    }
  }
  
  // Summarize PDF text with Gemini Pro
  async summarizePdfWithGemini(pdfText: string): Promise<string> {
    try {
      // Gemini has a context limit, so we need to truncate if necessary
      const maxLength = 30000; // Approximate max tokens for Gemini 2.5 Pro
      const truncatedText = pdfText.length > maxLength 
        ? pdfText.substring(0, maxLength) + "...[text truncated due to length]" 
        : pdfText;
      
      // Create a prompt for Gemini
      const prompt = `Summarize this academic text in detail, focusing on key concepts, arguments, and conclusions: \n\n${truncatedText}`;
      
      // Call Gemini API
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      });
      
      const response = result.response;
      return response.text();
    } catch (error: unknown) {
      console.error('Error summarizing PDF with Gemini:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Gemini summarization failed: ${errorMessage}`);
    }
  }
}

export const llmService = new LLMService();
