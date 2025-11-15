const BASE_PATH = './';

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    
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
      
      return new Response(file, {
        headers: {
          'Content-Type': contentType,
        },
      });
    } else {
      return new Response('File not found', { status: 404 });
    }
  },
  error() {
    return new Response(null, { status: 404 });
  },
});

console.info('🚀 Server running at http://localhost:3000/');