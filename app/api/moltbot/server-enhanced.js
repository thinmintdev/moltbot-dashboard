const http = require('http');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = util.promisify(exec);

const PORT = 18790;
const MOLTBOT_PATH = '/home/linuxbrew/.linuxbrew/bin/moltbot';
const LOG_DIR = '/tmp/moltbot';

// ============================================================================
// Error Handling Utilities
// ============================================================================

const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  
  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  
  // Method errors (405)
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  
  // Server errors (500)
  EXECUTION_ERROR: 'EXECUTION_ERROR',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  
  // Service errors (503)
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  MOLTBOT_NOT_RUNNING: 'MOLTBOT_NOT_RUNNING',
};

function createErrorResponse(code, message, details = null, recovery = null) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      recovery,
      timestamp: new Date().toISOString()
    }
  };
}

function logError(endpoint, error, context = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    endpoint,
    error: typeof error === 'string' ? error : error.message,
    stack: error.stack,
    ...context
  };
  console.error(`[ERROR] ${timestamp} ${endpoint}:`, logEntry);
  return logEntry;
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateModelId(modelId) {
  if (!modelId || typeof modelId !== 'string' || modelId.trim() === '') {
    return { valid: false, error: 'Model ID is required' };
  }
  if (modelId.length > 100) {
    return { valid: false, error: 'Model ID is too long (max 100 characters)' };
  }
  // Check for potentially dangerous characters
  if (/[;&|>$`\\]/.test(modelId)) {
    return { valid: false, error: 'Model ID contains invalid characters' };
  }
  return { valid: true };
}

function validateTaskInput(title, description) {
  const errors = [];
  
  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push('Task title is required');
  } else if (title.length > 200) {
    errors.push('Task title is too long (max 200 characters)');
  }
  
  if (description && typeof description !== 'string') {
    errors.push('Description must be a string');
  } else if (description && description.length > 2000) {
    errors.push('Description is too long (max 2000 characters)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function validateTaskId(taskId) {
  if (!taskId || typeof taskId !== 'string') {
    return { valid: false, error: 'Task ID is required' };
  }
  // Task IDs are timestamps, so should be numeric
  if (!/^\d+$/.test(taskId)) {
    return { valid: false, error: 'Invalid task ID format' };
  }
  return { valid: true };
}

function validateStatus(status) {
  const validStatuses = ['todo', 'inProgress', 'done'];
  if (!status || !validStatuses.includes(status)) {
    return {
      valid: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    };
  }
  return { valid: true };
}

function validateLinesParam(lines) {
  const numLines = parseInt(lines, 10);
  if (isNaN(numLines) || numLines < 1) {
    return { valid: false, error: 'Lines parameter must be a positive number' };
  }
  if (numLines > 10000) {
    return { valid: false, error: 'Lines parameter too large (max 10000)' };
  }
  return { valid: true, value: numLines };
}

// ============================================================================
// API Functions with Enhanced Error Handling
// ============================================================================

async function getMoltbotStatus() {
  try {
    const { stdout, stderr } = await execAsync(`${MOLTBOT_PATH} status --json 2>&1`);
    
    if (!stdout || stdout.trim() === '') {
      if (stderr && stderr.includes('not found')) {
        return createErrorResponse(
          ERROR_CODES.MOLTBOT_NOT_RUNNING,
          'Moltbot is not installed or not found',
          { command: `${MOLTBOT_PATH} status` },
          'Ensure Moltbot is installed at the expected path'
        );
      }
      return createErrorResponse(
        ERROR_CODES.EXECUTION_ERROR,
        'No output from moltbot status command',
        { stdout: stdout?.substring(0, 100) }
      );
    }
    
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) {
      return createErrorResponse(
        ERROR_CODES.PARSE_ERROR,
        'Could not parse moltbot status output',
        { output: stdout.substring(0, 200) },
        'Check that moltbot is returning valid JSON'
      );
    }
    
    const data = JSON.parse(stdout.slice(jsonStart));
    
    // Check if moltbot service is actually running
    if (!data.gatewayService?.runtimeShort?.includes('running')) {
      return createErrorResponse(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'Moltbot gateway service is not running',
        { serviceStatus: data.gatewayService },
        'Restart the gateway with: moltbot gateway start'
      );
    }
    
    return {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    if (e.code === 'ENOENT') {
      return createErrorResponse(
        ERROR_CODES.MOLTBOT_NOT_RUNNING,
        'Moltbot executable not found',
        { path: MOLTBOT_PATH },
        'Install Moltbot or update the path in server configuration'
      );
    }
    logError('/status', e);
    return createErrorResponse(
      ERROR_CODES.EXECUTION_ERROR,
      'Failed to get Moltbot status',
      { message: e.message }
    );
  }
}

async function getMoltbotHealth() {
  try {
    const { stdout, stderr } = await execAsync(`${MOLTBOT_PATH} health --json 2>&1`);
    
    if (!stdout || stdout.trim() === '') {
      if (stderr && stderr.includes('command not found')) {
        return createErrorResponse(
          ERROR_CODES.MOLTBOT_NOT_RUNNING,
          'Health command not available in this Moltbot version',
          null,
          'Upgrade Moltbot or use alternative health checks'
        );
      }
      return createErrorResponse(
        ERROR_CODES.EXECUTION_ERROR,
        'No output from moltbot health command',
        { stderr: stderr?.substring(0, 200) }
      );
    }
    
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) {
      return createErrorResponse(
        ERROR_CODES.PARSE_ERROR,
        'Could not parse moltbot health output',
        { output: stdout.substring(0, 200) }
      );
    }
    
    return {
      success: true,
      data: JSON.parse(stdout.slice(jsonStart)),
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    logError('/health', e);
    return createErrorResponse(
      ERROR_CODES.EXECUTION_ERROR,
      'Failed to get Moltbot health',
      { message: e.message }
    );
  }
}

async function getModels() {
  try {
    const { stdout, stderr } = await execAsync(`${MOLTBOT_PATH} models list --json 2>&1`);
    
    if (!stdout || stdout.trim() === '') {
      // Models command might not exist, return empty list with info
      return {
        success: true,
        data: {
          models: [],
          defaults: {},
          message: 'No models configured or models command not available'
        },
        timestamp: new Date().toISOString()
      };
    }
    
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) {
      return createErrorResponse(
        ERROR_CODES.PARSE_ERROR,
        'Could not parse models list output',
        { output: stdout.substring(0, 200) }
      );
    }
    
    return {
      success: true,
      data: JSON.parse(stdout.slice(jsonStart)),
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    // Models command might not exist in this version
    logError('/models', e);
    return {
      success: true,
      data: {
        models: [],
        defaults: {},
        error: 'Models command not available',
        note: 'Models must be configured manually'
      },
      timestamp: new Date().toISOString()
    };
  }
}

async function setModel(modelId) {
  // Validate input
  const validation = validateModelId(modelId);
  if (!validation.valid) {
    return createErrorResponse(
      ERROR_CODES.INVALID_PARAMETER,
      validation.error,
      { parameter: 'modelId', value: modelId },
      'Provide a valid model ID'
    );
  }
  
  try {
    const { stdout, stderr } = await execAsync(
      `${MOLTBOT_PATH} models set "${modelId.replace(/"/g, '\\"')}" --json 2>&1`
    );
    
    if (stderr && stderr.toLowerCase().includes('error')) {
      logError('/model/set', new Error(stderr), { modelId });
      return createErrorResponse(
        ERROR_CODES.MODEL_NOT_FOUND,
        `Model "${modelId}" not found or could not be set`,
        { stderr: stderr.substring(0, 300) },
        'Check available models with: moltbot models list'
      );
    }
    
    return {
      success: true,
      data: {
        model: modelId,
        message: `Successfully switched to model: ${modelId}`
      },
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    logError('/model/set', e, { modelId });
    return createErrorResponse(
      ERROR_CODES.EXECUTION_ERROR,
      `Failed to set model: ${modelId}`,
      { message: e.message },
      'Check that the model exists and Moltbot is running'
    );
  }
}

