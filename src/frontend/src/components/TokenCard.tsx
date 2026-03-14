import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Stethoscope, User, XCircle } from "lucide-react";
import { ConsultationStatus } from "../backend.d";
import type { ConsultationToken, Doctor } from "../backend.d";
import { calculateLocalETA, formatETA } from "../utils/eta";

interface TokenCardProps {
  token: ConsultationToken;
  doctor?: Doctor;
  onCancel?: () => void;
  isCancelling?: boolean;
  totalInQueue?: number;
  showCancel?: boolean;
}

const statusConfig: Record<
  ConsultationStatus,
  { label: string; color: string; bg: string }
> = {
  [ConsultationStatus.waiting]: {
    label: "Waiting",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
  [ConsultationStatus.called]: {
    label: "Called!",
    color: "text-teal-400",
    bg: "bg-teal-400/10 border-teal-400/20",
  },
  [ConsultationStatus.serving]: {
    label: "Serving",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  [ConsultationStatus.completed]: {
    label: "Completed",
    color: "text-muted-foreground",
    bg: "bg-white/5 border-white/10",
  },
  [ConsultationStatus.cancelled]: {
    label: "Cancelled",
    color: "text-rose-400",
    bg: "bg-rose-400/10 border-rose-400/20",
  },
  [ConsultationStatus.skipped]: {
    label: "Skipped",
    color: "text-muted-foreground",
    bg: "bg-white/5 border-white/10",
  },
};

export function TokenCard({
  token,
  doctor,
  onCancel,
  isCancelling,
  totalInQueue = 0,
  showCancel = true,
}: TokenCardProps) {
  const status =
    statusConfig[token.status] ?? statusConfig[ConsultationStatus.waiting];
  const pos = Number(token.queuePosition);
  const eta = doctor
    ? calculateLocalETA(pos, Number(doctor.avgConsultationMinutes))
    : null;
  const progressPct =
    totalInQueue > 0
      ? Math.max(0, ((totalInQueue - pos + 1) / totalInQueue) * 100)
      : 0;

  return (
    <div className="glass rounded-2xl p-6 card-hover shadow-card">
      {/* Status badge + token number */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.bg} ${status.color}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full bg-current ${token.status === ConsultationStatus.called ? "animate-pulse" : ""}`}
            />
            {status.label}
          </span>
        </div>
        {showCancel &&
          (token.status === ConsultationStatus.waiting ||
            token.status === ConsultationStatus.called) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              disabled={isCancelling}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 h-8 w-8"
              data-ocid="patient.cancel_token_button"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
      </div>

      {/* Token number */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
          Token Number
        </p>
        <h2 className="token-number text-5xl font-bold gradient-text">
          {token.tokenNumber}
        </h2>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Patient</span>
          </div>
          <p className="text-sm font-semibold truncate">
            {token.isFamilyMember && token.memberName
              ? token.memberName
              : token.patientName}
          </p>
          {token.isFamilyMember && (
            <Badge
              variant="outline"
              className="mt-1 text-xs border-teal-400/30 text-teal-400"
            >
              Family
            </Badge>
          )}
        </div>

        {doctor && (
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Doctor</span>
            </div>
            <p className="text-sm font-semibold truncate">Dr. {doctor.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {doctor.specialty}
            </p>
          </div>
        )}

        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">#</span>
            <span className="text-xs text-muted-foreground">Position</span>
          </div>
          <p className="text-sm font-bold text-teal-400">{pos} in queue</p>
        </div>

        {eta !== null && (
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">ETA</span>
            </div>
            <p className="text-sm font-bold text-amber-400">{formatETA(eta)}</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalInQueue > 0 && token.status === ConsultationStatus.waiting && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Queue Progress</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <Progress value={progressPct} className="h-1.5 bg-white/10" />
        </div>
      )}
    </div>
  );
}
