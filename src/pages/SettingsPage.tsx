import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Database, Globe, Palette, Settings, Shield, Upload, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLookups } from "@/hooks/useLookups";
import { useToast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/currency";
import { settingsApi, ApiError } from "@/services/api";
import type { ManualPricingImportSummary } from "@/types/dashboardTypes";

const SettingsPage = () => {
  const { data: lookups } = useLookups();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedSubscription, setSelectedSubscription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [effectiveUsageDate, setEffectiveUsageDate] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [lastImport, setLastImport] = useState<ManualPricingImportSummary | null>(null);

  const subscriptions = useMemo(
    () => (lookups.subscriptions || []).filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [lookups.subscriptions],
  );

  useEffect(() => {
    if (!selectedSubscription && subscriptions.length > 0) {
      setSelectedSubscription(subscriptions[0]);
    }
  }, [selectedSubscription, subscriptions]);

  const handleUpload = async () => {
    if (!selectedSubscription || !selectedFile) {
      toast({
        title: "Missing input",
        description: "Choose a subscription and an .xlsx workbook before importing.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const summary = await settingsApi.importManualPricingWorkbook(
        selectedFile,
        selectedSubscription,
        effectiveUsageDate || undefined,
      );

      setLastImport(summary);
      await queryClient.invalidateQueries();

      toast({
        title: "Manual pricing imported",
        description: `${summary.matchedResourcesInserted} resources imported for ${summary.subscriptionName}.`,
      });
    } catch (error) {
      const message = error instanceof ApiError
        ? ((error.body as { message?: string } | undefined)?.message || error.statusText)
        : error instanceof Error
          ? error.message
          : "Manual pricing import failed.";

      toast({
        title: "Import failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage dashboard preferences and manual pricing imports.</p>
        </div>
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="mb-6 h-auto w-full justify-start overflow-x-auto bg-muted/50 p-1">
          <TabsTrigger value="general" className="flex items-center gap-2 px-4 py-2.5"><Globe className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 px-4 py-2.5"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2 px-4 py-2.5"><Palette className="h-4 w-4" /> Appearance</TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 px-4 py-2.5"><Shield className="h-4 w-4" /> Security</TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2 px-4 py-2.5"><Database className="h-4 w-4" /> Data Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Regional Settings</CardTitle>
              <CardDescription>Currency and formatting are standardized for this portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Primary Currency</Label>
                  <p className="text-xs text-muted-foreground">Dashboard cost views are standardized to INR.</p>
                </div>
                <Badge variant="secondary">INR only</Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Number Format</Label>
                  <p className="text-xs text-muted-foreground">Regional grouping for rupee display is enabled.</p>
                </div>
                <Switch checked disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Email Notifications</CardTitle>
              <CardDescription>Notification settings are placeholders in this build.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-report">Weekly Summary Report</Label>
                <Switch id="weekly-report" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="critical-alerts">Critical Budget Alerts</Label>
                <Switch id="critical-alerts" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>Theme controls are available from the sidebar toggle.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Use the theme toggle in the sidebar footer to switch the portal appearance.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription>Admin routes are protected in the UI. Backend token enforcement remains in development mode.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Use admin accounts only for manual pricing uploads and other operational changes.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4 text-primary" />
                Manual Pricing Import
              </CardTitle>
              <CardDescription>
                Upload the SG-style pricing workbook and import it directly into SQL for either subscription. The portal converts the file to synthetic monthly pricing rows automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Accepted workbook format</p>
                <p className="mt-1">The file must be `.xlsx` and include fields like `subscriptionFriendlyName`, `resourceGroup`, `resourceName`, `usageDate`, and `INR Amount`.</p>
                <p className="mt-2">If you leave the effective date empty, the portal derives the month-end date from the uploaded workbook automatically.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Subscription</Label>
                  <Select value={selectedSubscription} onValueChange={setSelectedSubscription}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose subscription" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptions.map((subscription) => (
                        <SelectItem key={subscription} value={subscription}>
                          {subscription}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effective-date">Effective Usage Date Override</Label>
                  <Input
                    id="effective-date"
                    type="date"
                    value={effectiveUsageDate}
                    onChange={(event) => setEffectiveUsageDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-pricing-file">Workbook</Label>
                <Input
                  id="manual-pricing-file"
                  type="file"
                  accept=".xlsx"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>{selectedFile.name}</span>
                    <Badge variant="outline">{(selectedFile.size / 1024).toFixed(1)} KB</Badge>
                  </div>
                )}
              </div>

              {lastImport && (
                <div className="grid gap-3 rounded-lg border border-emerald-200/50 bg-emerald-50/40 p-4 md:grid-cols-3 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                  <div>
                    <p className="text-xs text-muted-foreground">Imported Total</p>
                    <p className="text-lg font-semibold text-foreground">{formatINR(lastImport.totalImportedAmtInr)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Inserted Resources</p>
                    <p className="text-lg font-semibold text-foreground">{lastImport.matchedResourcesInserted}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Effective Date</p>
                    <p className="text-lg font-semibold text-foreground">{lastImport.effectiveUsageDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Aggregated Resources</p>
                    <p className="text-sm font-medium text-foreground">{lastImport.distinctAggregatedResources}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Unmatched</p>
                    <p className="text-sm font-medium text-foreground">{lastImport.unmatchedResources}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                    <p className="text-sm font-medium text-foreground">{lastImport.skippedRows}</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t bg-muted/30 py-3">
              <p className="text-xs text-muted-foreground">Use this only for manual workbook backfills. Live Azure export import continues separately.</p>
              <Button onClick={handleUpload} disabled={!selectedSubscription || !selectedFile || isUploading} className="gap-2">
                {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isUploading ? "Importing..." : "Import Workbook"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default memo(SettingsPage);
