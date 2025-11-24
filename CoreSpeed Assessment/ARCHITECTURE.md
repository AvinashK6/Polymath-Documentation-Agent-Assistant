# Architecture & Code Documentation

## Overview

The Polymath Documentation Assistant is a multilayered Deno application that demonstrates advanced AI agent capabilities. It combines:
- **LLM Inference** (Anthropic Claude)
- **MCP Networking** (Model Context Protocol via Firecrawl)
- **Local File I/O** (Markdown report generation)

The application is structured in four distinct layers that work together to research topics, synthesize information, and generate comprehensive reports.

---

## Architecture Layers

### Layer 1: Agent Setup

**File:** `main.ts` (lines 1-23)

```typescript
const zypherContext = await createZypherContext(Deno.cwd());
const agent = new ZypherAgent(
  zypherContext,
  new AnthropicModelProvider({ apiKey: "..." })
);
await agent.mcp.registerServer({ id: "firecrawl", ... });
```

**What it does:**
1. **Creates Zypher Context** - Initializes the agent's execution environment with access to the current working directory
2. **Instantiates ZypherAgent** - Creates an AI agent powered by Anthropic's Claude model
3. **Registers MCP Server** - Connects the agent to the Firecrawl MCP server for web crawling capabilities

**Key Components:**
- `createZypherContext()` - Sets up the runtime environment for the agent
- `AnthropicModelProvider` - Configures Claude as the LLM backbone
- `agent.mcp.registerServer()` - Registers Firecrawl as a command-based MCP server

**MCP Configuration:**
- Type: `command` (runs as a subprocess)
- Command: `npx -y firecrawl-mcp` (executes Firecrawl MCP via npm)
- Environment: Passes `FIRECRAWL_API_KEY` for authentication

---

### Layer 2: Research Function

**File:** `main.ts` (lines 25-72)

```typescript
async function researchTopic(topic: string): Promise<string[]>
```

**What it does:**
1. **Retrieves MCP Tool** - Gets the `firecrawl_firecrawl_search` tool from the registered MCP server
2. **Executes Web Search** - Directly invokes the tool with the user's topic and a limit of 5 results
3. **Parses Nested Results** - Extracts URLs, titles, and descriptions from the tool's response
4. **Formats for Synthesis** - Returns an array of formatted search summaries

**Execution Flow:**

```
User Topic → Tool Invocation → Firecrawl API
    ↓
Web Search Results (JSON) → Parse & Extract
    ↓
Format as Markdown Snippets → Return Array
```

**Key Implementation Details:**

1. **Direct Tool Invocation** (not via prompt)
   ```typescript
   const firecrawlTool = agent.mcp.tools.get('firecrawl_firecrawl_search');
   const toolResult = await firecrawlTool.execute({ query: topic, limit: 5 });
   ```
   - Avoids agent hallucination/parameter misinterpretation
   - Ensures only required parameters (`query`) are passed
   - Returns structured data from Firecrawl

2. **Nested Data Extraction**
   - Tool result structure: `{ content: [{ text: "..." }] }`
   - Parses inner JSON string containing `{ web: [ {url, title, description} ] }`
   - Handles parsing failures gracefully with try-catch

3. **Result Formatting**
   ```markdown
   **Article Title**
   URL: https://example.com
   Brief description of the article content
   ```

**Error Handling:**
- Returns empty array if tool unavailable
- Catches JSON parsing errors and falls back to raw text
- Logs errors to console for debugging

---

### Layer 3: Synthesis Function

**File:** `main.ts` (lines 74-106)

```typescript
async function synthesizeReport(topic: string, findings: string[]): Promise<string>
```

**What it does:**
1. **Constructs Synthesis Prompt** - Creates a detailed instruction for the LLM to synthesize findings
2. **Streams Agent Task** - Runs the task through the Zypher agent using Claude
3. **Collects Streamed Output** - Aggregates text chunks from the real-time event stream
4. **Returns Markdown Report** - Produces a comprehensive, well-structured report

**Execution Flow:**

```
Research Findings Array
    ↓
Format into Synthesis Prompt
    ↓
agent.runTask() → Event Stream
    ↓
Extract "type: text" Events → Aggregate Content
    ↓
Return Complete Markdown String
```

**Synthesis Prompt Structure:**
```
"Synthesize the following research findings on '{topic}' into a 
structured Markdown report. Include an introduction, key points, 
and a conclusion.
Findings:
{formatted findings with --- separators}"
```

**LLM Capabilities Demonstrated:**
- Claude synthesizes raw research data into coherent narrative
- Automatically structures content with headings, sections, and lists
- Maintains context across multiple research findings
- Produces production-ready Markdown

**Event Stream Processing:**

The agent emits different event types during task execution:

1. **Tool Use Events** - When agent decides to use web crawling
2. **Tool Result Events** - Responses from MCP tools
3. **Text Events** - Streaming LLM output (the ones we aggregate)
4. **Message Events** - Full conversation history

The code specifically looks for:
```typescript
event.type === "text" && event.content
```

This captures the streamed token output from Claude in real-time.

**Output Example:**
```markdown
# Topic: Transformative Technology
## Introduction
[Full contextual introduction from the synthesis]
### Key Applications
- Point 1
- Point 2
## Challenges
[Synthesized challenges from research]
## Conclusion
[Comprehensive conclusion tying together findings]
```

---

### Layer 4: File I/O Function

**File:** `main.ts` (lines 108-112)

```typescript
async function writeReportToFile(topic: string, markdown: string)
```

