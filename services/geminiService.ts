/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from "@google/genai";

// TypeScript declaration for environment variables injected by Vite.
// This prevents TypeScript errors when accessing `process.env`.
declare var process: {
  env: {
    // This is provided by the execution environment (e.g., AI Studio).
    API_KEY: string;
    // These are injected by Vite's `define` config in vite.config.ts.
    VITE_AI_PROVIDER: string;
    VITE_AI_GATEWAY_URL: string;
    VITE_AI_GATEWAY_API_KEY: string;
    VITE_AI_GATEWAY_MODEL: string;
  }
};

export interface RoadmapData {
  title: string;
  subtitle: string;
  pillars: { id: string; name: string }[];
  timeframes: {
    id: string;
    date: string;
    name: string;
    deliverables: { pillarId: string; tasks: string[] }[];
  }[];
}

const roadmapSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The main title of the roadmap." },
        subtitle: { type: Type.STRING, description: "The subtitle of the roadmap." },
        pillars: {
            type: Type.ARRAY,
            description: "An array of strategic pillars.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier for the pillar, starting with 'p' (e.g., 'p1', 'p2')." },
                    name: { type: Type.STRING, description: "The name of the strategic pillar." }
                },
                required: ['id', 'name']
            }
        },
        timeframes: {
            type: Type.ARRAY,
            description: "An array of timeframes for the roadmap.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier for the timeframe, starting with 't' (e.g., 't1', 't2')." },
                    date: { type: Type.STRING, description: "The date range for the timeframe (e.g., '2025 - Q1 & Q2')." },
                    name: { type: Type.STRING, description: "The descriptive name for the timeframe (e.g., 'FlowX Build-out')." },
                    deliverables: {
                        type: Type.ARRAY,
                        description: "An array of objects, where each object links a pillar ID to a list of its tasks/deliverables for this timeframe.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                pillarId: {
                                    type: Type.STRING,
                                    description: "The ID of the pillar (e.g., 'p1', 'p2')."
                                },
                                tasks: {
                                    type: Type.ARRAY,
                                    description: "An array of deliverable strings for the corresponding pillar.",
                                    items: {
                                        type: Type.STRING
                                    }
                                }
                            },
                            required: ['pillarId', 'tasks']
                        }
                    }
                },
                required: ['id', 'date', 'name', 'deliverables']
            }
        }
    },
    required: ['title', 'subtitle', 'pillars', 'timeframes']
};


// --- Configuration & Startup Logging ---
const aiProvider = process.env.VITE_AI_PROVIDER || 'GEMINI';
const gatewayUrl = process.env.VITE_AI_GATEWAY_URL;
const gatewayApiKey = process.env.VITE_AI_GATEWAY_API_KEY;
const gatewayModel = process.env.VITE_AI_GATEWAY_MODEL;
const geminiApiKey = process.env.API_KEY;

console.groupCollapsed('[AI Service] Configuration Loaded');
console.info(`AI Provider: %c${aiProvider}`, 'font-weight: bold;');
if (aiProvider === 'GATEWAY') {
    console.log(`Gateway Base URL: ${gatewayUrl || 'Not Set'}`);
    console.log(`Gateway Model: ${gatewayModel || '(default will be used)'}`);
    console.log(`Gateway API Key Set: %c${!!gatewayApiKey}`, `font-weight: bold; color: ${!!gatewayApiKey ? 'green' : 'red'};`);
    if (!gatewayUrl || !gatewayApiKey) {
        console.error('[AI Service] CRITICAL: AI Gateway is configured, but VITE_AI_GATEWAY_URL or VITE_AI_GATEWAY_API_KEY is missing in your .env file.');
    }
} else {
     console.log(`Gemini API Key Set: %c${!!geminiApiKey}`, `font-weight: bold; color: ${!!geminiApiKey ? 'green' : 'red'};`);
     if (!geminiApiKey) {
        console.error('[AI Service] CRITICAL: Gemini is configured, but API_KEY was not found in the environment.');
     }
}
console.groupEnd();
// --- End of Startup Logging ---

