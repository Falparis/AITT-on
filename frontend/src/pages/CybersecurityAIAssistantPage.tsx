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
import { Bot, Lock, Send, User } from "lucide-react";
import { useState } from "react";
import { useMakePostOutcall } from "../hooks/useQueries";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/**
 * Cybersecurity AI Assistant Chat Page
 *
 * This component provides a specialized chat interface for cybersecurity queries.
 * The assistant is specifically trained and focused on providing expertise in
 * cybersecurity best practices, breach detection, vulnerability analysis, and remediation.
 */
export default function CybersecurityAIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Hello! I am your specialized Cybersecurity AI Assistant. I provide expert guidance on cybersecurity best practices, vulnerability detection, breach analysis, threat intelligence, and remediation recommendations. Ask me anything about securing your code and infrastructure!",
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
      // In production, this would call the backend's cybersecurityAssistant function
      // which is specifically configured with cybersecurity expertise
      const _response = await makePostOutcall.mutateAsync({
        url: "https://api.example.com/cybersecurity-assistant",
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: "cybersecurity-specialist",
        }),
      });

      // For demo purposes, generate a mock cybersecurity-focused response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: generateCybersecurityResponse(input),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (_error) {
      // Fallback to mock cybersecurity response if API call fails
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: generateCybersecurityResponse(input),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }
  };

  /**
   * Generates cybersecurity-specific responses based on user queries
   * This function simulates the backend's cybersecurity assistant specialized responses
   */
  const generateCybersecurityResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("owasp") || lowerQuery.includes("top 10")) {
      return "The **OWASP Top 10** represents the most critical web application security risks:\n\n1. **Broken Access Control**: Unauthorized access to resources\n2. **Cryptographic Failures**: Weak encryption or exposed sensitive data\n3. **Injection**: SQL, NoSQL, OS command injection attacks\n4. **Insecure Design**: Missing or ineffective security controls\n5. **Security Misconfiguration**: Default configs, incomplete setups\n6. **Vulnerable Components**: Using outdated or vulnerable libraries\n7. **Authentication Failures**: Weak credential management\n8. **Software and Data Integrity Failures**: Insecure CI/CD pipelines\n9. **Security Logging Failures**: Insufficient monitoring\n10. **Server-Side Request Forgery (SSRF)**: Fetching remote resources without validation\n\nRegularly audit your applications against these vulnerabilities.";
    }

    if (lowerQuery.includes("sql injection") || lowerQuery.includes("sqli")) {
      return "**SQL Injection Prevention Best Practices:**\n\n• **Use Parameterized Queries**: Always use prepared statements with bound parameters\n• **Input Validation**: Validate and sanitize all user inputs\n• **Least Privilege**: Database accounts should have minimal necessary permissions\n• **Escape Special Characters**: When dynamic queries are unavoidable\n• **Use ORMs**: Object-Relational Mapping tools provide built-in protection\n• **Web Application Firewall**: Deploy WAF rules to detect injection attempts\n• **Regular Security Testing**: Include SQLi tests in your security audits\n\nExample (Node.js):\n```javascript\n// BAD: Vulnerable to SQL injection\ndb.query(`SELECT * FROM users WHERE id = ${userId}`);\n\n// GOOD: Using parameterized query\ndb.query('SELECT * FROM users WHERE id = ?', [userId]);\n```";
    }

    if (
      lowerQuery.includes("xss") ||
      lowerQuery.includes("cross-site scripting")
    ) {
      return "**Cross-Site Scripting (XSS) Prevention:**\n\n• **Output Encoding**: Encode all user-generated content before rendering\n• **Content Security Policy (CSP)**: Implement strict CSP headers\n• **Input Validation**: Validate and sanitize user inputs\n• **Use Security Libraries**: React, Vue automatically escape content\n• **HTTPOnly Cookies**: Prevent JavaScript access to session cookies\n• **X-XSS-Protection Header**: Enable browser XSS filters\n• **Avoid innerHTML**: Use textContent or framework-safe methods\n\n**Types of XSS:**\n1. **Stored XSS**: Malicious script stored in database\n2. **Reflected XSS**: Script reflected from URL parameters\n3. **DOM-based XSS**: Client-side script manipulation\n\nAlways treat user input as untrusted and encode appropriately for the context (HTML, JavaScript, URL, CSS).";
    }

    if (
      lowerQuery.includes("authentication") ||
      lowerQuery.includes("password")
    ) {
      return "**Authentication Security Best Practices:**\n\n• **Strong Password Policies**: Minimum 12 characters, complexity requirements\n• **Password Hashing**: Use bcrypt, Argon2, or PBKDF2 (never plain text or MD5)\n• **Multi-Factor Authentication (MFA)**: Implement 2FA/MFA for all accounts\n• **Account Lockout**: Prevent brute force with rate limiting\n• **Secure Session Management**: Use secure, httpOnly, sameSite cookies\n• **Password Reset Security**: Use time-limited tokens, verify identity\n• **OAuth/OIDC**: Consider delegating authentication to trusted providers\n• **Monitor Failed Attempts**: Alert on suspicious login patterns\n\n**Password Storage Example:**\n```javascript\nconst bcrypt = require('bcrypt');\nconst saltRounds = 12;\n\n// Hash password\nconst hash = await bcrypt.hash(password, saltRounds);\n\n// Verify password\nconst match = await bcrypt.compare(password, hash);\n```";
    }

    if (
      lowerQuery.includes("api security") ||
      lowerQuery.includes("rest api")
    ) {
      return "**API Security Best Practices:**\n\n• **Authentication**: Use OAuth 2.0, JWT, or API keys\n• **Authorization**: Implement proper access controls (RBAC/ABAC)\n• **Rate Limiting**: Prevent abuse and DDoS attacks\n• **Input Validation**: Validate all request parameters and payloads\n• **HTTPS Only**: Enforce TLS 1.2+ for all API endpoints\n• **CORS Configuration**: Restrict allowed origins appropriately\n• **API Versioning**: Maintain backward compatibility securely\n• **Logging & Monitoring**: Track API usage and anomalies\n• **Error Handling**: Don't expose sensitive information in errors\n• **API Gateway**: Use gateway for centralized security controls\n\n**Security Headers:**\n- X-Content-Type-Options: nosniff\n- X-Frame-Options: DENY\n- Strict-Transport-Security: max-age=31536000\n- Content-Security-Policy: default-src 'self'";
    }

    if (
      lowerQuery.includes("dependency") ||
      lowerQuery.includes("supply chain")
    ) {
      return "**Software Supply Chain Security:**\n\n• **Dependency Scanning**: Use tools like Snyk, Dependabot, npm audit\n• **Keep Dependencies Updated**: Regularly update to patched versions\n• **Verify Package Integrity**: Check checksums and signatures\n• **Minimize Dependencies**: Reduce attack surface by limiting packages\n• **Private Registry**: Host internal packages securely\n• **Lock Files**: Use package-lock.json, yarn.lock to ensure consistency\n• **SBOM**: Maintain Software Bill of Materials\n• **Vulnerability Monitoring**: Set up alerts for new CVEs\n\n**Tools:**\n- npm audit / yarn audit\n- Snyk\n- GitHub Dependabot\n- OWASP Dependency-Check\n- Trivy\n\n**Example:**\n```bash\n# Audit dependencies\nnpm audit\n\n# Fix vulnerabilities automatically\nnpm audit fix\n\n# Check for outdated packages\nnpm outdated\n```";
    }

    if (lowerQuery.includes("docker") || lowerQuery.includes("container")) {
      return '**Container Security Best Practices:**\n\n• **Minimal Base Images**: Use alpine or distroless images\n• **Non-Root User**: Run containers as non-privileged users\n• **Image Scanning**: Scan for vulnerabilities (Trivy, Clair, Snyk)\n• **Secrets Management**: Never hardcode secrets in images\n• **Read-Only Filesystem**: Mount volumes as read-only when possible\n• **Resource Limits**: Set CPU and memory limits\n• **Network Segmentation**: Use network policies to isolate containers\n• **Regular Updates**: Keep base images and dependencies updated\n• **Sign Images**: Use Docker Content Trust for image signing\n• **Runtime Security**: Use tools like Falco for runtime monitoring\n\n**Dockerfile Security Example:**\n```dockerfile\n# Use specific version, not \'latest\'\nFROM node:18-alpine\n\n# Create non-root user\nRUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001\n\n# Set working directory\nWORKDIR /app\n\n# Copy files with proper ownership\nCOPY --chown=nodejs:nodejs . .\n\n# Switch to non-root user\nUSER nodejs\n\nCMD ["node", "server.js"]\n```';
    }

    if (lowerQuery.includes("encryption") || lowerQuery.includes("crypto")) {
      return "**Encryption Best Practices:**\n\n• **Use Strong Algorithms**: AES-256, RSA-2048+, ChaCha20-Poly1305\n• **TLS 1.2+**: Enforce modern TLS for data in transit\n• **Key Management**: Use HSM or cloud KMS for key storage\n• **Encrypt at Rest**: Encrypt sensitive data in databases and storage\n• **Avoid Custom Crypto**: Use well-tested libraries (OpenSSL, libsodium)\n• **Perfect Forward Secrecy**: Use ephemeral key exchange (ECDHE)\n• **Certificate Management**: Automate cert rotation, use Let's Encrypt\n• **Hashing**: Use SHA-256+ for integrity, bcrypt/Argon2 for passwords\n\n**Common Mistakes to Avoid:**\n- Using ECB mode (use GCM or CBC with HMAC)\n- Hardcoding encryption keys\n- Using weak algorithms (DES, MD5, SHA-1)\n- Not validating certificates\n- Reusing IVs/nonces\n\n**Example (Node.js):**\n```javascript\nconst crypto = require('crypto');\n\n// Encrypt\nconst algorithm = 'aes-256-gcm';\nconst key = crypto.randomBytes(32);\nconst iv = crypto.randomBytes(16);\nconst cipher = crypto.createCipheriv(algorithm, key, iv);\n```";
    }

    if (
      lowerQuery.includes("penetration test") ||
      lowerQuery.includes("pentest")
    ) {
      return "**Penetration Testing Best Practices:**\n\n**Planning Phase:**\n• Define scope and objectives\n• Get written authorization\n• Identify critical assets\n• Choose testing methodology (OWASP, PTES, NIST)\n\n**Testing Phases:**\n1. **Reconnaissance**: Gather information about target\n2. **Scanning**: Identify open ports, services, vulnerabilities\n3. **Exploitation**: Attempt to exploit discovered vulnerabilities\n4. **Post-Exploitation**: Assess impact and lateral movement\n5. **Reporting**: Document findings with remediation steps\n\n**Tools:**\n- Nmap (network scanning)\n- Burp Suite (web app testing)\n- Metasploit (exploitation framework)\n- OWASP ZAP (web security scanner)\n- Wireshark (network analysis)\n- Nikto (web server scanner)\n\n**Types of Testing:**\n- **Black Box**: No prior knowledge\n- **White Box**: Full knowledge and access\n- **Gray Box**: Partial knowledge\n\nConduct pentests regularly (quarterly for critical systems) and after major changes.";
    }

    if (
      lowerQuery.includes("incident response") ||
      lowerQuery.includes("breach")
    ) {
      return "**Incident Response Plan:**\n\n**1. Preparation**\n• Establish incident response team\n• Define roles and responsibilities\n• Create communication protocols\n• Set up monitoring and alerting\n\n**2. Detection & Analysis**\n• Monitor security alerts\n• Analyze indicators of compromise (IoCs)\n• Determine incident severity\n• Document timeline\n\n**3. Containment**\n• Short-term: Isolate affected systems\n• Long-term: Apply patches, change credentials\n• Preserve evidence for forensics\n\n**4. Eradication**\n• Remove malware and backdoors\n• Close vulnerabilities\n• Strengthen security controls\n\n**5. Recovery**\n• Restore systems from clean backups\n• Monitor for reinfection\n• Gradual return to normal operations\n\n**6. Post-Incident**\n• Conduct lessons learned meeting\n• Update incident response plan\n• Improve security controls\n• Report to stakeholders/authorities\n\n**Key Metrics:**\n- Mean Time to Detect (MTTD)\n- Mean Time to Respond (MTTR)\n- Mean Time to Contain (MTTC)";
    }

    if (
      lowerQuery.includes("zero trust") ||
      lowerQuery.includes("zero-trust")
    ) {
      return "**Zero Trust Security Model:**\n\n**Core Principles:**\n• **Never Trust, Always Verify**: Verify every access request\n• **Least Privilege Access**: Grant minimum necessary permissions\n• **Assume Breach**: Design with the assumption of compromise\n• **Micro-Segmentation**: Divide network into small zones\n• **Continuous Monitoring**: Monitor all activities in real-time\n\n**Implementation Steps:**\n1. **Identify Assets**: Catalog all resources and data\n2. **Map Flows**: Understand how data moves\n3. **Architect Network**: Implement micro-segmentation\n4. **Create Policy**: Define access policies based on identity\n5. **Monitor & Maintain**: Continuous verification and logging\n\n**Key Technologies:**\n- Identity and Access Management (IAM)\n- Multi-Factor Authentication (MFA)\n- Software-Defined Perimeter (SDP)\n- Network Access Control (NAC)\n- Security Information and Event Management (SIEM)\n\n**Benefits:**\n- Reduced attack surface\n- Better visibility and control\n- Improved compliance\n- Protection against insider threats\n- Support for remote work";
    }

    return "I specialize in cybersecurity and can help you with:\n\n• **Vulnerability Assessment**: OWASP Top 10, CVE analysis\n• **Secure Coding**: SQL injection, XSS, CSRF prevention\n• **Authentication & Authorization**: MFA, OAuth, JWT best practices\n• **API Security**: Rate limiting, input validation, secure headers\n• **Container Security**: Docker hardening, image scanning\n• **Encryption**: TLS, at-rest encryption, key management\n• **Supply Chain Security**: Dependency scanning, SBOM\n• **Incident Response**: Breach detection, containment, recovery\n• **Penetration Testing**: Security testing methodologies\n• **Zero Trust Architecture**: Implementation strategies\n• **Compliance**: NIST, ISO 27001, SOC 2, GDPR\n\nPlease ask me specific questions about any cybersecurity topic!";
  };

  const quickQuestions = [
    "How do I prevent SQL injection attacks?",
    "What are the OWASP Top 10 vulnerabilities?",
    "How should I secure my API endpoints?",
    "What are container security best practices?",
  ];

  return (
    <div className="container py-8 space-y-8 max-w-5xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Lock className="h-8 w-8 text-primary" />
          Cybersecurity AI Assistant
        </h1>
        <p className="text-muted-foreground">
          Specialized AI assistant for cybersecurity guidance, breach detection,
          and remediation recommendations
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Cybersecurity Expert Conversation
            </CardTitle>
            <CardDescription>
              Ask questions about security vulnerabilities, best practices, and
              threat mitigation
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
                placeholder="Ask your cybersecurity question..."
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
              <CardDescription>Common cybersecurity queries</CardDescription>
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
              <CardTitle className="text-lg">Security Focus Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• OWASP Top 10 vulnerabilities</p>
              <p>• Secure coding practices</p>
              <p>• API security</p>
              <p>• Container & cloud security</p>
              <p>• Authentication & encryption</p>
              <p>• Incident response</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
