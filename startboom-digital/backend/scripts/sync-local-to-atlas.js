import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const args = new Set(process.argv.slice(2));
const shouldDropDest = args.has('--drop') || args.has('--drop-dest');
const shouldCopyIndexes = !(args.has('--no-indexes') || args.has('--skip-indexes'));
const dryRun = args.has('--dry-run');

const getDbNameFromUri = (uri) => {
  try {
    const url = new URL(uri);
    const pathname = (url.pathname || '').replace(/^\/+/, '').trim();
    return pathname || null;
  } catch {
    return null;
  }
};

const requireEnv = (key, value) => {
  if (!value) {
    console.error(`Missing ${key}. Set it as an environment variable and re-run.`);
    process.exit(1);
  }
};

const sourceUri =
  process.env.SOURCE_MONGODB_URI ||
  process.env.LOCAL_MONGODB_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/crm_db';

const destUri = process.env.DEST_MONGODB_URI || process.env.ATLAS_MONGODB_URI;

requireEnv('DEST_MONGODB_URI (or ATLAS_MONGODB_URI)', destUri);

if (sourceUri === destUri) {
  console.error('SOURCE_MONGODB_URI and DEST_MONGODB_URI are the same. Refusing to sync.');
  process.exit(1);
}

const sourceDbName = process.env.SOURCE_DB_NAME || getDbNameFromUri(sourceUri);
const destDbName = process.env.DEST_DB_NAME || getDbNameFromUri(destUri);

requireEnv('SOURCE_DB_NAME (or include DB name in SOURCE_MONGODB_URI)', sourceDbName);
requireEnv('DEST_DB_NAME (or include DB name in DEST_MONGODB_URI)', destDbName);

const BATCH_SIZE = Number(process.env.SYNC_BATCH_SIZE || 1000);
if (!Number.isFinite(BATCH_SIZE) || BATCH_SIZE < 1) {
  console.error('SYNC_BATCH_SIZE must be a positive number.');
  process.exit(1);
}

const formatNumber = (num) => new Intl.NumberFormat().format(num);

const insertBatch = async (collection, batch) => {
  if (batch.length === 0) return 0;
  const result = await collection.insertMany(batch, { ordered: false });
  return result.insertedCount || 0;
};

const copyIndexes = async (sourceCollection, destCollection) => {
  const indexes = await sourceCollection.indexes();
  const indexesToCopy = indexes.filter((idx) => idx?.name && idx.name !== '_id_');

  for (const idx of indexesToCopy) {
    const { key, name, v, ns, ...options } = idx;
    await destCollection.createIndex(key, { name, ...options });
  }

  return indexesToCopy.length;
};

const run = async () => {
  console.log('DB sync: localhost → Atlas');
  console.log(`- Source DB: ${sourceDbName}`);
  console.log(`- Dest DB:   ${destDbName}`);
  console.log(`- Drop dest: ${shouldDropDest ? 'YES' : 'NO'}`);
  console.log(`- Indexes:   ${shouldCopyIndexes ? 'YES' : 'NO'}`);
  console.log(`- Dry run:   ${dryRun ? 'YES' : 'NO'}`);

  const sourceClient = new MongoClient(sourceUri);
  const destClient = new MongoClient(destUri);

  try {
    await sourceClient.connect();
    await destClient.connect();

    const sourceDb = sourceClient.db(sourceDbName);
    const destDb = destClient.db(destDbName);

    const collections = await sourceDb.listCollections().toArray();
    const collectionNames = collections
      .map((c) => c.name)
      .filter((name) => name && !name.startsWith('system.'));

    console.log(`- Collections: ${collectionNames.length}`);

    if (dryRun) {
      console.log('Dry run complete. No changes were made.');
      return;
    }

    if (shouldDropDest) {
      console.log('Dropping destination database...');
      await destDb.dropDatabase();
    } else {
      console.log('Destination database will NOT be dropped. This may create duplicates.');
    }

    for (const name of collectionNames) {
      const sourceCollection = sourceDb.collection(name);
      const destCollection = destDb.collection(name);

      const estimated = await sourceCollection.estimatedDocumentCount();
      console.log(`\nSyncing collection: ${name} (~${formatNumber(estimated)} docs)`);

      const cursor = sourceCollection.find({}, { batchSize: BATCH_SIZE });

      let batch = [];
      let insertedTotal = 0;

      for await (const doc of cursor) {
        batch.push(doc);
        if (batch.length >= BATCH_SIZE) {
          insertedTotal += await insertBatch(destCollection, batch);
          batch = [];
          process.stdout.write(`\r- Inserted: ${formatNumber(insertedTotal)}...`);
        }
      }

      if (batch.length > 0) {
        insertedTotal += await insertBatch(destCollection, batch);
      }

      process.stdout.write(`\r- Inserted: ${formatNumber(insertedTotal)}            \n`);

      if (shouldCopyIndexes) {
        const copied = await copyIndexes(sourceCollection, destCollection);
        console.log(`- Indexes copied: ${copied}`);
      }
    }

    console.log('\n✅ Sync complete.');
    console.log('Next: set Render + local backend to use the SAME Atlas MONGODB_URI to keep data identical.');
  } finally {
    await Promise.allSettled([sourceClient.close(), destClient.close()]);
  }
};

run().catch((err) => {
  console.error('\n❌ Sync failed.');
  console.error(err?.message || err);
  console.error('\nTip: If you see duplicate key errors, re-run with --drop-dest.');
  process.exit(1);
});

