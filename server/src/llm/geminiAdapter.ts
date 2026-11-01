import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, ReportJson, ReportJsonSchema } from './types.js';

export class GeminiAdapter implements LLMProvider {
  name = 'Google Gemini Adapter';
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
    if (!apiKey) {
      throw new Error('Gemini API key is required to initialize GeminiAdapter.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async generateReport(prompt: string, systemInstruction: string): Promise<ReportJson> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2, // Low temperature for high factual accuracy
      },
      systemInstruction,
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (err: any) {
      throw new Error(`Failed to parse Gemini response as JSON: ${err.message}. Raw text: ${responseText.slice(0, 300)}`);
    }

    // Validate with Zod
    const validation = ReportJsonSchema.safeParse(parsed);
    if (!validation.success) {
      throw new Error(`Schema validation error: ${JSON.stringify(validation.error.format())}`);
    }

    return validation.data;
  }
}

