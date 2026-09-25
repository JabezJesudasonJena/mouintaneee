// ============================================================
// Barrel export for the data layer
// ============================================================

export { getMockClient } from './mock-client';
export type { DataClient, Subscription, CreateShipmentPayload, CreateTripPayload, ReportIncidentPayload } from './client';
export type * from './types';
export { storage } from './storage';
export { SEED_DATA } from './seed';
