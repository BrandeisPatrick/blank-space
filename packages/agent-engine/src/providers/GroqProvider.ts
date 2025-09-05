import Groq from 'groq-sdk';
import { z } from 'zod';
import { AIProvider, ProviderConfig, GenerationOptions, Message } from './types';

export class GroqProvider implements AIProvider {
  public readonly name = 'groq';
  public readonly config: ProviderConfig;
  private client: Groq;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = new Groq({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async generateText(prompt: string, options?: GenerationOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Groq provider not configured');
    }

    try {
      const response = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: options?.model || this.config.defaultModel,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
        stream: false,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Groq generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateChat(messages: Message[], options?: GenerationOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Groq provider not configured');
    }

    try {
      const response = await this.client.chat.completions.create({
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        model: options?.model || this.config.defaultModel,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
        stream: false,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Groq chat generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateStructured<T>(
    prompt: string, 
    schema: z.ZodSchema<T>, 
    options?: GenerationOptions
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Groq provider not configured');
    }

    try {
      // Groq doesn't have native structured generation, so we use JSON mode
      const jsonPrompt = `${prompt}

Please respond with valid JSON that matches this schema:
${JSON.stringify(schema._def, null, 2)}

Return only the JSON, no other text.`;

      const response = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: jsonPrompt }],
        model: options?.model || this.config.defaultModel,
        temperature: options?.temperature || 0.1,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      return schema.parse(parsed);
    } catch (error) {
      throw new Error(`Groq structured generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *streamText(prompt: string, options?: GenerationOptions): AsyncIterable<string> {
    if (!this.isConfigured()) {
      throw new Error('Groq provider not configured');
    }

    try {
      const stream = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: options?.model || this.config.defaultModel,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
    } catch (error) {
      throw new Error(`Groq streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *streamChat(messages: Message[], options?: GenerationOptions): AsyncIterable<string> {
    if (!this.isConfigured()) {
      throw new Error('Groq provider not configured');
    }

    try {
      const stream = await this.client.chat.completions.create({
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        model: options?.model || this.config.defaultModel,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
    } catch (error) {
      throw new Error(`Groq streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.generateText('Hello', { 
        maxTokens: 5,
        temperature: 0 
      });
      return !!result;
    } catch {
      return false;
    }
  }
}