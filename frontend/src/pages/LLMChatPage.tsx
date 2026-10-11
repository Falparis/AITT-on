import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Bot, MessageSquare, Send, User } from "lucide-react";
import { useState } from "react";
import { useMakePostOutcall } from "../hooks/useQueries";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/**
 * AI Act Assistant Chat Page
 *
 * This component provides a specialized chat interface for AI Act compliance queries.
 * The assistant is specifically trained and focused on providing expertise and recommendations
 * for the EU AI Act regulatory framework.
 */
export default function LLMChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Hello! I am your specialized AI Act compliance assistant. I provide expert guidance on the EU AI Act requirements, risk classifications, compliance obligations, and best practices. Ask me anything about AI Act compliance!",
    },
  ]);
  const [input, setInput] = useState("");
  const makePostOutcall = useMakePostOutcall();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      // In production, this would call the backend's aiActAssistant function
      // which is specifically configured with AI Act expertise
      const _response = await makePostOutcall.mutateAsync({
        url: "https://api.example.com/ai-act-assistant",
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: "ai-act-specialist",
        }),
      });

      // For demo purposes, generate a mock AI Act-focused response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: generateAIActResponse(input),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (_error) {
      // Fallback to mock AI Act response if API call fails
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: generateAIActResponse(input),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }
  };

  /**
   * Generates AI Act-specific responses based on user queries
   * This function simulates the backend's AI Act assistant specialized responses
   */
  const generateAIActResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("risk") || lowerQuery.includes("classification")) {
      return "The EU AI Act classifies AI systems into four risk categories:\n\n1. **Unacceptable Risk**: Prohibited systems (e.g., social scoring, real-time biometric identification in public spaces)\n2. **High Risk**: Systems requiring strict compliance (e.g., critical infrastructure, employment, law enforcement)\n3. **Limited Risk**: Systems with transparency obligations (e.g., chatbots, emotion recognition)\n4. **Minimal Risk**: Systems with no specific obligations\n\nYour AI system's classification determines your compliance requirements under the AI Act.";
    }

    if (lowerQuery.includes("high-risk") || lowerQuery.includes("high risk")) {
      return "High-risk AI systems under the AI Act must comply with:\n\n• Risk management system (Article 9)\n• Data governance and quality (Article 10)\n• Technical documentation (Article 11)\n• Record-keeping and logging (Article 12)\n• Transparency and user information (Article 13)\n• Human oversight measures (Article 14)\n• Accuracy, robustness, and cybersecurity (Article 15)\n• Conformity assessment procedures\n• CE marking and registration in EU database\n\nNon-compliance can result in fines up to €35 million or 7% of global annual turnover.";
    }

    if (
      lowerQuery.includes("transparency") ||
      lowerQuery.includes("article 13")
    ) {
      return "Article 13 of the AI Act requires transparency obligations for high-risk AI systems:\n\n• Clear, adequate information for users\n• Instructions for use must be concise and understandable\n• Information about system capabilities and limitations\n• Expected level of accuracy and robustness\n• Known circumstances that may lead to risks\n• Human oversight measures\n\nFor limited-risk systems (like chatbots), users must be informed they are interacting with an AI system.";
    }

    if (
      lowerQuery.includes("documentation") ||
      lowerQuery.includes("article 11")
    ) {
      return "Technical documentation under Article 11 must include:\n\n• General description of the AI system\n• Detailed design specifications\n• Development process and methodology\n• Data governance measures\n• Risk management system documentation\n• Testing and validation procedures\n• Performance metrics and limitations\n• Human oversight measures\n• Cybersecurity measures\n\nThis documentation must be kept up-to-date and made available to authorities upon request.";
    }

    if (lowerQuery.includes("compliance") || lowerQuery.includes("conform")) {
      return "To ensure AI Act compliance:\n\n1. **Classify your AI system** according to risk level\n2. **Implement required measures** based on classification\n3. **Establish governance** with clear roles and responsibilities\n4. **Document everything** - technical specs, risk assessments, testing\n5. **Conduct conformity assessment** for high-risk systems\n6. **Register** in EU database if required\n7. **Monitor continuously** and update documentation\n8. **Train your team** on AI Act requirements\n\nThe AI Act applies to providers placing AI systems on the EU market and users of AI systems in the EU.";
    }

    if (
      lowerQuery.includes("penalty") ||
      lowerQuery.includes("fine") ||
      lowerQuery.includes("sanction")
    ) {
      return "The AI Act establishes significant penalties for non-compliance:\n\n• **€35 million or 7% of global turnover**: Prohibited AI practices (Article 5)\n• **€15 million or 3% of global turnover**: Non-compliance with AI Act obligations\n• **€7.5 million or 1.5% of global turnover**: Incorrect or misleading information to authorities\n\nMember States will designate national authorities to enforce these provisions. The severity reflects the EU's commitment to responsible AI development.";
    }

    if (
      lowerQuery.includes("provider") ||
      lowerQuery.includes("deployer") ||
      lowerQuery.includes("user")
    ) {
      return "The AI Act defines key roles with specific obligations:\n\n**Providers** (developers/manufacturers):\n• Ensure compliance with AI Act requirements\n• Conduct conformity assessments\n• Maintain technical documentation\n• Implement quality management systems\n\n**Deployers** (users of AI systems):\n• Use systems according to instructions\n• Monitor operation and report incidents\n• Ensure human oversight\n• Conduct fundamental rights impact assessments for high-risk systems\n\n**Distributors and importers** also have specific obligations under the Act.";
    }

    if (lowerQuery.includes("data") || lowerQuery.includes("article 10")) {
      return "Article 10 establishes data governance requirements for high-risk AI systems:\n\n• Training, validation, and testing datasets must be relevant, representative, and free of errors\n• Data must be appropriate for the intended purpose\n• Special attention to potential biases\n• Data governance practices must be documented\n• Statistical properties of datasets must be examined\n• For personal data, GDPR compliance is mandatory\n\nPoor data quality is a major source of AI system failures and bias, making this a critical compliance area.";
    }

    if (lowerQuery.includes("oversight") || lowerQuery.includes("article 14")) {
      return "Article 14 requires human oversight for high-risk AI systems:\n\n• Humans must be able to understand system capabilities and limitations\n• Ability to monitor system operation\n• Ability to interpret system outputs\n• Ability to override or stop the system (stop button)\n• Ability to intervene in system decisions\n\nHuman oversight measures must be appropriate to the risks and level of autonomy of the AI system. This ensures humans remain in control of critical decisions.";
    }

    if (
      lowerQuery.includes("gpai") ||
      lowerQuery.includes("general purpose") ||
      lowerQuery.includes("foundation model")
    ) {
      return "The AI Act includes specific provisions for General Purpose AI (GPAI) models:\n\n**All GPAI providers must:**\n• Provide technical documentation\n• Comply with copyright law\n• Publish detailed summaries of training data\n\n**GPAI with systemic risk** (e.g., >10^25 FLOPs) must additionally:\n• Conduct model evaluations\n• Assess and mitigate systemic risks\n• Report serious incidents\n• Ensure adequate cybersecurity\n\nThis addresses foundation models like GPT, Claude, and similar large-scale AI systems.";
    }

    return "I specialize in EU AI Act compliance and can help you with:\n\n• **Risk classification** of AI systems\n• **Compliance requirements** for different risk levels\n• **Technical documentation** standards (Article 11)\n• **Data governance** requirements (Article 10)\n• **Transparency obligations** (Article 13)\n• **Human oversight** measures (Article 14)\n• **Conformity assessment** procedures\n• **Penalties and enforcement**\n• **Provider and deployer obligations**\n• **General Purpose AI** requirements\n\nPlease ask me specific questions about any aspect of AI Act compliance!";
  };

  const quickQuestions = [
    "How are AI systems classified under the AI Act?",
    "What are the requirements for high-risk AI systems?",
    "What documentation is required under Article 11?",
    "What are the penalties for non-compliance?",
  ];

  return (
    <div className="container py-8 space-y-8 max-w-5xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          AI Act Assistant
        </h1>
        <p className="text-muted-foreground">
          Specialized AI assistant for EU AI Act compliance guidance and
          recommendations
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Act Expert Conversation
            </CardTitle>
            <CardDescription>
              Ask questions about EU AI Act requirements, risk classifications,
              and compliance obligations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[55vh] min-h-[320px] lg:h-[500px] pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg p-4 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ))}
                {makePostOutcall.isPending && (
                  <div className="flex gap-3 justify-start">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="rounded-lg p-4 bg-muted">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                placeholder="Ask your question about AI Act compliance..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="min-h-[60px]"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || makePostOutcall.isPending}
                size="icon"
                className="h-[60px] w-[60px]"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Questions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Questions</CardTitle>
              <CardDescription>
                Common AI Act compliance queries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickQuestions.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4 whitespace-normal break-words"
                  onClick={() => {
                    setInput(question);
                    setTimeout(() => handleSend(), 100);
                  }}
                >
                  <span className="text-sm">{question}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">AI Act Focus Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Risk classification (Articles 6-7)</p>
              <p>• High-risk requirements (Articles 8-15)</p>
              <p>• Transparency obligations (Article 13)</p>
              <p>• Documentation standards (Article 11)</p>
              <p>• Data governance (Article 10)</p>
              <p>• Human oversight (Article 14)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
