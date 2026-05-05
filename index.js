import 'dotenv/config';
import { OpenAI } from 'openai';
import readline from 'readline/promises';
import { toolsMap } from './tools.js';

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemPrompt = `
You are an AI CLI Agent that works strictly in a THINK → TOOL → OBSERVE → OUTPUT loop.

You have access to the following tools:
1. createDirectory(dirPath: string)       — Creates a directory (recursive).
2. createFile(filePath: string, content: string) — Creates a file with the given content.
3. executeCommand(cmd: string)            — Runs a shell command and returns its output.

STRICT RULES:
1. Always respond with EXACTLY ONE valid JSON object per turn. Never output an array or multiple objects.
2. Required JSON keys: "step" (always), "content" (always), "tool_name" (only for TOOL step), "tool_args" (only for TOOL step).
3. Valid step values: "START" | "THINK" | "TOOL" | "OBSERVE" | "OUTPUT"
4. After every TOOL step you MUST stop and wait for the OBSERVE step from the developer. Never fabricate or assume tool results.
5. Do NOT open files in a browser automatically. Just create the files and tell the user to open them manually.
6. When creating HTML/CSS/JS files, write the COMPLETE file content inline — do not truncate or use placeholders.
7. Use "OUTPUT" only when the task is fully done.

When asked to clone or replicate the Scaler Academy website, you must:
- Create a folder named "scaler_clone"
- Create index.html with a complete, visually rich page that includes:
    • A sticky navigation bar with Scaler logo text and nav links
    • A hero section with a headline, subtext, and a CTA button
    • A features/stats section (e.g., students placed, avg salary hike, companies)
    • A courses section with cards
    • A footer with links and copyright
- Use internal <style> and <script> tags (single HTML file)
- Use a dark/professional color scheme matching Scaler's brand (#1a1a2e, #16213e, #0f3460, accent #e94560)
- Make it responsive with modern CSS (flexbox/grid)

Example flow:
User: "Clone the Scaler website"
{ "step": "START", "content": "User wants me to clone the Scaler Academy website." }
{ "step": "THINK", "content": "I will create a scaler_clone folder and then create a complete index.html." }
{ "step": "TOOL", "content": "Creating directory", "tool_name": "createDirectory", "tool_args": { "dirPath": "scaler_clone" } }
[wait for OBSERVE]
{ "step": "TOOL", "content": "Creating index.html", "tool_name": "createFile", "tool_args": { "filePath": "scaler_clone/index.html", "content": "...full HTML..." } }
[wait for OBSERVE]
{ "step": "OUTPUT", "content": "Done! Open scaler_clone/index.html in your browser." }
`;

// Max retries before giving up and asking user to retry
const MAX_API_RETRIES = 3;

