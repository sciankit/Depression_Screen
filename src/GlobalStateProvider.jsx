import { createContext, useState, useEffect, useContext } from 'react';
import { buildExplainabilitySummary, buildInterventionPlan } from './riskUtils';

const GlobalStateContext = createContext(null);

export function getPhqRisk(phqTotalScore, item9Positive = false) {
    if (item9Positive) {
        return { tier: 2, reason: "Critical: Item 9 Safety Override" };
    }

    if (phqTotalScore >= 20) {
        return { tier: 2, reason: "Critical: Severe Score" };
    } else if (phqTotalScore >= 10) {
        return { tier: 1, reason: "Moderate: Elevating Score" };
    } else {
        return { tier: 0, reason: "Stable: Low Score" };
    }
}

export function finalEnsembleDecision(phqScore, nlpResult, item9Positive = false) {
    const { tier: baseTier, reason } = getPhqRisk(phqScore, item9Positive);

    if (nlpResult && nlpResult.predicted_class === "suicide") {
        return { tier: 2, reason: "Critical: NLP Suicide Detection" };
    }

    if (baseTier === 0 && nlpResult && nlpResult.risk_tier === 1) {
        return { tier: 1, reason: "Moderate: Passive Signals detect stress mismatch" };
    }

    return { tier: baseTier, reason };
}

export function GlobalStateProvider({ children }) {
    const [prediction, setPrediction] = useState(null);
    const [phqPrediction, setPhqPrediction] = useState(null);
    const [ensembleDecision, setEnsembleDecision] = useState(null);
    const [interventionPlan, setInterventionPlan] = useState(null);
    const [explainability, setExplainability] = useState([]);
    const [isScoring, setIsScoring] = useState(true);
    const [userName, setUserName] = useState("Eric");
    const [selectedVoiceAgentId, setSelectedVoiceAgentId] = useState(import.meta.env.VITE_ELEVENLABS_COMPANION_AGENT_ID);
    const [selectedTextAgentId, setSelectedTextAgentId] = useState(import.meta.env.VITE_ELEVENLABS_TEXTCOMPANION_AGENT_ID);

    useEffect(() => {
        if (prediction && (phqPrediction !== null && phqPrediction !== undefined)) {
            const phqScore = typeof phqPrediction === 'number' ? phqPrediction :
                (phqPrediction.score !== undefined ? phqPrediction.score :
                    (phqPrediction.prediction !== undefined ? phqPrediction.prediction :
                        (typeof phqPrediction === 'string' ? parseFloat(phqPrediction) : 0)));

            const decision = finalEnsembleDecision(phqScore, prediction);
            setEnsembleDecision(decision);
            setInterventionPlan(buildInterventionPlan(decision, prediction, phqPrediction));
            setExplainability(buildExplainabilitySummary(prediction));

            let voiceAgentId = import.meta.env.VITE_ELEVENLABS_COMPANION_AGENT_ID;
            let textAgentId = import.meta.env.VITE_ELEVENLABS_TEXTCOMPANION_AGENT_ID;

            if (decision.tier === 2) {
                voiceAgentId = import.meta.env.VITE_ELEVENLABS_RESPONDER_AGENT_ID;
                textAgentId = import.meta.env.VITE_ELEVENLABS_RESPONDER_AGENT_ID;
            } else if (decision.tier === 1) {
                voiceAgentId = import.meta.env.VITE_ELEVENLABS_COACH_AGENT_ID;
                textAgentId = import.meta.env.VITE_ELEVENLABS_COACH_AGENT_ID;
            }

            setSelectedVoiceAgentId(voiceAgentId);
            setSelectedTextAgentId(textAgentId);
        }
    }, [prediction, phqPrediction]);

    useEffect(() => {
        // Run the models once when the app is opened
        const runInitialScore = async () => {
            setIsScoring(true);
            try {
                // Since this is initialization, we pass a default string or fetch a mocked history log for the NLP model.
                const initialContext = "I've been feeling overwhelmed at work recently and a bit anxious about the upcoming deadline.";

                // Run both models concurrently
                const [nlpResult, phqResult] = await Promise.all([
                    scoreModel([initialContext]),
                    scorePhqModel()
                ]);

                if (nlpResult && nlpResult.predictions && nlpResult.predictions.length > 0) {
                    setPrediction(nlpResult.predictions[0]);
                    console.log("Initial NLP Prediction:", nlpResult.predictions[0]);
                }

                if (phqResult && phqResult.predictions && phqResult.predictions.length > 0) {
                    setPhqPrediction(phqResult.predictions[0]);
                    console.log("Initial PHQ Prediction:", phqResult.predictions[0]);
                }
            } catch (error) {
                console.error("Initial model scoring failed:", error);
            } finally {
                setIsScoring(false);
            }
        };

        runInitialScore();
    }, []);

    // Databricks Integration
    async function scoreModel(dataset) {
        const url = "https://dbc-f46c6a76-9efe.cloud.databricks.com/serving-endpoints/mental_roberta/invocations";
        const token = import.meta.env.VITE_DATABRICKS_TOKEN;

        if (!token) {
            console.warn("No Databricks token found.");
            return null;
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        const payload = Array.isArray(dataset)
            ? { inputs: dataset }
            : { dataframe_split: { columns: Object.keys(dataset[0]), data: dataset.map(Object.values) } };

        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Request failed with status ${response.status}, ${text}`);
        }

        return response.json();
    }

    // Databricks Integration - PHQ-9 Model
    async function scorePhqModel(dataset = null) {
        const url = "https://dbc-f46c6a76-9efe.cloud.databricks.com/serving-endpoints/phq_model/invocations";
        const token = import.meta.env.VITE_DATABRICKS_TOKEN;

        if (!token) {
            console.warn("No Databricks token found.");
            return null;
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        // Fallback default dataset from user spec if none provided
        const payloadData = dataset || [[0.5] * 36];

        const payload = {
            dataframe_split: {
                columns: [
                    "DHRb.cvc", "NHRd.0204.sde", "NHR.0204.cv", "NHR.0406.sd", "NHR.0406.cv", "NHR.0002.sd", "NHR.0002.cv",
                    "ISf.stg.wdh", "IS.hri.wd", "ACj.st.60mk", "AC.st.15m", "AC.st.30m", "AC.st.60m.wd", "AC.st.15m.wd",
                    "AC.st.30m.wd", "AC.hr.60m.wd", "AC.hr.30m.wd", "ICVl.st.wd", "ICV.hr", "ICV.hr.wd", "peaks.st",
                    "peaks.st.wd", "acrom.st", "F.st.wd", "beta.hr", "acro.hr", "F.hr", "beta.hr.wd", "acro.hr.wd",
                    "F.hr.wd", "sleep.offset", "sleep.midpoint", "sleep.offset.wd", "sleep.offset.wd.sd", "sleep.midpoint.wd",
                    "sleep.midpoint.wd.sd"
                ],
                data: payloadData
            }
        };

        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`PHQ Model Request failed with status ${response.status}, ${text}`);
        }

        return response.json();
    }

    return (
        <GlobalStateContext.Provider value={{
            prediction,
            phqPrediction,
            ensembleDecision,
            interventionPlan,
            explainability,
            isScoring,
            scoreModel,
            scorePhqModel,
            selectedVoiceAgentId,
            selectedTextAgentId,
            userName,
            setUserName,
        }}>
            {children}
        </GlobalStateContext.Provider>
    );
}

export function useGlobalState() {
    return useContext(GlobalStateContext);
}