**What it does:**
1. **Generates Filename** - Creates a descriptive filename from the topic
2. **Writes to Filesystem** - Persists the Markdown report to disk using Deno's file API
3. **Confirms Completion** - Logs success message with filename

**Filename Generation:**
- Input: `"AI in Healthcare"`
- Process: 
  - Replace spaces with underscores: `"AI_in_Healthcare"`
  - Convert to lowercase: `"ai_in_healthcare"`
  - Append extension: `"ai_in_healthcare_report.md"`
- Output: `ai_in_healthcare_report.md`

**File Writing:**
```typescript
await Deno.writeTextFile(fileName, markdown);
```
- Deno's built-in file API (no external dependencies needed)
- Creates file if it doesn't exist
- Overwrites if file already exists (useful for re-runs)
- Requires `-A` (all permissions) or specific `--allow-write` flag

---

## Main Orchestration

**File:** `main.ts` (lines 114-134)

```typescript
async function main()
```

**Execution Sequence:**

```
User Input (Prompt)
    ↓
Validate Topic
    ↓
Layer 2: Research Topic → Get Findings Array
    ↓
Layer 3: Synthesize Report → Get Markdown String
    ↓
Layer 4: Write to File → Persist Report
    ↓
Completion Message
```

**Key Flow:**
1. Prompts user interactively for a topic
2. Validates input (non-empty, trimmed)
3. Chains async operations in sequence
4. Error handling exits gracefully if no topic provided

---

## Data Structures

### Research Findings Array

```typescript
findings: string[] = [
  "**Article Title 1**\nURL: https://...\nDescription...\n",
  "**Article Title 2**\nURL: https://...\nDescription...\n",
  "**Article Title 3**\nURL: https://...\nDescription...\n",
  "**Article Title 4**\nURL: https://...\nDescription...\n",
  "**Article Title 5**\nURL: https://...\nDescription...\n"
]
```

### Firecrawl Search Result Format

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"web\": [{\"url\": \"...\", \"title\": \"...\", \"description\": \"...\", \"position\": 1}, ...]}"
    }
  ]
}
```

### Streamed Event from Zypher

```typescript
{
  type: "text",
  content: "This is a chunk of the generated"
}
// Multiple events stream in, concatenated to form complete output
```

---

## MCP (Model Context Protocol) Integration

### What is MCP?

The Model Context Protocol is a standard that allows AI agents to interact with external tools and services through a standardized interface.

### How Firecrawl MCP Works

```
Zypher Agent (Client)
    ↓ (MCP Protocol)
Firecrawl MCP Server (Subprocess)
    ↓ (REST API)
Firecrawl Cloud Service
    ↓
Web Crawling & Search
    ↓
Results Flow Back
```

### Available Tools from Firecrawl MCP

The agent can access:
- `firecrawl_firecrawl_search` - Web search (used in this project)
- `firecrawl_firecrawl_scrape` - Scrape specific URLs
- `firecrawl_firecrawl_crawl` - Deep crawl websites
- `firecrawl_firecrawl_map` - Map website structure
- `firecrawl_firecrawl_extract` - Extract structured data

---

## Error Handling & Resilience

### Research Layer
- **Missing Tool** - Returns empty array if Firecrawl not available
- **JSON Parsing** - Falls back to raw text if nested JSON is malformed
- **Network Errors** - Caught and logged, returns empty array

### Synthesis Layer
- **No Events** - Returns empty string if agent produces no output
- **Streaming Errors** - Gracefully handles incomplete event streams
- **Prompt Too Long** - Claude handles large finding arrays naturally

### File I/O Layer
- **Permission Errors** - Deno will throw if `--allow-write` not granted
- **Disk Space** - OS-level file write errors propagate up
- **Invalid Filenames** - Regex sanitization prevents special characters

---

## Performance Characteristics

### Timing
- **Research** - 2-5 seconds (depends on Firecrawl API latency)
- **Synthesis** - 10-30 seconds (Claude streaming generation)
- **File Write** - <100ms
- **Total** - ~15-40 seconds per report

### Resource Usage
- **Memory** - ~50-100MB (includes Deno runtime + Claude context)
- **Network** - ~2-5MB per report (search + synthesis)
- **Disk** - ~10-50KB per report (depending on content length)

---

## Extension Points

### Add More MCP Servers
```typescript
await agent.mcp.registerServer({
  id: "github",
  type: "command",
  command: { command: "npx", args: ["-y", "github-mcp"] }
});
```

### Customize Synthesis Prompt
Modify the `synthesisPrompt` variable in `synthesizeReport()` to change:
- Report structure (sections, depth)
- Tone and style (academic, casual, technical)
- Specific analyses or comparisons to include

### Add Post-Processing
```typescript
let markdown = await synthesizeReport(topic, findings);
markdown = addTableOfContents(markdown); // Custom function
markdown = formatForGitHub(markdown);    // Custom function
```

### Change LLM Model
```typescript
const event$ = agent.runTask(
  synthesisPrompt,
  "claude-opus-4-1-20250805"  // Different model
);
```

---

## Security Considerations

1. **API Keys** - Stored in `.env`, never committed to version control
2. **File Permissions** - Deno's permission model prevents unauthorized file access
3. **Network Access** - Firecrawl API key controls access to external services
4. **Input Validation** - User topic is used in prompts (no injection needed, but sanitization is good practice)

---

## Summary

The Polymath Documentation Assistant demonstrates a modern AI architecture where:
- **Agents** handle task orchestration
- **MCP Servers** provide tool capabilities
- **LLMs** synthesize and generate content
- **Local I/O** persists results

This pattern can be extended to any research, analysis, or content generation workflow.
