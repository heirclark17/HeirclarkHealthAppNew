// ============================================
// FIGMA API INTEGRATION FOR RAILWAY BACKEND
// Add this to your backend code
// ============================================

/**
 * File: backend/src/config/figma.ts (or similar)
 *
 * This file reads the FIGMA_API_KEY from Railway environment variables
 * and provides a configured Figma client for your backend.
 */

// 1. READ ENVIRONMENT VARIABLE
// -----------------------------
const FIGMA_API_KEY = process.env.FIGMA_API_KEY;

if (!FIGMA_API_KEY) {
  console.error('❌ FIGMA_API_KEY environment variable is missing!');
  console.error('Add it in Railway: Dashboard → Your Service → Variables');
  throw new Error('FIGMA_API_KEY is required');
}

console.log('✅ Figma API Key loaded from environment');

// 2. FIGMA API CLIENT CONFIGURATION
// ----------------------------------
interface FigmaConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

export const figmaConfig: FigmaConfig = {
  apiKey: FIGMA_API_KEY,
  baseUrl: 'https://api.figma.com/v1',
  timeout: 30000, // 30 seconds
};

// 3. FIGMA API HELPER FUNCTIONS
// ------------------------------

/**
 * Get common headers for Figma API requests
 */
function getFigmaHeaders(): HeadersInit {
  return {
    'X-Figma-Token': figmaConfig.apiKey,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch a Figma file by ID
 * @param fileKey - The Figma file key (from URL: figma.com/file/{fileKey}/...)
 * @returns Figma file data
 */
export async function getFigmaFile(fileKey: string): Promise<any> {
  try {
    const response = await fetch(
      `${figmaConfig.baseUrl}/files/${fileKey}`,
      {
        headers: getFigmaHeaders(),
        signal: AbortSignal.timeout(figmaConfig.timeout),
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Invalid Figma API key or no access to file');
      }
      if (response.status === 404) {
        throw new Error(`Figma file not found: ${fileKey}`);
      }
      throw new Error(`Figma API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Figma API error:', error);
    throw error;
  }
}

/**
 * Get Figma file nodes (specific components/frames)
 * @param fileKey - The Figma file key
 * @param nodeIds - Array of node IDs to fetch
 * @returns Figma node data
 */
export async function getFigmaNodes(
  fileKey: string,
  nodeIds: string[]
): Promise<any> {
  try {
    const idsParam = nodeIds.join(',');
    const response = await fetch(
      `${figmaConfig.baseUrl}/files/${fileKey}/nodes?ids=${idsParam}`,
      {
        headers: getFigmaHeaders(),
        signal: AbortSignal.timeout(figmaConfig.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Figma nodes fetch error:', error);
    throw error;
  }
}

/**
 * Get images from Figma file
 * @param fileKey - The Figma file key
 * @param nodeIds - Array of node IDs to export as images
 * @param format - Image format (png, jpg, svg, pdf)
 * @param scale - Scale factor (1, 2, 3, 4)
 * @returns Image URLs
 */
export async function getFigmaImages(
  fileKey: string,
  nodeIds: string[],
  format: 'png' | 'jpg' | 'svg' | 'pdf' = 'png',
  scale: number = 2
): Promise<any> {
  try {
    const idsParam = nodeIds.join(',');
    const response = await fetch(
      `${figmaConfig.baseUrl}/images/${fileKey}?ids=${idsParam}&format=${format}&scale=${scale}`,
      {
        headers: getFigmaHeaders(),
        signal: AbortSignal.timeout(figmaConfig.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Figma images fetch error:', error);
    throw error;
  }
}

/**
 * Get Figma styles (colors, text styles, effects)
 * @param fileKey - The Figma file key
 * @returns Figma styles
 */
export async function getFigmaStyles(fileKey: string): Promise<any> {
  try {
    const response = await fetch(
      `${figmaConfig.baseUrl}/files/${fileKey}/styles`,
      {
        headers: getFigmaHeaders(),
        signal: AbortSignal.timeout(figmaConfig.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Figma styles fetch error:', error);
    throw error;
  }
}

// 4. EXPRESS ROUTE EXAMPLE (if using Express)
// --------------------------------------------

/**
 * Add this to your Express routes file
 */

/*
import express from 'express';
import { getFigmaFile, getFigmaNodes, getFigmaImages, getFigmaStyles } from './config/figma';

const figmaRouter = express.Router();

// GET /api/v1/figma/file/:fileKey
figmaRouter.get('/file/:fileKey', async (req, res) => {
  try {
    const { fileKey } = req.params;
    const data = await getFigmaFile(fileKey);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/figma/nodes/:fileKey?ids=node1,node2
figmaRouter.get('/nodes/:fileKey', async (req, res) => {
  try {
    const { fileKey } = req.params;
    const nodeIds = req.query.ids?.toString().split(',') || [];
    const data = await getFigmaNodes(fileKey, nodeIds);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/figma/images/:fileKey?ids=node1,node2&format=png&scale=2
figmaRouter.get('/images/:fileKey', async (req, res) => {
  try {
    const { fileKey } = req.params;
    const nodeIds = req.query.ids?.toString().split(',') || [];
    const format = (req.query.format as any) || 'png';
    const scale = parseInt(req.query.scale?.toString() || '2');
    const data = await getFigmaImages(fileKey, nodeIds, format, scale);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/figma/styles/:fileKey
figmaRouter.get('/styles/:fileKey', async (req, res) => {
  try {
    const { fileKey } = req.params;
    const data = await getFigmaStyles(fileKey);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default figmaRouter;
*/

// 5. USAGE IN MCP SERVER
// -----------------------

/**
 * MCP Server Integration Example
 */

/*
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { getFigmaFile, getFigmaNodes } from './config/figma';

const mcpServer = new Server({
  name: 'figma-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Define MCP tool for Figma file fetching
mcpServer.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'get_figma_file') {
    const { fileKey } = request.params.arguments;
    const data = await getFigmaFile(fileKey);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(data, null, 2),
      }],
    };
  }

  if (request.params.name === 'get_figma_nodes') {
    const { fileKey, nodeIds } = request.params.arguments;
    const data = await getFigmaNodes(fileKey, nodeIds);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(data, null, 2),
      }],
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start MCP server
async function main() {
  console.log('🚀 Figma MCP Server starting...');
  console.log('📦 Figma API Key:', FIGMA_API_KEY ? '✅ Loaded' : '❌ Missing');

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);

  console.log('✅ Figma MCP Server ready');
}

main().catch(console.error);
*/

// 6. VERIFICATION SCRIPT
// ----------------------

/**
 * Add this script to verify Figma API connection
 * Run: node scripts/verify-figma.js
 */

/*
async function verifyFigmaConnection() {
  console.log('🔍 Verifying Figma API connection...');
  console.log('API Key:', FIGMA_API_KEY ? `${FIGMA_API_KEY.substring(0, 10)}...` : '❌ Missing');

  // Test with a public Figma file (replace with your file)
  const testFileKey = 'YOUR_FILE_KEY_HERE';

  try {
    const data = await getFigmaFile(testFileKey);
    console.log('✅ Figma API connection successful!');
    console.log('📄 File name:', data.name);
    console.log('📅 Last modified:', data.lastModified);
    return true;
  } catch (error) {
    console.error('❌ Figma API connection failed:', error.message);
    return false;
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyFigmaConnection()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
*/

// 7. ENVIRONMENT VARIABLE CHECK
// ------------------------------

/**
 * Add this to your server startup (app.ts or index.ts)
 */
function validateEnvironment() {
  const requiredEnvVars = [
    'FIGMA_API_KEY',
    // Add other required vars
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    console.error('\n📝 Add these in Railway: Dashboard → Variables');
    process.exit(1);
  }

  console.log('✅ All required environment variables loaded');
}

// Call this at server startup
// validateEnvironment();

// 8. TYPESCRIPT TYPES (Optional)
// -------------------------------

export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  styles: Record<string, FigmaStyle>;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  [key: string]: any;
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  remote: boolean;
}

export interface FigmaStyle {
  key: string;
  name: string;
  description: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
}

// ============================================
// DEPLOYMENT CHECKLIST
// ============================================

/*
✅ Railway Setup:
1. Go to Railway Dashboard
2. Select your project
3. Click Variables tab
4. Add: FIGMA_API_KEY=figd_YOUR_TOKEN_HERE
5. Save and redeploy

✅ Code Setup:
1. Add this file to your backend: src/config/figma.ts
2. Import in your routes or MCP server
3. Add Express routes (if using REST API)
4. Or add MCP tools (if using MCP server)

✅ Testing:
1. Check Railway logs for "✅ Figma API Key loaded"
2. Test API endpoint: GET /api/v1/figma/file/{fileKey}
3. Verify you can fetch Figma files
4. Check MCP connection in Claude Code settings

✅ Security:
1. Never commit FIGMA_API_KEY to Git
2. Use Railway's encrypted variables
3. Add rate limiting to Figma endpoints
4. Validate file keys before fetching
*/

export { FIGMA_API_KEY };
