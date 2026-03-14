import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Clock,
  List,
  Loader2,
  Pause,
  Play,
  Settings,
  SkipForward,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ConsultationStatus } from "../../backend.d";
import type { UserProfile } from "../../backend.d";
import { Header } from "../../components/Header";
import { QueueList } from "../../components/QueueList";
import { Sidebar } from "../../components/Sidebar";
import { StatsCard } from "../../components/StatsCard";
import type { AppPage } from "../../hooks/useAuth";
import {
  useAddEmergencyPatient,
  useCallNextPatient,
  useCompleteToken,
  useDoctors,
  usePauseQueue,
  useQueue,
  useResumeQueue,
} from "../../hooks/useQueue";
import { announceToken } from "../../utils/speech";

interface DoctorDashboardProps {
  userProfile: UserProfile | null;
  onLogout: () => void;
  onNavigateTo: (page: AppPage) => void;
}

type DoctorSection = "queue" | "emergency" | "settings";

const sidebarItems = [
  {
    id: "queue",
    label: "Patient Queue",
    icon: <List className="w-4 h-4" />,
    ocid: "sidebar.queue_link",
  },
  {
    id: "emergency",
    label: "Emergency Add",
    icon: <UserPlus className="w-4 h-4" />,
    ocid: "sidebar.emergency_link",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-4 h-4" />,
    ocid: "sidebar.settings_link",
  },
];

