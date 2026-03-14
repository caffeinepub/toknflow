import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { QueueList } from "../../components/QueueList";
import { useDoctors, useQueue } from "../../hooks/useQueue";

interface QueueStatusProps {
  highlightPrincipal?: string;
}

export function QueueStatus({ highlightPrincipal }: QueueStatusProps) {
  const { data: doctors, isLoading: isLoadingDoctors } = useDoctors();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const doctorIdBigint = selectedDoctorId ? BigInt(selectedDoctorId) : null;

  const {
    data: queue,
    isLoading: isLoadingQueue,
    refetch,
  } = useQueue(doctorIdBigint);

  const selectedDoctor = doctors?.find(
    (d) => d.id.toString() === selectedDoctorId,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold font-display mb-1">Queue Status</h2>
          <p className="text-muted-foreground text-sm">
            Live queue view for any doctor.
          </p>
        </div>
        {selectedDoctorId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void refetch()}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Select Doctor to View Queue
        </Label>
        {isLoadingDoctors ? (
          <Skeleton className="h-11 w-full bg-white/5 rounded-xl" />
        ) : (
          <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
            <SelectTrigger
              className="bg-white/5 border-white/10 focus:border-teal-400/50 h-11 rounded-xl"
              data-ocid="queue.doctor_select"
            >
              <SelectValue placeholder="Choose a doctor..." />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-white/10">
              {(doctors ?? []).map((doctor) => (
                <SelectItem
                  key={doctor.id.toString()}
                  value={doctor.id.toString()}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        doctor.isPaused ? "text-amber-400" : "text-emerald-400"
                      }
                    >
                      ●
                    </span>
                    Dr. {doctor.name} — {doctor.specialty}
                    {doctor.isPaused && (
                      <span className="text-xs text-amber-400">(Paused)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedDoctorId && (
        <div className="glass rounded-2xl p-5">
          {selectedDoctor && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold">Dr. {selectedDoctor.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDoctor.specialty}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    selectedDoctor.isPaused
                      ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                      : "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {selectedDoctor.isPaused ? "Paused" : "Active"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  ~{Number(selectedDoctor.avgConsultationMinutes)} min/patient
                </p>
              </div>
            </div>
          )}

          <QueueList
            tokens={queue ?? []}
            isLoading={isLoadingQueue}
            highlightPrincipal={highlightPrincipal}
            avgConsultationMinutes={
              selectedDoctor
                ? Number(selectedDoctor.avgConsultationMinutes)
                : 10
            }
          />
        </div>
      )}

      {!selectedDoctorId && (
        <div className="text-center py-12 text-muted-foreground glass rounded-2xl">
          <p className="text-sm">Select a doctor above to view their queue</p>
        </div>
      )}
    </div>
  );
}
