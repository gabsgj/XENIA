#!/usr/bin/env python3
"""
Migration script to add metadata column to syllabus_topics table.
Run this to update existing database schema.
"""

import sys
import os

# Add backend to path to import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.supabase_client import get_supabase

def migrate_add_metadata_column():
    """Add metadata jsonb column to syllabus_topics table."""
    try:
        supabase = get_supabase()
        
        # Check if column already exists
        check_query = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'syllabus_topics' 
        AND column_name = 'metadata';
        """
        
        result = supabase.rpc('exec_sql', {'sql': check_query}).execute()
        
        if not result.data:
            # Add metadata column
            alter_query = """
            ALTER TABLE syllabus_topics 
            ADD COLUMN IF NOT EXISTS metadata jsonb;
            """
            
            supabase.rpc('exec_sql', {'sql': alter_query}).execute()
            print("✅ Added metadata column to syllabus_topics table")
            
            # Add index for better performance
            index_query = """
            CREATE INDEX IF NOT EXISTS idx_syllabus_topics_metadata 
            ON syllabus_topics USING GIN (metadata);
            """
            
            try:
                supabase.rpc('exec_sql', {'sql': index_query}).execute()
                print("✅ Added GIN index on metadata column")
            except Exception as e:
                print(f"⚠️ Could not add index (non-critical): {e}")
                
        else:
            print("ℹ️ Metadata column already exists")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("Manual SQL to run:")
        print("ALTER TABLE syllabus_topics ADD COLUMN IF NOT EXISTS metadata jsonb;")
        print("CREATE INDEX IF NOT EXISTS idx_syllabus_topics_metadata ON syllabus_topics USING GIN (metadata);")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Running migration: add metadata column")
    success = migrate_add_metadata_column()
    if success:
        print("✅ Migration completed successfully")
    else:
        print("❌ Migration failed - check logs above")
        sys.exit(1)
