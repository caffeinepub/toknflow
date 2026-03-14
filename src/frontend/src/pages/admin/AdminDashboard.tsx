import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  BarChart2,
  CheckCircle,
  ClipboardList,
  Clock,
  LayoutDashboard,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Stethoscope,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Variant_pending_approved_rejected } from "../../backend.d";
import type { UserProfile } from "../../backend.d";
import { Header } from "../../components/Header";
import { QueueList } from "../../components/QueueList";
import { Sidebar } from "../../components/Sidebar";
import { StatsCard } from "../../components/StatsCard";
import type { AppPage } from "../../hooks/useAuth";
import {
  useAddDoctor,
  useAllQueues,
  useAnalytics,
  useApproveDoctorRequest,
  useDoctorRequests,
  useDoctors,
  useRejectDoctorRequest,
  useResetDailyQueues,
} from "../../hooks/useQueue";

interface AdminDashboardProps {
  userProfile: UserProfile | null;
  onLogout: () => void;
  onNavigateTo: (page: AppPage) => void;
}

type AdminSection =
  | "overview"
  | "doctors"
  | "requests"
  | "queues"
  | "analytics"
  | "reset";

const sidebarItems = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
    ocid: "sidebar.overview_link",
  },
  {
    id: "doctors",
    label: "Doctors",
    icon: <Stethoscope className="w-4 h-4" />,
    ocid: "sidebar.doctors_link",
  },
  {
    id: "requests",
    label: "Requests",
    icon: <ClipboardList className="w-4 h-4" />,
    ocid: "sidebar.requests_link",
  },
  {
    id: "queues",
    label: "All Queues",
    icon: <List className="w-4 h-4" />,
    ocid: "sidebar.queues_link",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart2 className="w-4 h-4" />,
    ocid: "sidebar.analytics_link",
  },
  {
    id: "reset",
    label: "Reset Queues",
    icon: <RefreshCw className="w-4 h-4" />,
    ocid: "sidebar.reset_link",
  },
];

const sectionTitles: Record<AdminSection, string> = {
  overview: "Overview",
  doctors: "Doctor Management",
  requests: "Doctor Requests",
  queues: "All Queues",
  analytics: "Analytics",
  reset: "Reset Queues",
};