export function DoctorDashboard({
  userProfile,
  onLogout,
}: DoctorDashboardProps) {
  const [activeSection, setActiveSection] = useState<DoctorSection>("queue");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [emergencyName, setEmergencyName] = useState("");

  const { data: doctors, isLoading: isLoadingDoctors } = useDoctors();
  const doctorIdBigint = selectedDoctorId ? BigInt(selectedDoctorId) : null;
  const { data: queue, isLoading: isLoadingQueue } = useQueue(doctorIdBigint);

  const callNext = useCallNextPatient();
  const addEmergency = useAddEmergencyPatient();
  const pauseQueue = usePauseQueue();
  const resumeQueue = useResumeQueue();
  const completeToken = useCompleteToken();

  const selectedDoctor = doctors?.find(
    (d) => d.id.toString() === selectedDoctorId,
  );

  const waitingCount =
    queue?.filter((t) => t.status === ConsultationStatus.waiting).length ?? 0;
  const servingToken = queue?.find(
    (t) => t.status === ConsultationStatus.serving,
  );
  const calledToken = queue?.find(
    (t) => t.status === ConsultationStatus.called,
  );

  const handleCallNext = async () => {
    if (!doctorIdBigint) return;
    try {
      const tokenId = await callNext.mutateAsync(doctorIdBigint);
      if (tokenId !== null && tokenId !== undefined) {
        // Find the called token to announce
        const token = queue?.find((t) => t.id === tokenId);
        if (token && selectedDoctor) {
          announceToken(
            token.tokenNumber,
            token.isFamilyMember && token.memberName
              ? token.memberName
              : token.patientName,
            selectedDoctor.name,
          );
          toast.success(
            `Calling Token #${token.tokenNumber} — ${token.isFamilyMember && token.memberName ? token.memberName : token.patientName}`,
          );
        }
      } else {
        toast.info("No more patients in queue");
      }
    } catch {
      toast.error("Failed to call next patient");
    }
  };

  const handleAddEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorIdBigint) {
      toast.error("Please select a doctor first");
      return;
    }
    if (!emergencyName.trim()) {
      toast.error("Please enter patient name");
      return;
    }
    try {
      await addEmergency.mutateAsync({
        doctorId: doctorIdBigint,
        patientName: emergencyName.trim(),
      });
      toast.success(`Emergency patient ${emergencyName} added to queue`);
      setEmergencyName("");
    } catch {
      toast.error("Failed to add emergency patient");
    }
  };

  const handleTogglePause = async () => {
    if (!doctorIdBigint || !selectedDoctor) return;
    try {
      if (selectedDoctor.isPaused) {
        await resumeQueue.mutateAsync(doctorIdBigint);
        toast.success("Queue resumed");
      } else {
        await pauseQueue.mutateAsync(doctorIdBigint);
        toast.info("Queue paused");
      }
    } catch {
      toast.error("Failed to toggle queue status");
    }
  };

  const handleCompleteToken = async (tokenId: bigint) => {
    try {
      await completeToken.mutateAsync(tokenId);
      toast.success("Consultation completed");
    } catch {
      toast.error("Failed to complete token");
    }
  };

  const renderQueueSection = () => (
    <div className="space-y-5">
      {/* Doctor picker */}
      <div className="glass rounded-2xl p-5">
        <Label className="text-sm font-medium mb-3 block">
          Select Your Doctor Profile
        </Label>
        {isLoadingDoctors ? (
          <Skeleton className="h-11 w-full bg-white/5 rounded-xl" />
        ) : (
          <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
            <SelectTrigger
              className="bg-white/5 border-white/10 focus:border-teal-400/50 h-11 rounded-xl"
              data-ocid="doctor.profile_select"
            >
              <SelectValue placeholder="Select your doctor profile..." />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-white/10">
              {(doctors ?? []).map((doctor) => (
                <SelectItem
                  key={doctor.id.toString()}
                  value={doctor.id.toString()}
                >
                  Dr. {doctor.name} — {doctor.specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedDoctor && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatsCard
              title="Waiting"
              value={waitingCount}
              icon={<Users className="w-5 h-5" />}
              colorClass="text-amber-400"
            />
            <StatsCard
              title="Status"
              value={selectedDoctor.isPaused ? "Paused" : "Active"}
              icon={<Activity className="w-5 h-5" />}
              colorClass={
                selectedDoctor.isPaused ? "text-amber-400" : "text-emerald-400"
              }
            />
            <StatsCard
              title="Avg Time"
              value={`${Number(selectedDoctor.avgConsultationMinutes)}m`}
              icon={<Clock className="w-5 h-5" />}
              colorClass="text-teal-400"
            />
          </div>

          {/* Currently Serving */}
          {(servingToken ?? calledToken) && (
            <div
              className="glass rounded-2xl p-5 border border-emerald-400/20"
              style={{ background: "oklch(0.68 0.22 165 / 8%)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-400">
                    {servingToken ? "Currently Serving" : "Just Called"}
                  </span>
                </div>
                {servingToken && (
                  <Button
                    size="sm"
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                    onClick={() => void handleCompleteToken(servingToken.id)}
                    disabled={completeToken.isPending}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Complete
                  </Button>
                )}
              </div>
              {(servingToken ?? calledToken) && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold">
                      {(servingToken ?? calledToken)?.isFamilyMember &&
                      (servingToken ?? calledToken)?.memberName
                        ? (servingToken ?? calledToken)?.memberName
                        : (servingToken ?? calledToken)?.patientName}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      Token #{(servingToken ?? calledToken)?.tokenNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1 gradient-teal text-white font-bold h-12 rounded-xl btn-glow"
              onClick={() => void handleCallNext()}
              disabled={callNext.isPending || waitingCount === 0}
              data-ocid="doctor.call_next_button"
            >
              {callNext.isPending ? (
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              ) : (
                <SkipForward className="mr-2 w-4 h-4" />
              )}
              Call Next Patient
            </Button>
            <Button
              className={`h-12 px-4 rounded-xl font-semibold ${
                selectedDoctor.isPaused
                  ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
              }`}
              onClick={() => void handleTogglePause()}
              disabled={pauseQueue.isPending || resumeQueue.isPending}
              data-ocid="doctor.pause_button"
            >
              {selectedDoctor.isPaused ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Queue status badge */}
          {selectedDoctor.isPaused && (
            <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-2.5">
              <Pause className="w-3.5 h-3.5" />
              Queue is currently paused. New patients cannot join.
            </div>
          )}

          {/* Queue list */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold font-display">Patient Queue</h3>
              <Badge
                variant="outline"
                className="text-xs bg-teal-400/10 text-teal-400 border-teal-400/20"
              >
                {waitingCount} waiting
              </Badge>
            </div>
            <QueueList
              tokens={queue ?? []}
              isLoading={isLoadingQueue}
              avgConsultationMinutes={Number(
                selectedDoctor.avgConsultationMinutes,
              )}
            />
          </div>
        </>
      )}

      {!selectedDoctorId && (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          <Stethoscope className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm">
            Select your doctor profile to manage the queue
          </p>
        </div>
      )}
    </div>
  );

  const renderEmergencySection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display mb-1">
          Add Emergency Patient
        </h2>
        <p className="text-muted-foreground text-sm">
          Add an urgent patient directly to the front of the queue.
        </p>
      </div>

      <form onSubmit={(e) => void handleAddEmergency(e)} className="space-y-5">
        <div className="space-y-2">
          <Label>Select Doctor</Label>
          {isLoadingDoctors ? (
            <Skeleton className="h-11 w-full bg-white/5 rounded-xl" />
          ) : (
            <Select
              value={selectedDoctorId}
              onValueChange={setSelectedDoctorId}
            >
              <SelectTrigger className="bg-white/5 border-white/10 focus:border-teal-400/50 h-11 rounded-xl">
                <SelectValue placeholder="Choose doctor..." />
              </SelectTrigger>
              <SelectContent className="bg-navy-800 border-white/10">
                {(doctors ?? []).map((d) => (
                  <SelectItem key={d.id.toString()} value={d.id.toString()}>
                    Dr. {d.name} — {d.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label>Emergency Patient Name</Label>
          <Input
            value={emergencyName}
            onChange={(e) => setEmergencyName(e.target.value)}
            placeholder="Patient name"
            className="bg-white/5 border-white/10 focus:border-rose-400/50 h-11 rounded-xl"
            data-ocid="doctor.emergency_name_input"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-bold h-12 rounded-xl"
          disabled={addEmergency.isPending}
          data-ocid="doctor.emergency_add_button"
        >
          {addEmergency.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Emergency Patient
            </>
          )}
        </Button>
      </form>

      <div className="glass rounded-2xl p-5 border border-rose-400/10">
        <h3 className="font-semibold text-sm text-rose-400 mb-2">Note</h3>
        <p className="text-sm text-muted-foreground">
          Emergency patients are added at the top of the queue and will be
          called before regular patients. Use this only for genuine medical
          emergencies.
        </p>
      </div>
    </div>
  );

  const renderSettingsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display mb-1">Queue Settings</h2>
        <p className="text-muted-foreground text-sm">
          Manage your doctor profile and queue preferences.
        </p>
      </div>

      {selectedDoctor ? (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-teal-400/15 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold">Dr. {selectedDoctor.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedDoctor.specialty}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Status</p>
              <Badge
                variant="outline"
                className={
                  selectedDoctor.isActive
                    ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                    : "text-muted-foreground border-white/10"
                }
              >
                {selectedDoctor.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Queue Status</p>
              <Badge
                variant="outline"
                className={
                  selectedDoctor.isPaused
                    ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
                    : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                }
              >
                {selectedDoctor.isPaused ? "Paused" : "Running"}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">
                Avg Consultation
              </p>
              <p className="font-medium">
                {Number(selectedDoctor.avgConsultationMinutes)} minutes
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className={`w-full border-white/10 ${
              selectedDoctor.isPaused
                ? "text-emerald-400 hover:bg-emerald-400/10"
                : "text-amber-400 hover:bg-amber-400/10"
            }`}
            onClick={() => void handleTogglePause()}
            disabled={pauseQueue.isPending || resumeQueue.isPending}
          >
            {selectedDoctor.isPaused ? (
              <>
                <Play className="mr-2 w-4 h-4" />
                Resume Queue
              </>
            ) : (
              <>
                <Pause className="mr-2 w-4 h-4" />
                Pause Queue
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          <p className="text-sm">Select a doctor profile from the Queue tab</p>
        </div>
      )}
    </div>
  );

  const sectionTitles: Record<DoctorSection, string> = {
    queue: "Patient Queue",
    emergency: "Emergency Add",
    settings: "Settings",
  };

  const renderContent = () => {
    switch (activeSection) {
      case "queue":
        return renderQueueSection();
      case "emergency":
        return renderEmergencySection();
      case "settings":
        return renderSettingsSection();
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
        onNavigate={(id) => setActiveSection(id as DoctorSection)}
        userRole="doctor"
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={sectionTitles[activeSection]}
          subtitle={`Dr. ${userProfile?.name ?? "Doctor"}`}
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
              className="max-w-2xl"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// Activity icon for stats
function Activity({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      focusable="false"
    >
      <title>Activity</title>
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  );
}
