import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { TokenResponse } from "../backend.d";
import type { ConsultationToken } from "../backend.d";

interface SmartRecoveryModalProps {
  token: ConsultationToken | null;
  onRespond: (response: TokenResponse) => Promise<void>;
  onTimeout: () => Promise<void>;
}

const COUNTDOWN_SECONDS = 60;

export function SmartRecoveryModal({
  token,
  onRespond,
  onTimeout,
}: SmartRecoveryModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [isResponding, setIsResponding] = useState(false);
  const isOpen = token !== null;

  const handleTimeout = useCallback(async () => {
    if (!token) return;
    await onTimeout();
  }, [token, onTimeout]);

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(COUNTDOWN_SECONDS);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          void handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, handleTimeout]);

  const handleResponse = async (response: TokenResponse) => {
    setIsResponding(true);
    try {
      await onRespond(response);
    } finally {
      setIsResponding(false);
    }
  };

  const progressPct = (secondsLeft / COUNTDOWN_SECONDS) * 100;
  const progressColor =
    secondsLeft > 30
      ? "oklch(0.72 0.18 195)"
      : secondsLeft > 15
        ? "oklch(0.75 0.19 75)"
        : "oklch(0.62 0.24 27)";

  return (
    <AnimatePresence>
      {isOpen && token && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.1 0.03 250 / 95%), oklch(0.08 0.02 250 / 95%))",
            backdropFilter: "blur(12px)",
          }}
          data-ocid="patient.recovery.modal"
        >
          {/* Pulsing ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-96 h-96 rounded-full border border-teal-400/20 animate-ping"
              style={{ animationDuration: "2s" }}
            />
            <div
              className="absolute w-80 h-80 rounded-full border border-teal-400/10 animate-ping"
              style={{ animationDuration: "2.5s" }}
            />
          </div>

          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm glass-dark rounded-3xl p-8 text-center shadow-teal-lg"
          >
            {/* Alert icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-teal-400/15 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-8 h-8 text-teal-400" />
              </div>
            </div>

            <h2 className="text-xl font-bold font-display mb-1">
              Your Token is Being Called!
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Please respond within the countdown
            </p>

            {/* Token number */}
            <div className="bg-white/5 rounded-2xl py-4 mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                Token
              </p>
              <p className="token-number text-4xl font-bold gradient-text">
                {token.tokenNumber}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {token.patientName}
              </p>
            </div>

            {/* Countdown */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span
                  className={`text-2xl font-bold font-mono ${
                    secondsLeft <= 10
                      ? "text-rose-400"
                      : secondsLeft <= 20
                        ? "text-amber-400"
                        : "text-teal-400"
                  }`}
                >
                  {secondsLeft}s
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progressPct}%`,
                    background: progressColor,
                  }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-12 rounded-xl"
                onClick={() => handleResponse(TokenResponse.coming)}
                disabled={isResponding}
                data-ocid="patient.recovery.coming_button"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I'm Coming
              </Button>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold h-12 rounded-xl"
                onClick={() => handleResponse(TokenResponse.more_time)}
                disabled={isResponding}
                data-ocid="patient.recovery.more_time_button"
              >
                <Clock className="w-4 h-4 mr-2" />
                Need More Time
              </Button>
              <Button
                className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-semibold h-12 rounded-xl"
                onClick={() => handleResponse(TokenResponse.cancel)}
                disabled={isResponding}
                data-ocid="patient.recovery.cancel_button"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Appointment
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Auto-skip in {secondsLeft} seconds if no response
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
