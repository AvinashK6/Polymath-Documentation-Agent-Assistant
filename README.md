# Polymath Documentation Assistant

A Deno-based AI agent that researches topics on the web, synthesizes findings, and generates comprehensive Markdown reports.

Short Demo Video (Screen Recording) - https://drive.google.com/file/d/1ZeVFKYwm076_hXdcBONpa4WhoBVPusKj/

## Quick Start

### Prerequisites

1. **Deno** - Download and install from [deno.com](https://deno.com)
2. **Node.js** - Required for running the Firecrawl MCP server
3. **Firecrawl API Key** - Get one from [firecrawl.dev](https://www.firecrawl.dev)
4. **Anthropic API Key** - Get one from [console.anthropic.com](https://console.anthropic.com)

### Setup

1. **Clone or download the project**
   ```bash
   cd "CoreSpeed Assessment"
   ```

2. **Set up environment variables**
   Create a `.env` file in the project directory:
   ```
   FIRECRAWL_API_KEY=your_firecrawl_api_key_here
   ```

3. **Verify dependencies**
   The project uses `deno.json` to manage imports. Dependencies are automatically fetched from JSR and npm.

### Running the Project

```bash
deno run -A main.ts
```

**Flags:**
- `-A` - Allows all permissions (network, file I/O, environment variables, etc.)

### Usage

1. Run the command above
2. When prompted, enter the topic you want to research (e.g., "AI in Healthcare", "Quantum Computing", "Renewable Energy")
3. The agent will:
   - Search the web for authoritative sources
   - Gather and organize the information
   - Synthesize findings into a structured Markdown report
4. The report is saved as `{topic}_report.md` in the project directory

### Example

```bash
$ deno run -A main.ts
Enter the topic to research: AI in Healthcare
Researching topic: AI in Healthcare
Synthesizing report...
Report written to ai_in_healthcare_report.md
```

### Output

Reports are saved as Markdown files in the project directory with the following structure:
- `ai_in_healthcare_report.md` - If you researched "AI in Healthcare"
- `quantum_computing_report.md` - If you researched "Quantum Computing"
- etc.

## Troubleshooting

### Error: "Environment variable FIRECRAWL_API_KEY is not set"
- Make sure you've created a `.env` file with your Firecrawl API key
- Verify the key is correct

### Error: "MCP error -32602"
- This usually means the Firecrawl MCP server is having issues
- Verify your Firecrawl API key is valid
- Check that Node.js is installed (required for the MCP server)

### Error: "Failed to connect to MCP server"
- Ensure the Firecrawl MCP server is properly installed via `npx`
- Try running `npx -y firecrawl-mcp` directly to test

### Empty Report File
- Check the console output for errors during synthesis
- Ensure the search found results by reviewing console logs
- Try with a different topic

## Project Structure

```
CoreSpeed Assessment/
├── main.ts                 # Main application file
├── deno.json              # Deno configuration with dependencies
├── .env                   # Environment variables (create this)
├── README.md              # This file
├── ARCHITECTURE.md        # Detailed architecture documentation
├── ai_in_healthcare_report.md    # Example output
└── ...other generated reports...
```

## Dependencies

- `@corespeed/zypher` - AI agent framework with MCP support
- `rxjs-for-await` - Async observable utilities
- Firecrawl MCP - Web crawling and search capabilities
- Anthropic Claude - LLM for synthesis

## Features

✅ Web research using Firecrawl MCP server  
✅ Intelligent topic synthesis using Claude  
✅ Structured Markdown report generation  
✅ Automatic file I/O with descriptive naming  
✅ Error handling and fallback mechanisms  
✅ Real-time streaming of agent tasks  

## Next Steps

- Modify the main topic in `main.ts` to research different subjects
- Extend the agent with additional MCP servers for more capabilities
- Customize the Markdown report format in the `synthesizeReport` function
- Add persistent storage or database integration for reports
