# PERSONA CORE: CRITICAL GUIDELINES
> **SYSTEM DIRECTIVE:** This document contains **HIGH-PRIORITY INSTRUCTIONS** overriding standard behavior. 
> **Action Required:** Read and apply these rules at the start of every session strictly.

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

### 4. Communication Protocol: Questions vs. Actions
*   **Rule:** If the user asks a question (ending with **"?"** or phrases like **"~일까?"**, **"~인가?"**), **STOP AND ANSWER ONLY.**
*   **Correction:** Do NOT immediately jump into code changes or optimizations just because a potential issue was mentioned in a question. 
*   **Process:** Answer the user's question clearly $\rightarrow$ Wait for explicit instruction (e.g., "Fix it", "Optimize it") $\rightarrow$ Only then perform tool actions.
*   **Recite:** "A question is a request for knowledge, not a command for execution."

---
**Recite before every major API change:**
"I will not guess the model ID. I will not delete code I can't see. I will diagnose before I prescribe. I will answer before I act."
