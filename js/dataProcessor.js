/**
 * Parse JSONL file content
 * @param {string} content - Raw JSONL file content
 * @param {string} filename - Filename for logging purposes
 * @returns {Array} Parsed message objects
 */
function parseJSONL(content, filename = '(unknown)') {
    const lines = content.trim().split('\n');
    const messages = [];
    let lineNumber = 0;
    const parseErrors = [];

    for (const line of lines) {
        lineNumber++;
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
            parseErrors.push({ lineNumber, line: line.substring(0, 100), error: e.message });
        }
    }

    if (parseErrors.length > 0) {
        console.warn(`[parseJSONL] ${filename}: Failed to parse ${parseErrors.length} line(s):`, parseErrors);
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
 * @param {string} period - 'hour', 'day', 'dayOfWeek', 'dayOfMonth', 'month', 'dateHour', 'session'
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
            case 'day':
                key = data.timestamp.toLocaleDateString('en-CA');
                sortKey = data.timestamp.getTime();
                break;
            case 'dayOfWeek':
                key = data.timestamp.toLocaleDateString('en-US', { weekday: 'long' });
                break;
            case 'dayOfMonth':
                key = data.timestamp.getDate();
                break;
            case 'month':
                key = data.timestamp.toISOString().slice(0, 7);
                sortKey = data.timestamp.getFullYear() * 12 + data.timestamp.getMonth();
                break;
            case 'dateHour':
                key = data.timestamp.toLocaleDateString('en-CA') + ' ' + data.timestamp.getHours().toString().padStart(2, '0') + ':00';
                sortKey = data.timestamp.getTime();
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
                sortKey: sortKey ?? key,
                tpsValues: [],
                itpsValues: [],
                otpsValues: []
            };
        }

        aggregated[key].totalTPS += data.tps;
        aggregated[key].totalITPS += data.itps;
        aggregated[key].totalOTPS += data.otps;
        aggregated[key].count += 1;
        aggregated[key].totalTokens += data.totalTokens;
        aggregated[key].tpsValues.push(data.tps);
        aggregated[key].itpsValues.push(data.itps);
        aggregated[key].otpsValues.push(data.otps);
    }

    // Convert to array and calculate averages and percentiles
    const result = Object.entries(aggregated)
        .map(([key, value]) => ({
            label: key,
            averageTPS: value.totalTPS / value.count,
            averageITPS: value.totalITPS / value.count,
            averageOTPS: value.totalOTPS / value.count,
            count: value.count,
            totalTokens: value.totalTokens,
            sortKey: value.sortKey,
            tpsPercentiles: calculatePercentiles(value.tpsValues),
            itpsPercentiles: calculatePercentiles(value.itpsValues),
            otpsPercentiles: calculatePercentiles(value.otpsValues)
        }));

    // Sort based on period
    if (period === 'dayOfWeek') {
        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        result.sort((a, b) => dayOrder.indexOf(a.label) - dayOrder.indexOf(b.label));
    } else if (period === 'hour' || period === 'dayOfMonth') {
        result.sort((a, b) => a.label - b.label);
    } else if (period === 'day' || period === 'month' || period === 'dateHour') {
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
                totalDuration: 0,
                tpsValues: [],
                itpsValues: [],
                otpsValues: []
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
        stats.tpsValues.push(data.tps);
        stats.itpsValues.push(data.itps);
        stats.otpsValues.push(data.otps);
    }

    return Array.from(modelMap.values()).map(stats => {
        const tpsPercentiles = calculatePercentiles(stats.tpsValues);
        const itpsPercentiles = calculatePercentiles(stats.itpsValues);
        const otpsPercentiles = calculatePercentiles(stats.otpsValues);

        return {
            model: stats.model,
            averageTPS: stats.totalTPS / stats.count,
            averageITPS: stats.totalITPS / stats.count,
            averageOTPS: stats.totalOTPS / stats.count,
            turnCount: stats.count,
            totalTokens: stats.totalTokens,
            totalInputTokens: stats.totalInputTokens,
            totalOutputTokens: stats.totalOutputTokens,
            totalDuration: stats.totalDuration,
            tpsPercentiles,
            itpsPercentiles,
            otpsPercentiles
        };
    }).sort((a, b) => b.totalTokens - a.totalTokens);
}

/**
 * Calculate percentiles from an array of numbers
 * @param {Array<number>} values - Array of numeric values
 * @returns {Object} Object with p50, p75, p95, pMax
 */
