-- Migration: Add unique constraint on tasks table to prevent duplicates
-- This prevents multiple tasks with the same user_id, topic, and due_date

-- First, clean up any existing duplicates (keep the one with the most recent status or earliest ID)
-- This uses a CTE to identify duplicates and delete all but one
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY user_id, topic, due_date
               ORDER BY 
                   CASE status 
                       WHEN 'done' THEN 1 
                       WHEN 'doing' THEN 2 
                       WHEN 'todo' THEN 3 
                   END,
                   created_at ASC
           ) as rn
    FROM tasks
)
DELETE FROM tasks
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_user_topic_date 
ON tasks(user_id, topic, due_date);

-- Add comment explaining the constraint
COMMENT ON INDEX idx_tasks_user_topic_date IS 
'Ensures only one task per user per topic per date. Prevents duplicate task entries.';
