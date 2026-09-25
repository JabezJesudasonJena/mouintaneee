// ============================================================
// DataClient — the ONLY interface components call
// When backend exists, swap mock-client.ts for real-client.ts
// ============================================================

import type {
  Trip,
  Shipment,
  Driver,
  Vehicle,
  Route,
  HazardEvent,
  Incident,
  DriverLocation,
  Alert,
  Hub,
  SyncEvent,
  Organization,
  User,
  ShipmentPriority,
  SpecialHandling,
  IncidentCategory,
  GeoPoint,
} from './types';

// ============================================================
// Subscription handle for realtime-like updates
// ============================================================
export interface Subscription {
  unsubscribe: () => void;
}

// ============================================================
// Create/update payloads
// ============================================================

export interface CreateShipmentPayload {
  originName: string;
  originLocation: GeoPoint;
  destinationName: string;
  destinationLocation: GeoPoint;
  cargoDescription: string;
  weightKg: number;
  volumeCbm: number;
  specialHandling: SpecialHandling[];
  priority: ShipmentPriority;
  deadline: string;
}

export interface CreateTripPayload {
  shipmentId: string;
  driverId: string;
  vehicleId: string;
  routeId: string;
}

export interface ReportIncidentPayload {
  tripId?: string;
  driverId: string;
  category: IncidentCategory;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  title: string;
  description: string;
  location: GeoPoint;
}

// ============================================================
// DataClient interface
// ============================================================

export interface DataClient {
  // Session / auth (mocked)
  getCurrentUser(): User | null;
  login(role: 'ops_manager' | 'driver'): User;
  logout(): void;

  // Organizations
  getOrganization(id: string): Organization | null;

  // Drivers
  getDrivers(): Driver[];
  getDriver(id: string): Driver | null;
  getAvailableDrivers(): Driver[];

  // Vehicles
  getVehicles(): Vehicle[];
  getVehicle(id: string): Vehicle | null;
  getAvailableVehicles(): Vehicle[];
  getCompatibleVehicles(weightKg: number, volumeCbm: number): Vehicle[];

  // Shipments
  getShipments(): Shipment[];
  getShipment(id: string): Shipment | null;
  createShipment(payload: CreateShipmentPayload): Shipment;

  // Trips
  getTrips(): Trip[];
  getTrip(id: string): Trip | null;
  getActiveTrips(): Trip[];
  createTrip(payload: CreateTripPayload): Trip;
  getDriverActiveTrip(driverId: string): Trip | null;

  // Routes
  getRoutes(): Route[];
  getRoute(id: string): Route | null;
  getRoutesForTrip(tripId: string): Route[];

  // Hazards
  getHazards(): HazardEvent[];
  getHazard(id: string): HazardEvent | null;
  getActiveHazards(): HazardEvent[];
  injectHazard(hazard: Partial<HazardEvent>): HazardEvent;

  // Incidents
  getIncidents(): Incident[];
  getIncident(id: string): Incident | null;
  reportIncident(payload: ReportIncidentPayload): Incident;

  // Alerts
  getAlerts(): Alert[];
  getUnreadAlerts(): Alert[];
  markAlertRead(id: string): void;
  dismissAlert(id: string): void;

  // Hubs
  getHubs(): Hub[];

  // Realtime subscriptions (interval-based in mock, WebSocket in real)
  subscribeToDriverLocations(callback: (locations: DriverLocation[]) => void): Subscription;
  subscribeToAlerts(callback: (alert: Alert) => void): Subscription;
  subscribeToTripUpdates(callback: (trip: Trip) => void): Subscription;

  // Offline sync
  getSyncQueue(): SyncEvent[];
  addToSyncQueue(event: Omit<SyncEvent, 'id' | 'createdAt' | 'status' | 'retryCount'>): SyncEvent;
  processSyncQueue(): Promise<SyncEvent[]>;
  isOnline(): boolean;
  setOnline(online: boolean): void;

  // Demo controls
  startSimulation(): void;
  stopSimulation(): void;
}
