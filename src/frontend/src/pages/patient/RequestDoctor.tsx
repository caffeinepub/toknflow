import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRequestDoctor } from "../../hooks/useQueue";

export function RequestDoctor() {
  const requestDoctor = useRequestDoctor();
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !specialty.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await requestDoctor.mutateAsync({
        doctorName: doctorName.trim(),
        specialty: specialty.trim(),
      });
      toast.success("Doctor request submitted! Admin will review it soon.");
      setDoctorName("");
      setSpecialty("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit request",
      );
    }
  };

  const popularSpecialties = [
    "Cardiology",
    "Dermatology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "General Medicine",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display mb-1">
          Request a Doctor
        </h2>
        <p className="text-muted-foreground text-sm">
          Can't find your doctor? Submit a request and our admin will add them.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Doctor Name</Label>
          <Input
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="e.g. Dr. Emily Carter"
            className="bg-white/5 border-white/10 focus:border-teal-400/50 h-11 rounded-xl"
            data-ocid="request.doctor_name_input"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Specialty</Label>
          <Input
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="e.g. Cardiology"
            className="bg-white/5 border-white/10 focus:border-teal-400/50 h-11 rounded-xl"
            data-ocid="request.specialty_input"
          />
          {/* Quick-fill pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {popularSpecialties.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpecialty(s)}
                className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-teal-400/10 hover:text-teal-400 text-muted-foreground transition-colors border border-white/10 hover:border-teal-400/30"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full gradient-teal text-white font-bold h-12 rounded-xl btn-glow"
          disabled={requestDoctor.isPending}
          data-ocid="request.submit_button"
        >
          {requestDoctor.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Submit Request
            </>
          )}
        </Button>
      </form>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-sm mb-2">What happens next?</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-teal-400 mt-0.5">1.</span>
            Your request is reviewed by the clinic admin.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-400 mt-0.5">2.</span>
            The doctor is added to the system and verified.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-400 mt-0.5">3.</span>
            You can then book a token with that doctor.
          </li>
        </ul>
      </div>
    </div>
  );
}