function calculatePercentiles(values) {
    if (values.length === 0) {
        return { p50: 0, p75: 0, p95: 0, pMax: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);

    const percentile = (p) => {
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
    };

    return {
        p50: percentile(50),
        p75: percentile(75),
        p95: percentile(95),
        pMax: sorted[sorted.length - 1]
    };
}

/**
 * Process multiple JSONL files
 * @param {Array<File>} files - Array of JSONL files
 * @param {Function} onProgress - Progress callback
 * @param {CacheManager} cacheManager - Optional cache manager instance
 * @returns {Promise<Object>} Processed data
 */
async function processFiles(files, onProgress, cacheManager = null) {
    const startTime = performance.now();
    const allTPSData = [];
    const sessions = [];
    let totalTokens = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let filesProcessed = 0;
    let filesSkipped = 0;
    let filesFromCache = 0;

    // Initialize cache manager if provided
    let cacheInitialized = false;
    if (cacheManager) {
        try {
            await cacheManager.init();
            cacheInitialized = true;
        } catch (e) {
            console.warn('[processFiles] Failed to initialize cache manager:', e.message);
        }
    }

    for (const file of files) {
        try {
            // Calculate file key and check cache
            let fileKey = null;
            let cachedData = null;

            if (cacheInitialized) {
                fileKey = calculateFileKey(file);
                cachedData = await cacheManager.get(fileKey);
            }

            let tpsData;
            let sessionData;

            if (cachedData) {
                // Use cached data
                tpsData = cachedData.tpsData;
                sessionData = cachedData.session;
                filesFromCache++;
                console.log(`[processFiles] ${file.name}: Using cached data`);
            } else {
                // Process file normally
                const content = await file.text();
                const messages = parseJSONL(content, file.name);

                if (messages.length === 0) {
                    console.warn(`[processFiles] ${file.name}: No valid user/assistant messages found`);
                    filesSkipped++;
                    continue;
                }

                const sessionId = file.name.replace('.jsonl', '');
                tpsData = calculateTPS(messages, sessionId);

                if (tpsData.length === 0) {
                    console.warn(`[processFiles] ${file.name}: No valid TPS data calculated (no complete conversation turns)`);
                    filesSkipped++;
                    continue;
                }

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

                sessionData = {
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
                };

                // Cache the processed data
                if (cacheInitialized && fileKey) {
                    try {
                        await cacheManager.set(fileKey, file.name, {
                            tpsData,
                            session: sessionData
                        });
                    } catch (e) {
                        console.warn(`[processFiles] ${file.name}: Failed to cache data:`, e.message);
                    }
                }
            }

            allTPSData.push(...tpsData);
            sessions.push(sessionData);

            // Get session totals from sessionData (works for both cached and fresh)
            totalTokens += sessionData.totalTokens;
            totalInputTokens += sessionData.inputTokens;
            totalOutputTokens += sessionData.outputTokens;
            filesProcessed++;

            if (onProgress) {
                onProgress(filesProcessed, files.length);
            }
        } catch (e) {
            console.error(`[processFiles] ${file.name}: ${e.name}: ${e.message}`);
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

    const tpsValues = allTPSData.map(d => d.tps);
    const itpsValues = allTPSData.map(d => d.itps);
    const otpsValues = allTPSData.map(d => d.otps);

    const tpsPercentiles = calculatePercentiles(tpsValues);
    const itpsPercentiles = calculatePercentiles(itpsValues);
    const otpsPercentiles = calculatePercentiles(otpsValues);

    const modelStats = aggregateByModel(allTPSData);

    const elapsedMs = performance.now() - startTime;
    const elapsedSeconds = (elapsedMs / 1000).toFixed(2);

    // Log summary
    console.log(`[processFiles] Completed in ${elapsedSeconds}s (${filesProcessed} processed, ${filesFromCache} from cache, ${filesSkipped} skipped, ${sessions.length} sessions, ${allTPSData.length} turns)`);

    return {
        sessions,
        allTPSData,
        modelStats,
        summary: {
            filesScanned: files.length,
            filesProcessed,
            filesSkipped,
            filesFromCache,
            totalSessions: sessions.length,
            totalTurns: allTPSData.length,
            totalTokens,
            totalInputTokens,
            totalOutputTokens,
            averageTPS,
            averageITPS,
            averageOTPS,
            tpsPercentiles,
            itpsPercentiles,
            otpsPercentiles,
            models: modelStats.map(m => m.model)
        }
    };
}
