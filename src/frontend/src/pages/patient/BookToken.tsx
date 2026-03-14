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
import { Switch } from "@/components/ui/switch";
import { Loader2, Ticket, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../../backend.d";
import { useDoctors, useGenerateToken } from "../../hooks/useQueue";

interface BookTokenProps {
  userProfile: UserProfile | null;
  onTokenGenerated?: () => void;
}

export function BookToken({ userProfile, onTokenGenerated }: BookTokenProps) {
  const { data: doctors, isLoading: isLoadingDoctors } = useDoctors();
  const generateToken = useGenerateToken();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [patientName, setPatientName] = useState(userProfile?.name ?? "");
  const [isFamilyMember, setIsFamilyMember] = useState(false);
  const [memberName, setMemberName] = useState("");

  const activeDoctors = doctors?.filter((d) => d.isActive) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoctorId) {
      toast.error("Please select a doctor");
      return;
    }
    if (!patientName.trim()) {
      toast.error("Please enter patient name");
      return;
    }
    if (isFamilyMember && !memberName.trim()) {
      toast.error("Please enter family member name");
      return;
    }

    try {
      const tokenId = await generateToken.mutateAsync({
        doctorId: BigInt(selectedDoctorId),
        patientName: patientName.trim(),
        isFamilyMember,
        memberName: isFamilyMember ? memberName.trim() : null,
      });
      toast.success(`Token generated! ID: ${tokenId}`);
      setSelectedDoctorId("");
      setIsFamilyMember(false);
      setMemberName("");
      onTokenGenerated?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate token",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display mb-1">Book a Token</h2>
        <p className="text-muted-foreground text-sm">
          Select a doctor and generate your digital queue token.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        {/* Doctor selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select Doctor</Label>
          {isLoadingDoctors ? (
            <Skeleton className="h-11 w-full bg-white/5 rounded-xl" />
          ) : (
            <Select
              value={selectedDoctorId}
              onValueChange={setSelectedDoctorId}
            >
              <SelectTrigger
                className="bg-white/5 border-white/10 focus:border-teal-400/50 h-11 rounded-xl"
                data-ocid="patient.doctor_select"
              >
                <SelectValue placeholder="Choose a doctor..." />
              </SelectTrigger>
              <SelectContent className="bg-navy-800 border-white/10">
                {activeDoctors.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No active doctors available
                  </SelectItem>
                ) : (
                  activeDoctors.map((doctor) => (
                    <SelectItem
                      key={doctor.id.toString()}
                      value={doctor.id.toString()}
                    >
                      <div>
                        <span className="font-medium">Dr. {doctor.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">
                          {doctor.specialty}
                        </span>
                        {doctor.isPaused && (
                          <span className="text-amber-400 text-xs ml-2">
                            (Paused)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Patient name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Patient Name</Label>
          <Input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Enter patient name"
            className="bg-white/5 border-white/10 focus:border-teal-400/50 h-11 rounded-xl"
            data-ocid="patient.name_input"
          />
        </div>

        {/* Family member toggle */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <Label className="text-sm font-medium cursor-pointer">
                Booking for a family member?
              </Label>
            </div>
            <Switch
              checked={isFamilyMember}
              onCheckedChange={setIsFamilyMember}
              className="data-[state=checked]:bg-teal-500"
              data-ocid="patient.family_member_switch"
            />
          </div>

          {isFamilyMember && (
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium">Family Member Name</Label>
              <Input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Enter family member's name"
                className="bg-white/5 border-white/10 focus:border-teal-400/50 h-11 rounded-xl"
                data-ocid="patient.member_name_input"
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full gradient-teal text-white font-bold h-12 rounded-xl btn-glow text-base"
          disabled={generateToken.isPending}
          data-ocid="patient.book_token_button"
        >
          {generateToken.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Token...
            </>
          ) : (
            <>
              <Ticket className="mr-2 h-4 w-4" />
              Generate Token
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
