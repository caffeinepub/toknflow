import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User } from "lucide-react";
import { ConsultationStatus } from "../backend.d";
import type { ConsultationToken } from "../backend.d";
import { calculateLocalETA, formatETA } from "../utils/eta";

interface QueueListProps {
  tokens: ConsultationToken[];
  isLoading?: boolean;
  highlightPrincipal?: string;
  avgConsultationMinutes?: number;
  maxHeight?: string;
}

const statusColors: Record<ConsultationStatus, string> = {
  [ConsultationStatus.waiting]:
    "bg-amber-400/20 text-amber-400 border-amber-400/20",
  [ConsultationStatus.called]:
    "bg-teal-400/20 text-teal-400 border-teal-400/20",
  [ConsultationStatus.serving]:
    "bg-emerald-400/20 text-emerald-400 border-emerald-400/20",
  [ConsultationStatus.completed]:
    "bg-white/10 text-muted-foreground border-white/10",
  [ConsultationStatus.cancelled]:
    "bg-rose-400/20 text-rose-400 border-rose-400/20",
  [ConsultationStatus.skipped]:
    "bg-white/10 text-muted-foreground border-white/10",
};

export function QueueList({
  tokens,
  isLoading,
  highlightPrincipal,
  avgConsultationMinutes = 10,
  maxHeight = "400px",
}: QueueListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2" data-ocid="queue.loading_state">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  const activeTokens = tokens.filter(
    (t) =>
      t.status === ConsultationStatus.waiting ||
      t.status === ConsultationStatus.called ||
      t.status === ConsultationStatus.serving,
  );

  if (activeTokens.length === 0) {
    return (
      <div
        className="text-center py-10 text-muted-foreground"
        data-ocid="queue.empty_state"
      >
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
          <User className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium">Queue is empty</p>
        <p className="text-xs mt-1">No patients waiting</p>
      </div>
    );
  }

  return (
    <ScrollArea style={{ maxHeight }} className="scrollbar-thin">
      <div className="space-y-2">
        {activeTokens.map((token, idx) => {
          const isHighlighted =
            highlightPrincipal &&
            token.patientPrincipal?.toString() === highlightPrincipal;
          const eta = calculateLocalETA(
            Number(token.queuePosition),
            avgConsultationMinutes,
          );

          return (
            <div
              key={token.id.toString()}
              data-ocid={`queue.item.${idx + 1}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isHighlighted
                  ? "bg-teal-400/10 border border-teal-400/30"
                  : "bg-white/5 border border-white/5 hover:bg-white/8"
              }`}
            >
              {/* Position */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono flex-shrink-0 ${
                  token.status === ConsultationStatus.serving
                    ? "bg-emerald-400/20 text-emerald-400"
                    : token.status === ConsultationStatus.called
                      ? "bg-teal-400/20 text-teal-400"
                      : "bg-white/10 text-foreground"
                }`}
              >
                {Number(token.queuePosition)}
              </div>

              {/* Name + token */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">
                    {token.isFamilyMember && token.memberName
                      ? token.memberName
                      : token.patientName}
                  </p>
                  {isHighlighted && (
                    <span className="text-xs text-teal-400 font-medium">
                      (You)
                    </span>
                  )}
                  {token.isFamilyMember && (
                    <Badge
                      variant="outline"
                      className="text-xs py-0 h-4 border-teal-400/30 text-teal-400"
                    >
                      Family
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  #{token.tokenNumber}
                </p>
              </div>

              {/* ETA */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Clock className="w-3 h-3" />
                <span>{formatETA(eta)}</span>
              </div>

              {/* Status */}
              <Badge
                variant="outline"
                className={`text-xs flex-shrink-0 ${statusColors[token.status]}`}
              >
                {token.status}
              </Badge>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
