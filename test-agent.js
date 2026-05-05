// Quick test script to verify the agent works
import 'dotenv/config';
import { OpenAI } from 'openai';
import { toolsMap } from './tools.js';

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

console.log("Testing API connection...");
console.log("API Key:", process.env.OPENROUTER_API_KEY ? "✓ Set" : "✗ Missing");
console.log("Model:", process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free");

// Test tools
console.log("\nTesting tools...");
console.log("Available tools:", Object.keys(toolsMap).join(", "));

// Test createDirectory
const dirResult = await toolsMap.createDirectory("test_folder");
console.log("createDirectory:", dirResult);

// Test createFile
const fileResult = await toolsMap.createFile("test_folder/test.txt", "Hello World!");
console.log("createFile:", fileResult);

// Test executeCommand
const cmdResult = await toolsMap.executeCommand("echo Test successful");
console.log("executeCommand:", cmdResult);

console.log("\n✓ All tools working!");
console.log("\nTesting API call...");

try {
    const response = await client.chat.completions.create({
        model: process.env.OPENROUTER_MODEL || 'openrouter/owl-alpha',
        messages: [
            { role: "user", content: "Say 'API test successful' in JSON format: {\"message\": \"...\"}" }
        ],
        response_format: { type: "json_object" },
        max_tokens: 50
    });
    
    console.log("API Response:", response.choices[0].message.content);
    console.log("\n✓ API connection successful!");
    console.log("\n🎉 Everything is working! Run 'npm start' to use the agent.");
} catch (err) {
    console.error("\n✗ API Error:", err.message);
    if (err.message.includes('429')) {
        console.log("\n💡 Rate limit hit. Try changing OPENROUTER_MODEL in .env to:");
        console.log("   - openrouter/owl-alpha (RECOMMENDED)");
        console.log("   - poolside/laguna-xs.2:free");
        console.log("   - nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free");
    } else if (err.message.includes('404')) {
        console.log("\n💡 Model not found. Update OPENROUTER_MODEL in .env to a valid free model:");
        console.log("   - openrouter/owl-alpha (RECOMMENDED)");
        console.log("   - poolside/laguna-m.1:free");
        console.log("   - poolside/laguna-xs.2:free");
    }
}
