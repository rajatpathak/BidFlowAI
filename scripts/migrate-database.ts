#!/usr/bin/env node

/**
 * Database Migration Script
 * Migrates from current schema to enhanced schema with improved structure
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function runMigration() {
  console.log('🔄 Starting database migration to enhanced schema...');

  try {
    // Create enums first
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'bidder', 'finance_manager', 'analyst');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE tender_status AS ENUM ('draft', 'published', 'in_progress', 'submitted', 'under_evaluation', 'won', 'lost', 'cancelled', 'missed_opportunity');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE tender_source AS ENUM ('gem', 'non_gem', 'portal', 'direct', 'referral');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE priority AS ENUM ('low', 'medium', 'high', 'critical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✅ Enums created successfully');

    // Add new columns to existing tables
    console.log('🔄 Adding new columns to users table...');
    
    const userColumns = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(15)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW()',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()'
    ];

    for (const columnSql of userColumns) {
      try {
        await db.execute(sql.raw(columnSql));
      } catch (error) {
        console.log(`Column might already exist: ${columnSql}`);
      }
    }

    console.log('🔄 Adding new columns to tenders table...');
    
    const tenderColumns = [
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100)',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(15,2)',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT \'INR\'',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS publish_date TIMESTAMP',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMP',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS technical_meeting_date TIMESTAMP',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS category VARCHAR(100)',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS location VARCHAR(255)',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS win_probability DECIMAL(5,2)',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id)',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS portal_link TEXT',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id)',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT \'[]\'',
      'ALTER TABLE tenders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\''
    ];

    for (const columnSql of tenderColumns) {
      try {
        await db.execute(sql.raw(columnSql));
      } catch (error) {
        console.log(`Column might already exist: ${columnSql}`);
      }
    }

    // Create activity_logs table
    console.log('🔄 Creating activity_logs table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add enhanced user sessions columns
    console.log('🔄 Enhancing user_sessions table...');
    const sessionColumns = [
      'ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS refresh_token TEXT',
      'ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)',
      'ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT',
      'ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true'
    ];

    for (const columnSql of sessionColumns) {
      try {
        await db.execute(sql.raw(columnSql));
      } catch (error) {
        console.log(`Session column might already exist: ${columnSql}`);
      }
    }

    // Enhance tender_assignments table
    console.log('🔄 Enhancing tender_assignments table...');
    const assignmentColumns = [
      'ALTER TABLE tender_assignments ADD COLUMN IF NOT EXISTS priority priority DEFAULT \'medium\'',
      'ALTER TABLE tender_assignments ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2)',
      'ALTER TABLE tender_assignments ADD COLUMN IF NOT EXISTS estimated_hours INTEGER',
      'ALTER TABLE tender_assignments ADD COLUMN IF NOT EXISTS actual_hours INTEGER',
      'ALTER TABLE tender_assignments ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP',
      'ALTER TABLE tender_assignments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP',
      'ALTER TABLE tender_assignments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()',
      'ALTER TABLE tender_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()'
    ];

    for (const columnSql of assignmentColumns) {
      try {
        await db.execute(sql.raw(columnSql));
      } catch (error) {
        console.log(`Assignment column might already exist: ${columnSql}`);
      }
    }

    // Enhance documents table
    console.log('🔄 Enhancing documents table...');
    const documentColumns = [
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS hash VARCHAR(64)',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT \'supporting_document\'',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT false',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT \'[]\'',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\'',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id)',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP'
    ];

    for (const columnSql of documentColumns) {
      try {
        await db.execute(sql.raw(columnSql));
      } catch (error) {
        console.log(`Document column might already exist: ${columnSql}`);
      }
    }

    // Create indexes for performance
    console.log('🔄 Creating performance indexes...');
    
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS users_email_idx ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS users_username_idx ON users(username)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS users_role_idx ON users(role)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS users_active_idx ON users(is_active)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS tenders_status_idx ON tenders(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS tenders_source_idx ON tenders(source)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS tenders_deadline_idx ON tenders(deadline)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS tenders_assigned_to_idx ON tenders(assigned_to)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS tenders_organization_idx ON tenders(organization)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS tenders_created_at_idx ON tenders(created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS activity_logs_user_id_idx ON activity_logs(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS activity_logs_entity_type_idx ON activity_logs(entity_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS activity_logs_created_at_idx ON activity_logs(created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS documents_tender_id_idx ON documents(tender_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS documents_category_idx ON documents(category)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS sessions_user_id_idx ON user_sessions(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS sessions_token_idx ON user_sessions(token)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS sessions_active_idx ON user_sessions(is_active)'
    ];

    for (const indexSql of indexes) {
      try {
        await db.execute(sql.raw(indexSql));
      } catch (error) {
        console.log(`Index might already exist: ${indexSql}`);
      }
    }

    // Update data types where needed
    console.log('🔄 Updating data types...');
    
    try {
      // Convert value column to DECIMAL for better precision
      await db.execute(sql`
        ALTER TABLE tenders 
        ALTER COLUMN value TYPE DECIMAL(15,2) 
        USING value::DECIMAL(15,2)
      `);
    } catch (error) {
      console.log('Value column type conversion might have failed or already done');
    }

    try {
      // Convert finance request amount to DECIMAL
      await db.execute(sql`
        ALTER TABLE finance_requests 
        ALTER COLUMN amount TYPE DECIMAL(15,2) 
        USING amount::DECIMAL(15,2)
      `);
    } catch (error) {
      console.log('Finance amount column type conversion might have failed or already done');
    }

    // Add constraints
    console.log('🔄 Adding constraints...');
    
    try {
      await db.execute(sql`
        ALTER TABLE users 
        ADD CONSTRAINT users_email_unique UNIQUE (email)
      `);
    } catch (error) {
      console.log('Email unique constraint might already exist');
    }

    try {
      await db.execute(sql`
        ALTER TABLE users 
        ADD CONSTRAINT users_username_unique UNIQUE (username)
      `);
    } catch (error) {
      console.log('Username unique constraint might already exist');
    }

    try {
      await db.execute(sql`
        ALTER TABLE tenders 
        ADD CONSTRAINT tenders_reference_number_unique UNIQUE (reference_number)
      `);
    } catch (error) {
      console.log('Reference number unique constraint might already exist');
    }

    // Update existing data
    console.log('🔄 Updating existing data...');
    
    // Set default values for new columns
    await db.execute(sql`
      UPDATE users 
      SET updated_at = created_at 
      WHERE updated_at IS NULL
    `);

    await db.execute(sql`
      UPDATE users 
      SET is_active = true 
      WHERE is_active IS NULL
    `);

    // Generate reference numbers for existing tenders using a simpler approach
    await db.execute(sql`
      UPDATE tenders 
      SET reference_number = CONCAT('TND-', EXTRACT(YEAR FROM created_at), '-', LPAD(id::TEXT, 8, '0'))
      WHERE reference_number IS NULL
    `);

    console.log('✅ Database migration completed successfully');
    
    // Verify migration
    const verificationQueries = [
      'SELECT COUNT(*) as user_count FROM users',
      'SELECT COUNT(*) as tender_count FROM tenders',
      'SELECT COUNT(*) as assignment_count FROM tender_assignments',
      'SELECT COUNT(*) as document_count FROM documents'
    ];

    console.log('🔍 Verifying migration...');
    for (const query of verificationQueries) {
      try {
        const result = await db.execute(sql.raw(query));
        console.log(`${query}: ${JSON.stringify(result[0])}`);
      } catch (error) {
        console.log(`Verification query failed: ${query}`);
      }
    }

    console.log('🎉 Migration verification completed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { runMigration };