import mongoose from "mongoose";

export async function connectDatabase(uri: string): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
}

export async function createAllIndexes(): Promise<void> {
  const models = mongoose.modelNames();
  await Promise.all(
    models.map((name) => mongoose.model(name).createIndexes())
  );
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
