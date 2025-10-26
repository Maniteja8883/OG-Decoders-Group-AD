'use server';

/**
 * @fileOverview A career chat assistant that uses a user profile and a knowledge base to answer career-specific questions.
 *
 * - careerChatAssistant - A function that handles the career chat assistant process.
 * - CareerChatAssistantInput - The input type for the careerChatAssistant function.
 * - CareerChatAssistantOutput - The return type for the careerChatAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CareerChatAssistantInputSchema = z.object({
  profile: z.string().describe('The user profile.'),
  query: z.string().describe('The user query.'),
});
export type CareerChatAssistantInput = z.infer<typeof CareerChatAssistantInputSchema>;

const CareerChatAssistantOutputSchema = z.object({
  answer: z.string().describe('The answer to the user query.'),
});
export type CareerChatAssistantOutput = z.infer<typeof CareerChatAssistantOutputSchema>;

export async function careerChatAssistant(input: CareerChatAssistantInput): Promise<CareerChatAssistantOutput> {
  return careerChatAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'careerChatAssistantPrompt',
  input: {schema: CareerChatAssistantInputSchema},
  output: {schema: CareerChatAssistantOutputSchema},
  prompt: `You are an expert career counselor.

You have access to a knowledge base of career information.
You also have access to the user's profile.

Use this information to answer the user's query.

User Profile: {{{profile}}}
User Query: {{{query}}}
`,
});

const careerChatAssistantFlow = ai.defineFlow(
  {
    name: 'careerChatAssistantFlow',
    inputSchema: CareerChatAssistantInputSchema,
    outputSchema: CareerChatAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
