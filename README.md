# Stanford GSB Homework Tracker

A web application that automates tracking and summarizing Stanford GSB homework assignments by integrating with Canvas LMS and using AI for content processing.

## Overview

The Stanford GSB Homework Tracker simplifies the academic workflow for GSB students by:

1. Securely connecting to Canvas to extract homework assignments and readings
2. Processing and organizing assignments into a clear weekly view
3. Providing AI-powered summarization for PDF readings
4. Automating the creation of Google Docs for notes and summaries

This application helps students save time, stay organized, and better prepare for classes by automating tedious administrative tasks.

## Key Features

### Canvas Integration
- Secure Canvas login and session management
- Automated homework and reading extraction from specified Canvas courses
- Intelligent grouping of assignments by date and course

### AI-Powered Content Processing
- Canvas content is processed using Claude 3.7 Sonnet for clarity and structure
- PDF summarization using Google's Gemini 2.5 Pro model
- Intelligent extraction of key concepts and themes from academic papers

### Weekly Task Organization
- Aggregated to-do list display showing all assignments
- Assignments grouped by date with clear status indicators
- Visual distinction between readings and other assignment types

### PDF Summarization & Google Drive Integration
- Easy PDF upload interface with drag-and-drop support
- Automatic AI summarization of academic papers and readings
- Summaries are formatted and saved as Google Docs via Zapier
- Consistent naming convention for organized note-taking

## Technical Architecture

The application is built using a modern tech stack:

### Frontend
- React-based single-page application with responsive design
- UI components from ShadCN UI and Tailwind CSS
- Client-side state management with React Query

### Backend
- Node.js/Express server for API endpoints and service orchestration
- In-memory storage for development (PostgreSQL planned for production)
- API integrations with AI services (Anthropic Claude, Google Gemini)
- Zapier webhook integration for Google Docs creation

### AI Services
- **Claude 3.7 Sonnet**: Used for processing Canvas content to create structured summaries
- **Gemini 2.5 Pro**: Specialized for academic PDF summarization

### External Integrations
- **Canvas LMS**: Source for course materials and assignments
- **Zapier MCP**: Creates Google Docs from AI-generated summaries
- **Google Drive**: Storage for summarized documents and notes

## Getting Started

### Prerequisites
- Node.js 18 or higher
- Environment variables for API keys:
  - `ANTHROPIC_API_KEY`: For Claude 3.7 API access
  - `GOOGLE_AI_API_KEY`: For Gemini 2.5 Pro API access
  - `ZAPIER_MCP_WEBHOOK_URL`: For Google Drive integration
  - (Optional) `CANVAS_USERNAME` and `CANVAS_PASSWORD`: For automated Canvas login

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with required API keys
4. Start the development server:
   ```
   npm run dev
   ```

### Configuration

The application allows customization of:
- Google Drive folder path for summaries
- File naming convention for generated documents
- Canvas course selection and filtering

## Development Roadmap

### V1 (Current)
- Canvas authentication and homework extraction
- AI processing of Canvas content
- PDF summarization with Gemini
- Google Docs creation via Zapier

### V2 (Planned)
- PostgreSQL database implementation
- Support for multiple Canvas instances/accounts
- Analytics dashboard showing homework completion metrics
- Collaborative features for study groups

### V3 (Future)
- Mobile app version
- Calendar integration
- Advanced AI tutoring based on course materials
- Lecture recording transcription and summarization

## Security Notes

This application prioritizes security:
- Canvas credentials can be stored as environment variables
- No credentials are exposed in frontend code
- All API keys are handled server-side only
- Session management follows security best practices

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Stanford GSB for the inspiration
- Anthropic (Claude) and Google (Gemini) for AI capabilities
- Zapier for workflow automation