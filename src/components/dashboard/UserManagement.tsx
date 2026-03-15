import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Trash2, Shield, Eye, Edit3, ChevronDown, ChevronRight, X, UserPlus, Globe, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLookups } from "@/hooks/useLookups";
import { type AppUser, type UserRole } from "@/types/dashboardTypes";
import { roleColors, roleDescriptions } from "@/data/usersData";
import type { AccessScope } from "@/contexts/AuthContext";

interface UserManagementProps {
  users: AppUser[];
  currentUser: AppUser;
  onAddUser: (user: AppUser) => void;
  onRemoveUser: (id: string) => void;
  onUpdateUser: (user: AppUser) => void;
}

const roleIcons: Record<UserRole, React.ElementType> = {
  admin: Shield,
  editor: Edit3,
  viewer: Eye,
};

function ScopeEditor({ scopes, onChange }: { scopes: AccessScope[]; onChange: (s: AccessScope[]) => void }) {
  const [scopeType, setScopeType] = useState<"subscription" | "resourceGroup">("resourceGroup");
  const [scopeValue, setScopeValue] = useState("");
  const { data: lookups } = useLookups();
  const allSubscriptions = lookups.subscriptions;
  const allResourceGroups = lookups.resourceGroups;

  const options = scopeType === "subscription" ? allSubscriptions : allResourceGroups;
  const existing = new Set(scopes.map((s) => `${s.type}:${s.value}`));

  const addScope = () => {
    if (!scopeValue || existing.has(`${scopeType}:${scopeValue}`)) return;
    onChange([...scopes, { type: scopeType, value: scopeValue }]);
    setScopeValue("");
  };

  const removeScope = (idx: number) => {
    onChange(scopes.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Access Scopes</p>

      {/* Existing scopes */}
      <div className="flex flex-wrap gap-1.5">
        {scopes.length === 0 && <span className="text-[10px] text-muted-foreground italic">No scopes assigned</span>}
        {scopes.map((s, i) => (
          <Badge key={i} variant="outline" className="text-[10px] gap-1 pr-1">
            {s.type === "subscription" ? <Globe className="h-2.5 w-2.5" /> : <Layers className="h-2.5 w-2.5" />}
            {s.value}
            <button onClick={() => removeScope(i)} className="ml-0.5 hover:text-destructive">
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Add scope */}
      <div className="flex gap-1.5">
        <Select value={scopeType} onValueChange={(v) => { setScopeType(v as any); setScopeValue(""); }}>
          <SelectTrigger className="w-[130px] h-8 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="subscription">Subscription</SelectItem>
            <SelectItem value="resourceGroup">Resource Group</SelectItem>
          </SelectContent>
        </Select>
        <Select value={scopeValue} onValueChange={setScopeValue}>
          <SelectTrigger className="flex-1 h-8 text-xs bg-secondary border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            {options.filter((o) => !existing.has(`${scopeType}:${o}`)).map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-8 px-2" onClick={addScope} disabled={!scopeValue}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function UserManagement({ users, currentUser, onAddUser, onRemoveUser, onUpdateUser }: UserManagementProps) {
  const [open, setOpen] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [department, setDepartment] = useState("");
  const [newScopes, setNewScopes] = useState<AccessScope[]>([]);

  const handleAdd = () => {
    if (!name || !email) return;
    const rgs = newScopes.filter((s) => s.type === "resourceGroup").map((s) => s.value);
    onAddUser({
      id: crypto.randomUUID(),
      name, email, role,
      assignedResourceGroups: role === "admin" ? [] : rgs,
      scopes: role === "admin" ? [] : newScopes,
      department: department || undefined,
      lastActive: new Date().toISOString(),
    });
    setName(""); setEmail(""); setRole("viewer"); setDepartment(""); setNewScopes([]);
    setOpen(false);
  };

  const getInitials = (n: string) => n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const formatLastActive = (iso?: string) => {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
    return `${Math.round(diff / 86400000)}d ago`;
  };

  const formatScopes = (user: AppUser) => {
    if (user.role === "admin") return "All Access";
    const scopes = user.scopes || [];
    if (scopes.length === 0 && user.assignedResourceGroups.length === 0) return "No Scope";
    const labels = scopes.map((s) => s.value);
    // fallback to legacy
    if (labels.length === 0) return user.assignedResourceGroups.join(", ");
    return labels.join(", ");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      <div className="glass-card rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">User Management</h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{users.length} users</Badge>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1"><UserPlus className="h-3 w-3" /> Add User</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
                <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary border-border" />
                <Input placeholder="Department (optional)" value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-secondary border-border" />
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — Full Access</SelectItem>
                    <SelectItem value="editor">Editor — Modify Assigned</SelectItem>
                    <SelectItem value="viewer">Viewer — Read Only</SelectItem>
                  </SelectContent>
                </Select>

                {role !== "admin" && (
                  <ScopeEditor scopes={newScopes} onChange={setNewScopes} />
                )}

                <Button onClick={handleAdd} className="w-full" disabled={!name || !email || (role !== "admin" && newScopes.length === 0)}>
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Current user banner */}
        <div className="p-3 rounded-md border border-primary/20 bg-primary/5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {getInitials(currentUser.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{currentUser.name} <span className="text-muted-foreground text-xs">(You)</span></p>
              <p className="text-[10px] text-muted-foreground">{currentUser.email} · {currentUser.department}</p>
            </div>
            <Badge className={`text-[10px] ${roleColors[currentUser.role]} border`}>
              <Shield className="h-3 w-3 mr-1" /> {currentUser.role}
            </Badge>
          </div>
        </div>

        {/* Role legend */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(Object.keys(roleDescriptions) as UserRole[]).map((r) => {
            const Icon = roleIcons[r];
            return (
              <div key={r} className="p-2 rounded-md border border-border/50 bg-secondary/20 text-center">
                <Icon className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-medium text-foreground capitalize">{r}</p>
                <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{roleDescriptions[r]}</p>
              </div>
            );
          })}
        </div>

        {/* User list */}
        <div className="space-y-2">
          {users.filter((u) => u.id !== currentUser.id).map((user) => {
            const Icon = roleIcons[user.role];
            const isExpanded = expandedUser === user.id;

            return (
              <div key={user.id}>
                <div
                  className="p-3 rounded-md border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{user.email} {user.department && `· ${user.department}`}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[9px] ${roleColors[user.role]} border`}>
                        <Icon className="h-2.5 w-2.5 mr-0.5" /> {user.role}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">{formatLastActive(user.lastActive)}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onRemoveUser(user.id); }}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Access scope preview */}
                  <div className="ml-9 mt-2">
                    <span className="text-[10px] text-muted-foreground mr-1.5">Scope:</span>
                    <span className="text-[10px] text-foreground">{formatScopes(user)}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-2 mb-1 p-3 rounded-b-md bg-secondary/10 border border-t-0 border-border/20 space-y-3">
                        {/* Role change */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Change Role</p>
                          <Select value={user.role} onValueChange={(v) => onUpdateUser({
                            ...user, role: v as UserRole,
                            assignedResourceGroups: v === "admin" ? [] : user.assignedResourceGroups,
                            scopes: v === "admin" ? [] : user.scopes,
                          })}>
                            <SelectTrigger className="bg-secondary border-border h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Scope assignment */}
                        {user.role !== "admin" && (
                          <ScopeEditor
                            scopes={user.scopes || []}
                            onChange={(scopes) => {
                              const rgs = scopes.filter((s) => s.type === "resourceGroup").map((s) => s.value);
                              onUpdateUser({ ...user, scopes, assignedResourceGroups: rgs });
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
