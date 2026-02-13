# AI Development Log & Post-Mortem - 2026-02-13

## Incident: Image Generation & Translation API Failures

### 1. The Core Mistakes
*   **Model Hallucination/Assumption**: I repeatedly attempted to use `gemini-1.5-flash` and `gemini-1.5-flash-001` on endpoints (`v1beta` Free Tier & Vertex AI) where they were not enabled or did not exist for the user's project. This resulted in persistent `404 Not Found` errors.
*   **Destructive Code Editing**: In an attempt to fix logic quickly, I used `write_to_file` with comments like `// ... (existing helper functions) ...`. This wiped out essential logic, causing `500 Internal Server Errors`. **Lesson**: `write_to_file` overwrites *everything*. Never use placeholders for existing code unless using a patch tool.
*   **Regression of Working Features**: I removed `gemini-2.0-flash-lite` from the Vertex AI fallback list, despite logs showing it was the *only* model that had previously succeeded.
*   **Blind Debugging**: I spent too many turns guessing the cause (API key? Rate limit?) instead of immediately writing a small diagnostic script to check the HTTP status codes and response bodies.

### 2. The Solution (What Worked)
*   **Diagnostic Scripting**: Wrote `test-ai.js` to manually hit the endpoints. This proved definitively that the models I was trying to use returned `404`.
*   **Model Standardization**:
    *   **Free Tier (AI Studio)**: Switched to `gemini-pro` (Stable, v1beta).
    *   **Paid Tier (Vertex AI)**: Restored `gemini-2.0-flash-lite-preview-02-05` (Proven working) and added `gemini-1.0-pro-001` (Stable fallback).
*   **Strict 3-Layer Architecture**:
    1.  **Gemini Nano (Local)**: High priority. If client sends `preRefinedPrompt`, server skips all AI calls.
    2.  **AI Studio (Free)**: First server-side attempt.
    3.  **Vertex AI (Paid)**: Final fallback.
*   **Robust Auth**: Switched to `GoogleAuth` library's auto-discovery (`GOOGLE_APPLICATION_CREDENTIALS`) instead of manual JSON parsing, reducing config errors.

### 3. Guidelines for Future AI Agent
1.  **NEVER use `write_to_file` with placeholders.** If you rewrite a file, write *every single line*.
2.  **Verify Model IDs.** Just because a model is "new" doesn't mean it's available in the user's specific Google Cloud Project region or API tier.
3.  **Preserve Working Configs.** If a specific seemingly random string (like `gemini-2.0-flash-lite-preview-02-05`) works, **keep it**. It works for a reason.
4.  **Diagnose before Fixing.** If an API integration fails twice, stop coding. Write a script to `curl` or `fetch` the endpoint and see the raw error.
