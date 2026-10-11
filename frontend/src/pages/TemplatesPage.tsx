import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileDown, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { downloadTemplate } from "../api/files";
import { ApiError } from "../api/types";
import { useTemplates } from "../hooks/data";
import type { Template } from "../mock/types";

export default function TemplatesPage() {
  const { data: templates, isLoading } = useTemplates();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (template: Template) => {
    setDownloadingId(template.id);
    try {
      await downloadTemplate(template.id, template.file);
      toast.success(`Downloading ${template.file}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not download template");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Template Download Center"
        subtitle="Download a blank Word template, fill it out, then submit it for review."
        icon={FileDown}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates available"
          description="Templates published by the admin will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="break-words text-base">
                    {template.name}
                  </CardTitle>
                </div>
                <CardDescription className="break-words">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="font-mono text-xs text-muted-foreground break-all">
                  {template.file}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleDownload(template)}
                  disabled={downloadingId === template.id}
                >
                  <Download className="h-4 w-4" />
                  {downloadingId === template.id ? "Downloading…" : "Download .docx"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
