/**
 * Calculate estimated waiting time in minutes.
 * ETA = number of patients ahead × average consultation time
 */
export const calculateLocalETA = (
  queuePosition: number,
  avgConsultationMinutes: number,
): number => {
  if (queuePosition <= 0) return 0;
  return (queuePosition - 1) * avgConsultationMinutes;
};

/**
 * Format minutes into human-readable string
 */
export const formatETA = (minutes: number): string => {
  if (minutes <= 0) return "Next up!";
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`;
};

/**
 * Format nanoseconds timestamp to readable date string
 */
export const formatTimestamp = (nanos: bigint): string => {
  const ms = Number(nanos) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
