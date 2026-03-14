import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History } from "lucide-react";
import { ConsultationStatus } from "../../backend.d";
import { useTokenHistory } from "../../hooks/useQueue";
import { useDoctors } from "../../hooks/useQueue";
import { formatTimestamp } from "../../utils/eta";

const statusColors: Record<ConsultationStatus, string> = {
  [ConsultationStatus.waiting]:
    "bg-amber-400/10 text-amber-400 border-amber-400/20",
  [ConsultationStatus.called]:
    "bg-teal-400/10 text-teal-400 border-teal-400/20",
  [ConsultationStatus.serving]:
    "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  [ConsultationStatus.completed]:
    "bg-white/10 text-muted-foreground border-white/10",
  [ConsultationStatus.cancelled]:
    "bg-rose-400/10 text-rose-400 border-rose-400/20",
  [ConsultationStatus.skipped]:
    "bg-white/10 text-muted-foreground border-white/10",
};

export function TokenHistory() {
  const { data: history, isLoading } = useTokenHistory();
  const { data: doctors } = useDoctors();

  const getDoctorName = (doctorId: bigint) => {
    const doctor = doctors?.find((d) => d.id === doctorId);
    return doctor ? `Dr. ${doctor.name}` : `Doctor #${doctorId}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-ocid="history.loading_state">
        <Skeleton className="h-8 w-48 bg-white/5 rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Skeleton key={i} className="h-14 w-full bg-white/5 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display mb-1">Queue History</h2>
        <p className="text-muted-foreground text-sm">
          All your past and active tokens.
        </p>
      </div>

      {!history || history.length === 0 ? (
        <div
          className="text-center py-16 glass rounded-2xl"
          data-ocid="history.empty_state"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
            <History className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No token history yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Book a token to get started
          </p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <Table data-ocid="history.table">
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">
                  Token
                </TableHead>
                <TableHead className="text-muted-foreground text-xs">
                  Patient
                </TableHead>
                <TableHead className="text-muted-foreground text-xs">
                  Doctor
                </TableHead>
                <TableHead className="text-muted-foreground text-xs">
                  Date
                </TableHead>
                <TableHead className="text-muted-foreground text-xs">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((token, idx) => (
                <TableRow
                  key={token.id.toString()}
                  data-ocid={`history.item.${idx + 1}`}
                  className="border-white/5 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-mono text-sm font-bold text-teal-400">
                    #{token.tokenNumber}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <p className="font-medium">
                        {token.isFamilyMember && token.memberName
                          ? token.memberName
                          : token.patientName}
                      </p>
                      {token.isFamilyMember && (
                        <Badge
                          variant="outline"
                          className="text-xs border-teal-400/30 text-teal-400 mt-0.5"
                        >
                          Family
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getDoctorName(token.doctorId)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatTimestamp(token.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusColors[token.status] ?? statusColors[ConsultationStatus.waiting]}`}
                    >
                      {token.status}
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
}
