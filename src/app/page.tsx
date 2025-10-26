import { Header } from '@/app/components/Header';
import { PersonaProfilingChat } from '@/app/components/persona-profiling/PersonaProfilingChat';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-2xl mx-auto shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-center">Find Your Career Path</CardTitle>
            <CardDescription className="text-center">
              Let's start by getting to know you. Answer a few questions to build your personalized career profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PersonaProfilingChat />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
