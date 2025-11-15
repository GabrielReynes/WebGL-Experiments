import { watch } from 'fs';
import { join } from 'path';

const BASE_PATH = './';

// Store connected WebSocket clients
const clients = new Set();

// Broadcast reload message to all connected clients
function broadcastReload() {
    const message = JSON.stringify({ type: "reload" });
    console.log(`📡 Broadcasting reload to ${clients.size} client(s)...`);
    let sentCount = 0;
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
                sentCount++;
            } catch (error) {
                console.error("Error sending reload message:", error);
                clients.delete(client);
            }
        } else {
            // Remove closed connections
            clients.delete(client);
        }
    });
    console.log(`✅ Reload message sent to ${sentCount} client(s)`);
}

// Inject hot reload script into HTML files
function injectHotReloadScript(html, wsUrl) {
    const script = `
    <script>
      (function() {
        const ws = new WebSocket('${wsUrl}');
        ws.onopen = () => console.log('🔥 Hot reload connected');
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'reload') {
            console.log('🔄 Reloading...');
            window.location.reload();
          }
        };
        ws.onerror = (error) => console.error('Hot reload error:', error);
        ws.onclose = () => console.log('Hot reload disconnected');
      })();
    </script>
  `;
    // Try to replace </body> - handle both with and without whitespace
    if (html.includes('</body>')) {
        return html.replace('</body>', `${script}</body>`);
    } else if (html.includes('</body >')) {
        return html.replace('</body >', `${script}</body >`);
    } else {
        // If no body tag found, append before closing html tag
        return html.replace('</html>', `${script}</html>`);
    }
}

Bun.serve({
    port: 3000,
    async fetch(req, server) {
        const url = new URL(req.url);
        const path = url.pathname;

        // Handle WebSocket upgrade
        if (path === '/_ws') {
            console.log('🔌 WebSocket upgrade request received');
            const upgraded = server.upgrade(req);
            if (upgraded) {
                console.log('✅ WebSocket upgrade successful');
                return; // Successfully upgraded, don't return a response
            } else {
                console.log('❌ WebSocket upgrade failed');
                return new Response("Upgrade failed", { status: 400 });
            }
        }

        // Default to index.html for root
        let filePath = path === '/' ? '/index.html' : path;
        filePath = `${BASE_PATH}${filePath}`;

        const file = Bun.file(filePath);

        if (await file.exists()) {
            // Set correct MIME types for shader files
            let contentType = 'text/plain';

            if (path.endsWith('.frag') || path.endsWith('.vert') || path.endsWith('.glsl')) {
                contentType = 'text/plain';
            } else if (path.endsWith('.html')) {
                contentType = 'text/html';
            } else if (path.endsWith('.js')) {
                contentType = 'application/javascript';
            } else if (path.endsWith('.css')) {
                contentType = 'text/css';
            }

            let content = await file.text();

            // Inject hot reload script into HTML files
            if (path.endsWith('.html')) {
                const wsUrl = `ws://${url.host}/_ws`;
                content = injectHotReloadScript(content, wsUrl);
            }

            return new Response(content, {
                headers: {
                    'Content-Type': contentType,
                },
            });
        } else {
            return new Response('File not found', { status: 404 });
        }
    },
    websocket: {
        open(ws) {
            clients.add(ws);
            console.log(`✅ Client connected. Total clients: ${clients.size}`);
        },
        message(ws, message) {
            // Handle incoming messages if needed
            console.log("WebSocket message received:", message);
        },
        close(ws) {
            clients.delete(ws);
            console.log(`❌ Client disconnected. Total clients: ${clients.size}`);
        },
        error(ws, error) {
            console.error("WebSocket error:", error);
            clients.delete(ws);
        },
    },
    error() {
        return new Response(null, { status: 404 });
    },
});

// Watch for file changes using Node.js fs.watch
// Use a debounce to avoid multiple reloads for the same file
let reloadTimeout = null;

function handleFileChange(filename) {
    // Ignore node_modules and .git directories
    if (filename.includes('node_modules') || filename.includes('.git')) {
        return;
    }

    // Debounce reloads (wait 100ms in case multiple events fire)
    if (reloadTimeout) {
        clearTimeout(reloadTimeout);
    }

    reloadTimeout = setTimeout(() => {
        console.log(`📝 File changed: ${filename}`);
        broadcastReload();
    }, 100);
}

// Watch the base directory recursively
watch(BASE_PATH, { recursive: true }, (eventType, filename) => {
    if (filename && eventType === 'change') {
        handleFileChange(filename);
    }
});

console.info('🚀 Server running at http://localhost:3000/');
console.info('🔥 Hot reload enabled!');
