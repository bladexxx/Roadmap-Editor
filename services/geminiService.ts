/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from "@google/genai";

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


export const parseRoadmapText = async (text: string): Promise<RoadmapData> => {
    console.log('Starting roadmap text parsing...');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const prompt = `
Parse the following roadmap, provided in Markdown format, into a structured JSON object.

**Instructions:**
1.  Extract the main title and subtitle.
2.  Identify all strategic pillars and assign a unique ID to each (p1, p2, p3, ...).
3.  Identify all timeframes and assign a unique ID to each (t1, t2, t3, ...).
4.  For each timeframe, separate the date from the descriptive name. For example, in "2025 - Q1 & Q2: FlowX Build-out", the 'date' is "2025 - Q1 & Q2" and the 'name' is "FlowX Build-out".
5.  For each timeframe, create a 'deliverables' array. Each item in this array should be an object containing the 'pillarId' and a 'tasks' array with the corresponding deliverable strings.
6.  Adhere strictly to the provided JSON schema.

**Roadmap Markdown:**
${text}
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: roadmapSchema,
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
};