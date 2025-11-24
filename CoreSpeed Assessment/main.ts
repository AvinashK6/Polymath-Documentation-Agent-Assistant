
import {
  AnthropicModelProvider,
  createZypherContext,
  ZypherAgent,
} from "@corespeed/zypher";
import { eachValueFrom } from "rxjs-for-await";

// --- Layer 1: Agent Setup ---
const zypherContext = await createZypherContext(Deno.cwd());
const agent = new ZypherAgent(
  zypherContext,
  new AnthropicModelProvider({
     // Set your Anthropic API key here
    apiKey: "",
  }),
);
await agent.mcp.registerServer({
  id: "firecrawl",
  type: "command",
  command: {
    command: "npx",
    args: ["-y", "firecrawl-mcp"],
    env: {
        // Set your Firecrawl API key here
      FIRECRAWL_API_KEY: "",
    },
  },
});

// --- Layer 2: Research Function ---
async function researchTopic(topic: string): Promise<string[]> {
  // Direct tool invocation: firecrawl_firecrawl_search tool
  const firecrawlTool = agent.mcp.tools.get('firecrawl_firecrawl_search');
  if (!firecrawlTool) {
    console.error("firecrawl_firecrawl_search tool not available");
    return [];
  }

  try {
    // Execute the tool with only the required 'query' parameter
    const toolResult = await (firecrawlTool as unknown as { execute: (params: unknown) => Promise<unknown> }).execute({ 
      query: topic, 
      limit: 5 
    });
    
    // Process the nested result structure
    const results: string[] = [];
    
    if (toolResult && typeof toolResult === "object" && "content" in toolResult) {
      const content = (toolResult as { content: unknown[] }).content;
      if (Array.isArray(content) && content.length > 0) {
        const firstItem = content[0];
        if (firstItem && typeof firstItem === "object" && "text" in firstItem) {
          const textContent = (firstItem as { text: unknown }).text;
          if (typeof textContent === "string") {
            try {
              // Parse the nested JSON string
              const parsedData = JSON.parse(textContent);
              if (parsedData.web && Array.isArray(parsedData.web)) {
                // Extract URL, title, and description for each result
                parsedData.web.forEach((item: unknown) => {
                  if (item && typeof item === "object") {
                    const itemObj = item as { url?: string; title?: string; description?: string };
                    const summary = `**${itemObj.title || "No Title"}**\nURL: ${itemObj.url || "No URL"}\n${itemObj.description || "No description"}\n`;
                    results.push(summary);
                  }
                });
              }
            } catch {
              // If parsing fails, just use the raw text
              results.push(textContent);
            }
          }
        }
      }
    }
    
    if (results.length === 0) {
      results.push("No search results found.");
    }
    
    return results;
  } catch (error) {
    console.error("Error executing firecrawl_firecrawl_search:", error);
    return [];
  }
}

// --- Layer 3: Synthesis Function ---
async function synthesizeReport(topic: string, findings: string[]): Promise<string> {
  console.log("Findings received for synthesis:", findings.length, "items");
  console.log("First finding:", findings[0]?.substring(0, 200));
  
  const synthesisPrompt = `Synthesize the following research findings on '${topic}' into a structured Markdown report. Include an introduction, key points, and a conclusion.\nFindings:\n${findings.join("\n---\n")}`;
  
  console.log("Synthesis prompt length:", synthesisPrompt.length);
  
  const event$ = agent.runTask(synthesisPrompt, "claude-sonnet-4-20250514");
  let markdownReport = "";
  for await (const event of eachValueFrom(event$)) {
    // Check for text events with content property
    if (event && typeof event === "object" && "type" in event && event.type === "text" && "content" in event) {
      const content = (event as { content: unknown }).content;
      if (typeof content === "string") {
        markdownReport += content;
      }
    }
    // Also check for the older format with text property
    else if ("text" in event && event.text) {
      if (typeof event.text === "string") {
        markdownReport += event.text;
      } else if (typeof event.text === "object" && "value" in event.text) {
        markdownReport += event.text.value;
      }
    }
  }
  
  console.log("Generated markdown length:", markdownReport.length);
  console.log("First 200 chars of markdown:", markdownReport.substring(0, 200));
  return markdownReport;
}

// --- Layer 4: Write to File ---
async function writeReportToFile(topic: string, markdown: string) {
  const fileName = `${topic.replace(/\s+/g, "_").toLowerCase()}_report.md`;
  await Deno.writeTextFile(fileName, markdown);
  console.log(`Report written to ${fileName}`);
}

// --- Main Orchestration ---
async function main() {
  const topic = prompt("Enter the topic to research:")?.trim();
  if (!topic) {
    console.log("No topic provided. Exiting.");
    return;
  }
  console.log(`Researching topic: ${topic}`);
  const findings = await researchTopic(topic);
  console.log("Synthesizing report...");
  const markdown = await synthesizeReport(topic, findings);
  await writeReportToFile(topic, markdown);
}

await main();