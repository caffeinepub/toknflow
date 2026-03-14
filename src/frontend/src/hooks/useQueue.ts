import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TokenResponse } from "../backend.d";
import type { ConsultationToken, Doctor } from "../backend.d";
import { useActor } from "./useActor";

export function useDoctors() {
  const { actor, isFetching } = useActor();
  return useQuery<Doctor[]>({
    queryKey: ["doctors"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDoctors();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useQueue(doctorId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ConsultationToken[]>({
    queryKey: ["queue", doctorId?.toString()],
    queryFn: async () => {
      if (!actor || !doctorId) return [];
      return actor.getQueue(doctorId);
    },
    enabled: !!actor && !isFetching && doctorId !== null,
    refetchInterval: 10_000,
  });
}

export function useAllQueues() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[bigint, ConsultationToken[]]>>({
    queryKey: ["all-queues"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllQueues();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function useMyTokens() {
  const { actor, isFetching } = useActor();
  return useQuery<ConsultationToken[]>({
    queryKey: ["my-tokens"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyTokens();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function useTokenHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<ConsultationToken[]>({
    queryKey: ["token-history"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTokenHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAnalytics() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAnalytics();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useDoctorRequests() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["doctor-requests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDoctorRequests();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useGenerateToken() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      doctorId,
      patientName,
      isFamilyMember,
      memberName,
    }: {
      doctorId: bigint;
      patientName: string;
      isFamilyMember: boolean;
      memberName: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.generateToken(
        doctorId,
        patientName,
        isFamilyMember,
        memberName,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-tokens"] });
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

export function useCancelToken() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tokenId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.cancelToken(tokenId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-tokens"] });
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

export function useRespondToCall() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tokenId,
      response,
    }: {
      tokenId: bigint;
      response: TokenResponse;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.respondToCall(tokenId, response);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-tokens"] });
    },
  });
}

export function useMarkSkipped() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tokenId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.markTokenSkipped(tokenId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-tokens"] });
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

export function useCallNextPatient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctorId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.callNextPatient(doctorId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
      void queryClient.invalidateQueries({ queryKey: ["all-queues"] });
    },
  });
}

export function useAddEmergencyPatient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      doctorId,
      patientName,
    }: {
      doctorId: bigint;
      patientName: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addEmergencyPatient(doctorId, patientName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

export function usePauseQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctorId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.pauseQueue(doctorId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useResumeQueue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doctorId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.resumeQueue(doctorId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useCompleteToken() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tokenId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.completeToken(tokenId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

export function useAddDoctor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      specialty,
      avgConsultationMinutes,
      doctorPrincipal,
    }: {
      name: string;
      specialty: string;
      avgConsultationMinutes: bigint;
      doctorPrincipal: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const principal = Principal.fromText(doctorPrincipal);
      return actor.addDoctor(
        name,
        specialty,
        avgConsultationMinutes,
        principal,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useRequestDoctor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      doctorName,
      specialty,
    }: {
      doctorName: string;
      specialty: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.requestDoctor(doctorName, specialty);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["doctor-requests"] });
    },
  });
}

export function useApproveDoctorRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      doctorPrincipal,
    }: {
      requestId: bigint;
      doctorPrincipal: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const principal = Principal.fromText(doctorPrincipal);
      return actor.approveDoctorRequest(requestId, principal);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["doctor-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useRejectDoctorRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectDoctorRequest(requestId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["doctor-requests"] });
    },
  });
}

export function useResetDailyQueues() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.resetDailyQueues();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["queue"] });
      void queryClient.invalidateQueries({ queryKey: ["all-queues"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
