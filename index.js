import 'dotenv/config';
import { OpenAI } from 'openai';
import readline from 'readline/promises';
import { toolsMap } from './tools.js';

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemPrompt = `
You are an AI Assistant who works on a THINK, TOOL, OBSERVE, and OUTPUT format.
You will break down major problems into smaller steps and do multiple thinking steps before providing an output.

Tools available:
1. createDirectory(dirPath: string): Creates a new directory.
2. createFile(filePath: string, content: string): Creates a new file with the specified content. Note: filePath should be relative. If the directory does not exist, it will be created automatically.
3. executeCommand(cmd: string): Executes a CLI command.

Rules:
1. You must ALWAYS respond with EXACTLY ONE valid JSON object. NEVER output a JSON array.
2. The JSON object must have these keys: "step", "content", "tool_name", "tool_args". "tool_name" and "tool_args" are optional depending on the step. "content" should always be present.
3. The "step" must be one of: "START", "THINK", "TOOL", "OBSERVE", "OUTPUT".
4. CRITICAL: You must ONLY output ONE step at a time. After outputting a "TOOL" step, you MUST STOP and wait for the developer to provide the "OBSERVE" step. DO NOT hallucinate tool results.
5. Use "OUTPUT" only when you have completely finished the user's task.

Example:
User: "Create a folder named src"
Assistant: { "step": "START", "content": "User wants to create a src folder" }
Assistant: { "step": "THINK", "content": "I should use createDirectory tool" }
Assistant: { "step": "TOOL", "content": "Calling tool", "tool_name": "createDirectory", "tool_args": { "dirPath": "src" } }
Developer: { "step": "OBSERVE", "content": "Directory src created successfully." }
Assistant: { "step": "OUTPUT", "content": "I have created the src folder as requested." }
`;

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("====================================");
    console.log("Welcome to the AI CLI Agent! (Powered by OpenRouter)");
    console.log("Type your command below. (Type 'exit' to quit)");
    console.log("====================================\n");

    let messageHistory = [
        { role: "system", content: systemPrompt }
    ];

    while (true) {
        const userInput = await rl.question("User: ");
        if (userInput.toLowerCase() === 'exit') {
            console.log("Goodbye!");
            rl.close();
            break;
        }

        // Add user message to history
        messageHistory.push({ role: "user", content: userInput });

        while (true) {
            let response;
            try {
                // Determine model, default to a high-quality free model on OpenRouter
                const targetModel = process.env.OPENROUTER_MODEL ? process.env.OPENROUTER_MODEL.trim() : 'google/gemma-4-31b-it:free';
                
                response = await client.chat.completions.create({
                    model: targetModel,
                    messages: messageHistory,
                    response_format: { type: "json_object" }
                });
            } catch (err) {
                if (err.message && (err.message.includes('503') || err.message.includes('429'))) {
                    console.log(`\n[SYSTEM] API is busy or Network Error. Auto-retrying in 5 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue; // Retry the exact same request
                }
                console.error("\n[SYSTEM] Error communicating with OpenRouter API:", err.message);
                break;
            }

            const content = response.choices[0].message.content;
            
            let parsedContent;
            try {
                parsedContent = JSON.parse(content);
                if (Array.isArray(parsedContent)) {
                    parsedContent = parsedContent[0];
                }
            } catch (error) {
                console.log("\n[SYSTEM] Error parsing JSON:", content);
                messageHistory.push({ role: 'assistant', content: JSON.stringify({ step: "THINK", content: "I must output valid JSON." }) });
                continue;
            }

            messageHistory.push({
                role: 'assistant',
                content: JSON.stringify(parsedContent)
            });

            if (parsedContent.step === "START") {
                console.log(`\n🤖 [START] ${parsedContent.content}`);
            } else if (parsedContent.step === "THINK") {
                console.log(`\n🧠 [THINK] ${parsedContent.content}`);
            } else if (parsedContent.step === "TOOL") {
                console.log(`\n🔧 [TOOL] Calling ${parsedContent.tool_name} with args:`, parsedContent.tool_args);
                
                if (!toolsMap[parsedContent.tool_name]) {
                    const observeMsg = { step: "OBSERVE", content: "This tool is not available." };
                    console.log(`\n👀 [OBSERVE] ${observeMsg.content}`);
                    messageHistory.push({
                        role: "user", 
                        content: JSON.stringify(observeMsg)
                    });
                } else {
                    let data;
                    // Safely handle different ways models might pass arguments
                    try {
                        if (parsedContent.tool_name === "createFile" && typeof parsedContent.tool_args === "object") {
                            data = await toolsMap[parsedContent.tool_name](parsedContent.tool_args.filePath, parsedContent.tool_args.content);
                        } else if (parsedContent.tool_name === "createDirectory" && typeof parsedContent.tool_args === "object") {
                            data = await toolsMap[parsedContent.tool_name](parsedContent.tool_args.dirPath);
                        } else if (parsedContent.tool_name === "executeCommand" && typeof parsedContent.tool_args === "object") {
                            data = await toolsMap[parsedContent.tool_name](parsedContent.tool_args.cmd);
                        } else {
                            data = await toolsMap[parsedContent.tool_name](parsedContent.tool_args);
                        }
                    } catch (e) {
                        data = "Error executing tool: " + e.message;
                    }

                    const observeMsg = { step: "OBSERVE", content: data };
                    console.log(`\n👀 [OBSERVE] ${observeMsg.content}\n`);
                    messageHistory.push({
                        role: "user",
                        content: JSON.stringify(observeMsg)
                    });
                }
            } else if (parsedContent.step === "OUTPUT") {
                console.log(`\n✅ [OUTPUT] ${parsedContent.content}\n`);
                break;
            } else {
                console.log(`\n❓ [UNKNOWN STEP]`, parsedContent);
                // Try to recover
                messageHistory.push({ role: 'assistant', content: JSON.stringify({ step: "THINK", content: "I used an invalid step. I must use START, THINK, TOOL, or OUTPUT." }) });
            }
        }
    }
}

main().catch(console.error);
