export const speak = (text: string): void => {
  if (!window.speechSynthesis) return;
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
};

export const announceToken = (
  tokenNumber: string,
  patientName: string,
  doctorName: string,
): void => {
  const text = `Token number ${tokenNumber}, ${patientName}, please proceed to Doctor ${doctorName}`;
  speak(text);
};
