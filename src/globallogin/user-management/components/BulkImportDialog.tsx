import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, X, Loader2, AlertCircle, CheckCircle, Download } from "lucide-react";
import type { BulkImportResponse } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<BulkImportResponse>;
}

export function BulkImportDialog({ open, onOpenChange, onImport }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BulkImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    try {
      const res = await onImport(selectedFile);
      setResult(res);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    onOpenChange(false);
  };

  const handleDownloadSample = () => {
    const lines = [
      "# ===== REFERENCE: Portal IDs =====",
      "# 1 = India OSS Portal",
      "# 2 = IP Portal",
      "# 3 = Service Order Management",
      "# 4 = Global User Management",
      "# 5 = APAC OSS Portal",
      "#",
      "# ===== REFERENCE: Role IDs =====",
      "# 1 = India NOC Role (Portal: India OSS - 1)",
      "# 2 = IP NOC Role (Portal: IP - 2)",
      "# 3 = SOM User Role (Portal: SOM - 3)",
      "# 4 = Global Admin Role (Portal: Global - 4)",
      "# 5 = APAC User Role (Portal: APAC OSS - 5)",
      "# 9 = India Admin Role (Portal: India OSS - 1)",
      "#",
      "# ===== NOTES =====",
      "# Use | to assign multiple roleIds or portalIds (e.g. 1|9)",
      "# password is required only for LOCAL authType (leave blank for SSO)",
      "# organization: Lightstorm or Vegayan",
      "# enabled: true or false",
      "#",
      "username,email,password,authType,organization,enabled,roleIds,portalIds",
      "john_doe,john@example.com,Pass@123,LOCAL,Lightstorm,true,1|9,1|4",
      "jane_sso,jane@example.com,,SSO,Vegayan,true,2|4,2|4",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_import_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Import Users</DialogTitle>
          <DialogDescription>Upload a CSV file to import multiple users.</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{result.successCount} user(s) imported successfully</span>
            </div>
            {result.errorCount > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{result.errorCount} error(s)</span>
                </div>
                <ul className="text-xs text-muted-foreground list-disc pl-6 max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Click to upload</p>
              <p className="text-xs text-muted-foreground">CSV files only</p>
              <Input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6"
                  onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">CSV Format:</p>
              <code className="block bg-muted p-2 rounded text-[10px]">
                username,email,password,authType,organization,enabled,roleIds,portalIds
              </code>
              <p className="mt-1">Use | to separate multiple roleIds/portalIds (e.g. 1|9)</p>
              <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs gap-1" onClick={handleDownloadSample}>
                <Download className="h-3 w-3" /> Download sample CSV
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={!selectedFile || importing}>
                {importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</> : "Import Users"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
