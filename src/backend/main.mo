import Int "mo:core/Int";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    role : Text; // "patient", "doctor", or "admin"
  };

  public type TokenResponse = { #coming; #more_time; #cancel };

  public type ConsultationStatus = {
    #waiting;
    #called;
    #serving;
    #completed;
    #cancelled;
    #skipped;
  };

  public type Doctor = {
    id : Nat;
    name : Text;
    specialty : Text;
    isActive : Bool;
    isPaused : Bool;
    avgConsultationMinutes : Nat;
    principal : ?Principal;
  };

  public type DoctorRequest = {
    id : Nat;
    requestedBy : Principal;
    doctorName : Text;
    specialty : Text;
    status : { #pending; #approved; #rejected };
  };

  public type ConsultationToken = {
    id : Nat;
    tokenNumber : Text;
    patientPrincipal : Principal;
    patientName : Text;
    doctorId : Nat;
    status : ConsultationStatus;
    queuePosition : Nat;
    createdAt : Int;
    calledAt : ?Int;
    isFamilyMember : Bool;
    memberName : ?Text;
  };

  public type ConsultationRecord = {
    doctorId : Nat;
    date : Int;
    totalPatients : Nat;
    totalMinutes : Nat;
  };

  public type Analytics = {
    totalPatientsToday : Nat;
    avgWaitTime : Nat;
    perDoctorStats : [(Nat, { totalPatients : Nat; avgWaitTime : Nat })];
  };

  var nextDoctorId = 1;
  var nextTokenId = 1;
  var nextRequestId = 1;

  let doctors = Map.empty<Nat, Doctor>();
  let tokens = Map.empty<Nat, ConsultationToken>();
  let doctorRequests = Map.empty<Nat, DoctorRequest>();
  let consultationRecords = Map.empty<Nat, ConsultationRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let doctorPrincipals = Map.empty<Principal, Nat>(); // Maps principal to doctor ID

  // Helper function to check if caller is a doctor
  func isDoctorPrincipal(caller : Principal) : Bool {
    switch (doctorPrincipals.get(caller)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  // Helper function to get doctor ID for a principal
  func getDoctorIdForPrincipal(caller : Principal) : ?Nat {
    doctorPrincipals.get(caller);
  };

  // Helper function to verify doctor owns the queue
  func verifyDoctorOwnsQueue(caller : Principal, doctorId : Nat) : Bool {
    switch (getDoctorIdForPrincipal(caller)) {
      case (null) { false };
      case (?id) { id == doctorId };
    };
  };

  // Helper function to get next queue position for a doctor
  func getNextQueuePosition(doctorId : Nat) : Nat {
    var maxPosition = 0;
    for ((_, token) in tokens.entries()) {
      if (token.doctorId == doctorId and (token.status == #waiting or token.status == #called)) {
        if (token.queuePosition > maxPosition) {
          maxPosition := token.queuePosition;
        };
      };
    };
    maxPosition + 1;
  };

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // PATIENT FUNCTIONS

  public shared ({ caller }) func generateToken(doctorId : Nat, patientName : Text, isFamilyMember : Bool, memberName : ?Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate tokens");
    };

    let doctor = switch (doctors.get(doctorId)) {
      case (null) { Runtime.trap("Doctor not found") };
      case (?doc) { doc };
    };

    if (not doctor.isActive) {
      Runtime.trap("Doctor is not active");
    };

    if (doctor.isPaused) {
      Runtime.trap("Doctor queue is paused");
    };

    let position = getNextQueuePosition(doctorId);
    let token : ConsultationToken = {
      id = nextTokenId;
      tokenNumber = "T" # nextTokenId.toText();
      patientPrincipal = caller;
      patientName;
      doctorId;
      status = #waiting;
      queuePosition = position;
      createdAt = Time.now();
      calledAt = null;
      isFamilyMember;
      memberName;
    };

    tokens.add(nextTokenId, token);
    nextTokenId += 1;
    token.id;
  };

  public shared ({ caller }) func cancelToken(tokenId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can cancel tokens");
    };

    let token = switch (tokens.get(tokenId)) {
      case (null) { Runtime.trap("Token not found") };
      case (?t) { t };
    };

    // Verify ownership
    if (token.patientPrincipal != caller) {
      Runtime.trap("Unauthorized: Can only cancel your own tokens");
    };

    if (token.status != #waiting and token.status != #called) {
      Runtime.trap("Can only cancel waiting or called tokens");
    };

    let updatedToken = {
      id = token.id;
      tokenNumber = token.tokenNumber;
      patientPrincipal = token.patientPrincipal;
      patientName = token.patientName;
      doctorId = token.doctorId;
      status = #cancelled;
      queuePosition = token.queuePosition;
      createdAt = token.createdAt;
      calledAt = token.calledAt;
      isFamilyMember = token.isFamilyMember;
      memberName = token.memberName;
    };

    tokens.add(tokenId, updatedToken);
  };

  public shared ({ caller }) func respondToCall(tokenId : Nat, response : TokenResponse) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can respond to calls");
    };

    let token = switch (tokens.get(tokenId)) {
      case (null) { Runtime.trap("Token not found") };
      case (?t) { t };
    };

    // Verify ownership
    if (token.patientPrincipal != caller) {
      Runtime.trap("Unauthorized: Can only respond to your own token calls");
    };

    if (token.status != #called) {
      Runtime.trap("Token is not in called status");
    };

    let newStatus = switch (response) {
      case (#coming) { #serving };
      case (#more_time) { #waiting };
      case (#cancel) { #cancelled };
    };

    let updatedToken = {
      id = token.id;
      tokenNumber = token.tokenNumber;
      patientPrincipal = token.patientPrincipal;
      patientName = token.patientName;
      doctorId = token.doctorId;
      status = newStatus;
      queuePosition = token.queuePosition;
      createdAt = token.createdAt;
      calledAt = token.calledAt;
      isFamilyMember = token.isFamilyMember;
      memberName = token.memberName;
    };

    tokens.add(tokenId, updatedToken);
  };

  public shared ({ caller }) func requestDoctor(doctorName : Text, specialty : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request doctors");
    };

    let request : DoctorRequest = {
      id = nextRequestId;
      requestedBy = caller;
      doctorName;
      specialty;
      status = #pending;
    };

    doctorRequests.add(nextRequestId, request);
    nextRequestId += 1;
  };

  public query ({ caller }) func getMyTokens() : async [ConsultationToken] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their tokens");
    };

    let userTokens = tokens.values().toArray().filter(
      func(token) { token.patientPrincipal == caller }
    );
    userTokens;
  };

  public query ({ caller }) func getTokenHistory() : async [ConsultationToken] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their token history");
    };

    let history = tokens.values().toArray().filter(
      func(token) {
        token.patientPrincipal == caller and (token.status == #completed or token.status == #cancelled)
      }
    );
    history;
  };

  // DOCTOR FUNCTIONS

  public shared ({ caller }) func callNextPatient(doctorId : Nat) : async ?Nat {
    // Must be a doctor (user role) and own this queue
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can call patients");
    };

    if (not verifyDoctorOwnsQueue(caller, doctorId)) {
      Runtime.trap("Unauthorized: Can only call patients from your own queue");
    };

    // Find next waiting token
    var nextToken : ?ConsultationToken = null;
    var minPosition = 999999;

    for ((id, token) in tokens.entries()) {
      if (token.doctorId == doctorId and token.status == #waiting and token.queuePosition < minPosition) {
        nextToken := ?token;
        minPosition := token.queuePosition;
      };
    };

    switch (nextToken) {
      case (null) { null };
      case (?token) {
        let updatedToken = {
          id = token.id;
          tokenNumber = token.tokenNumber;
          patientPrincipal = token.patientPrincipal;
          patientName = token.patientName;
          doctorId = token.doctorId;
          status = #called;
          queuePosition = token.queuePosition;
          createdAt = token.createdAt;
          calledAt = ?Time.now();
          isFamilyMember = token.isFamilyMember;
          memberName = token.memberName;
        };
        tokens.add(token.id, updatedToken);
        ?token.id;
      };
    };
  };

  public shared ({ caller }) func markTokenSkipped(tokenId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark tokens as skipped");
    };

    let token = switch (tokens.get(tokenId)) {
      case (null) { Runtime.trap("Token not found") };
      case (?t) { t };
    };

    if (not verifyDoctorOwnsQueue(caller, token.doctorId)) {
      Runtime.trap("Unauthorized: Can only skip tokens from your own queue");
    };

    let updatedToken = {
      id = token.id;
      tokenNumber = token.tokenNumber;
      patientPrincipal = token.patientPrincipal;
      patientName = token.patientName;
      doctorId = token.doctorId;
      status = #skipped;
      queuePosition = token.queuePosition;
      createdAt = token.createdAt;
      calledAt = token.calledAt;
      isFamilyMember = token.isFamilyMember;
      memberName = token.memberName;
    };

    tokens.add(tokenId, updatedToken);
  };

  public shared ({ caller }) func completeToken(tokenId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete tokens");
    };

    let token = switch (tokens.get(tokenId)) {
      case (null) { Runtime.trap("Token not found") };
      case (?t) { t };
    };

    if (not verifyDoctorOwnsQueue(caller, token.doctorId)) {
      Runtime.trap("Unauthorized: Can only complete tokens from your own queue");
    };

    let updatedToken = {
      id = token.id;
      tokenNumber = token.tokenNumber;
      patientPrincipal = token.patientPrincipal;
      patientName = token.patientName;
      doctorId = token.doctorId;
      status = #completed;
      queuePosition = token.queuePosition;
      createdAt = token.createdAt;
      calledAt = token.calledAt;
      isFamilyMember = token.isFamilyMember;
      memberName = token.memberName;
    };

    tokens.add(tokenId, updatedToken);
  };

  public shared ({ caller }) func addEmergencyPatient(doctorId : Nat, patientName : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add emergency patients");
    };

    if (not verifyDoctorOwnsQueue(caller, doctorId)) {
      Runtime.trap("Unauthorized: Can only add emergency patients to your own queue");
    };

    let token : ConsultationToken = {
      id = nextTokenId;
      tokenNumber = "E" # nextTokenId.toText();
      patientPrincipal = caller;
      patientName;
      doctorId;
      status = #waiting;
      queuePosition = 0; // Emergency patients go first
      createdAt = Time.now();
      calledAt = null;
      isFamilyMember = false;
      memberName = null;
    };

    tokens.add(nextTokenId, token);
    nextTokenId += 1;
    token.id;
  };

  public shared ({ caller }) func pauseQueue(doctorId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can pause queues");
    };

    if (not verifyDoctorOwnsQueue(caller, doctorId)) {
      Runtime.trap("Unauthorized: Can only pause your own queue");
    };

    let doctor = switch (doctors.get(doctorId)) {
      case (null) { Runtime.trap("Doctor not found") };
      case (?doc) { doc };
    };

    let updatedDoctor = {
      id = doctor.id;
      name = doctor.name;
      specialty = doctor.specialty;
      isActive = doctor.isActive;
      isPaused = true;
      avgConsultationMinutes = doctor.avgConsultationMinutes;
      principal = doctor.principal;
    };

    doctors.add(doctorId, updatedDoctor);
  };

  public shared ({ caller }) func resumeQueue(doctorId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can resume queues");
    };

    if (not verifyDoctorOwnsQueue(caller, doctorId)) {
      Runtime.trap("Unauthorized: Can only resume your own queue");
    };

    let doctor = switch (doctors.get(doctorId)) {
      case (null) { Runtime.trap("Doctor not found") };
      case (?doc) { doc };
    };

    let updatedDoctor = {
      id = doctor.id;
      name = doctor.name;
      specialty = doctor.specialty;
      isActive = doctor.isActive;
      isPaused = false;
      avgConsultationMinutes = doctor.avgConsultationMinutes;
      principal = doctor.principal;
    };

    doctors.add(doctorId, updatedDoctor);
  };

  // ADMIN FUNCTIONS

  public shared ({ caller }) func addDoctor(name : Text, specialty : Text, avgConsultationMinutes : Nat, doctorPrincipal : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add doctors");
    };

    let doctor : Doctor = {
      id = nextDoctorId;
      name;
      specialty;
      isActive = true;
      isPaused = false;
      avgConsultationMinutes;
      principal = ?doctorPrincipal;
    };

    doctors.add(nextDoctorId, doctor);
    doctorPrincipals.add(doctorPrincipal, nextDoctorId);
    nextDoctorId += 1;
  };

  public shared ({ caller }) func approveDoctorRequest(requestId : Nat, doctorPrincipal : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve doctor requests");
    };

    let req = switch (doctorRequests.get(requestId)) {
      case (null) { Runtime.trap("Doctor request not found") };
      case (?r) { r };
    };

    let doctor : Doctor = {
      id = nextDoctorId;
      name = req.doctorName;
      specialty = req.specialty;
      isActive = true;
      isPaused = false;
      avgConsultationMinutes = 10;
      principal = ?doctorPrincipal;
    };

    doctors.add(nextDoctorId, doctor);
    doctorPrincipals.add(doctorPrincipal, nextDoctorId);

    let updatedRequest = {
      id = req.id;
      requestedBy = req.requestedBy;
      doctorName = req.doctorName;
      specialty = req.specialty;
      status = #approved;
    };

    doctorRequests.add(requestId, updatedRequest);
    nextDoctorId += 1;
  };

  public shared ({ caller }) func rejectDoctorRequest(requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject doctor requests");
    };

    let req = switch (doctorRequests.get(requestId)) {
      case (null) { Runtime.trap("Doctor request not found") };
      case (?r) { r };
    };

    let updatedRequest = {
      id = req.id;
      requestedBy = req.requestedBy;
      doctorName = req.doctorName;
      specialty = req.specialty;
      status = #rejected;
    };

    doctorRequests.add(requestId, updatedRequest);
  };

  public shared ({ caller }) func resetDailyQueues() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reset daily queues");
    };

    for ((id, token) in tokens.entries()) {
      if (token.status == #waiting or token.status == #called) {
        let updatedToken = {
          id = token.id;
          tokenNumber = token.tokenNumber;
          patientPrincipal = token.patientPrincipal;
          patientName = token.patientName;
          doctorId = token.doctorId;
          status = #cancelled;
          queuePosition = token.queuePosition;
          createdAt = token.createdAt;
          calledAt = token.calledAt;
          isFamilyMember = token.isFamilyMember;
          memberName = token.memberName;
        };
        tokens.add(id, updatedToken);
      };
    };
  };

  public query ({ caller }) func getAllQueues() : async [(Nat, [ConsultationToken])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all queues");
    };

    let allDoctors = doctors.keys().toArray();
    let queues = allDoctors.map(
      func(doctorId) {
        let queue = tokens.values().toArray().filter(
          func(token) {
            token.doctorId == doctorId and (token.status == #waiting or token.status == #called)
          }
        );
        (doctorId, queue);
      }
    );
    queues;
  };

  public query ({ caller }) func getDoctorRequests() : async [DoctorRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view doctor requests");
    };

    doctorRequests.values().toArray();
  };

  public query ({ caller }) func getAnalytics() : async Analytics {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view analytics");
    };

    let today = Time.now();
    let oneDayNanos = 86400000000000; // 24 hours in nanoseconds
    let todayStart = today - oneDayNanos;

    let todayTokens = tokens.values().toArray().filter(
      func(token) { token.createdAt >= todayStart }
    );

    let totalPatientsToday = todayTokens.size();

    // Calculate average wait time
    var totalWaitTime = 0;
    var completedCount = 0;
    for (token in todayTokens.values()) {
      if (token.status == #completed) {
        switch (token.calledAt) {
          case (?calledTime) {
            let waitTime = Int.abs(calledTime - token.createdAt) / 1000000000 / 60; // Convert to minutes
            totalWaitTime += waitTime;
            completedCount += 1;
          };
          case (null) {};
        };
      };
    };

    let avgWaitTime = if (completedCount > 0) { totalWaitTime / completedCount } else { 0 };

    // Per-doctor stats
    let doctorIds = doctors.keys().toArray();
    let perDoctorStats = doctorIds.map(
      func(doctorId) {
        let doctorTokens = todayTokens.filter(
          func(token) { token.doctorId == doctorId }
        );

        var docTotalWait = 0;
        var docCompleted = 0;
        for (token in doctorTokens.values()) {
          if (token.status == #completed) {
            switch (token.calledAt) {
              case (?calledTime) {
                let waitTime = Int.abs(calledTime - token.createdAt) / 1000000000 / 60;
                docTotalWait += waitTime;
                docCompleted += 1;
              };
              case (null) {};
            };
          };
        };

        let docAvgWait = if (docCompleted > 0) { docTotalWait / docCompleted } else { 0 };
        (doctorId, { totalPatients = doctorTokens.size(); avgWaitTime = docAvgWait });
      }
    );

    {
      totalPatientsToday;
      avgWaitTime;
      perDoctorStats;
    };
  };

  // PUBLIC QUERY FUNCTIONS (no auth required)

  public query func getDoctors() : async [Doctor] {
    doctors.values().toArray();
  };

  public query func getDoctor(doctorId : Nat) : async ?Doctor {
    doctors.get(doctorId);
  };

  public query ({ caller }) func getQueue(doctorId : Nat) : async [ConsultationToken] {
    // Doctors can view their own queue, admins can view any queue
    let isDoctor = verifyDoctorOwnsQueue(caller, doctorId);
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    if (not isDoctor and not isAdmin) {
      Runtime.trap("Unauthorized: Can only view your own queue or be an admin");
    };

    let queue = tokens.values().toArray().filter(
      func(token) {
        token.doctorId == doctorId and (token.status == #waiting or token.status == #called)
      }
    );

    queue.sort<ConsultationToken>(
      func(a, b) { Nat.compare(a.queuePosition, b.queuePosition) }
    );
  };

  public query func calculateETA(tokenId : Nat) : async ?Nat {
    let token = switch (tokens.get(tokenId)) {
      case (null) { return null };
      case (?t) { t };
    };

    let doctor = switch (doctors.get(token.doctorId)) {
      case (null) { return null };
      case (?d) { d };
    };

    // Count tokens ahead in queue
    var tokensAhead = 0;
    for ((_, t) in tokens.entries()) {
      if (t.doctorId == token.doctorId and (t.status == #waiting or t.status == #called) and t.queuePosition < token.queuePosition) {
        tokensAhead += 1;
      };
    };

    ?(tokensAhead * doctor.avgConsultationMinutes);
  };
};
