// analyzer.js

/**
 * @class ChatGPTAnalyzerJS
 * @description Analyzes ChatGPT conversation data to extract word frequencies and generate
 * nodes and links for a visualization. This is a client-side implementation
 * of the logic previously handled by app.py.
 */
class ChatGPTAnalyzerJS {
    constructor() {
        // Define a set of common English stop words and additional chat-specific words.
        // This replaces the NLTK stopwords functionality for client-side use.
        this.stopWords = new Set([
            'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
            'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
            'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
            'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
            'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
            'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
            'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
            'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
            'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
            'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
            'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
            'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now',
            // Additional chat-specific words from your app.py
            'would', 'could', 'should', 'really', 'like', 'think', 'know', 'want', 'need', 'good',
            'great', 'thanks', 'thank', 'please', 'sorry', 'yes', 'no', 'ok', 'okay', 'sure',
            'chatgpt', 'gpt', 'ai', 'assistant', 'help', 'can', 'will', 'get', 'use', 'one', 'also',
            'make', 'much', 'many', 'time', 'etc', 'etc' // Added a few more common ones
        ]);
    }

    /**
     * Extracts meaningful words from conversation data, filters stop words,
     * and counts their frequencies.
     * @param {Array} conversationsData - The parsed JSON array of conversations.
     * @param {number} numWordsLimit - The maximum number of most common words to return.
     * @returns {Object} An object containing total stats and the most common words.
     */
    extractWordsFromConversations(conversationsData, numWordsLimit) {
        let allText = "";
        let conversationCount = 0;
        let messageCount = 0;

        try {
            for (const conversation of conversationsData) {
                if (conversation.mapping) {
                    conversationCount++;
                    for (const msgId in conversation.mapping) {
                        const messageData = conversation.mapping[msgId];
                        if (messageData.message) {
                            const message = messageData.message;
                            messageCount++;

                            if (message.content && message.content.parts) {
                                const parts = message.content.parts;
                                for (const part of parts) {
                                    if (typeof part === 'string') {
                                        allText += part + " ";
                                    } else if (typeof part === 'object' && part.text) {
                                        allText += part.text + " ";
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Clean and tokenize the text
            // Removes non-alphabetic characters and converts to lowercase
            const cleanedText = allText.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
            // Splits by one or more whitespace characters
            const tokens = cleanedText.split(/\s+/).filter(word => word.length > 0);

            // Filter out stop words and non-alphabetic tokens
            const filteredWords = tokens.filter(word => {
                return word.length > 1 && !this.stopWords.has(word);
            });

            // Count word frequencies using a Map for better performance and order
            const wordFreq = new Map();
            for (const word of filteredWords) {
                wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
            }

            // Convert Map to array of [word, frequency] pairs and sort by frequency
            const mostCommonWords = Array.from(wordFreq.entries())
                .sort((a, b) => b[1] - a[1]) // Sort descending by frequency
                .slice(0, numWordsLimit); // Take the top N words

            return {
                total_conversations: conversationCount,
                total_messages: messageCount,
                total_words: filteredWords.length,
                unique_words: wordFreq.size,
                words: mostCommonWords
            };

        } catch (e) {
            console.error("Error in extractWordsFromConversations:", e);
            throw new Error("Failed to process conversation data. Please check the file format.");
        }
    }
}

/**
 * Main function to analyze ChatGPT conversation JSON data and prepare it for visualization.
 * This function encapsulates the entire analysis workflow.
 * @param {string} jsonString - The raw JSON string content of the conversations file.
 * @param {number} numWordsToDisplay - The number of top words to analyze and display.
 * @returns {Promise<Object>} A promise that resolves with an object containing
 * 'stats', 'nodes', and 'links' for visualization.
 */
export async function analyzeChatGPTData(jsonString, numWordsToDisplay = 1000) {
    let conversationsData;
    try {
        conversationsData = JSON.parse(jsonString);
    } catch (e) {
        console.error("Error parsing JSON:", e);
        throw new Error("Invalid JSON file. Please upload a valid ChatGPT conversation JSON.");
    }

    if (!Array.isArray(conversationsData)) {
        throw new Error("JSON structure is not an array. Please ensure it's a valid ChatGPT conversation export.");
    }

    const analyzer = new ChatGPTAnalyzerJS();
    const analysis = analyzer.extractWordsFromConversations(conversationsData, numWordsToDisplay);

    const nodes = [];
    const links = [];

    // Create nodes from the analyzed words
    for (let i = 0; i < analysis.words.length; i++) {
        const [word, freq] = analysis.words[i];
        nodes.push({
            id: i,
            word: word,
            frequency: freq,
            // Adjust size calculation for better visual representation
            // Min size 8, Max size 40 (arbitrary, adjust as needed)
            size: Math.min(Math.max(freq * 0.5, 8), 40),
            group: i % 12 // For coloring nodes, similar to Python logic
        });
    }

    // Generate links between nodes based on frequency and proximity
    // The random seed is not directly replicable in JS Math.random,
    // so connections will be non-deterministic but still follow the logic.
    for (let i = 0; i < nodes.length; i++) {
        const currentFreq = nodes[i].frequency;
        // Determine number of connections based on frequency, min 3, max 15
        const numConnections = Math.min(Math.max(Math.floor(currentFreq / 5), 3), 15);

        let targets = [];

        // Add nearby nodes (within a window of 5-6 indices)
        for (let j = Math.max(0, i - 5); j < Math.min(nodes.length, i + 6); j++) {
            if (j !== i) {
                targets.push(j);
            }
        }

        // Add random targets to meet the numConnections requirement
        const availableTargets = nodes.map((_, idx) => idx).filter(idx => idx !== i && !targets.includes(idx));
        const randomTargetsCount = Math.min(numConnections - targets.length, availableTargets.length);

        // Shuffle availableTargets and pick random ones
        for (let k = availableTargets.length - 1; k > 0; k--) {
            const j = Math.floor(Math.random() * (k + 1));
            [availableTargets[k], availableTargets[j]] = [availableTargets[j], availableTargets[k]]; // Fisher-Yates shuffle
        }

        targets.push(...availableTargets.slice(0, randomTargetsCount));

        // Ensure unique targets and limit to numConnections
        targets = Array.from(new Set(targets)).slice(0, numConnections);

        for (const target of targets) {
            const freqDiff = Math.abs(nodes[i].frequency - nodes[target].frequency);
            const maxFreq = Math.max(nodes[i].frequency, nodes[target].frequency);
            // Calculate strength: higher when frequencies are similar
            const strength = maxFreq > 0 ? Math.max(0.2, 1.0 - (freqDiff / maxFreq)) : 0.5;

            links.push({
                source: i,
                target: target,
                strength: strength
            });
        }
    }

    return {
        stats: {
            total_conversations: analysis.total_conversations,
            total_messages: analysis.total_messages,
            total_words: analysis.total_words,
            unique_words: analysis.unique_words
        },
        nodes: nodes,
        links: links
    };
}