import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Shield,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useGetComplianceDashboard } from "../hooks/useQueries";
import { Regulation } from "../types";

export default function ComplianceDashboardPage() {
  const { data: documents, isLoading } = useGetComplianceDashboard();

  const getComplianceColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-green-500 dark:text-green-500";
    if (score >= 40) return "text-yellow-500 dark:text-yellow-400";
    return "text-red-500 dark:text-red-400";
  };

  const getComplianceBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-950";
    if (score >= 60) return "bg-green-50 dark:bg-green-900/30";
    if (score >= 40) return "bg-yellow-50 dark:bg-yellow-900/30";
    return "bg-red-50 dark:bg-red-900/30";
  };

  const getComplianceIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return CheckCircle;
    if (score >= 40) return AlertTriangle;
    return XCircle;
  };

  const getComplianceBadge = (score: number) => {
    if (score >= 70) {
      return {
        text: `compliance at ${score}%`,
        emoji: "✅",
        bgColor: "bg-green-500 hover:bg-green-600",
        textColor: "text-white",
      };
    }
    return {
      text: `compliance at ${score}%`,
      emoji: "❌",
      bgColor: "bg-red-500 hover:bg-red-600",
      textColor: "text-white",
    };
  };

  const getRegulationLabel = (regulation: Regulation) => {
    return regulation === Regulation.euAIAct
      ? "EU – AI Act"
      : "US – AI Regulations";
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const stats = documents
    ? {
        total: documents.length,
        compliant: documents.filter(
          (d) => d.compliance && Number(d.compliance.score) >= 80,
        ).length,
        pending: documents.filter((d) => !d.compliance).length,
        avgScore:
          documents.filter((d) => d.compliance).length > 0
            ? Math.round(
                documents
                  .filter((d) => d.compliance)
                  .reduce((sum, d) => sum + Number(d.compliance!.score), 0) /
                  documents.filter((d) => d.compliance).length,
              )
            : 0,
      }
    : { total: 0, compliant: 0, pending: 0, avgScore: 0 };

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          AI Compliance Dashboard
        </h1>
        <p className="text-muted-foreground">
          Track the compliance status of your AI-analyzed documents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              Analyzed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Compliant</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats.compliant}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />≥ 80% score
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {stats.pending}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Not analyzed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className="text-3xl text-primary">
              {stats.avgScore}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Overall compliance
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Analyzed Documents</h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="grid gap-4">
            {documents.map((doc) => {
              const score = doc.compliance ? Number(doc.compliance.score) : 0;
              const Icon = doc.compliance
                ? getComplianceIcon(score)
                : AlertTriangle;
              const badge = doc.compliance ? getComplianceBadge(score) : null;

              return (
                <Card
                  key={doc.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            doc.compliance
                              ? getComplianceBgColor(score)
                              : "bg-muted"
                          }`}
                        >
                          <Icon
                            className={`h-6 w-6 ${
                              doc.compliance
                                ? getComplianceColor(score)
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">
                              {doc.filename}
                            </h3>
                            <Badge variant="outline">
                              <Shield className="h-3 w-3 mr-1" />
                              {getRegulationLabel(doc.regulation)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(doc.timestamp)}
                          </p>
                          {doc.compliance && badge && (
                            <div className="space-y-2">
                              <div className="inline-flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium ${badge.bgColor} ${badge.textColor}`}
                                >
                                  <span className="text-lg">{badge.emoji}</span>
                                  <span>{badge.text}</span>
                                </span>
                              </div>
                              {doc.compliance.recommendations && (
                                <p className="text-sm text-muted-foreground">
                                  {doc.compliance.recommendations}
                                </p>
                              )}
                            </div>
                          )}
                          {!doc.compliance && (
                            <p className="text-sm text-muted-foreground">
                              Awaiting compliance analysis
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {doc.compliance && (
                          <div className="text-center">
                            <div
                              className={`text-3xl font-bold ${getComplianceColor(score)}`}
                            >
                              {score}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Score
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Shield className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    No Analyzed Documents
                  </h3>
                  <p className="text-muted-foreground">
                    Upload documents to see their compliance analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
