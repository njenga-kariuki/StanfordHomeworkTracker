# Stanford GSB Homework Tracker

A 2025 academic workflow prototype built by Njenga Kariuki: bring course tasks into a weekly view, organize them with an LLM, and send reading summaries into a document workflow.

## Implementation

The React and TypeScript interface includes course selection, assignment grouping, settings and a PDF upload flow. An Express backend connects the interface to separate Canvas, language-model and Zapier service modules, with session handling and in-memory storage.

The source contains real Anthropic and Google Generative AI API calls and a configurable Zapier webhook request. It also makes the unfinished integration boundaries explicit:

- **Canvas:** login and course/assignment retrieval use a local mock service and sample assignments; this version does not scrape or authenticate with Stanford Canvas.
- **PDFs:** the upload interface is implemented, but the text-extraction function returns placeholder content before the summarization call.
- **Google Docs:** the webhook adapter is implemented; a configured Zapier workflow is needed to create a document.

These boundaries reflect where the prototype stopped in April 2025. The code is preserved as a record of the workflow and service orchestration work.

## Local exploration

Use Node.js and npm, run `npm ci`, then `npm run dev`. Start with dummy Canvas credentials and the included sample assignments; do not enter a real university password into the mock login.

For the LLM and webhook paths, provide your own environment variables through your shell or hosting environment. `.env.example` lists the configuration. The historical model identifiers may require updates before those calls can run. API calls can incur charges.

`npm run build` builds the client and server; `npm run check` runs TypeScript checking. The original design brief remains in [PROJECT.md](PROJECT.md) as the intended scope, which extends beyond the implemented prototype.

## Scope

This is a personal prototype with in-memory storage and demonstration authentication. It is not an official Stanford application or a service for handling real student accounts. No private course readings, student records or live credentials are included.

The package metadata specifies MIT. Stanford GSB provided the academic context; Anthropic, Google and Zapier provide the external services used by the integration code.
