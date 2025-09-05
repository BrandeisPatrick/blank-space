import { anthropic } from '@ai-sdk/anthropic';
import { generateText, generateObject, streamText } from 'ai';
import { z } from 'zod';
import { AIProvider, ProviderConfig, GenerationOptions, Message } from './types';

export class AnthropicProvider implements AIProvider {
  public readonly name = 'anthropic';
  public readonly config: ProviderConfig;
  private client: any;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async generateText(prompt: string, options?: GenerationOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic provider not configured');
    }

    try {
      const result = await generateText({
        model: this.client(options?.model || this.config.defaultModel),
        prompt,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        topP: options?.topP,
        stopSequences: options?.stop,
      });

      return result.text;
    } catch (error) {
      throw new Error(`Anthropic generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateChat(messages: Message[], options?: GenerationOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic provider not configured');
    }

    try {
      const result = await generateText({
        model: this.client(options?.model || this.config.defaultModel),
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        topP: options?.topP,
        stopSequences: options?.stop,
      });

      return result.text;
    } catch (error) {
      throw new Error(`Anthropic chat generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateStructured<T>(
    prompt: string, 
    schema: z.ZodSchema<T>, 
    options?: GenerationOptions
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic provider not configured');
    }

    try {
      const result = await generateObject({
        model: this.client(options?.model || this.config.defaultModel),
        prompt,
        schema,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        topP: options?.topP,
      });

      return result.object;
    } catch (error) {
      throw new Error(`Anthropic structured generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *streamText(prompt: string, options?: GenerationOptions): AsyncIterable<string> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic provider not configured');
    }

    try {
      const result = streamText({
        model: this.client(options?.model || this.config.defaultModel),
        prompt,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        topP: options?.topP,
        stopSequences: options?.stop,
      });

      for await (const delta of result.textStream) {
        yield delta;
      }
    } catch (error) {
      throw new Error(`Anthropic streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *streamChat(messages: Message[], options?: GenerationOptions): AsyncIterable<string> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic provider not configured');
    }

    try {
      const result = streamText({
        model: this.client(options?.model || this.config.defaultModel),
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        topP: options?.topP,
        stopSequences: options?.stop,
      });

      for await (const delta of result.textStream) {
        yield delta;
      }
    } catch (error) {
      throw new Error(`Anthropic streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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