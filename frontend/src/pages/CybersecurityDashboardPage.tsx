import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle,
  Code,
  GitBranch,
  Lock,
  Play,
  Plus,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { SiGithub } from "react-icons/si";
import { toast } from "sonner";
import {
  useAddRepository,
  useAnalyzeRepository,
  useGetCybersecurityDashboard,
  useUpdateCybersecurityScore,
} from "../hooks/useQueries";

export default function CybersecurityDashboardPage() {
  const { data: repositories, isLoading } = useGetCybersecurityDashboard();
  const addRepository = useAddRepository();
  const updateScore = useUpdateCybersecurityScore();
  const analyzeRepository = useAnalyzeRepository();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [newScore, setNewScore] = useState<string>("");

  const handleAddRepository = async () => {
    if (!repoName.trim() || !repoUrl.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await addRepository.mutateAsync({ name: repoName, url: repoUrl });
      toast.success("Repository added successfully");
      setAddDialogOpen(false);
      setRepoName("");
      setRepoUrl("");
    } catch (error: any) {
      toast.error(error.message || "Failed to add repository");
    }
  };

  const handleAnalyzeRepository = async (repositoryId: string) => {
    try {
      await analyzeRepository.mutateAsync(repositoryId);
      toast.success("Repository analyzed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze repository");
    }
  };

  const handleUpdateScore = async () => {
    const score = Number.parseInt(newScore);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      toast.error("Please enter a valid score between 0 and 100");
      return;
    }

    try {
      await updateScore.mutateAsync({
        repositoryId: selectedRepoId,
        newScore: score,
      });
      toast.success("Cybersecurity score updated successfully");
      setScoreDialogOpen(false);
      setNewScore("");
      setSelectedRepoId("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update score");
    }
  };

  const getSecurityColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-green-500 dark:text-green-500";
    if (score >= 40) return "text-yellow-500 dark:text-yellow-400";
    return "text-red-500 dark:text-red-400";
  };

  const getSecurityBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-950";
    if (score >= 60) return "bg-green-50 dark:bg-green-900/30";
    if (score >= 40) return "bg-yellow-50 dark:bg-yellow-900/30";
    return "bg-red-50 dark:bg-red-900/30";
  };

  const getSecurityIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return CheckCircle;
    if (score >= 40) return AlertTriangle;
    return XCircle;
  };

  const getSecurityBadge = (score: number) => {
    if (score >= 70) {
      return {
        text: `secure at ${score}%`,
        emoji: "✅",
        bgColor: "bg-green-500 hover:bg-green-600",
        textColor: "text-white",
      };
    }
    return {
      text: `vulnerable at ${score}%`,
      emoji: "❌",
      bgColor: "bg-red-500 hover:bg-red-600",
      textColor: "text-white",
    };
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const stats = repositories
    ? {
        total: repositories.length,
        secure: repositories.filter(
          (r) => r.cybersecurity && Number(r.cybersecurity.score) >= 80,
        ).length,
        pending: repositories.filter((r) => !r.cybersecurity).length,
        avgScore:
          repositories.filter((r) => r.cybersecurity).length > 0
            ? Math.round(
                repositories
                  .filter((r) => r.cybersecurity)
                  .reduce((sum, r) => sum + Number(r.cybersecurity!.score), 0) /
                  repositories.filter((r) => r.cybersecurity).length,
              )
            : 0,
      }
    : { total: 0, secure: 0, pending: 0, avgScore: 0 };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Lock className="h-8 w-8 text-primary" />
            Cybersecurity Dashboard
          </h1>
          <p className="text-muted-foreground">
            Analyze code repositories for cybersecurity vulnerabilities and
            breaches
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Repository
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Repository</DialogTitle>
              <DialogDescription>
                Add a GitHub repository or VS Code environment for cybersecurity
                analysis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="repo-name">Repository Name</Label>
                <Input
                  id="repo-name"
                  placeholder="my-awesome-project"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repo-url">Repository URL</Label>
                <Input
                  id="repo-url"
                  placeholder="https://github.com/username/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 gap-2">
                  <SiGithub className="h-4 w-4" />
                  GitHub
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Code className="h-4 w-4" />
                  VS Code
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddRepository}
                disabled={addRepository.isPending}
              >
                {addRepository.isPending ? "Adding..." : "Add Repository"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Repositories</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GitBranch className="h-4 w-4" />
              Analyzed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Secure</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats.secure}
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
              Overall security
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repositories List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Analyzed Repositories</h2>

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
        ) : repositories && repositories.length > 0 ? (
          <div className="grid gap-4">
            {repositories.map((repo) => {
              const score = repo.cybersecurity
                ? Number(repo.cybersecurity.score)
                : 0;
              const Icon = repo.cybersecurity
                ? getSecurityIcon(score)
                : AlertTriangle;
              const badge = repo.cybersecurity ? getSecurityBadge(score) : null;

              return (
                <Card
                  key={repo.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            repo.cybersecurity
                              ? getSecurityBgColor(score)
                              : "bg-muted"
                          }`}
                        >
                          <Icon
                            className={`h-6 w-6 ${
                              repo.cybersecurity
                                ? getSecurityColor(score)
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">
                              {repo.name}
                            </h3>
                            <Badge variant="outline">
                              <Code className="h-3 w-3 mr-1" />
                              Repository
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {repo.url}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(repo.timestamp)}
                          </p>
                          {repo.cybersecurity && badge && (
                            <div className="space-y-2">
                              <div className="inline-flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium ${badge.bgColor} ${badge.textColor}`}
                                >
                                  <span className="text-lg">{badge.emoji}</span>
                                  <span>{badge.text}</span>
                                </span>
                              </div>
                              {repo.cybersecurity.recommendations && (
                                <p className="text-sm text-muted-foreground">
                                  {repo.cybersecurity.recommendations}
                                </p>
                              )}
                              {repo.cybersecurity.vulnerabilities && (
                                <p className="text-sm text-muted-foreground">
                                  Vulnerabilities:{" "}
                                  {repo.cybersecurity.vulnerabilities}
                                </p>
                              )}
                            </div>
                          )}
                          {!repo.cybersecurity && (
                            <p className="text-sm text-muted-foreground">
                              Awaiting cybersecurity analysis
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {repo.cybersecurity && (
                          <div className="text-center">
                            <div
                              className={`text-3xl font-bold ${getSecurityColor(score)}`}
                            >
                              {score}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Score
                            </div>
                          </div>
                        )}
                        {!repo.cybersecurity && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAnalyzeRepository(repo.id)}
                            disabled={analyzeRepository.isPending}
                            className="gap-2"
                          >
                            <Play className="h-4 w-4" />
                            {analyzeRepository.isPending
                              ? "Analyzing..."
                              : "Analyze"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRepoId(repo.id);
                            setNewScore(
                              repo.cybersecurity
                                ? String(Number(repo.cybersecurity.score))
                                : "",
                            );
                            setScoreDialogOpen(true);
                          }}
                        >
                          Modify Score
                        </Button>
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
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    No Analyzed Repositories
                  </h3>
                  <p className="text-muted-foreground">
                    Connect repositories to see their cybersecurity analysis
                  </p>
                </div>
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Repository
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modify Score Dialog */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Cybersecurity Score</DialogTitle>
            <DialogDescription>
              Enter a new cybersecurity score (0-100) for this repository
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-score">New Score (%)</Label>
              <Input
                id="new-score"
                type="number"
                min="0"
                max="100"
                placeholder="85"
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateScore}
              disabled={updateScore.isPending}
            >
              {updateScore.isPending ? "Updating..." : "Update Score"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
