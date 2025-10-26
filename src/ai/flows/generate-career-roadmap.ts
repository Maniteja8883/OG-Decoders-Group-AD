'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a career roadmap mind map based on a user's profile.
 *
 * The flow takes a user profile as input and outputs a Mermaid.js syntax mind map.
 *
 * @exports {function} generateCareerRoadmap - The main function to trigger the flow.
 * @exports {type} GenerateCareerRoadmapInput - The input type for the generateCareerRoadmap function.
 * @exports {type} GenerateCareerRoadmapOutput - The return type for the generateCareerRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCareerRoadmapInputSchema = z.object({
  age: z.number().describe('The age of the user.'),
  location: z.string().describe('The location of the user.'),
  interests: z.array(z.string()).describe('The interests of the user.'),
  goals: z.string().describe('The career goals of the user.'),
  current_grade: z.string().describe('The current academic standing of the user.'),
  learning_style: z.string().describe('The learning style of the user.'),
  time_availability: z.string().describe('The time availability of the user.'),
});
export type GenerateCareerRoadmapInput = z.infer<typeof GenerateCareerRoadmapInputSchema>;

const GenerateCareerRoadmapOutputSchema = z.object({
  mindMap: z.string().describe('A Mermaid.js syntax mind map representing career paths.'),
});
export type GenerateCareerRoadmapOutput = z.infer<typeof GenerateCareerRoadmapOutputSchema>;

export async function generateCareerRoadmap(input: GenerateCareerRoadmapInput): Promise<GenerateCareerRoadmapOutput> {
  return generateCareerRoadmapFlow(input);
}

const generateCareerRoadmapPrompt = ai.definePrompt({
  name: 'generateCareerRoadmapPrompt',
  input: {schema: GenerateCareerRoadmapInputSchema},
  output: {schema: GenerateCareerRoadmapOutputSchema},
  prompt: `You are an expert career counselor. Based on the user's profile, generate a Mermaid.js syntax mind map visualizing potential career paths.

User Profile:
Age: {{{age}}}
Location: {{{location}}}
Interests: {{#each interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Goals: {{{goals}}}
Current Grade: {{{current_grade}}}
Learning Style: {{{learning_style}}}
Time Availability: {{{time_availability}}}

Here's an example of the Mermaid.js mindmap syntax:

graph TB
  A[Career] --> B(Sub-Domain 1)
  A --> C(Sub-Domain 2)
  B --> D{Required Skills}
  B --> E[Learning Resources]
  C --> F{Required Skills}
  C --> G[Learning Resources]


Based on their profile, here is the career roadmap in Mermaid.js syntax:
`,
});

const generateCareerRoadmapFlow = ai.defineFlow(
  {
    name: 'generateCareerRoadmapFlow',
    inputSchema: GenerateCareerRoadmapInputSchema,
    outputSchema: GenerateCareerRoadmapOutputSchema,
  },
  async input => {
    const {output} = await generateCareerRoadmapPrompt(input);
    return output!;
  }
);
