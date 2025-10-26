'use server';
/**
 * @fileOverview An AI agent that recommends both traditional and AI-first learning resources tailored to the user's profile and career goals.
 *
 * - recommendResources - A function that handles the resource recommendation process.
 * - RecommendResourcesInput - The input type for the recommendResources function.
 * - RecommendResourcesOutput - The return type for the recommendResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendResourcesInputSchema = z.object({
  profile: z.object({
    age: z.number().describe('The age of the user.'),
    location: z.string().describe('The location of the user.'),
    interests: z.array(z.string()).describe('The interests of the user.'),
    goals: z.string().describe('The career goals of the user.'),
    current_grade: z.string().describe('The current academic standing of the user.'),
    learning_style: z.string().describe('The learning style of the user (e.g., structured, self-paced).'),
    time_availability: z.string().describe('The time the user has available for learning (e.g., hours per week).'),
  }).describe('The user profile.'),
  careerGoals: z.string().describe('The specific career goals of the user.'),
});
export type RecommendResourcesInput = z.infer<typeof RecommendResourcesInputSchema>;

const ResourceSchema = z.object({
  name: z.string().describe('The name of the resource.'),
  type: z.string().describe('The type of resource (e.g., course, tool, book).'),
  url: z.string().url().describe('The URL of the resource.'),
  description: z.string().describe('A brief description of the resource.'),
  isAiFirst: z.boolean().describe('Whether the resource is an AI-first tool or a traditional resource.'),
  difficulty: z.string().describe('The difficulty level of the resource (e.g., beginner, intermediate, advanced).'),
  timeEstimate: z.string().describe('An estimate of the time required to complete the resource (e.g., hours, weeks).'),
});

const RecommendResourcesOutputSchema = z.array(ResourceSchema).describe('A list of recommended learning resources.');
export type RecommendResourcesOutput = z.infer<typeof RecommendResourcesOutputSchema>;

export async function recommendResources(input: RecommendResourcesInput): Promise<RecommendResourcesOutput> {
  return recommendResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendResourcesPrompt',
  input: {schema: RecommendResourcesInputSchema},
  output: {schema: RecommendResourcesOutputSchema},
  prompt: `You are an expert career counselor. Recommend a list of learning resources (courses, tools, books, etc.) to help the user achieve their career goals, taking into account their profile. Provide resources that reflect both traditional and AI-first learning methodologies. Make sure to incorporate user's learning style in the resources. Here are some examples:

Resource 1:
{
  "name": "CS50's Introduction to Computer Science",
  "type": "course",
  "url": "https://cs50.harvard.edu/",
  "description": "A foundational computer science course from Harvard University.",
  "isAiFirst": false,
  "difficulty": "beginner",
  "timeEstimate": "12 weeks"
}

Resource 2:
{
  "name": "Cursor AI",
  "type": "tool",
  "url": "https://www.cursor.sh/",
  "description": "An AI-powered code editor that helps you write code faster.",
  "isAiFirst": true,
  "difficulty": "beginner",
  "timeEstimate": "1 week"
}

User Profile:
{{json profile}}

Career Goals: {{careerGoals}}


Output the resources as a JSON array.
`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const recommendResourcesFlow = ai.defineFlow(
  {
    name: 'recommendResourcesFlow',
    inputSchema: RecommendResourcesInputSchema,
    outputSchema: RecommendResourcesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