export function AdminDashboard({ userProfile, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [approveModalRequestId, setApproveModalRequestId] = useState<
    bigint | null
  >(null);
  const [approvePrincipal, setApprovePrincipal] = useState("");

  // Doctor form state
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState("");
  const [newDoctorAvgTime, setNewDoctorAvgTime] = useState("10");
  const [newDoctorPrincipal, setNewDoctorPrincipal] = useState("");

  const { data: doctors, isLoading: isLoadingDoctors } = useDoctors();
  const { data: analytics, isLoading: isLoadingAnalytics } = useAnalytics();
  const { data: requests, isLoading: isLoadingRequests } = useDoctorRequests();
  const { data: allQueues, isLoading: isLoadingQueues } = useAllQueues();

  const addDoctor = useAddDoctor();
  const approveRequest = useApproveDoctorRequest();
  const rejectRequest = useRejectDoctorRequest();
  const resetQueues = useResetDailyQueues();

  const pendingRequests =
    requests?.filter(
      (r) => r.status === Variant_pending_approved_rejected.pending,
    ) ?? [];

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorName || !newDoctorSpecialty || !newDoctorPrincipal) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await addDoctor.mutateAsync({
        name: newDoctorName,
        specialty: newDoctorSpecialty,
        avgConsultationMinutes: BigInt(Number.parseInt(newDoctorAvgTime) || 10),
        doctorPrincipal: newDoctorPrincipal,
      });
      toast.success(`Dr. ${newDoctorName} added successfully`);
      setShowAddDoctor(false);
      setNewDoctorName("");
      setNewDoctorSpecialty("");
      setNewDoctorAvgTime("10");
      setNewDoctorPrincipal("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add doctor");
    }
  };

  const handleApproveRequest = async () => {
    if (!approveModalRequestId) return;
    if (!approvePrincipal.trim()) {
      toast.error("Please enter the doctor's principal");
      return;
    }
    try {
      await approveRequest.mutateAsync({
        requestId: approveModalRequestId,
        doctorPrincipal: approvePrincipal.trim(),
      });
      toast.success("Doctor request approved!");
      setApproveModalRequestId(null);
      setApprovePrincipal("");
    } catch {
      toast.error("Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId: bigint) => {
    try {
      await rejectRequest.mutateAsync(requestId);
      toast.success("Request rejected");
    } catch {
      toast.error("Failed to reject request");
    }
  };

  const handleResetQueues = async () => {
    try {
      await resetQueues.mutateAsync();
      toast.success("All queues reset for the day");
      setShowResetConfirm(false);
    } catch {
      toast.error("Failed to reset queues");
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display mb-1">System Overview</h2>
        <p className="text-muted-foreground text-sm">
          Today's clinic performance at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          title="Patients Today"
          value={
            isLoadingAnalytics
              ? "—"
              : Number(analytics?.totalPatientsToday ?? 0).toString()
          }
          icon={<Users className="w-5 h-5" />}
          colorClass="text-teal-400"
          isLoading={isLoadingAnalytics}
        />
        <StatsCard
          title="Active Doctors"
          value={doctors?.filter((d) => d.isActive).length ?? 0}
          icon={<Stethoscope className="w-5 h-5" />}
          colorClass="text-emerald-400"
          isLoading={isLoadingDoctors}
        />
        <StatsCard
          title="Pending Requests"
          value={pendingRequests.length}
          icon={<ClipboardList className="w-5 h-5" />}
          colorClass={
            pendingRequests.length > 0
              ? "text-amber-400"
              : "text-muted-foreground"
          }
        />
        <StatsCard
          title="Avg Wait Time"
          value={
            isLoadingAnalytics ? "—" : `${Number(analytics?.avgWaitTime ?? 0)}m`
          }
          icon={<Clock className="w-5 h-5" />}
          colorClass="text-amber-400"
          isLoading={isLoadingAnalytics}
        />
      </div>

      {/* Doctor status summary */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-bold font-display mb-4 text-sm">Doctors Status</h3>
        {isLoadingDoctors ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full bg-white/5 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {(doctors ?? []).map((doctor) => (
              <div
                key={doctor.id.toString()}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      doctor.isPaused
                        ? "bg-amber-400"
                        : doctor.isActive
                          ? "bg-emerald-400"
                          : "bg-muted-foreground"
                    }`}
                  />
                  <span className="text-sm font-medium">Dr. {doctor.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {doctor.specialty}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    doctor.isPaused
                      ? "text-amber-400 border-amber-400/30"
                      : doctor.isActive
                        ? "text-emerald-400 border-emerald-400/30"
                        : "text-muted-foreground"
                  }`}
                >
                  {doctor.isPaused
                    ? "Paused"
                    : doctor.isActive
                      ? "Active"
                      : "Inactive"}
                </Badge>
              </div>
            ))}
            {(!doctors || doctors.length === 0) && (
              <p
                className="text-sm text-muted-foreground text-center py-4"
                data-ocid="doctors.empty_state"
              >
                No doctors added yet
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderDoctors = () => (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold font-display mb-1">Doctors</h2>
          <p className="text-muted-foreground text-sm">
            Manage clinic doctors.
          </p>
        </div>
        <Button
          className="gradient-teal text-white font-semibold rounded-xl btn-glow"
          onClick={() => setShowAddDoctor(true)}
          data-ocid="admin.add_doctor_button"
        >
          <Plus className="mr-2 w-4 h-4" />
          Add Doctor
        </Button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <Table data-ocid="doctors.table">
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-xs text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="text-xs text-muted-foreground">
                Specialty
              </TableHead>
              <TableHead className="text-xs text-muted-foreground">
                Avg Time
              </TableHead>
              <TableHead className="text-xs text-muted-foreground">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingDoctors ? (
              Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                <TableRow key={i} className="border-white/5">
                  {[1, 2, 3, 4].map((j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-white/5 rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (doctors ?? []).length === 0 ? (
              <TableRow className="border-white/5">
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground text-sm"
                  data-ocid="doctors.table.empty_state"
                >
                  No doctors added yet. Click "Add Doctor" to get started.
                </TableCell>
              </TableRow>
            ) : (
              (doctors ?? []).map((doctor, idx) => (
                <TableRow
                  key={doctor.id.toString()}
                  data-ocid={`doctors.item.${idx + 1}`}
                  className="border-white/5 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium">
                    Dr. {doctor.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doctor.specialty}
                  </TableCell>
                  <TableCell className="text-sm">
                    {Number(doctor.avgConsultationMinutes)}m
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        doctor.isPaused
                          ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
                          : doctor.isActive
                            ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                            : "text-muted-foreground"
                      }`}
                    >
                      {doctor.isPaused
                        ? "Paused"
                        : doctor.isActive
                          ? "Active"
                          : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold font-display mb-1">Doctor Requests</h2>
        <p className="text-muted-foreground text-sm">
          Approve or reject doctor requests submitted by patients.
        </p>
      </div>

      {isLoadingRequests ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : pendingRequests.length === 0 ? (
        <div
          className="glass rounded-2xl p-10 text-center"
          data-ocid="requests.empty_state"
        >
          <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-400/50" />
          <p className="text-sm text-muted-foreground">
            No pending requests. All caught up!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((req, idx) => (
            <div
              key={req.id.toString()}
              data-ocid={`requests.item.${idx + 1}`}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold">Dr. {req.doctorName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {req.specialty}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested by:{" "}
                    <span className="font-mono text-teal-400/70">
                      {req.requestedBy.toString().slice(0, 12)}...
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                    onClick={() => {
                      setApproveModalRequestId(req.id);
                    }}
                    data-ocid={`admin.approve_request_button.${idx + 1}`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30"
                    onClick={() => void handleRejectRequest(req.id)}
                    disabled={rejectRequest.isPending}
                    data-ocid={`admin.reject_request_button.${idx + 1}`}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All requests history */}
      {(requests?.filter(
        (r) => r.status !== Variant_pending_approved_rejected.pending,
      )?.length ?? 0) > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <h3 className="text-sm font-medium text-muted-foreground">
              Past Requests
            </h3>
          </div>
          <Table>
            <TableBody>
              {requests
                ?.filter(
                  (r) => r.status !== Variant_pending_approved_rejected.pending,
                )
                .map((req, idx) => (
                  <TableRow
                    key={req.id.toString()}
                    className="border-white/5"
                    data-ocid={`requests.history.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">
                      Dr. {req.doctorName}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {req.specialty}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          req.status ===
                          Variant_pending_approved_rejected.approved
                            ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                            : "text-rose-400 border-rose-400/30 bg-rose-400/10"
                        }
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  const renderQueues = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold font-display mb-1">All Queues</h2>
        <p className="text-muted-foreground text-sm">
          Live queue status for every doctor.
        </p>
      </div>

      {isLoadingQueues ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : !allQueues || allQueues.length === 0 ? (
        <div
          className="glass rounded-2xl p-10 text-center"
          data-ocid="queues.empty_state"
        >
          <p className="text-sm text-muted-foreground">No active queues</p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {allQueues.map(([doctorId, tokens], idx) => {
            const doctor = doctors?.find((d) => d.id === doctorId);
            const waiting = tokens.filter(
              (t) =>
                t.status === "waiting" ||
                t.status === "called" ||
                t.status === "serving",
            ).length;

            return (
              <AccordionItem
                key={doctorId.toString()}
                value={doctorId.toString()}
                data-ocid={`queues.item.${idx + 1}`}
                className="glass rounded-2xl border-white/10 overflow-hidden"
              >
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${doctor?.isPaused ? "bg-amber-400" : "bg-emerald-400"}`}
                    />
                    <span className="font-medium">
                      {doctor ? `Dr. ${doctor.name}` : `Doctor #${doctorId}`}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {doctor?.specialty}
                    </span>
                    <Badge
                      variant="outline"
                      className="ml-2 text-xs bg-teal-400/10 text-teal-400 border-teal-400/20"
                    >
                      {waiting} waiting
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4">
                  <QueueList
                    tokens={tokens}
                    avgConsultationMinutes={
                      doctor ? Number(doctor.avgConsultationMinutes) : 10
                    }
                    maxHeight="300px"
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold font-display mb-1">Analytics</h2>
        <p className="text-muted-foreground text-sm">
          Daily statistics and performance metrics.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          title="Total Patients Today"
          value={
            isLoadingAnalytics
              ? "—"
              : Number(analytics?.totalPatientsToday ?? 0)
          }
          icon={<Users className="w-5 h-5" />}
          colorClass="text-teal-400"
          isLoading={isLoadingAnalytics}
        />
        <StatsCard
          title="Average Wait Time"
          value={
            isLoadingAnalytics ? "—" : `${Number(analytics?.avgWaitTime ?? 0)}m`
          }
          icon={<Clock className="w-5 h-5" />}
          colorClass="text-amber-400"
          isLoading={isLoadingAnalytics}
        />
      </div>

      {/* Per-doctor stats */}
      {analytics && analytics.perDoctorStats.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <h3 className="text-sm font-semibold">Per Doctor Statistics</h3>
          </div>
          <Table data-ocid="analytics.table">
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">
                  Doctor
                </TableHead>
                <TableHead className="text-xs text-muted-foreground">
                  Patients
                </TableHead>
                <TableHead className="text-xs text-muted-foreground">
                  Avg Wait
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.perDoctorStats.map(([doctorId, stats], idx) => {
                const doctor = doctors?.find((d) => d.id === doctorId);
                return (
                  <TableRow
                    key={doctorId.toString()}
                    data-ocid={`analytics.item.${idx + 1}`}
                    className="border-white/5 hover:bg-white/5"
                  >
                    <TableCell className="font-medium">
                      {doctor ? `Dr. ${doctor.name}` : `Doctor #${doctorId}`}
                    </TableCell>
                    <TableCell>{Number(stats.totalPatients)}</TableCell>
                    <TableCell>{Number(stats.avgWaitTime)}m</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {(!analytics || analytics.perDoctorStats.length === 0) &&
        !isLoadingAnalytics && (
          <div
            className="glass rounded-2xl p-8 text-center"
            data-ocid="analytics.empty_state"
          >
            <BarChart2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Analytics will appear here once patients start using the system.
            </p>
          </div>
        )}
    </div>
  );

  const renderReset = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display mb-1">
          Reset Daily Queues
        </h2>
        <p className="text-muted-foreground text-sm">
          Clear all active queues at the end of the day.
        </p>
      </div>

      <div className="glass rounded-2xl p-6 border border-rose-400/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-400/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-rose-400 mb-1">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              This action will clear all active patient queues across all
              doctors. All waiting, called, and serving tokens will be reset.
              This cannot be undone. Only perform this at the end of the working
              day.
            </p>
            <Button
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-semibold"
              onClick={() => setShowResetConfirm(true)}
              data-ocid="admin.reset_queues_button"
            >
              <RefreshCw className="mr-2 w-4 h-4" />
              Reset All Queues
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview();
      case "doctors":
        return renderDoctors();
      case "requests":
        return renderRequests();
      case "queues":
        return renderQueues();
      case "analytics":
        return renderAnalytics();
      case "reset":
        return renderReset();
      default:
        return null;
    }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "oklch(0.12 0.025 250)" }}
    >
      <Sidebar
        items={sidebarItems}
        activeItem={activeSection}
        onNavigate={(id) => setActiveSection(id as AdminSection)}
        userRole="admin"
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={sectionTitles[activeSection]}
          subtitle={`Admin: ${userProfile?.name ?? "Administrator"}`}
          userProfile={userProfile}
          onLogout={onLogout}
        />

        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Add Doctor Dialog */}
      <Dialog open={showAddDoctor} onOpenChange={setShowAddDoctor}>
        <DialogContent
          className="bg-navy-900 border-white/10 max-w-md"
          data-ocid="admin.add_doctor_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Add New Doctor</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fill in the doctor's information to add them to the system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleAddDoctor(e)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Doctor Name</Label>
              <Input
                value={newDoctorName}
                onChange={(e) => setNewDoctorName(e.target.value)}
                placeholder="Dr. John Smith"
                className="bg-white/5 border-white/10 rounded-xl"
                data-ocid="admin.doctor_name_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Specialty</Label>
              <Input
                value={newDoctorSpecialty}
                onChange={(e) => setNewDoctorSpecialty(e.target.value)}
                placeholder="Cardiology"
                className="bg-white/5 border-white/10 rounded-xl"
                data-ocid="admin.doctor_specialty_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Avg Consultation Time (minutes)</Label>
              <Input
                type="number"
                value={newDoctorAvgTime}
                onChange={(e) => setNewDoctorAvgTime(e.target.value)}
                min="1"
                max="120"
                className="bg-white/5 border-white/10 rounded-xl"
                data-ocid="admin.doctor_avg_time_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Doctor Principal (ICP address)</Label>
              <Input
                value={newDoctorPrincipal}
                onChange={(e) => setNewDoctorPrincipal(e.target.value)}
                placeholder="aaaaa-aa"
                className="bg-white/5 border-white/10 rounded-xl font-mono text-sm"
                data-ocid="admin.doctor_principal_input"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddDoctor(false)}
                data-ocid="admin.add_doctor_dialog.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gradient-teal text-white"
                disabled={addDoctor.isPending}
                data-ocid="admin.add_doctor_dialog.confirm_button"
              >
                {addDoctor.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add Doctor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approve Request Dialog */}
      <Dialog
        open={approveModalRequestId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setApproveModalRequestId(null);
            setApprovePrincipal("");
          }
        }}
      >
        <DialogContent
          className="bg-navy-900 border-white/10 max-w-sm"
          data-ocid="admin.approve_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Approve Doctor Request
            </DialogTitle>
            <DialogDescription>
              Enter the doctor's ICP principal to approve and add them to the
              system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm">Doctor's Principal</Label>
            <Input
              value={approvePrincipal}
              onChange={(e) => setApprovePrincipal(e.target.value)}
              placeholder="aaaaa-aa"
              className="bg-white/5 border-white/10 rounded-xl font-mono text-sm"
              data-ocid="admin.approve_principal_input"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setApproveModalRequestId(null);
                setApprovePrincipal("");
              }}
              data-ocid="admin.approve_dialog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
              onClick={() => void handleApproveRequest()}
              disabled={approveRequest.isPending}
              data-ocid="admin.approve_dialog.confirm_button"
            >
              {approveRequest.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent
          className="bg-navy-900 border-white/10"
          data-ocid="admin.reset_confirm_dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-rose-400">
              Reset All Queues?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently clear all active queues for today. All
              waiting patients will lose their tokens. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/10 hover:bg-white/5"
              data-ocid="admin.reset_cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => void handleResetQueues()}
              data-ocid="admin.confirm_reset_button"
            >
              {resetQueues.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Yes, Reset All Queues
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
