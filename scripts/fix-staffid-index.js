/* eslint-disable @typescript-eslint/no-require-imports */
// Script to fix staffId unique index issue
// Run with: node scripts/fix-staffid-index.js

const mongoose = require('mongoose');

async function fixStaffIdIndex() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    // Add database name to the URI
    const connectionUri = mongoUri.endsWith('/') 
      ? mongoUri + 'C3-ERP' 
      : mongoUri + '/C3-ERP';
    
    await mongoose.connect(connectionUri);
    console.log('✅ Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Check existing indexes
    console.log('\n📋 Current indexes:');
    const indexes = await usersCollection.indexes();
    console.log(indexes);

    // Drop the old staffId_1 index if it exists
    try {
      console.log('\n🗑️  Dropping old staffId_1 index...');
      await usersCollection.dropIndex('staffId_1');
      console.log('✅ Old index dropped');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index does not exist (already dropped or never created)');
      } else {
        throw error;
      }
    }

    // Create compound unique index: staffId unique per organization
    console.log('\n🔨 Creating compound unique index on [organizationId, staffId]...');
    await usersCollection.createIndex(
      { organizationId: 1, staffId: 1 }, 
      { 
        unique: true,
        partialFilterExpression: { 
          staffId: { $type: "string" },
          organizationId: { $type: "string" }
        }
      }
    );
    console.log('✅ New compound index created');

    // Verify new indexes
    console.log('\n📋 Updated indexes:');
    const newIndexes = await usersCollection.indexes();
    console.log(newIndexes);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

fixStaffIdIndex();
