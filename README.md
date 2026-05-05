# AI Agent CLI Tool - Scaler Website Clone

A conversational CLI agent that can clone the Scaler Academy website by generating HTML, CSS, and JavaScript files through natural language instructions.

## Features

- 🤖 Conversational AI agent in your terminal
- 🔄 Multi-step reasoning loop (THINK → TOOL → OBSERVE → OUTPUT)
- 🛠️ Built-in tools: file creation, directory management, command execution
- 🌐 Generates complete, working HTML/CSS/JS websites
- 🎨 Clones the Scaler Academy website with professional styling

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Add your OpenRouter API key to `.env`:
```
OPENROUTER_API_KEY=your_api_key_here
```

Get your free API key at: https://openrouter.ai/

## Usage

Start the agent:
```bash
npm start
```

Then type your instruction:
```
Clone the Scaler Academy website
```

The agent will:
1. Create a `scaler_clone` folder
2. Generate a complete `index.html` with embedded CSS and JavaScript
3. Include header, hero section, features, and footer
4. Tell you to open the file in your browser

To exit, type: `exit`

## Troubleshooting

### Rate Limit Errors (429)

If you see "Rate limit exceeded", the free model has hit its daily/hourly limit. Try:

1. **Switch to a different free model** in `.env`:
```env
OPENROUTER_MODEL=openrouter/owl-alpha
# or
OPENROUTER_MODEL=poolside/laguna-xs.2:free
# or
OPENROUTER_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
```

2. **Wait a few minutes** and try again (free models have per-day limits)
3. **Add $10 credits** to your OpenRouter account for 1000 free requests/day
4. **Use a paid model** for unlimited access (check https://openrouter.ai/models)

### API Connection Errors

- Check your internet connection
- Verify your API key is correct in `.env`
- Make sure you're using a valid OpenRouter model

### Agent Not Responding

- The agent uses a multi-step loop - be patient
- Each TOOL step requires an OBSERVE step before continuing
- If stuck, press Ctrl+C and restart

## Project Structure

```
.
├── index.js          # Main CLI agent logic
├── tools.js          # Tool implementations (createFile, createDirectory, executeCommand)
├── package.json      # Dependencies
├── .env              # Your API key (not committed)
└── .env.example      # Template for environment variables
```

## How It Works

The agent follows a structured reasoning loop:

1. **START** - Acknowledges the user's request
2. **THINK** - Plans the next action
3. **TOOL** - Executes a tool (create file, run command, etc.)
4. **OBSERVE** - Receives tool output
5. **OUTPUT** - Delivers final result

This loop continues until the task is complete.

## Example Commands

- `Clone the Scaler Academy website`
- `Create a todo app with HTML, CSS, and JavaScript`
- `Make a landing page with a hero section and footer`
- `Create a folder called my_project and add an index.html file`

## Assignment Requirements Met

✅ CLI tool that accepts natural language instructions  
✅ Agent reasons through tasks in multiple steps  
✅ Generates working HTML/CSS/JS files  
✅ Clones Scaler website with header, hero, and footer  
✅ Multi-step loop (not single-shot)  
✅ Opens in browser and visually resembles Scaler  

## License

MIT
