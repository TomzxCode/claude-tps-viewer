/**
 * Parse JSONL file content
 * @param {string} content - Raw JSONL file content
 * @returns {Array} Parsed message objects
 */
function parseJSONL(content) {
    const lines = content.trim().split('\n');
    const messages = [];

    for (const line of lines) {
        try {
            const message = JSON.parse(line);
            // Only process user and assistant messages
            if (message.type === 'user' || message.type === 'assistant') {
                messages.push({
                    type: message.type,
                    timestamp: new Date(message.timestamp),
                    usage: message.message?.usage || null,
                    role: message.message?.role || null,
                    sessionId: message.sessionId,
                    uuid: message.uuid,
                    model: message.message?.model || null
                });
            }
        } catch (e) {
            console.warn('Failed to parse line:', line, e);
        }
    }

    return messages;
}

/**
 * Calculate TPS for a conversation turn
 * @param {Array} messages - Array of parsed messages
 * @param {string} sessionId - Session ID for grouping
 * @returns {Array} Array of TPS data points
 */
function calculateTPS(messages, sessionId) {
    const tpsData = [];
    let currentTurn = {
        userTimestamp: null,
        assistantMessages: []
    };

    for (const message of messages) {
        if (message.type === 'user') {
            // Save previous turn if it has assistant messages
            if (currentTurn.userTimestamp && currentTurn.assistantMessages.length > 0) {
                const tps = calculateTurnTPS(currentTurn, sessionId);
                if (tps !== null) {
                    tpsData.push(tps);
                }
            }

            // Start new turn
            currentTurn = {
                userTimestamp: message.timestamp,
                assistantMessages: []
            };
        } else if (message.type === 'assistant' && currentTurn.userTimestamp) {
            currentTurn.assistantMessages.push(message);
        }
    }

    // Don't forget the last turn
    if (currentTurn.userTimestamp && currentTurn.assistantMessages.length > 0) {
        const tps = calculateTurnTPS(currentTurn, sessionId);
        if (tps !== null) {
            tpsData.push(tps);
        }
    }

    return tpsData;
}

/**
 * Calculate TPS for a single turn
 * @param {Object} turn - Turn object with userTimestamp and assistantMessages
 * @param {string} sessionId - Session ID for grouping
 * @returns {Object|null} TPS data object or null
 */
function calculateTurnTPS(turn, sessionId) {
    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let lastAssistantTimestamp = turn.userTimestamp;
    const models = new Set();

    for (const msg of turn.assistantMessages) {
        if (msg.usage) {
            const input = msg.usage.input_tokens || 0;
            const output = msg.usage.output_tokens || 0;
            totalTokens += input + output;
            inputTokens += input;
            outputTokens += output;
        }
        if (msg.timestamp > lastAssistantTimestamp) {
            lastAssistantTimestamp = msg.timestamp;
        }
        if (msg.model) {
            models.add(msg.model);
        }
    }

    const durationSeconds = (lastAssistantTimestamp - turn.userTimestamp) / 1000;

    if (durationSeconds <= 0) {
        return null;
    }

    // Get the primary model (most common in this turn, or first)
    const modelList = Array.from(models);
    const model = modelList.length > 0 ? modelList[0] : 'unknown';

    return {
        sessionId,
        timestamp: turn.userTimestamp,
        tps: totalTokens / durationSeconds,
        itps: inputTokens / durationSeconds,
        otps: outputTokens / durationSeconds,
        totalTokens,
        inputTokens,
        outputTokens,
        durationSeconds,
        model,
        models: modelList
    };
}

/**
 * Aggregate TPS by time period
 * @param {Array} tpsData - Array of TPS data points
 * @param {string} period - 'hour', 'dayOfWeek', 'dayOfMonth', 'month', 'session'
 * @returns {Object} Aggregated data with labels and values
 */
function aggregateByPeriod(tpsData, period) {
    const aggregated = {};

    for (const data of tpsData) {
        let key;
        let sortKey;

        switch (period) {
            case 'session':
                key = data.sessionId;
                break;
            case 'hour':
                key = data.timestamp.getHours();
                break;
            case 'dayOfWeek':
                key = data.timestamp.toLocaleDateString('en-US', { weekday: 'long' });
                break;
            case 'dayOfMonth':
                key = data.timestamp.getDate();
                break;
            case 'month':
                key = data.timestamp.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                sortKey = data.timestamp.getFullYear() * 12 + data.timestamp.getMonth();
                break;
            default:
                key = 'session';
        }

        if (!aggregated[key]) {
            aggregated[key] = {
                totalTPS: 0,
                totalITPS: 0,
                totalOTPS: 0,
                count: 0,
                totalTokens: 0,
                sortKey: sortKey ?? key
            };
        }

        aggregated[key].totalTPS += data.tps;
        aggregated[key].totalITPS += data.itps;
        aggregated[key].totalOTPS += data.otps;
        aggregated[key].count += 1;
        aggregated[key].totalTokens += data.totalTokens;
    }

    // Convert to array and calculate averages
    const result = Object.entries(aggregated)
        .map(([key, value]) => ({
            label: key,
            averageTPS: value.totalTPS / value.count,
            averageITPS: value.totalITPS / value.count,
            averageOTPS: value.totalOTPS / value.count,
            count: value.count,
            totalTokens: value.totalTokens,
            sortKey: value.sortKey
        }));

    // Sort based on period
    if (period === 'dayOfWeek') {
        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        result.sort((a, b) => dayOrder.indexOf(a.label) - dayOrder.indexOf(b.label));
    } else if (period === 'hour' || period === 'dayOfMonth') {
        result.sort((a, b) => a.label - b.label);
    } else if (period === 'month') {
        result.sort((a, b) => a.sortKey - b.sortKey);
    } else {
        result.sort((a, b) => a.label.localeCompare(b.label));
    }

    return result;
}

