import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  Check,
  Copy,
  Eye,
  Key,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGenerateSDKSecret,
  useGetRiskAnalysis,
  useGetSDKSecret,
  useRunRiskAnalysis,
} from "../hooks/useQueries";
import { RiskCategory, type RiskEvent } from "../types";

function getRiskColor(category: RiskCategory): string {
  switch (category) {
    case RiskCategory.low:
      return "bg-success text-success-foreground";
    case RiskCategory.medium:
      return "bg-warning text-warning-foreground";
    case RiskCategory.high:
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getRiskLabel(category: RiskCategory): string {
  switch (category) {
    case RiskCategory.low:
      return "Low Risk";
    case RiskCategory.medium:
      return "Medium Risk";
    case RiskCategory.high:
      return "High Risk";
    default:
      return "Unknown";
  }
}

function getRiskProgressColor(score: number): string {
  if (score <= 30) return "bg-success";
  if (score <= 70) return "bg-warning";
  return "bg-destructive";
}

function getIssueIcon(issueType: string) {
  const type = issueType.toLowerCase();
  if (type.includes("bias")) return Activity;
  if (type.includes("drift")) return TrendingUp;
  if (type.includes("inconsistency")) return AlertTriangle;
  if (type.includes("hallucination")) return Eye;
  return Zap;
}

export default function AIRiskMinimizationPage() {
  const { data: riskAnalysis, isLoading, error } = useGetRiskAnalysis();
  const runAnalysis = useRunRiskAnalysis();
  const { data: sdkSecret, isLoading: sdkLoading } = useGetSDKSecret();
  const generateSecret = useGenerateSDKSecret();

  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleRefresh = async () => {
    try {
      await runAnalysis.mutateAsync();
      toast.success("Risk analysis updated successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to run risk analysis");
    }
  };

  const handleGenerateSecret = async () => {
    try {
      await generateSecret.mutateAsync();
      toast.success("SDK secret generated successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate SDK secret");
    }
  };

  const handleCopySecret = async () => {
    if (sdkSecret) {
      try {
        await navigator.clipboard.writeText(sdkSecret);
        setCopiedSecret(true);
        toast.success("SDK secret copied to clipboard");
        setTimeout(() => setCopiedSecret(false), 2000);
      } catch (_error) {
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load risk analysis. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentScore = Number(riskAnalysis?.currentScore || 0);
  const category = riskAnalysis?.category || RiskCategory.low;
  const events = riskAnalysis?.events || [];

  // Count events by type
  const biasCount = events.filter((e) =>
    e.issueType.toLowerCase().includes("bias"),
  ).length;
  const driftCount = events.filter((e) =>
    e.issueType.toLowerCase().includes("drift"),
  ).length;
  const inconsistencyCount = events.filter((e) =>
    e.issueType.toLowerCase().includes("inconsistency"),
  ).length;
  const hallucinationCount = events.filter((e) =>
    e.issueType.toLowerCase().includes("hallucination"),
  ).length;

  const _progressColorClass = getRiskProgressColor(currentScore);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            AI Risk & Bias Minimization Layer
          </h1>
          <p className="text-muted-foreground">
            Continuous monitoring and analysis of AI assistant outputs for bias,
            drift, and inconsistencies
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={runAnalysis.isPending}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${runAnalysis.isPending ? "animate-spin" : ""}`}
          />
          {runAnalysis.isPending ? "Analyzing..." : "Refresh Analysis"}
        </Button>
      </div>

      {/* SDK Secret Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            SDK Secret for External Integration
          </CardTitle>
          <CardDescription>
            Use this secret to connect your AI algorithms and receive external
            insights from Risk & Bias analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sdkLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : sdkSecret ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {sdkSecret}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                  className="flex-shrink-0"
                >
                  {copiedSecret ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Keep this secret secure. Use it to authenticate external
                connections to your AI Risk & Bias analysis.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No SDK secret generated yet. Click the button below to generate
                your unique secret.
              </p>
              <Button
                onClick={handleGenerateSecret}
                disabled={generateSecret.isPending}
                className="gap-2"
              >
                <Key className="h-4 w-4" />
                {generateSecret.isPending
                  ? "Generating..."
                  : "Generate SDK Secret"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Score Meter */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Risk Score</span>
            <Badge className={getRiskColor(category)} variant="outline">
              {getRiskLabel(category)}
            </Badge>
          </CardTitle>
          <CardDescription>
            {riskAnalysis?.summary || "No analysis data available"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Progress value={currentScore} className="h-8" />
                <style>{`
                  .risk-progress-${currentScore} [data-state="complete"] {
                    background-color: ${
                      currentScore <= 30
                        ? "oklch(var(--success))"
                        : currentScore <= 70
                          ? "oklch(var(--warning))"
                          : "oklch(var(--destructive))"
                    };
                  }
                `}</style>
                <div
                  className={`risk-progress-${currentScore} absolute inset-0 pointer-events-none`}
                >
                  <Progress value={currentScore} className="h-8" />
                </div>
              </div>
            </div>
            <div className="text-4xl font-bold min-w-[80px] text-right">
              {currentScore}
            </div>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>0 (Low Risk)</span>
            <span>100 (High Risk)</span>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bias Detection
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{biasCount}</div>
            <p className="text-xs text-muted-foreground">
              {biasCount === 0
                ? "No bias detected"
                : `${biasCount} event${biasCount > 1 ? "s" : ""} detected`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Drift Analysis
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driftCount}</div>
            <p className="text-xs text-muted-foreground">
              {driftCount === 0
                ? "No drift detected"
                : `${driftCount} event${driftCount > 1 ? "s" : ""} detected`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inconsistencies
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inconsistencyCount}</div>
            <p className="text-xs text-muted-foreground">
              {inconsistencyCount === 0
                ? "No inconsistencies"
                : `${inconsistencyCount} event${inconsistencyCount > 1 ? "s" : ""} detected`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hallucinations
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hallucinationCount}</div>
            <p className="text-xs text-muted-foreground">
              {hallucinationCount === 0
                ? "No hallucinations"
                : `${hallucinationCount} event${hallucinationCount > 1 ? "s" : ""} detected`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {riskAnalysis?.recommendations && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Recommendations</AlertTitle>
          <AlertDescription>{riskAnalysis.recommendations}</AlertDescription>
        </Alert>
      )}

      {/* Risk Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Events Timeline</CardTitle>
          <CardDescription>
            Chronological view of detected risk events with severity markers and
            remediation suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No risk events detected yet</p>
              <p className="text-sm mt-2">
                Click "Refresh Analysis" to run a new analysis
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const IssueIcon = getIssueIcon(event.issueType);
                const eventDate = new Date(Number(event.timestamp) / 1000000);

                return (
                  <div
                    key={event.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`p-2 rounded-lg ${getRiskColor(event.category)}`}
                        >
                          <IssueIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{event.issueType}</h4>
                            <Badge
                              variant="outline"
                              className={getRiskColor(event.category)}
                            >
                              {event.severity}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Score: {Number(event.riskScore)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {eventDate.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pl-14">
                      <div>
                        <p className="text-sm font-medium mb-1">Description:</p>
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">
                          Suggested Action:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.suggestedAction}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
