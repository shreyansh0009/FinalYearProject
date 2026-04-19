import axios from "axios";

/**
 * Triggers an outbound call via the voice agent to notify a student
 * about their document status change.
 */
export const triggerVoiceNotification = async ({ phone, studentName, documentName, status, reason }) => {
    const voiceAgentUrl = process.env.VOICE_AGENT_URL;
    const agentId = process.env.VOICE_AGENT_DOC_AGENT_ID;

    if (!voiceAgentUrl || !agentId || !phone) return;

    try {
        await axios.post(`${voiceAgentUrl}/api/call/outbound`, {
            phoneNumber: phone,
            agentId,
            context: {
                studentName,
                documentName,
                status,
                reason: reason || null,
            }
        });
        console.log(`Voice notification triggered for ${phone} — ${status}`);
    } catch (error) {
        console.error("Voice notification failed (non-fatal):", error.message);
    }
};