/**
 * Aggregate metrics by model
 * @param {Array} tpsData - Array of TPS data points
 * @returns {Array} Array of model-specific metrics
 */
function aggregateByModel(tpsData) {
    const modelMap = new Map();

    for (const data of tpsData) {
        const model = data.model || 'unknown';

        if (!modelMap.has(model)) {
            modelMap.set(model, {
                model,
                totalTPS: 0,
                totalITPS: 0,
                totalOTPS: 0,
                count: 0,
                totalTokens: 0,
                totalInputTokens: 0,
                totalOutputTokens: 0,
                totalDuration: 0
            });
        }

        const stats = modelMap.get(model);
        stats.totalTPS += data.tps;
        stats.totalITPS += data.itps;
        stats.totalOTPS += data.otps;
        stats.count += 1;
        stats.totalTokens += data.totalTokens;
        stats.totalInputTokens += data.inputTokens;
        stats.totalOutputTokens += data.outputTokens;
        stats.totalDuration += data.durationSeconds;
    }

    return Array.from(modelMap.values()).map(stats => ({
        model: stats.model,
        averageTPS: stats.totalTPS / stats.count,
        averageITPS: stats.totalITPS / stats.count,
        averageOTPS: stats.totalOTPS / stats.count,
        turnCount: stats.count,
        totalTokens: stats.totalTokens,
        totalInputTokens: stats.totalInputTokens,
        totalOutputTokens: stats.totalOutputTokens,
        totalDuration: stats.totalDuration
    })).sort((a, b) => b.totalTokens - a.totalTokens);
}

/**
 * Process multiple JSONL files
 * @param {Array<File>} files - Array of JSONL files
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Processed data
 */
async function processFiles(files, onProgress) {
    const allTPSData = [];
    const sessions = [];
    let totalTokens = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let filesProcessed = 0;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const file of files) {
        const fileBasename = file.name.replace('.jsonl', '');
        if (!file.name.endsWith('.jsonl') || !uuidRegex.test(fileBasename)) continue;

        try {
            const content = await file.text();
            const messages = parseJSONL(content);
            const sessionId = file.name.replace('.jsonl', '');
            const tpsData = calculateTPS(messages, sessionId);

            allTPSData.push(...tpsData);

            // Extract session info and models used
            const sessionModels = new Set();
            for (const turn of tpsData) {
                if (turn.model) {
                    sessionModels.add(turn.model);
                }
            }

            const sessionTokens = tpsData.reduce((sum, d) => sum + d.totalTokens, 0);
            const sessionInputTokens = tpsData.reduce((sum, d) => sum + d.inputTokens, 0);
            const sessionOutputTokens = tpsData.reduce((sum, d) => sum + d.outputTokens, 0);
            const sessionTPS = tpsData.length > 0
                ? tpsData.reduce((sum, d) => sum + d.tps, 0) / tpsData.length
                : 0;

            sessions.push({
                id: file.name.replace('.jsonl', ''),
                filename: file.name,
                turnCount: tpsData.length,
                totalTokens: sessionTokens,
                inputTokens: sessionInputTokens,
                outputTokens: sessionOutputTokens,
                averageTPS: sessionTPS,
                averageITPS: tpsData.length > 0
                    ? tpsData.reduce((sum, d) => sum + d.itps, 0) / tpsData.length
                    : 0,
                averageOTPS: tpsData.length > 0
                    ? tpsData.reduce((sum, d) => sum + d.otps, 0) / tpsData.length
                    : 0,
                timestamp: messages[0]?.timestamp || new Date(),
                models: Array.from(sessionModels)
            });

            totalTokens += sessionTokens;
            totalInputTokens += sessionInputTokens;
            totalOutputTokens += sessionOutputTokens;
            filesProcessed++;

            if (onProgress) {
                onProgress(filesProcessed, files.length);
            }
        } catch (e) {
            console.error('Error processing file:', file.name, e);
        }
    }

    const averageTPS = allTPSData.length > 0
        ? allTPSData.reduce((sum, d) => sum + d.tps, 0) / allTPSData.length
        : 0;
    const averageITPS = allTPSData.length > 0
        ? allTPSData.reduce((sum, d) => sum + d.itps, 0) / allTPSData.length
        : 0;
    const averageOTPS = allTPSData.length > 0
        ? allTPSData.reduce((sum, d) => sum + d.otps, 0) / allTPSData.length
        : 0;

    const modelStats = aggregateByModel(allTPSData);

    return {
        sessions,
        allTPSData,
        modelStats,
        summary: {
            totalSessions: sessions.length,
            totalTurns: allTPSData.length,
            totalTokens,
            totalInputTokens,
            totalOutputTokens,
            averageTPS,
            averageITPS,
            averageOTPS,
            models: modelStats.map(m => m.model)
        }
    };
}
