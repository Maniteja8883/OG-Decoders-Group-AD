'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a career roadmap mind map based on a user's profile.
 *
 * The flow takes a user profile as input and outputs a structured JSON object for a mind map.
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

const MindMapNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  children: z.array(z.lazy(() => MindMapNodeSchema)).optional(),
});

const GenerateCareerRoadmapOutputSchema = z.object({
  mindMap: MindMapNodeSchema.describe('A structured JSON object representing the career mind map.'),
});
export type GenerateCareerRoadmapOutput = z.infer<typeof GenerateCareerRoadmapOutputSchema>;

export async function generateCareerRoadmap(input: GenerateCareerRoadmapInput): Promise<GenerateCareerRoadmapOutput> {
  return generateCareerRoadmapFlow(input);
}

const generateCareerRoadmapPrompt = ai.definePrompt({
  name: 'generateCareerRoadmapPrompt',
  input: {schema: GenerateCareerRoadmapInputSchema},
  output: {schema: GenerateCareerRoadmapOutputSchema},
  prompt: `You are an expert career counselor. Based on the user's profile, generate a structured JSON object representing a mind map of potential career paths.

User Profile:
Age: {{{age}}}
Location: {{{location}}}
Interests: {{#each interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Goals: {{{goals}}}
Current Grade: {{{current_grade}}}
Learning Style: {{{learning_style}}}
Time Availability: {{{time_availability}}}

Create a hierarchical JSON object. The root node should be the main career goal. It should have children for sub-domains, skills, and resources. Each node must have a unique 'id', a 'label', and an optional 'description' and 'type'. Use types like 'mainCareer', 'subDomain', 'skills', 'resources'.

Example JSON Output:
{
  "mindMap": {
    "id": "root",
    "label": "AI/ML Engineer",
    "description": "Build intelligent systems using machine learning.",
    "type": "mainCareer",
    "children": [
      {
        "id": "foundations",
        "label": "Foundations",
        "type": "subDomain",
        "children": [
          { "id": "python", "label": "Python", "description": "Core programming language." },
          { "id": "math", "label": "Math & Statistics", "description": "Linear algebra, calculus, probability." }
        ]
      },
      {
        "id": "core-skills",
        "label": "Core Skills",
        "type": "subDomain",
        "children": [
          { "id": "deep-learning", "label": "Deep Learning" },
          { "id": "nlp", "label": "NLP" }
        ]
      }
    ]
  }
}

Based on their profile, generate the career roadmap as a JSON object.
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
