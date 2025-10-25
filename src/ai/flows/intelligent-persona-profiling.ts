'use server';
/**
 * @fileOverview An intelligent persona profiling AI agent.
 *
 * - intelligentPersonaProfiling - A function that handles the persona profiling process.
 * - IntelligentPersonaProfilingInput - The input type for the intelligentPersonaProfiling function.
 * - IntelligentPersonaProfilingOutput - The return type for the intelligentPersonaProfiling function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentPersonaProfilingInputSchema = z.object({
  previousResponses: z.array(z.string()).optional().describe('The list of previous responses from the user.'),
  currentQuestion: z.string().optional().describe('The current question to ask the user.'),
});
export type IntelligentPersonaProfilingInput = z.infer<typeof IntelligentPersonaProfilingInputSchema>;

const IntelligentPersonaProfilingOutputSchema = z.object({
  nextQuestion: z.string().describe('The next question to ask the user.'),
  profile: z.record(z.string(), z.any()).optional().describe('The user profile.'),
  isProfileComplete: z.boolean().describe('Whether the profile is complete.'),
});
export type IntelligentPersonaProfilingOutput = z.infer<typeof IntelligentPersonaProfilingOutputSchema>;

export async function intelligentPersonaProfiling(input: IntelligentPersonaProfilingInput): Promise<IntelligentPersonaProfilingOutput> {
  return intelligentPersonaProfilingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentPersonaProfilingPrompt',
  input: {schema: IntelligentPersonaProfilingInputSchema},
  output: {schema: IntelligentPersonaProfilingOutputSchema},
  prompt: `You are an expert career counselor. Your goal is to build a user profile by asking a series of questions.

  Here's the user's previous responses:
  {{#each previousResponses}}
  - {{{this}}}
  {{/each}}

  Current question: {{currentQuestion}}

  Based on the user's responses, determine the next question to ask. The question should help you understand the user's location, goals,
  interests, academic standing, learning style, and time availability. If you have enough information, set isProfileComplete to true and summarize the profile.

  If isProfileComplete is true, populate the profile field with a summary of the user's information.  Otherwise leave it blank.
  The profile should include the keys "age", "location", "goals", "interests", "academicStanding", "learningStyle", and "timeAvailability".  Make sure to set them to reasonable values based on the prior questions!

  Output the next question to ask the user in the nextQuestion field.`, 
});

const intelligentPersonaProfilingFlow = ai.defineFlow(
  {
    name: 'intelligentPersonaProfilingFlow',
    inputSchema: IntelligentPersonaProfilingInputSchema,
    outputSchema: IntelligentPersonaProfilingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