async function getTasks() {
  try {
    const tasksFile = path.join(LOG_DIR, 'tasks.json');
    
    if (!fs.existsSync(tasksFile)) {
      return {
        success: true,
        data: {
          todo: [],
          inProgress: [],
          done: [],
          message: 'No tasks file found. Create your first task!'
        },
        timestamp: new Date().toISOString()
      };
    }
    
    const content = fs.readFileSync(tasksFile, 'utf8');
    
    if (!content.trim()) {
      return {
        success: true,
        data: { todo: [], inProgress: [], done: [] },
        timestamp: new Date().toISOString()
      };
    }
    
    const tasks = JSON.parse(content);
    
    // Validate task structure
    const validStatuses = ['todo', 'inProgress', 'done'];
    const cleanedTasks = { todo: [], inProgress: [], done: [] };
    
    validStatuses.forEach(status => {
      cleanedTasks[status] = (tasks[status] || []).filter(task => 
        task && task.id && task.title
      );
    });
    
    return {
      success: true,
      data: cleanedTasks,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      return createErrorResponse(
        ERROR_CODES.PARSE_ERROR,
        'Tasks file contains invalid JSON',
        { file: path.join(LOG_DIR, 'tasks.json') },
        'The tasks file may be corrupted. Consider deleting and starting fresh.'
      );
    }
    logError('/tasks', e);
    return createErrorResponse(
      ERROR_CODES.FILE_READ_ERROR,
      'Failed to read tasks file',
      { message: e.message }
    );
  }
}

