import *as ai from '../services/ai.service.js';


export const getResult = async (req, res) => {
    try {
        const { prompt } = req.query;

        if (!prompt) {
            return res.status(400).send({ message: "Prompt is required" });
        }

        // Call the AI service to generate the result
        const result = await ai.generateResult(prompt);

        // Send the result back to the client
        res.status(200).send({ result });
    } catch (error) {
        console.error("Error generating AI result:", error);
        res.status(500).send({ message: "Internal server error" });
    }
}