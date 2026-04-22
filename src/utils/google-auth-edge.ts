import * as jose from 'jose';

export async function getGoogleTokenEdge() {
    let projectId = process.env.GOOGLE_PROJECT_ID;
    let jsonContent = process.env.GOOGLE_CREDENTIALS_JSON;

    if (!jsonContent) {
        throw new Error("Missing GOOGLE_CREDENTIALS_JSON");
    }

    try {
        // Clean JSON string
        const cleanedJson = jsonContent.startsWith("'") || jsonContent.startsWith('"')
            ? jsonContent.slice(1, -1)
            : jsonContent;

        const credentials = JSON.parse(cleanedJson);
        const privateKey = credentials.private_key.replace(/\\n/g, '\n');
        const clientEmail = credentials.client_email;
        if (!projectId) projectId = credentials.project_id;

        // Create JWT
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 3600; // 1 hour

        const jwt = await new jose.SignJWT({
            scope: 'https://www.googleapis.com/auth/cloud-platform',
        })
            .setProtectedHeader({ alg: 'RS256' })
            .setIssuer(clientEmail)
            .setAudience('https://oauth2.googleapis.com/token')
            .setExpirationTime(exp)
            .setIssuedAt(iat)
            .sign(await jose.importPKCS8(privateKey, 'RS256'));

        // Exchange JWT for Access Token
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Google Auth Token Exchange Failed: ${error}`);
        }

        const data = await response.json();
        return { token: data.access_token, projectId };
    } catch (e: any) {
        console.error("Failed to generate Google Token in Edge:", e);
        throw e;
    }
}