async function createTask(title, description) {
  // Validate input
  const validation = validateTaskInput(title, description);
  if (!validation.valid) {
    return createErrorResponse(
      ERROR_CODES.INVALID_PARAMETER,
      'Invalid task input',
      { errors: validation.errors },
      'Provide a title for your task'
    );
  }
  
  try {
    const tasksFile = path.join(LOG_DIR, 'tasks.json');
    let tasks = { todo: [], inProgress: [], done: [] };
    
    if (fs.existsSync(tasksFile)) {
      try {
        const content = fs.readFileSync(tasksFile, 'utf8');
        if (content.trim()) {
          tasks = JSON.parse(content);
        }
      } catch (e) {
        logError('/tasks (create)', e, { action: 'read_existing' });
      }
    }
    
    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: (description || '').trim(),
      created: new Date().toISOString(),
      status: 'todo'
    };
    
    tasks.todo.push(newTask);
    
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
    
    return {
      success: true,
      data: {
        task: newTask,
        message: 'Task created successfully'
      },
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    logError('/tasks (create)', e, { title });
    return createErrorResponse(
      ERROR_CODES.FILE_WRITE_ERROR,
      'Failed to create task',
      { message: e.message },
      'Check disk space and file permissions'
    );
  }
}

async function updateTaskStatus(taskId, newStatus) {
  // Validate inputs
  const taskIdValidation = validateTaskId(taskId);
  if (!taskIdValidation.valid) {
    return createErrorResponse(
      ERROR_CODES.INVALID_PARAMETER,
      taskIdValidation.error,
      { parameter: 'taskId' }
    );
  }
  
  const statusValidation = validateStatus(newStatus);
  if (!statusValidation.valid) {
    return createErrorResponse(
      ERROR_CODES.INVALID_PARAMETER,
      statusValidation.error,
      { parameter: 'status', value: newStatus }
    );
  }
  
  try {
    const tasksFile = path.join(LOG_DIR, 'tasks.json');
    
    if (!fs.existsSync(tasksFile)) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'No tasks found',
        { taskId },
        'Create a task first before updating it'
      );
    }
    
    const content = fs.readFileSync(tasksFile, 'utf8');
    
    if (!content.trim()) {
      return createErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Tasks file is empty',
        { taskId },
        'Create a task first'
      );
    }
    
    let tasks = JSON.parse(content);
    
    // Find and move the task
    let task = null;
    const validStatuses = ['todo', 'inProgress', 'done'];
    
    validStatuses.forEach(status => {
      const found = (tasks[status] || []).find(t => t && t.id === taskId);
      if (found) {
        task = found;
        tasks[status] = tasks[status].filter(t => t.id !== taskId);
      }
    });
    
    if (!task) {
      return createErrorResponse(
        ERROR_CODES.TASK_NOT_FOUND,
        `Task with ID "${taskId}" not found`,
        { taskId },
        'The task may have been deleted or the ID is incorrect'
      );
    }
    
    // Update and move to new status
    task.status = newStatus;
    task.updated = new Date().toISOString();
    tasks[newStatus].push(task);
    
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
    
    return {
      success: true,
      data: {
        task,
        previousStatus: task.status,
        newStatus,
        message: `Task moved to ${newStatus}`
      },
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      return createErrorResponse(
        ERROR_CODES.PARSE_ERROR,
        'Tasks file contains invalid JSON',
        { file: path.join(LOG_DIR, 'tasks.json') },
        'The tasks file may be corrupted'
      );
    }
    logError('/task/update', e, { taskId, newStatus });
    return createErrorResponse(
      ERROR_CODES.FILE_WRITE_ERROR,
      'Failed to update task',
      { message: e.message }
    );
  }
}

