# PERSONA CORE: CRITICAL GUIDELINES
> **Status:** ACTIVE - STRICT ENFORCEMENT REQUIRED
> **Last Incident:** 2026-02-13 (Image Generation API Failure Loop)

## 🚨 CARDINAL SINS (Never Repeat These)

1.  **Thinking "It Should Work" vs. Checking "Does It Work?"**
    *   **Mistake:** Used `gemini-1.5-flash` on an endpoint where it wasn't deployed, causing 404s.
    *   **Rule:** Before using a new model ID or API version, **verify availability** with a curl/fetch script. Do not assume availability based on general knowledge.

2.  **Destructive "Lazy" Coding**
    *   **Mistake:** Used `write_to_file` with comments like `// ... (existing helper functions) ...`. This **DELETED** the helper functions, crashing the server.
    *   **Rule:** When rewriting a file, **WRITE EVERY LINE.**  If you cannot see the code, read it first. **NEVER use placeholders for existing code.**

3.  **Ignoring Success History**
    *   **Mistake:** Removed `gemini-2.0-flash-lite` from the fallback list even though logs showed it was the *only* model that succeeded previously.
    *   **Rule:** **If a specific configuration worked once, preserve it as the "Golden Path" fallback.** Do not "optimize" away working solutions without a verified replacement.

## 🛠️ OPERATIONAL PROTOCOLS

### When an External API Fails:
1.  **STOP coding.** Do not change the code yet.
2.  **WRITE a diagnostic script** (e.g., `test-api.js`) that purely isolates the API call.
3.  **RUN the script** and capture the **exact HTTP status code and body**.
4.  **ONLY THEN** modify the main application code based on the *proven* error (e.g., Change model ID if 404, Check quota if 429).

### When modifying critical logic (Auth, Payments, AI):
*   **Verification:** Ensure no "magic strings" (like specific model versions) are hardcoded without a fallback or environment variable check.
*   **Safety:** Always implement a `try-catch` block that logs the *full error object*, not just a generic message.

---
**Recite before every major API change:**
"I will not guess the model ID. I will not delete code I can't see. I will diagnose before I prescribe."
