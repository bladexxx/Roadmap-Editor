/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";

interface RoadmapData {
  title: string;
  subtitle: string;
  pillars: { id: string; name: string }[];
  timeframes: {
    id: string;
    title: string;
    deliverables: { [pillarId: string]: string[] };
  }[];
}

const handleImageGenApiResponse = (response: any, context: string): string => {
    if (!response.generatedImages || response.generatedImages.length === 0) {
        console.error(`Image generation for ${context} failed. No images were returned.`, { response });
        throw new Error(`The AI model did not return an image for the ${context}. This can happen due to safety filters or if the request is too complex.`);
    }

    const image = response.generatedImages[0];
    if (image.image?.imageBytes) {
        const base64ImageBytes: string = image.image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    }

    const errorMessage = `The AI model returned an unexpected response structure for ${context}.`;
    console.error(errorMessage, { response });
    throw new Error(errorMessage);
};

export const generateInfographic = async (data: RoadmapData): Promise<string> => {
    console.log('Starting infographic generation with data:', data);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const prompt = `
Generate a high-resolution, professional, and visually appealing infographic for a technology roadmap.

**Style Guidelines:**
- **Theme:** Modern, clean, and corporate. A dark theme is preferred. Use a professional color palette with deep blues, teals, and vibrant greens for highlights.
- **Layout:** A structured grid or matrix format. It should be easy to read, with strategic pillars as distinct rows and timeframes as columns.
- **Typography:** Use a clean, sans-serif font (like Inter or Helvetica). Ensure high contrast and readability. Use different font weights to create a clear visual hierarchy (e.g., bold for titles, regular for deliverables).
- **Iconography:** Include simple, modern icons next to each "Strategic Pillar" name to visually represent them. For example:
    - Core Platform & Architecture: an icon with connected nodes or a blueprint.
    - Hybrid Cloud & Security: a cloud with a shield icon.
    - Observability: a magnifying glass or a dashboard/monitoring icon.
    - GenAI Integration: a brain, a neural network, or a sparkle/AI icon.
- **Overall Feel:** Sophisticated, trustworthy, and forward-looking. Suitable for a presentation to executives. Do not include any placeholder text like "Lorem Ipsum".

**Content to Include:**

**Main Title:** ${data.title}
**Subtitle:** ${data.subtitle}

**Structure:**
The infographic must be a table or matrix with "Strategic Pillars" as rows and "Timeframes" as columns.

**Rows (Strategic Pillars):**
${data.pillars.map(p => `- ${p.name}`).join('\n')}

**Columns (Timeframes):**

${data.timeframes.map(t => `
**Column Title: ${t.title}**
Deliverables:
${data.pillars.map(p => `
- **For Pillar "${p.name}":**
  ${(t.deliverables[p.id] || []).map(d => `  - ${d}`).join('\n')}
`).join('')}
`).join('\n')}

Please generate the image based on these detailed instructions. The output must be a single, complete infographic image.
`;

    console.log('Sending prompt to the image generation model...');
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '16:9',
        },
    });
    console.log('Received response from model.', response);

    return handleImageGenApiResponse(response, 'infographic');
};
