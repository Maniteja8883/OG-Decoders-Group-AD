"use client";

import { intelligentPersonaProfiling, type IntelligentPersonaProfilingOutput } from "@/ai/flows/intelligent-persona-profiling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  sender: "user" | "bot";
  text: string;
};

export function PersonaProfilingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
    async function startConversation() {
      setIsLoading(true);
      try {
        const response = await intelligentPersonaProfiling({
          previousResponses: [],
        });
        if (response.nextQuestion) {
          setMessages([{ sender: "bot", text: response.nextQuestion }]);
        }
      } catch (error) {
        console.error("Error starting conversation:", error);
        toast({
          title: "Error",
          description: "Could not start the conversation. Please try refreshing.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    startConversation();
  }, [toast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newMessages: Message[] = [
      ...messages,
      { sender: "user", text: userInput },
    ];
    setMessages(newMessages);
    setUserInput("");
    setIsLoading(true);

    try {
      const previousResponses = newMessages.map(
        (msg) => `${msg.sender}: ${msg.text}`
      );
      
      const response: IntelligentPersonaProfilingOutput = await intelligentPersonaProfiling({
        previousResponses,
        currentQuestion: newMessages.findLast(msg => msg.sender === 'bot')?.text
      });

      if (response.isProfileComplete && response.profile) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Great! We've completed your profile. Generating your career roadmap now..." },
        ]);
        const profileString = JSON.stringify(response.profile);
        router.push(`/roadmap?profile=${encodeURIComponent(profileString)}`);
      } else if (response.nextQuestion) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: response.nextQuestion },
        ]);
      } else {
        throw new Error("AI did not provide a next step.");
      }
    } catch (error) {
      console.error("Error with persona profiling:", error);
      toast({
        title: "An Error Occurred",
        description: "There was an issue with the AI assistant. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => [...prev, {sender: "bot", text: "I'm sorry, I encountered an error. Could you please try rephrasing your last response?"}])
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh] max-h-[700px]">
      <ScrollArea className="flex-1 p-4 -mr-4 pr-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.sender === "user" ? "justify-end" : ""
              }`}
            >
              {message.sender === "bot" && (
                <div className="p-2 bg-primary rounded-full text-primary-foreground shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
              )}
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] break-words ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p>{message.text}</p>
              </div>
              {message.sender === "user" && (
                <div className="p-2 bg-muted rounded-full text-muted-foreground shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages.length > 0 && (
             <div className="flex items-start gap-3">
                <div className="p-2 bg-primary rounded-full text-primary-foreground shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted text-muted-foreground flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={isLoading ? "Waiting for response..." : "Type your answer..."}
            disabled={isLoading}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isLoading || !userInput.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