async function getContext() {
  try {
    const { stdout } = await execAsync(`${MOLTBOT_PATH} config get --json 2>&1`);
    
    const jsonStart = stdout.indexOf('{');
    const config = jsonStart !== -1 ? JSON.parse(stdout.slice(jsonStart)) : {};
    
    const workspaceDir = '/home/mintai/clawd';
    let memories = '';
    let memoriesError = null;
    
    try {
      const memFile = path.join(workspaceDir, 'MEMORY.md');
      if (fs.existsSync(memFile)) {
        memories = fs.readFileSync(memFile, 'utf8').substring(0, 2000);
      }
    } catch (e) {
      memoriesError = e.message;
    }
    
    return {
      success: true,
      data: {
        workspace: workspaceDir,
        workspaceExists: fs.existsSync(workspaceDir),
        config,
        memoriesLength: memories.length,
        memoriesTruncated: memories.length >= 2000,
        warnings: memoriesError ? [`Could not read MEMORY.md: ${memoriesError}`] : []
      },
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    logError('/context', e);
    return {
      success: true,
      data: {
        workspace: '/home/mintai/clawd',
        workspaceExists: false,
        config: {},
        memories: '',
        error: 'Could not fetch context from Moltbot',
        note: 'Moltbot may not be running'
      },
      timestamp: new Date().toISOString()
    };
  }
}

async function getLogs(lines = 100) {
  const validation = validateLinesParam(lines);
  if (!validation.valid) {
    return createErrorResponse(
      ERROR_CODES.INVALID_PARAMETER,
      validation.error,
      { parameter: 'lines' }
    );
  }
  
  const actualLines = validation.value;
  
  try {
    const logFile = path.join(LOG_DIR, 'moltbot.log');
    
    if (!fs.existsSync(logFile)) {
      return {
        success: true,
        data: {
          logs: [],
          message: 'Log file not found. Gateway logs will appear here.',
          logPath: logFile
        },
        timestamp: new Date().toISOString()
      };
    }
    
    const content = fs.readFileSync(logFile, 'utf8');
    const allLines = content.split('\n').filter(l => l.trim());
    
    const truncated = allLines.length > actualLines;
    const returnedLines = allLines.slice(-actualLines).reverse();
    
    return {
      success: true,
      data: {
        logs: returnedLines,
        totalLines: allLines.length,
        returnedLines: returnedLines.length,
        truncated,
        truncatedCount: truncated ? allLines.length - actualLines : 0,
        logPath: logFile
      },
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    if (e.code === 'EACCES') {
      return createErrorResponse(
        ERROR_CODES.FILE_READ_ERROR,
        'Permission denied reading log file',
        { logPath: path.join(LOG_DIR, 'moltbot.log') },
        'Check file permissions with: ls -la /tmp/moltbot/'
      );
    }
    logError('/logs', e);
    return createErrorResponse(
      ERROR_CODES.FILE_READ_ERROR,
      'Failed to read log file',
      { message: e.message }
    );
  }
}

async function sendChat(message, session) {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return createErrorResponse(
      ERROR_CODES.MISSING_PARAMETER,
      'Message is required',
      { parameter: 'message' },
      'Type a message to send to Moltbot'
    );
  }
  
  if (message.length > 10000) {
    return createErrorResponse(
      ERROR_CODES.INVALID_PARAMETER,
      'Message is too long (max 10000 characters)',
      { messageLength: message.length },
      'Try sending a shorter message'
    );
  }
  
  try {
    const { stdout, stderr } = await execAsync(
      `${MOLTBOT_PATH} chat "${message.replace(/"/g, '\\"')}" --session ${session || 'default'} --json 2>&1`
    );
    
    if (stderr && stderr.toLowerCase().includes('error')) {
      logError('/chat', new Error(stderr), { session, messageLength: message.length });
      return createErrorResponse(
        ERROR_CODES.EXECUTION_ERROR,
        'Failed to send chat message',
        { stderr: stderr.substring(0, 300) },
        'Moltbot may not be responding. Try again later.'
      );
    }
    
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) {
      // Command ran but no JSON response - might be a simple response
      return {
        success: true,
        data: {
          response: stdout.trim(),
          format: 'plain'
        },
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      success: true,
      data: {
        ...JSON.parse(stdout.slice(jsonStart)),
        format: 'json'
      },
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    logError('/chat', e, { session, messageLength: message.length });
    return createErrorResponse(
      ERROR_CODES.EXECUTION_ERROR,
      'Failed to communicate with Moltbot',
      { message: e.message },
      'Ensure Moltbot gateway is running'
    );
  }
}

// ============================================================================
// HTTP Server
// ============================================================================

const server = http.createServer(async (req, res) => {
  // CORS headers
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
  const startTime = Date.now();
  
  // Request logging
  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);
  
  try {
    let response;
    let statusCode = 200;
    
    switch (path) {
      case '/status':
        response = await getMoltbotStatus();
        if (!response.success) statusCode = 503;
        break;
        
      case '/health':
        response = await getMoltbotHealth();
        if (!response.success) statusCode = 503;
        break;
        
      case '/combined':
        const [statusResult, healthResult] = await Promise.all([
          getMoltbotStatus(),
          getMoltbotHealth()
        ]);
        response = {
          success: true,
          data: {
            status: statusResult.data || statusResult,
            health: healthResult.data || healthResult
          },
          timestamp: new Date().toISOString()
        };
        break;
        
      case '/models':
        response = await getModels();
        break;
        
      case '/model/set':
        if (req.method !== 'POST') {
          response = createErrorResponse(
            ERROR_CODES.METHOD_NOT_ALLOWED,
            'Only POST method is allowed for this endpoint',
            { method: req.method, endpoint: '/model/set' },
            'Use POST to switch models'
          );
          statusCode = 405;
        } else {
          const modelId = query.get('model');
          response = await setModel(modelId);
          if (!response.success) statusCode = 400;
        }
        break;
        
      case '/tasks':
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          await new Promise(resolve => req.on('end', resolve));
          
          try {
            const { title, description } = JSON.parse(body || '{}');
            response = await createTask(title, description);
            if (!response.success) statusCode = 400;
          } catch (e) {
            response = createErrorResponse(
              ERROR_CODES.PARSE_ERROR,
              'Invalid JSON in request body',
              { error: e.message },
              'Send valid JSON with title and description fields'
            );
            statusCode = 400;
          }
        } else {
          response = await getTasks();
        }
        break;
        
      case '/task/update':
        if (req.method !== 'POST') {
          response = createErrorResponse(
            ERROR_CODES.METHOD_NOT_ALLOWED,
            'Only POST method is allowed for this endpoint',
            { method: req.method, endpoint: '/task/update' },
            'Use POST to update task status'
          );
          statusCode = 405;
        } else {
          let body = '';
          req.on('data', chunk => body += chunk);
          await new Promise(resolve => req.on('end', resolve));
          
          try {
            const { taskId, status } = JSON.parse(body || '{}');
            response = await updateTaskStatus(taskId, status);
            if (!response.success) {
              statusCode = response.error?.code === 'NOT_FOUND' ? 404 : 400;
            }
          } catch (e) {
            response = createErrorResponse(
              ERROR_CODES.PARSE_ERROR,
              'Invalid JSON in request body',
              { error: e.message },
              'Send valid JSON with taskId and status fields'
            );
            statusCode = 400;
          }
        }
        break;
        
      case '/context':
        response = await getContext();
        break;
        
      case '/logs':
        response = await getLogs(query.get('lines') || 100);
        if (!response.success) statusCode = 400;
        break;
        
      case '/chat':
        if (req.method !== 'POST') {
          response = createErrorResponse(
            ERROR_CODES.METHOD_NOT_ALLOWED,
            'Only POST method is allowed for this endpoint',
            { method: req.method, endpoint: '/chat' },
            'Use POST to send chat messages'
          );
          statusCode = 405;
        } else {
          let body = '';
          req.on('data', chunk => body += chunk);
          await new Promise(resolve => req.on('end', resolve));
          
          try {
            const { message, session } = JSON.parse(body || '{}');
            response = await sendChat(message, session);
            if (!response.success) statusCode = 503;
          } catch (e) {
            response = createErrorResponse(
              ERROR_CODES.PARSE_ERROR,
              'Invalid JSON in request body',
              { error: e.message },
              'Send valid JSON with message field'
            );
            statusCode = 400;
          }
        }
        break;
        
      default:
        response = createErrorResponse(
          ERROR_CODES.NOT_FOUND,
          `Endpoint not found: ${path}`,
          { path, availableEndpoints: [
            '/status', '/health', '/combined',
            '/models', '/model/set',
            '/tasks', '/task/update',
            '/context', '/logs', '/chat'
          ] },
          'Check the API documentation for available endpoints'
        );
        statusCode = 404;
    }
    
    // Add response time header
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    
    res.writeHead(statusCode);
    res.end(JSON.stringify(response, null, 2));
    
  } catch (e) {
    const errorResponse = createErrorResponse(
      ERROR_CODES.EXECUTION_ERROR,
      'Internal server error',
      { message: e.message },
      'Try again later or restart the API server'
    );
    
    console.error(`[CRITICAL] ${new Date().toISOString()} ${path}:`, e);
    
    res.writeHead(500);
    res.end(JSON.stringify(errorResponse, null, 2));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Moltbot Status API running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /status      - Get Moltbot status`);
  console.log(`  GET  /health      - Get Moltbot health`);
  console.log(`  GET  /combined    - Combined status + health`);
  console.log(`  GET  /models      - List available models`);
  console.log(`  POST /model/set   - Switch default model`);
  console.log(`  GET  /tasks       - Get all tasks`);
  console.log(`  POST /tasks       - Create new task`);
  console.log(`  POST /task/update - Update task status`);
  console.log(`  GET  /context     - Get workspace context`);
  console.log(`  GET  /logs        - Get gateway logs`);
  console.log(`  POST /chat        - Send chat message`);
});