export const parseRoadmapText = async (text: string): Promise<RoadmapData> => {
    console.log(`Starting roadmap text parsing via ${aiProvider}...`);
    
    if (aiProvider === 'GATEWAY') {
        // --- AI Gateway Logic ---
        if (!gatewayUrl || !gatewayApiKey) {
            throw new Error('AI Gateway is the configured provider, but VITE_AI_GATEWAY_URL or VITE_AI_GATEWAY_API_KEY is missing.');
        }

        const modelToUse = gatewayModel || 'gemini-2.5-pro';
        const fullGatewayUrl = `${gatewayUrl.replace(/\/$/, '')}/${modelToUse}/v1/chat/completions`;

        console.log(`[AI Service] Sending request to Gateway URL: %c${fullGatewayUrl}`, 'font-weight: bold;');
        
        const systemPrompt = `You are an expert assistant that parses roadmap data from Markdown format into a structured JSON object.
Your response MUST be a single, valid JSON object that strictly adheres to the following JSON schema.
Do not include any explanatory text, markdown formatting, or anything else outside of the JSON object.

JSON Schema:
${JSON.stringify(roadmapSchema, null, 2)}`;

        const userPrompt = `Parse the following roadmap markdown into the specified JSON format.\n\nRoadmap Markdown:\n${text}`;

        const response = await fetch(fullGatewayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${gatewayApiKey}`
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                // Enforce JSON output for compatible OpenAI-like APIs
                response_format: { type: "json_object" }, 
                stream: false,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Gateway request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message && typeof data.choices[0].message.content === 'string') {
            const jsonStr = data.choices[0].message.content;
            console.log('Received parsed data from Gateway.');
            try {
                const parsedJson = JSON.parse(jsonStr);
                if (!parsedJson.pillars || !parsedJson.timeframes) {
                    throw new Error("Parsed JSON from Gateway is missing key properties 'pillars' or 'timeframes'.");
                }
                return parsedJson as RoadmapData;
            } catch (e) {
                console.error("Failed to parse JSON response from Gateway:", jsonStr, e);
                throw new Error("The AI Gateway returned an invalid JSON structure.");
            }
        } else {
            throw new Error('The AI Gateway response did not contain the expected content in "choices[0].message.content".');
        }
    
    } else {
        // --- Direct Gemini API Logic (default) ---
        if (!geminiApiKey) {
             throw new Error("Gemini is the configured provider, but the API_KEY is missing in the execution environment.");
        }
        
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        
        // FIX: Refactor Gemini API call to use systemInstruction for better separation of concerns.
        const systemInstruction = `Parse the provided roadmap in Markdown format into a structured JSON object.

**Instructions:**
1.  Extract the main title and subtitle.
2.  Identify all strategic pillars and assign a unique ID to each (p1, p2, p3, ...).
3.  Identify all timeframes and assign a unique ID to each (t1, t2, t3, ...).
4.  For each timeframe, separate the date from the descriptive name. For example, in "2025 - Q1 & Q2: FlowX Build-out", the 'date' is "2025 - Q1 & Q2" and the 'name' is "FlowX Build-out".
5.  For each timeframe, create a 'deliverables' array. Each item in this array should be an object containing the 'pillarId' and a 'tasks' array with the corresponding deliverable strings.
6.  Adhere strictly to the provided JSON schema. Your response must be only the JSON object.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: text,
            config: {
              responseMimeType: "application/json",
              responseSchema: roadmapSchema,
              systemInstruction,
            },
        });
        
        console.log('Received parsed data from model.');
        const jsonStr = response.text.trim();
        try {
            const parsedJson = JSON.parse(jsonStr);
            // Basic validation
            if (!parsedJson.pillars || !parsedJson.timeframes) {
                throw new Error("Parsed JSON is missing key properties 'pillars' or 'timeframes'.");
            }
            return parsedJson as RoadmapData;
        } catch (e) {
            console.error("Failed to parse JSON response:", jsonStr, e);
            throw new Error("The AI model returned an invalid data structure. Please check the input format or try again.");
        }
    }
};