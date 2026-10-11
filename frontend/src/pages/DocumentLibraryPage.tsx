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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Calendar,
  Download,
  Edit,
  FileText,
  Hash,
  Shield,
  Upload,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  useGetUserDocuments,
  useUpdateCompanyName,
  useUpdateComplianceScore,
  useUploadDocument,
} from "../hooks/useQueries";
import { type DocumentMetadata, Regulation } from "../types";

async function calculateSHA256(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return new Uint8Array(hashBuffer);
}

export default function DocumentLibraryPage() {
  const { data: documents, isLoading } = useGetUserDocuments();
  const uploadDocument = useUploadDocument();
  const updateComplianceScore = useUpdateComplianceScore();
  const updateCompanyName = useUpdateCompanyName();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedRegulation, setSelectedRegulation] =
    useState<Regulation | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<DocumentMetadata | null>(null);
  const [newScore, setNewScore] = useState("");
  const [editingCompanyName, setEditingCompanyName] =
    useState<DocumentMetadata | null>(null);
  const [newCompanyNameValue, setNewCompanyNameValue] = useState("");

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!selectedRegulation) {
        toast.error("Please select a regulatory framework");
        return;
      }

      if (!companyName.trim()) {
        toast.error("Please enter a company name");
        return;
      }

      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are accepted");
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Calculate hash
        const hash = await calculateSHA256(file);

        // Create blob with progress tracking
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
          (percentage) => {
            setUploadProgress(Math.round(percentage));
          },
        );

        // Upload document
        await uploadDocument.mutateAsync({
          filename: file.name,
          hash,
          regulation: selectedRegulation,
          blob,
          companyName: companyName.trim(),
        });

        toast.success(
          "Document uploaded successfully with 70% compliance score",
        );
        setSelectedRegulation(null);
        setCompanyName("");
        setUploadProgress(0);
      } catch (error: any) {
        console.error("Upload error:", error);
        const errorMessage = error?.message || "Error uploading document";
        toast.error(errorMessage);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [selectedRegulation, companyName, uploadDocument],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
      e.target.value = "";
    },
    [handleFileUpload],
  );

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatHash = (hash: Uint8Array) => {
    return `${Array.from(hash)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 16)}...`;
  };

  const getRegulationLabel = (regulation: Regulation) => {
    return regulation === Regulation.euAIAct
      ? "EU – AI Act"
      : "US – AI Regulations";
  };

  const handleDownload = async (doc: DocumentMetadata) => {
    try {
      const url = doc.blob.getDirectURL();
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Error downloading document");
    }
  };

  const handleEditScore = (doc: DocumentMetadata) => {
    setEditingDocument(doc);
    setNewScore(doc.compliance ? String(Number(doc.compliance.score)) : "70");
  };

  const handleSaveScore = async () => {
    if (!editingDocument) return;

    const score = Number.parseInt(newScore, 10);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      toast.error("Please enter a valid score between 0 and 100");
      return;
    }

    try {
      await updateComplianceScore.mutateAsync({
        documentId: editingDocument.id,
        newScore: score,
      });
      toast.success("Compliance score updated successfully");
      setEditingDocument(null);
      setNewScore("");
    } catch (error: any) {
      console.error("Update score error:", error);
      toast.error(error?.message || "Error updating compliance score");
    }
  };

  const handleCloseDialog = () => {
    setEditingDocument(null);
    setNewScore("");
  };

  const handleEditCompanyName = (doc: DocumentMetadata) => {
    setEditingCompanyName(doc);
    setNewCompanyNameValue(doc.companyName);
  };

  const handleSaveCompanyName = async () => {
    if (!editingCompanyName) return;

    if (!newCompanyNameValue.trim()) {
      toast.error("Please enter a company name");
      return;
    }

    try {
      await updateCompanyName.mutateAsync({
        documentId: editingCompanyName.id,
        newCompanyName: newCompanyNameValue.trim(),
      });
      toast.success("Company name updated successfully");
      setEditingCompanyName(null);
      setNewCompanyNameValue("");
    } catch (error: any) {
      console.error("Update company name error:", error);
      toast.error(error?.message || "Error updating company name");
    }
  };

  const handleCloseCompanyNameDialog = () => {
    setEditingCompanyName(null);
    setNewCompanyNameValue("");
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Document Library</h1>
        <p className="text-muted-foreground">
          Manage your uploaded documents and access their metadata
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload a New Document
          </CardTitle>
          <CardDescription>
            Select a regulatory framework, enter company name, and upload your
            PDF document for AI certification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Regulatory Framework</Label>
            <Select
              value={selectedRegulation || ""}
              onValueChange={(value) =>
                setSelectedRegulation(value as Regulation)
              }
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a regulatory framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Regulation.euAIAct}>EU – AI Act</SelectItem>
                <SelectItem value={Regulation.usAIRegulations}>
                  US – AI Regulations
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              disabled={isUploading}
            />
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            } ${!selectedRegulation || !companyName.trim() || isUploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={
                !selectedRegulation || !companyName.trim() || isUploading
              }
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isUploading
                      ? "Uploading..."
                      : "Drag and drop your PDF file here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isUploading ? "Please wait" : "or click to select"}
                  </p>
                </div>
                {(!selectedRegulation || !companyName.trim()) &&
                  !isUploading && (
                    <p className="text-sm text-destructive">
                      Please select a regulatory framework and enter company
                      name first
                    </p>
                  )}
              </div>
            </label>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading document...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
              <p className="text-xs text-muted-foreground text-center">
                Loading
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Compliance score assigned by AI</h2>

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
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">
                            {doc.filename}
                          </h3>
                          <Badge variant="outline" className="flex-shrink-0">
                            <Shield className="h-3 w-3 mr-1" />
                            {getRegulationLabel(doc.regulation)}
                          </Badge>
                          {doc.compliance && (
                            <Badge className="bg-green-500 hover:bg-green-600 text-white flex-shrink-0">
                              ✅ {Number(doc.compliance.score)}% Compliant
                            </Badge>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="truncate">{doc.companyName}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEditCompanyName(doc)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(doc.timestamp)}
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <Hash className="h-4 w-4" />
                            <span className="font-mono text-xs">
                              {formatHash(doc.hash)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleDownload(doc)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        onClick={() => handleEditScore(doc)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Modify Score
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No Documents</h3>
                  <p className="text-muted-foreground">
                    Start by uploading your first document
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Score Dialog */}
      <Dialog open={!!editingDocument} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Compliance Score</DialogTitle>
            <DialogDescription>
              Enter a new compliance score for {editingDocument?.filename}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="score">Compliance Score (%)</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                placeholder="Enter score (0-100)"
              />
              <p className="text-sm text-muted-foreground">
                Enter a value between 0 and 100
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveScore}
              disabled={updateComplianceScore.isPending}
            >
              {updateComplianceScore.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Name Dialog */}
      <Dialog
        open={!!editingCompanyName}
        onOpenChange={handleCloseCompanyNameDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company Name</DialogTitle>
            <DialogDescription>
              Update the company name for {editingCompanyName?.filename}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-name-edit">Company Name</Label>
              <Input
                id="company-name-edit"
                type="text"
                value={newCompanyNameValue}
                onChange={(e) => setNewCompanyNameValue(e.target.value)}
                placeholder="Enter company name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCompanyNameDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveCompanyName}
              disabled={updateCompanyName.isPending}
            >
              {updateCompanyName.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
