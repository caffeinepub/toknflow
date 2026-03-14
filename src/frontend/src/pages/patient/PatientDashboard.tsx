import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart2,
  History,
  Plus,
  PlusCircle,
  Stethoscope,
  Ticket,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConsultationStatus, TokenResponse } from "../../backend.d";
import type { ConsultationToken } from "../../backend.d";
import type { UserProfile } from "../../backend.d";
import { Header } from "../../components/Header";
import { Sidebar } from "../../components/Sidebar";
import { SmartRecoveryModal } from "../../components/SmartRecoveryModal";
import { TokenCard } from "../../components/TokenCard";
import type { AppPage } from "../../hooks/useAuth";
import {
  useCancelToken,
  useDoctors,
  useMarkSkipped,
  useMyTokens,
  useRespondToCall,
} from "../../hooks/useQueue";
import { BookToken } from "./BookToken";
import { QueueStatus } from "./QueueStatus";
import { RequestDoctor } from "./RequestDoctor";
import { TokenHistory } from "./TokenHistory";

interface PatientDashboardProps {
  userProfile: UserProfile | null;
  identity?: { getPrincipal: () => { toString: () => string } };
  onLogout: () => void;
  onNavigateTo: (page: AppPage) => void;
}

type PatientSection =
  | "my-token"
  | "book-token"
  | "queue-status"
  | "family"
  | "history"
  | "request-doctor";

const sidebarItems = [
  {
    id: "my-token",
    label: "My Token",
    icon: <Ticket className="w-4 h-4" />,
    ocid: "sidebar.my_token_link",
  },
  {
    id: "book-token",
    label: "Book Token",
    icon: <PlusCircle className="w-4 h-4" />,
    ocid: "sidebar.book_token_link",
  },
  {
    id: "queue-status",
    label: "Queue Status",
    icon: <BarChart2 className="w-4 h-4" />,
    ocid: "sidebar.queue_status_link",
  },
  {
    id: "family",
    label: "Family Booking",
    icon: <Users className="w-4 h-4" />,
    ocid: "sidebar.family_link",
  },
  {
    id: "history",
    label: "History",
    icon: <History className="w-4 h-4" />,
    ocid: "sidebar.history_link",
  },
  {
    id: "request-doctor",
    label: "Request Doctor",
    icon: <Stethoscope className="w-4 h-4" />,
    ocid: "sidebar.request_doctor_link",
  },
];

const sectionTitles: Record<PatientSection, string> = {
  "my-token": "My Token",
  "book-token": "Book Token",
  "queue-status": "Queue Status",
  family: "Family Booking",
  history: "Token History",
  "request-doctor": "Request Doctor",
};

