-- =============================================================================
-- MoltBot Dashboard - Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE agent_run_status AS ENUM ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled');
CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error');
CREATE TYPE context_type AS ENUM ('document', 'code', 'url', 'custom');

-- =============================================================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{"theme": "dark", "notifications": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  github_repo TEXT,
  color TEXT DEFAULT '#ef4444',
  icon TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

-- =============================================================================
-- TASKS TABLE
-- =============================================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'backlog',
  priority task_priority DEFAULT 'medium',
  labels TEXT[] DEFAULT '{}',
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);

-- =============================================================================
-- AGENTS TABLE
-- =============================================================================

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  model TEXT DEFAULT 'claude-sonnet-4-20250514',
  skills TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_type ON agents(type);

-- =============================================================================
-- AGENT RUNS TABLE
-- =============================================================================

CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status agent_run_status DEFAULT 'pending',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT,
  result JSONB,
  error TEXT,
  tokens_used INTEGER DEFAULT 0,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_runs_agent_id ON agent_runs(agent_id);
CREATE INDEX idx_agent_runs_task_id ON agent_runs(task_id);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_runs_created_at ON agent_runs(created_at DESC);

-- =============================================================================
-- AGENT LOGS TABLE (for realtime streaming)
-- =============================================================================

CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  level log_level DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_logs_run_id ON agent_logs(run_id);
CREATE INDEX idx_agent_logs_created_at ON agent_logs(created_at DESC);

-- =============================================================================
-- ROADMAPS TABLE
-- =============================================================================

CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  milestones JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roadmaps_project_id ON roadmaps(project_id);

-- =============================================================================
-- CONTEXTS TABLE (for AI context/knowledge)
-- =============================================================================

CREATE TABLE contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type context_type DEFAULT 'document',
  content TEXT NOT NULL,
  embedding vector(1536),  -- For OpenAI embeddings (enable pgvector first)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contexts_project_id ON contexts(project_id);
CREATE INDEX idx_contexts_type ON contexts(type);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Projects: users can CRUD their own projects
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Tasks: users can CRUD tasks in their projects
CREATE POLICY "Users can view tasks in their projects" ON tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create tasks in their projects" ON tasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update tasks in their projects" ON tasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete tasks in their projects" ON tasks FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));

-- Agents: users can CRUD their own agents
CREATE POLICY "Users can view own agents" ON agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create agents" ON agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agents" ON agents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agents" ON agents FOR DELETE USING (auth.uid() = user_id);

-- Agent runs: users can view runs of their agents
CREATE POLICY "Users can view runs of their agents" ON agent_runs FOR SELECT
  USING (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_runs.agent_id AND agents.user_id = auth.uid()));
CREATE POLICY "Users can create runs for their agents" ON agent_runs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_runs.agent_id AND agents.user_id = auth.uid()));
CREATE POLICY "Users can update runs of their agents" ON agent_runs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_runs.agent_id AND agents.user_id = auth.uid()));

-- Agent logs: users can view logs of their runs
CREATE POLICY "Users can view logs of their runs" ON agent_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM agent_runs
    JOIN agents ON agents.id = agent_runs.agent_id
    WHERE agent_runs.id = agent_logs.run_id AND agents.user_id = auth.uid()
  ));
CREATE POLICY "Users can create logs for their runs" ON agent_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM agent_runs
    JOIN agents ON agents.id = agent_runs.agent_id
    WHERE agent_runs.id = agent_logs.run_id AND agents.user_id = auth.uid()
  ));

-- Roadmaps: users can CRUD roadmaps in their projects
CREATE POLICY "Users can view roadmaps in their projects" ON roadmaps FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = roadmaps.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create roadmaps" ON roadmaps FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = roadmaps.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update roadmaps" ON roadmaps FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = roadmaps.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete roadmaps" ON roadmaps FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = roadmaps.project_id AND projects.user_id = auth.uid()));

-- Contexts: users can CRUD contexts in their projects
CREATE POLICY "Users can view contexts in their projects" ON contexts FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = contexts.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create contexts" ON contexts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = contexts.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update contexts" ON contexts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = contexts.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete contexts" ON contexts FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = contexts.project_id AND projects.user_id = auth.uid()));

-- =============================================================================
-- REALTIME PUBLICATION
-- =============================================================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;

-- =============================================================================
-- TRIGGERS FOR updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_roadmaps_updated_at BEFORE UPDATE ON roadmaps FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contexts_updated_at BEFORE UPDATE ON contexts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- FUNCTION: Create user profile on signup
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
