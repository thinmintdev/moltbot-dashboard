const http = require('http');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = util.promisify(exec);

const PORT = 18790;
const MOLTBOT_PATH = '/home/linuxbrew/.linuxbrew/bin/moltbot';
const LOG_DIR = '/tmp/moltbot';

async function getMoltbotStatus() {
  try {
    const { stdout } = await execAsync(`${MOLTBOT_PATH} status --json 2>/dev/null`);
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) return { error: 'No JSON output' };
    return JSON.parse(stdout.slice(jsonStart));
  } catch (e) {
    return { error: e.message };
  }
}

async function getMoltbotHealth() {
  try {
    const { stdout } = await execAsync(`${MOLTBOT_PATH} health --json 2>/dev/null`);
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) return { error: 'No JSON output' };
    return JSON.parse(stdout.slice(jsonStart));
  } catch (e) {
    return { error: e.message };
  }
}

async function getModels() {
  try {
    const { stdout } = await execAsync(`${MOLTBOT_PATH} models list --json 2>/dev/null`);
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) return { models: [], defaults: {} };
    return JSON.parse(stdout.slice(jsonStart));
  } catch (e) {
    return { error: e.message, models: [], defaults: {} };
  }
}

async function setModel(modelId) {
  try {
    const { stdout } = await execAsync(`${MOLTBOT_PATH} models set ${modelId} --json 2>/dev/null`);
    return { success: true, model: modelId };
  } catch (e) {
    return { error: e.message };
  }
}

async function getTasks() {
  try {
    const tasksFile = path.join(LOG_DIR, 'tasks.json');
    if (fs.existsSync(tasksFile)) {
      const content = fs.readFileSync(tasksFile, 'utf8');
      return JSON.parse(content);
    }
    return { todo: [], inProgress: [], done: [] };
  } catch (e) {
    return { error: e.message, todo: [], inProgress: [], done: [] };
  }
}

async function createTask(title, description) {
  try {
    const tasksFile = path.join(LOG_DIR, 'tasks.json');
    let tasks = { todo: [], inProgress: [], done: [] };
    
    if (fs.existsSync(tasksFile)) {
      try {
        tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      } catch (e) {}
    }
    
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      created: new Date().toISOString(),
      status: 'todo'
    };
    
    tasks.todo.push(newTask);
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
    return tasks;
  } catch (e) {
    return { error: e.message };
  }
}

async function updateTaskStatus(taskId, newStatus) {
  try {
    const tasksFile = path.join(LOG_DIR, 'tasks.json');
    if (!fs.existsSync(tasksFile)) return { error: 'Tasks file not found' };
    
    let tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
    
    let task;
    ['todo', 'inProgress', 'done'].forEach(status => {
      const found = tasks[status].find(t => t.id === taskId);
      if (found) {
        task = found;
        tasks[status] = tasks[status].filter(t => t.id !== taskId);
      }
    });
    
    if (task) {
      task.status = newStatus;
      task.updated = new Date().toISOString();
      tasks[newStatus].push(task);
    }
    
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
    return tasks;
  } catch (e) {
    return { error: e.message };
  }
}

async function getContext() {
  try {
    const { stdout } = await execAsync(`${MOLTBOT_PATH} config get --json 2>/dev/null`);
    const jsonStart = stdout.indexOf('{');
    const config = jsonStart !== -1 ? JSON.parse(stdout.slice(jsonStart)) : {};
    
    const workspaceDir = '/home/mintai/clawd';
    let memories = '';
    try {
      const memFile = path.join(workspaceDir, 'MEMORY.md');
      if (fs.existsSync(memFile)) {
        memories = fs.readFileSync(memFile, 'utf8').substring(0, 2000);
      }
    } catch (e) {}
    
    return {
      workspace: workspaceDir,
      config,
      memories: memories.substring(0, 500)
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function getLogs(lines = 100) {
  try {
    const logFile = path.join(LOG_DIR, 'moltbot.log');
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const allLines = content.split('\n').filter(l => l.trim());
      return allLines.slice(-lines).reverse();
    }
    return [];
  } catch (e) {
    return { error: e.message };
  }
}

async function sendChat(message, session) {
  try {
    const { stdout } = await execAsync(
      `${MOLTBOT_PATH} chat "${message.replace(/"/g, '\\"')}" --session ${session || 'default'} --json 2>/dev/null`
    );
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) return { response: stdout };
    return JSON.parse(stdout.slice(jsonStart));
  } catch (e) {
    return { error: e.message, response: 'Error sending message' };
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const query = url.searchParams;
  
  try {
    let data;
    switch (path) {
      case '/status':
        data = await getMoltbotStatus();
        break;
      case '/health':
        data = await getMoltbotHealth();
        break;
      case '/combined':
        const [status, health] = await Promise.all([
          getMoltbotStatus(),
          getMoltbotHealth()
        ]);
        data = { status, health };
        break;
      case '/models':
        data = await getModels();
        break;
      case '/model/set':
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        const modelId = query.get('model');
        data = await setModel(modelId);
        break;
      case '/tasks':
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          await new Promise(resolve => req.on('end', resolve));
          const { title, description } = JSON.parse(body || '{}');
          data = await createTask(title, description || '');
        } else {
          data = await getTasks();
        }
        break;
      case '/task/update':
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          await new Promise(resolve => req.on('end', resolve));
          const { taskId, status } = JSON.parse(body || '{}');
          data = await updateTaskStatus(taskId, status);
        } else {
          res.writeHead(405);
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        break;
      case '/context':
        data = await getContext();
        break;
      case '/logs':
        data = { logs: await getLogs(query.get('lines') || 100) };
        break;
      case '/chat':
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        let body = '';
        req.on('data', chunk => body += chunk);
        await new Promise(resolve => req.on('end', resolve));
        const { message, session } = JSON.parse(body || '{}');
        data = await sendChat(message, session);
        break;
      default:
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(data));
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Moltbot Status API running on port ${PORT}`);
});
