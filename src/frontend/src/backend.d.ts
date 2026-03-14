import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Analytics {
    totalPatientsToday: bigint;
    avgWaitTime: bigint;
    perDoctorStats: Array<[bigint, {
            totalPatients: bigint;
            avgWaitTime: bigint;
        }]>;
}
export interface ConsultationToken {
    id: bigint;
    status: ConsultationStatus;
    doctorId: bigint;
    tokenNumber: string;
    createdAt: bigint;
    isFamilyMember: boolean;
    queuePosition: bigint;
    calledAt?: bigint;
    patientPrincipal: Principal;
    memberName?: string;
    patientName: string;
}
export interface Doctor {
    id: bigint;
    principal?: Principal;
    avgConsultationMinutes: bigint;
    isPaused: boolean;
    name: string;
    isActive: boolean;
    specialty: string;
}
export interface DoctorRequest {
    id: bigint;
    status: Variant_pending_approved_rejected;
    specialty: string;
    doctorName: string;
    requestedBy: Principal;
}
export interface UserProfile {
    name: string;
    role: string;
}
export enum ConsultationStatus {
    serving = "serving",
    cancelled = "cancelled",
    skipped = "skipped",
    completed = "completed",
    called = "called",
    waiting = "waiting"
}
export enum TokenResponse {
    more_time = "more_time",
    cancel = "cancel",
    coming = "coming"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_pending_approved_rejected {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    addDoctor(name: string, specialty: string, avgConsultationMinutes: bigint, doctorPrincipal: Principal): Promise<void>;
    addEmergencyPatient(doctorId: bigint, patientName: string): Promise<bigint>;
    approveDoctorRequest(requestId: bigint, doctorPrincipal: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculateETA(tokenId: bigint): Promise<bigint | null>;
    callNextPatient(doctorId: bigint): Promise<bigint | null>;
    cancelToken(tokenId: bigint): Promise<void>;
    completeToken(tokenId: bigint): Promise<void>;
    generateToken(doctorId: bigint, patientName: string, isFamilyMember: boolean, memberName: string | null): Promise<bigint>;
    getAllQueues(): Promise<Array<[bigint, Array<ConsultationToken>]>>;
    getAnalytics(): Promise<Analytics>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDoctor(doctorId: bigint): Promise<Doctor | null>;
    getDoctorRequests(): Promise<Array<DoctorRequest>>;
    getDoctors(): Promise<Array<Doctor>>;
    getMyTokens(): Promise<Array<ConsultationToken>>;
    getQueue(doctorId: bigint): Promise<Array<ConsultationToken>>;
    getTokenHistory(): Promise<Array<ConsultationToken>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markTokenSkipped(tokenId: bigint): Promise<void>;
    pauseQueue(doctorId: bigint): Promise<void>;
    rejectDoctorRequest(requestId: bigint): Promise<void>;
    requestDoctor(doctorName: string, specialty: string): Promise<void>;
    resetDailyQueues(): Promise<void>;
    respondToCall(tokenId: bigint, response: TokenResponse): Promise<void>;
    resumeQueue(doctorId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