export function PatientDashboard({
  userProfile,
  identity,
  onLogout,
  onNavigateTo: _onNavigateTo,
}: PatientDashboardProps) {
  const [activeSection, setActiveSection] =
    useState<PatientSection>("my-token");
  const [calledToken, setCalledToken] = useState<ConsultationToken | null>(
    null,
  );

  const { data: myTokens, isLoading: isLoadingTokens } = useMyTokens();
  const { data: doctors } = useDoctors();
  const cancelToken = useCancelToken();
  const respondToCall = useRespondToCall();
  const markSkipped = useMarkSkipped();

  const principal = identity?.getPrincipal().toString();

  // Active token = waiting or called
  const activeToken = myTokens?.find(
    (t) =>
      t.status === ConsultationStatus.waiting ||
      t.status === ConsultationStatus.called ||
      t.status === ConsultationStatus.serving,
  );

  // Family member tokens
  const familyTokens = myTokens?.filter((t) => t.isFamilyMember) ?? [];

  // Check for called status -> show modal
  useEffect(() => {
    const called = myTokens?.find(
      (t) => t.status === ConsultationStatus.called,
    );
    if (called && (!calledToken || calledToken.id !== called.id)) {
      setCalledToken(called);
    } else if (!called && calledToken) {
      setCalledToken(null);
    }
  }, [myTokens, calledToken]);

  const handleCancelToken = async (tokenId: bigint) => {
    try {
      await cancelToken.mutateAsync(tokenId);
      toast.success("Token cancelled successfully");
    } catch {
      toast.error("Failed to cancel token");
    }
  };

  const handleRecoveryResponse = async (response: TokenResponse) => {
    if (!calledToken) return;
    try {
      await respondToCall.mutateAsync({ tokenId: calledToken.id, response });
      setCalledToken(null);
      if (response === TokenResponse.coming) {
        toast.success("Great! Please proceed to the doctor's room.");
      } else if (response === TokenResponse.more_time) {
        toast.info("You've been given more time. Please be ready soon.");
      } else {
        toast.info("Your appointment has been cancelled.");
      }
    } catch {
      toast.error("Failed to respond");
    }
  };

  const handleTimeout = async () => {
    if (!calledToken) return;
    try {
      await markSkipped.mutateAsync(calledToken.id);
      setCalledToken(null);
      toast.warning("Token skipped due to no response");
    } catch {
      toast.error("Failed to mark as skipped");
    }
  };

  const getDoctor = (doctorId: bigint) =>
    doctors?.find((d) => d.id === doctorId);

  const renderContent = () => {
    switch (activeSection) {
      case "my-token":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-display mb-1">
                My Active Token
              </h2>
              <p className="text-muted-foreground text-sm">
                Your current queue status and details.
              </p>
            </div>

            {isLoadingTokens ? (
              <Skeleton
                className="h-64 w-full bg-white/5 rounded-2xl"
                data-ocid="token.loading_state"
              />
            ) : activeToken ? (
              <TokenCard
                token={activeToken}
                doctor={getDoctor(activeToken.doctorId)}
                onCancel={() => void handleCancelToken(activeToken.id)}
                isCancelling={cancelToken.isPending}
                totalInQueue={
                  myTokens?.filter(
                    (t) =>
                      t.doctorId === activeToken.doctorId &&
                      t.status === ConsultationStatus.waiting,
                  ).length ?? 0
                }
              />
            ) : (
              <div
                className="glass rounded-2xl p-10 text-center"
                data-ocid="token.empty_state"
              >
                <div className="w-16 h-16 rounded-2xl bg-teal-400/10 flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-8 h-8 text-teal-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">No Active Token</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  You don't have any active tokens. Book one to get started!
                </p>
                <Button
                  className="gradient-teal text-white font-semibold rounded-xl btn-glow"
                  onClick={() => setActiveSection("book-token")}
                  data-ocid="patient.book_token_button"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Book a Token
                </Button>
              </div>
            )}
          </div>
        );

      case "book-token":
        return (
          <BookToken
            userProfile={userProfile}
            onTokenGenerated={() => setActiveSection("my-token")}
          />
        );

      case "queue-status":
        return <QueueStatus highlightPrincipal={principal} />;

      case "family":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-display mb-1">
                Family Bookings
              </h2>
              <p className="text-muted-foreground text-sm">
                Tokens booked for your family members.
              </p>
            </div>

            {familyTokens.length === 0 ? (
              <div
                className="glass rounded-2xl p-10 text-center"
                data-ocid="family.empty_state"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  No family member bookings yet
                </p>
                <Button
                  variant="ghost"
                  className="mt-3 text-teal-400 hover:text-teal-300"
                  onClick={() => setActiveSection("book-token")}
                >
                  Book for a family member
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {familyTokens.map((token, idx) => (
                  <motion.div
                    key={token.id.toString()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    data-ocid={`family.item.${idx + 1}`}
                  >
                    <TokenCard
                      token={token}
                      doctor={getDoctor(token.doctorId)}
                      onCancel={() => void handleCancelToken(token.id)}
                      isCancelling={cancelToken.isPending}
                      showCancel={
                        token.status === ConsultationStatus.waiting ||
                        token.status === ConsultationStatus.called
                      }
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      case "history":
        return <TokenHistory />;

      case "request-doctor":
        return <RequestDoctor />;

      default:
        return null;
    }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "oklch(0.12 0.025 250)" }}
    >
      {/* Sidebar */}
      <Sidebar
        items={sidebarItems}
        activeItem={activeSection}
        onNavigate={(id) => setActiveSection(id as PatientSection)}
        userRole="patient"
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={sectionTitles[activeSection]}
          subtitle={`Welcome, ${userProfile?.name ?? "Patient"}`}
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

      {/* Smart Recovery Modal */}
      <SmartRecoveryModal
        token={calledToken}
        onRespond={handleRecoveryResponse}
        onTimeout={handleTimeout}
      />
    </div>
  );
}