async function callAPIWithRetry(client, payload) {
    let attempts = 0;
    while (attempts < MAX_API_RETRIES) {
        try {
            const response = await client.chat.completions.create(payload);
            return response;
        } catch (err) {
            const isRetryable = err.message && (
                err.message.includes('503') ||
                err.message.includes('502') ||
                err.message.includes('429') ||
                err.message.includes('ECONNRESET') ||
                err.message.includes('timeout')
            );

            if (isRetryable && attempts < MAX_API_RETRIES - 1) {
                attempts++;
                const waitSec = attempts * 5;
                console.log(`\n[SYSTEM] API error (${err.message.slice(0, 60)}). Retrying in ${waitSec}s... (attempt ${attempts}/${MAX_API_RETRIES - 1})`);
                await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
            } else {
                throw err; // Non-retryable or exhausted retries
            }
        }
    }
}

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("============================================");
    console.log("  Welcome to the AI CLI Agent!");
    console.log("  Powered by OpenRouter");
    console.log("  Type your instruction below.");
    console.log("  Type 'exit' to quit.");
    console.log("============================================\n");

    const messageHistory = [
        { role: "system", content: systemPrompt }
    ];

    const targetModel = process.env.OPENROUTER_MODEL
        ? process.env.OPENROUTER_MODEL.trim()
        : 'openrouter/owl-alpha';

    console.log(`[SYSTEM] Using model: ${targetModel}\n`);

    while (true) {
        const userInput = await rl.question("You: ");

        if (userInput.toLowerCase() === 'exit') {
            console.log("\nGoodbye!");
            rl.close();
            break;
        }

        if (!userInput.trim()) continue;

        messageHistory.push({ role: "user", content: userInput });

        // Inner agent loop — runs until OUTPUT or unrecoverable error
        let agentLoopActive = true;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 3;

        while (agentLoopActive) {
            let response;

            try {
                response = await callAPIWithRetry(client, {
                    model: targetModel,
                    messages: messageHistory,
                    response_format: { type: "json_object" }
                });
            } catch (err) {
                console.error(`\n[SYSTEM] Failed to reach API after ${MAX_API_RETRIES} attempts: ${err.message}`);
                console.log("[SYSTEM] Please check your API key, rate limits, or try a different model.\n");
                agentLoopActive = false;
                // Remove the failed user message so we can retry
                messageHistory.pop();
                break;
            }

            const rawContent = response.choices[0].message.content;

            // Parse JSON
            let parsed;
            try {
                parsed = JSON.parse(rawContent);
                // Some models wrap in an array — unwrap
                if (Array.isArray(parsed)) parsed = parsed[0];
            } catch (_) {
                consecutiveErrors++;
                console.log(`\n[SYSTEM] Invalid JSON received (attempt ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`);
                console.log(rawContent);

                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    console.log("[SYSTEM] Too many invalid responses. Aborting this request.\n");
                    agentLoopActive = false;
                    break;
                }

                messageHistory.push({
                    role: 'assistant',
                    content: JSON.stringify({ step: "THINK", content: "My last response was not valid JSON. I must output a single valid JSON object." })
                });
                continue;
            }

            consecutiveErrors = 0; // Reset on successful parse

            // Push assistant message to history
            messageHistory.push({
                role: 'assistant',
                content: JSON.stringify(parsed)
            });

            // Handle each step
            switch (parsed.step) {
                case "START":
                    console.log(`\n🚀 [START] ${parsed.content}`);
                    break;

                case "THINK":
                    console.log(`\n🧠 [THINK] ${parsed.content}`);
                    break;

                case "TOOL": {
                    const toolName = parsed.tool_name;
                    const toolArgs = parsed.tool_args;

                    console.log(`\n🔧 [TOOL] ${toolName}`);
                    if (toolArgs) {
                        // Print args but truncate large content for readability
                        const preview = JSON.stringify(toolArgs);
                        console.log(`   Args: ${preview.length > 200 ? preview.slice(0, 200) + '...' : preview}`);
                    }

                    let observeContent;

                    if (!toolsMap[toolName]) {
                        observeContent = `Tool "${toolName}" is not available. Available tools: ${Object.keys(toolsMap).join(', ')}`;
                    } else {
                        try {
                            let result;
                            if (typeof toolArgs === 'object' && toolArgs !== null) {
                                switch (toolName) {
                                    case 'createFile':
                                        result = await toolsMap.createFile(toolArgs.filePath, toolArgs.content);
                                        break;
                                    case 'createDirectory':
                                        result = await toolsMap.createDirectory(toolArgs.dirPath);
                                        break;
                                    case 'executeCommand':
                                        result = await toolsMap.executeCommand(toolArgs.cmd);
                                        break;
                                    default:
                                        result = await toolsMap[toolName](toolArgs);
                                }
                            } else {
                                result = await toolsMap[toolName](toolArgs);
                            }
                            observeContent = result;
                        } catch (e) {
                            observeContent = `Tool execution error: ${e.message}`;
                        }
                    }

                    // Truncate very long observe content before pushing to history
                    const truncated = typeof observeContent === 'string' && observeContent.length > 500
                        ? observeContent.slice(0, 500) + '... [truncated]'
                        : observeContent;

                    console.log(`\n👀 [OBSERVE] ${truncated}\n`);

                    messageHistory.push({
                        role: "user",
                        content: JSON.stringify({ step: "OBSERVE", content: truncated })
                    });
                    break;
                }

                case "OUTPUT":
                    console.log(`\n✅ [OUTPUT] ${parsed.content}\n`);
                    agentLoopActive = false;
                    break;

                default:
                    console.log(`\n❓ [UNKNOWN STEP: ${parsed.step}]`, parsed);
                    consecutiveErrors++;
                    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                        console.log("[SYSTEM] Too many unknown steps. Aborting.\n");
                        agentLoopActive = false;
                    } else {
                        messageHistory.push({
                            role: 'assistant',
                            content: JSON.stringify({ step: "THINK", content: `"${parsed.step}" is not a valid step. I must use START, THINK, TOOL, or OUTPUT.` })
                        });
                    }
            }
        }
    }
}

main().catch(console.error);
