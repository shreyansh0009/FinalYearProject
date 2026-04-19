import { apiError } from "../utils/apiError.js";

// API key authentication for voice agent service-to-service calls
export const verifyVoiceAgentKey = (req, res, next) => {
    const apiKey = req.headers["x-voice-agent-key"];

    if (!apiKey || apiKey !== process.env.VOICE_AGENT_API_KEY) {
        throw new apiError(401, "Unauthorized: Invalid voice agent API key");
    }

    next();
};
