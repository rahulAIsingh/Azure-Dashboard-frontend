import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { AppUser, UserRole, AccessScope } from "@/types/dashboardTypes";
import { useLookups } from "@/hooks/useLookups";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null; // null = create mode
}

export function UserModal({ open, onOpenChange, user }: UserModalProps) {
  const { addUser, updateUser } = useAuth();
  const { data: lookups } = useLookups();
  const { toast } = useToast();
  const allSubscriptions = lookups.subscriptions;
  const allResourceGroups = lookups.resourceGroups;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [scopes, setScopes] = useState<AccessScope[]>([]);

  // Scope builder state
  const [scopeType, setScopeType] = useState<"subscription" | "resourceGroup">("resourceGroup");
  const [scopeValue, setScopeValue] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setDepartment(user.department || "");
      setPassword(user.password || "");
      setScopes(user.scopes || []);
    } else {
      setName("");
      setEmail("");
      setRole("viewer");
      setDepartment("");
      setPassword("");
      setScopes([]);
    }
  }, [user, open]);

  const addScope = () => {
    if (!scopeValue) return;
    if (scopes.some((s) => s.type === scopeType && s.value === scopeValue)) return;
    setScopes([...scopes, { type: scopeType, value: scopeValue }]);
    setScopeValue("");
  };

  const removeScope = (idx: number) => setScopes(scopes.filter((_, i) => i !== idx));

  const handleSave = async () => {
    const now = new Date().toISOString();
    const userData: AppUser = {
      id: user?.id || `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      password: password.trim() ? password.trim() : (user ? undefined : email.trim()), // Default to email for new users, leave undefined for existing if empty
      role,
      department: department.trim() || undefined,
      assignedResourceGroups: scopes.filter((s) => s.type === "resourceGroup").map((s) => s.value),
      scopes,
      lastActive: user?.lastActive || now,
    };

    try {
      if (user) {
        await updateUser(userData);
      } else {
        await addUser(userData);
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Failed to save user",
        description: err.message || "Please check if the backend is running.",
        variant: "destructive",
      });
      console.error(err);
    }
  };

  const scopeOptions = scopeType === "subscription" ? allSubscriptions : allResourceGroups;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@company.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder={user ? "Leave empty to keep current" : "Default: same as email"} 
              />
            </div>
          </div>

          {/* Scope section */}
          <div className="space-y-2">
            <Label>Access Scopes</Label>
            <div className="flex gap-2">
              <Select value={scopeType} onValueChange={(v) => { setScopeType(v as any); setScopeValue(""); }}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="resourceGroup">Resource Group</SelectItem>
                </SelectContent>
              </Select>
              <Select value={scopeValue} onValueChange={setScopeValue}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select value" /></SelectTrigger>
                <SelectContent>
                  {scopeOptions.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" size="icon" variant="outline" onClick={addScope} disabled={!scopeValue}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {scopes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {scopes.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">
                    <span className="opacity-60">{s.type === "subscription" ? "Sub" : "RG"}:</span> {s.value}
                    <button onClick={() => removeScope(i)} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !email.trim()}>
            {user ? "Save Changes" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
