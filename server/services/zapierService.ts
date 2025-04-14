import { z } from 'zod';

// Types for Zapier integration
type GoogleDocRequest = {
  content: string;
  fileName: string;
  folderPath: string;
};

type GoogleDocResult = {
  success: boolean;
  docId?: string;
  docUrl?: string;
  error?: string;
};

class ZapierService {
  private zapierMcpWebhookUrl: string;
  
  constructor() {
    this.zapierMcpWebhookUrl = process.env.ZAPIER_MCP_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/dummy-webhook';
  }
  
  // Create a Google Doc via Zapier MCP
  async createGoogleDoc(request: GoogleDocRequest): Promise<GoogleDocResult> {
    try {
      // Validate the incoming request
      const schema = z.object({
        content: z.string(),
        fileName: z.string(),
        folderPath: z.string()
      });
      
      schema.parse(request);
      
      // Call Zapier webhook
      const response = await fetch(this.zapierMcpWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: request.content,
          fileName: request.fileName,
          folderPath: request.folderPath
        })
      });
      
      if (!response.ok) {
        throw new Error(`Zapier responded with status: ${response.status}`);
      }
      
      // Parse response
      const result = await response.json();
      
      return {
        success: true,
        docId: result.docId || 'mock-doc-id',
        docUrl: result.docUrl || 'https://docs.google.com/document/d/mock-doc-id/edit'
      };
    } catch (error) {
      console.error('Error creating Google Doc via Zapier:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const zapierService = new ZapierService();
