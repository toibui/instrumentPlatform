import { pgTable, varchar, text } from 'drizzle-orm/pg-core';

export const rawData = pgTable('raw_data', {
  MaterialNumber: varchar('MaterialNumber', { length: 255 }),
  InstrumentName: text('InstrumentName'),
  Material_Name: varchar('Material_Name:', { length: 255 }),
  Parametershort: varchar('Parametershort', { length: 255 }),
  UsageType: varchar('UsageType', { length: 255 }),
  PL6: varchar('PL6', { length: 255 }),
});