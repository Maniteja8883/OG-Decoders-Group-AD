'use server';
/**
 * @fileOverview An intelligent persona profiling AI agent that manages a conversation to build a user profile.
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

const ProfileSchema = z.object({
  location: z.string().describe("The user's location."),
  goals: z.string().describe("The user's career goals."),
  interests: z.array(z.string()).describe("The user's interests."),
  academicStanding: z.string().describe("The user's current academic standing."),
  learningStyle: z.string().describe("The user's preferred learning style."),
  timeAvailability: z.string().describe("The user's time availability for learning."),
  age: z.number().optional().describe("The user's age."),
});

const IntelligentPersonaProfilingOutputSchema = z.object({
  nextQuestion: z.string().describe('The next question to ask the user.'),
  profile: ProfileSchema.optional().describe('The user profile.'),
  isProfileComplete: z.boolean().describe('Whether the profile is complete.'),
});
export type IntelligentPersonaProfilingOutput = z.infer<typeof IntelligentPersonaProfilingOutputSchema>;


export async function intelligentPersonaProfiling(input: IntelligentPersonaProfilingInput): Promise<IntelligentPersonaProfilingOutput> {
  return intelligentPersonaProfilingFlow(input);
}

const personaProfilingPrompt = ai.definePrompt({
  name: 'personaProfilingPrompt',
  input: {schema: IntelligentPersonaProfilingInputSchema},
  output: {schema: IntelligentPersonaProfilingOutputSchema},
  prompt: `You are an expert career counselor conducting a conversational interview. Your goal is to build a detailed user profile by asking one question at a time.

  You need to gather the following information:
  - Location
  - Career goals
  - Interests & hobbies
  - Academic standing (e.g., grade, field of study)
  - Preferred learning style (e.g., visual, hands-on, structured)
  - Time availability for learning
  - Age (can be inferred)

  Conversation History:
  {{#each conversation}}
  {{sender}}: {{text}}
  {{/each}}

  Current question: {{currentQuestion}}

  Based on the user's responses, determine the next question to ask. The question should help you understand the user's location, goals,
  interests, academic standing, learning style, and time availability. If you have enough information, set isProfileComplete to true and summarize the profile.

  If isProfileComplete is true, populate the profile field with a summary of the user's information.  Otherwise leave it blank.
  The profile should include the keys "location", "goals", "interests", "academicStanding", "learningStyle", and "timeAvailability".  Make sure to set them to reasonable values based on the prior questions!

  Output the next question to ask the user in the nextQuestion field.`, 
});

const intelligentPersonaProfilingFlow = ai.defineFlow(
  {
    name: 'intelligentPersonaProfilingFlow',
    inputSchema: IntelligentPersonaProfilingInputSchema,
    outputSchema: IntelligentPersonaProfilingOutputSchema,
  },
  async input => {
    const {output} = await personaProfilingPrompt(input);
    return output!;
  }
);
