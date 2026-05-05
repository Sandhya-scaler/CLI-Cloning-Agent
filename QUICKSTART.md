# Quick Start Guide

## ⚡ Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Your API Key

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your OpenRouter API key:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=openrouter/owl-alpha
```

**Get your free API key:** https://openrouter.ai/

### 3. Test & Run

Test everything works:
```bash
npm test
```

Start the agent:
```bash
npm start
```

## 🎯 Try It Out

Once the agent starts, type:
```
Clone the Scaler Academy website
```

The agent will:
1. Create a `scaler_clone` folder
2. Generate a complete HTML file with CSS and JavaScript
3. Tell you to open it in your browser

## 🔧 Troubleshooting

### "Rate limit exceeded" error?

Your API key has hit the free daily limit. Try a different model in `.env`:

```env
OPENROUTER_MODEL=poolside/laguna-xs.2:free
```

Or add $10 credits to your OpenRouter account for 1000 requests/day.

### "404 No endpoints found" error?

The model name is wrong or unavailable. Use one of these verified models:

```env
OPENROUTER_MODEL=openrouter/owl-alpha
# or
OPENROUTER_MODEL=poolside/laguna-m.1:free
# or
OPENROUTER_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
```

### Agent not responding?

- Check your internet connection
- Verify your API key is correct
- Make sure the model name is valid
- Try running `npm test` to diagnose the issue

## 📝 Example Commands

- `Clone the Scaler Academy website`
- `Create a todo app with HTML, CSS, and JavaScript in a folder called todo_app`
- `Make a landing page with a hero section and footer`
- `Create a simple calculator app`

## 🎥 Recording Your Demo

For your assignment submission:

1. Start the agent: `npm start`
2. Type: `Clone the Scaler Academy website`
3. Wait for the agent to complete (it will loop through multiple steps)
4. Open the generated `scaler_clone/index.html` in your browser
5. Show the working website in your video

**Video Requirements:**
- 2-3 minutes long
- Show the CLI agent running live
- Show the multi-step reasoning loop
- Show the final website opening in browser
- Upload to YouTube (public or unlisted)

## 📚 Need More Help?

Check the full [README.md](README.md) for detailed documentation.

## ✅ Assignment Checklist

- [ ] Agent runs in terminal and accepts natural language
- [ ] Agent uses multi-step loop (THINK → TOOL → OBSERVE → OUTPUT)
- [ ] Generates working HTML/CSS/JS files
- [ ] Cloned website has header, hero section, and footer
- [ ] Website opens in browser and looks like Scaler
- [ ] GitHub repo is public
- [ ] YouTube video is 2-3 minutes, public/unlisted
- [ ] Both links submitted on course portal

Good luck! 🚀
