import { pgTable, varchar, text } from 'drizzle-orm/pg-core';

export const rawData = pgTable('raw_data', {
  MaterialNumber: varchar('MaterialNumber', { length: 255 }),
  InstrumentName: text('InstrumentName'),
  Material_Name: varchar('Material Name', { length: 255 }),
  Test: varchar('Test', { length: 255 }),
  UsageType: varchar('UsageType', { length: 255 }),
});