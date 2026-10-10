import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Migration helper: Clones all collections from a source MongoDB to Atlas
 * Usage: node src/scripts/migrateLocalToAtlas.js <ATLAS_MONGO_URI>
 */
async function migrate() {
  const localUri = 'mongodb://127.0.0.1:27017/apexbuild';
  const targetUri = process.argv[2] || process.env.ATLAS_MONGO_URI || process.env.MONGO_URI;

  if (!targetUri || targetUri.includes('127.0.0.1') || targetUri.includes('localhost')) {
    console.error('❌ Please provide your MongoDB Atlas connection string:');
    console.error('Usage: node src/scripts/migrateLocalToAtlas.js "mongodb+srv://<user>:<password>@cluster.mongodb.net/apexbuild?retryWrites=true&w=majority"');
    process.exit(1);
  }

  console.log(`Connecting to local MongoDB: ${localUri}...`);
  const localConn = await mongoose.createConnection(localUri).asPromise();
  console.log('✅ Connected to local MongoDB.');

  console.log(`Connecting to target Atlas database...`);
  const atlasConn = await mongoose.createConnection(targetUri).asPromise();
  console.log('✅ Connected to Atlas MongoDB.');

  const collections = await localConn.db.listCollections().toArray();
  console.log(`\nFound ${collections.length} collections to migrate.`);

  let totalDocsMigrated = 0;

  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;

    const sourceCol = localConn.db.collection(colName);
    const targetCol = atlasConn.db.collection(colName);

    const count = await sourceCol.countDocuments();
    if (count === 0) {
      console.log(`⏭️  Skipping empty collection: ${colName}`);
      continue;
    }

    const docs = await sourceCol.find({}).toArray();
    try {
      await targetCol.deleteMany({});
      await targetCol.insertMany(docs, { ordered: false });
      console.log(`✅ Migrated ${colName}: ${docs.length} documents`);
      totalDocsMigrated += docs.length;
    } catch (err) {
      console.warn(`⚠️ Partial or index warning in ${colName}: ${err.message}`);
    }
  }

  console.log(`\n🎉 Migration Complete! Successfully migrated ${totalDocsMigrated} documents across collections.`);
  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
