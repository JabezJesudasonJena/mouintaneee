// ============================================================
// MockClient — implements DataClient using localStorage + seed data
// Simulates realtime with setInterval
// ============================================================

import type {
  DataClient,
  Subscription,
  CreateShipmentPayload,
  CreateTripPayload,
  ReportIncidentPayload,
} from './client';
import type {
  User,
  Organization,
  Driver,
  Vehicle,
  Shipment,
  Trip,
  Route,
  HazardEvent,
  Incident,
  DriverLocation,
  Alert,
  Hub,
  SyncEvent,
  GeoPoint,
} from './types';
import { storage } from './storage';
import { SEED_DATA } from './seed';

// ============================================================
// Keys
// ============================================================
const KEYS = {
  INITIALIZED: 'initialized',
  CURRENT_USER: 'current_user',
  ORGANIZATION: 'organization',
  USERS: 'users',
  DRIVERS: 'drivers',
  VEHICLES: 'vehicles',
  SHIPMENTS: 'shipments',
  TRIPS: 'trips',
  ROUTES: 'routes',
  HAZARDS: 'hazards',
  INCIDENTS: 'incidents',
  ALERTS: 'alerts',
  HUBS: 'hubs',
  SYNC_QUEUE: 'sync_queue',
  ONLINE: 'online',
  DRIVER_LOCATIONS: 'driver_locations',
} as const;

// ============================================================
// UID generator
// ============================================================
let counter = Date.now();
function uid(prefix: string): string {
  return `${prefix}_${(++counter).toString(36)}`;
}

// ============================================================
// Interpolation helper for smooth driver movement
// ============================================================
function interpolatePoint(
  from: [number, number],
  to: [number, number],
  t: number
): [number, number] {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
  ];
}

// ============================================================
// MockClient implementation
// ============================================================
class MockClient implements DataClient {
  private intervals: number[] = [];
  private locationCallbacks: ((locations: DriverLocation[]) => void)[] = [];
  private alertCallbacks: ((alert: Alert) => void)[] = [];
  private tripCallbacks: ((trip: Trip) => void)[] = [];
  private simulationTick = 0;

  constructor() {
    this.ensureSeeded();
  }

  // ============================================================
  // Initialization
  // ============================================================
  private ensureSeeded(): void {
    if (storage.get(KEYS.INITIALIZED, false)) return;

    storage.set(KEYS.ORGANIZATION, SEED_DATA.organization);
    storage.set(KEYS.USERS, SEED_DATA.users);
    storage.set(KEYS.DRIVERS, SEED_DATA.drivers);
    storage.set(KEYS.VEHICLES, SEED_DATA.vehicles);
    storage.set(KEYS.SHIPMENTS, SEED_DATA.shipments);
    storage.set(KEYS.TRIPS, SEED_DATA.trips);
    storage.set(KEYS.ROUTES, SEED_DATA.routes);
    storage.set(KEYS.HAZARDS, SEED_DATA.hazards);
    storage.set(KEYS.INCIDENTS, SEED_DATA.incidents);
    storage.set(KEYS.ALERTS, SEED_DATA.alerts);
    storage.set(KEYS.HUBS, SEED_DATA.hubs);
    storage.set(KEYS.SYNC_QUEUE, []);
    storage.set(KEYS.ONLINE, true);
    storage.set(KEYS.INITIALIZED, true);
  }

  // ============================================================
  // Session / Auth (mocked)
  // ============================================================
  getCurrentUser(): User | null {
    return storage.get<User | null>(KEYS.CURRENT_USER, null);
  }

  login(role: 'ops_manager' | 'driver'): User {
    const users = this.getUsers();
    const user = users.find((u) => u.role === role) || users[0];
    storage.set(KEYS.CURRENT_USER, user);
    return user;
  }

  logout(): void {
    storage.remove(KEYS.CURRENT_USER);
  }

  private getUsers(): User[] {
    return storage.get<User[]>(KEYS.USERS, SEED_DATA.users);
  }

  // ============================================================
  // Organization
  // ============================================================
  getOrganization(id: string): Organization | null {
    const org = storage.get<Organization>(KEYS.ORGANIZATION, SEED_DATA.organization);
    return org.id === id ? org : null;
  }

  // ============================================================
  // Drivers
  // ============================================================
  getDrivers(): Driver[] {
    return storage.get<Driver[]>(KEYS.DRIVERS, SEED_DATA.drivers);
  }

  getDriver(id: string): Driver | null {
    return this.getDrivers().find((d) => d.id === id) || null;
  }

  getAvailableDrivers(): Driver[] {
    return this.getDrivers().filter((d) => d.status === 'available');
  }

  // ============================================================
  // Vehicles
  // ============================================================
  getVehicles(): Vehicle[] {
    return storage.get<Vehicle[]>(KEYS.VEHICLES, SEED_DATA.vehicles);
  }

  getVehicle(id: string): Vehicle | null {
    return this.getVehicles().find((v) => v.id === id) || null;
  }

  getAvailableVehicles(): Vehicle[] {
    return this.getVehicles().filter((v) => v.status === 'available');
  }

  getCompatibleVehicles(weightKg: number, volumeCbm: number): Vehicle[] {
    return this.getAvailableVehicles().filter(
      (v) => v.maxWeightKg >= weightKg && v.maxVolumeCbm >= volumeCbm
    );
  }

  // ============================================================
  // Shipments
  // ============================================================
  getShipments(): Shipment[] {
    return storage.get<Shipment[]>(KEYS.SHIPMENTS, SEED_DATA.shipments);
  }

  getShipment(id: string): Shipment | null {
    return this.getShipments().find((s) => s.id === id) || null;
  }

  createShipment(payload: CreateShipmentPayload): Shipment {
    const shipment: Shipment = {
      id: uid('shp'),
      organizationId: SEED_DATA.organization.id,
      origin: {
        name: payload.originName,
        location: payload.originLocation,
      },
      destination: {
        name: payload.destinationName,
        location: payload.destinationLocation,
      },
      cargo: {
        description: payload.cargoDescription,
        weightKg: payload.weightKg,
        volumeCbm: payload.volumeCbm,
        specialHandling: payload.specialHandling,
      },
      priority: payload.priority,
      deadline: payload.deadline,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const shipments = this.getShipments();
    shipments.push(shipment);
    storage.set(KEYS.SHIPMENTS, shipments);
    return shipment;
  }

  // ============================================================
  // Trips
  // ============================================================
  getTrips(): Trip[] {
    return storage.get<Trip[]>(KEYS.TRIPS, SEED_DATA.trips);
  }

  getTrip(id: string): Trip | null {
    return this.getTrips().find((t) => t.id === id) || null;
  }

  getActiveTrips(): Trip[] {
    return this.getTrips().filter((t) =>
      ['planned', 'en_route', 'delayed', 'at_risk'].includes(t.status)
    );
  }

  createTrip(payload: CreateTripPayload): Trip {
    const shipment = this.getShipment(payload.shipmentId);
    const route = this.getRoute(payload.routeId);
    if (!shipment || !route) throw new Error('Invalid shipment or route');

    const trip: Trip = {
      id: uid('trp'),
      organizationId: SEED_DATA.organization.id,
      shipmentId: payload.shipmentId,
      driverId: payload.driverId,
      vehicleId: payload.vehicleId,
      routeId: payload.routeId,
      origin: shipment.origin,
      destination: shipment.destination,
      status: 'planned',
      riskLevel: route.riskScore > 60 ? 'high' : route.riskScore > 35 ? 'medium' : 'low',
      riskScore: route.riskScore,
      eta: new Date(Date.now() + route.estimatedMinutes * 60000).toISOString(),
      originalEta: new Date(Date.now() + route.estimatedMinutes * 60000).toISOString(),
      currentProgress: 0,
      events: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const trips = this.getTrips();
    trips.push(trip);
    storage.set(KEYS.TRIPS, trips);

    // Update shipment
    const shipments = this.getShipments();
    const idx = shipments.findIndex((s) => s.id === payload.shipmentId);
    if (idx >= 0) {
      shipments[idx].status = 'assigned';
      shipments[idx].tripId = trip.id;
      shipments[idx].updatedAt = new Date().toISOString();
      storage.set(KEYS.SHIPMENTS, shipments);
    }

    // Update driver status
    const drivers = this.getDrivers();
    const dIdx = drivers.findIndex((d) => d.id === payload.driverId);
    if (dIdx >= 0) {
      drivers[dIdx].status = 'on_trip';
      storage.set(KEYS.DRIVERS, drivers);
    }

    // Update vehicle status
    const vehicles = this.getVehicles();
    const vIdx = vehicles.findIndex((v) => v.id === payload.vehicleId);
    if (vIdx >= 0) {
      vehicles[vIdx].status = 'in_use';
      storage.set(KEYS.VEHICLES, vehicles);
    }

    return trip;
  }

  getDriverActiveTrip(driverId: string): Trip | null {
    return this.getActiveTrips().find((t) => t.driverId === driverId) || null;
  }

  // ============================================================
  // Routes
  // ============================================================
  getRoutes(): Route[] {
    return storage.get<Route[]>(KEYS.ROUTES, SEED_DATA.routes);
  }

  getRoute(id: string): Route | null {
    return this.getRoutes().find((r) => r.id === id) || null;
  }

  getRoutesForTrip(tripId: string): Route[] {
    const trip = this.getTrip(tripId);
    if (!trip) return [];
    const routeIds = [trip.routeId, trip.alternateRouteId].filter(Boolean) as string[];
    return this.getRoutes().filter((r) => routeIds.includes(r.id));
  }

  // ============================================================
  // Hazards
  // ============================================================
  getHazards(): HazardEvent[] {
    return storage.get<HazardEvent[]>(KEYS.HAZARDS, SEED_DATA.hazards);
  }

  getHazard(id: string): HazardEvent | null {
    return this.getHazards().find((h) => h.id === id) || null;
  }

  getActiveHazards(): HazardEvent[] {
    return this.getHazards().filter((h) => h.status !== 'resolved');
  }

  injectHazard(partial: Partial<HazardEvent>): HazardEvent {
    const hazard: HazardEvent = {
      id: uid('hzd'),
      organizationId: SEED_DATA.organization.id,
      type: partial.type || 'landslide',
      severity: partial.severity || 'high',
      title: partial.title || 'New hazard detected',
      description: partial.description || 'A new hazard has been reported on the route.',
      location: partial.location || { type: 'Point', coordinates: [85.405, 27.668] },
      affectedRadius: partial.affectedRadius || 0.3,
      reportedBy: partial.reportedBy || 'system',
      reportedAt: new Date().toISOString(),
      status: 'reported',
      affectedRoutes: partial.affectedRoutes || [],
      affectedTrips: partial.affectedTrips || [],
    };

    const hazards = this.getHazards();
    hazards.push(hazard);
    storage.set(KEYS.HAZARDS, hazards);

    // Create alert for the hazard
    const alert: Alert = {
      id: uid('alt'),
      organizationId: SEED_DATA.organization.id,
      priority: hazard.severity === 'critical' ? 'critical' : 'high',
      category: 'hazard',
      title: `New ${hazard.type} — ${hazard.title}`,
      message: hazard.description,
      hazardId: hazard.id,
      timestamp: new Date().toISOString(),
      read: false,
      dismissed: false,
      duplicateCount: 0,
      mergedAlertIds: [],
      actionRequired: true,
      actionLabel: 'Review hazard',
    };

    const alerts = this.getAlerts();
    alerts.unshift(alert);
    storage.set(KEYS.ALERTS, alerts);

    // Notify alert subscribers
    this.alertCallbacks.forEach((cb) => cb(alert));

    // Update affected trips' risk scores
    this.recalculateRisks(hazard);

    return hazard;
  }

  private recalculateRisks(hazard: HazardEvent): void {
    const trips = this.getTrips();
    let changed = false;

    trips.forEach((trip) => {
      if (['completed', 'cancelled'].includes(trip.status)) return;

      const route = this.getRoute(trip.routeId);
      if (!route) return;

      // Check if hazard is near any route coordinate
      const isNearRoute = route.geometry.coordinates.some((coord) => {
        const dist = Math.sqrt(
          Math.pow(coord[0] - hazard.location.coordinates[0], 2) +
          Math.pow(coord[1] - hazard.location.coordinates[1], 2)
        );
        return dist < 0.02; // roughly ~2km
      });

      if (isNearRoute) {
        const oldScore = trip.riskScore;
        const increase = hazard.severity === 'critical' ? 30 : hazard.severity === 'high' ? 20 : 10;
        trip.riskScore = Math.min(100, trip.riskScore + increase);
        trip.riskLevel = trip.riskScore > 75 ? 'critical' : trip.riskScore > 50 ? 'high' : trip.riskScore > 30 ? 'medium' : 'low';
        if (trip.riskScore > 60 && trip.status === 'en_route') {
          trip.status = 'at_risk';
        }
        trip.updatedAt = new Date().toISOString();

        trip.events.push({
          id: uid('evt'),
          tripId: trip.id,
          type: 'hazard_detected',
          timestamp: new Date().toISOString(),
          description: `Risk score changed: ${oldScore} → ${trip.riskScore} due to ${hazard.type}`,
          location: hazard.location,
        });

        changed = true;
        this.tripCallbacks.forEach((cb) => cb(trip));
      }
    });

    if (changed) {
      storage.set(KEYS.TRIPS, trips);
    }
  }

  // ============================================================
  // Incidents
  // ============================================================
  getIncidents(): Incident[] {
    return storage.get<Incident[]>(KEYS.INCIDENTS, SEED_DATA.incidents);
  }

  getIncident(id: string): Incident | null {
    return this.getIncidents().find((i) => i.id === id) || null;
  }

  reportIncident(payload: ReportIncidentPayload): Incident {
    const incident: Incident = {
      id: uid('inc'),
      organizationId: SEED_DATA.organization.id,
      tripId: payload.tripId,
      driverId: payload.driverId,
      category: payload.category,
      severity: payload.severity,
      title: payload.title,
      description: payload.description,
      location: payload.location,
      timestamp: new Date().toISOString(),
      status: 'submitted',
    };

    const incidents = this.getIncidents();
    incidents.push(incident);
    storage.set(KEYS.INCIDENTS, incidents);

    // If offline, queue for sync
    if (!this.isOnline()) {
      this.addToSyncQueue({
        type: 'incident_report',
        payload: incident as unknown as Record<string, unknown>,
      });
    }

    return incident;
  }

  // ============================================================
  // Alerts
  // ============================================================
  getAlerts(): Alert[] {
    return storage.get<Alert[]>(KEYS.ALERTS, SEED_DATA.alerts);
  }

  getUnreadAlerts(): Alert[] {
    return this.getAlerts().filter((a) => !a.read && !a.dismissed);
  }

  markAlertRead(id: string): void {
    const alerts = this.getAlerts();
    const idx = alerts.findIndex((a) => a.id === id);
    if (idx >= 0) {
      alerts[idx].read = true;
      storage.set(KEYS.ALERTS, alerts);
    }
  }

  dismissAlert(id: string): void {
    const alerts = this.getAlerts();
    const idx = alerts.findIndex((a) => a.id === id);
    if (idx >= 0) {
      alerts[idx].dismissed = true;
      storage.set(KEYS.ALERTS, alerts);
    }
  }

  // ============================================================
  // Hubs
  // ============================================================
  getHubs(): Hub[] {
    return storage.get<Hub[]>(KEYS.HUBS, SEED_DATA.hubs);
  }

  // ============================================================
  // Realtime Subscriptions
  // ============================================================
  subscribeToDriverLocations(callback: (locations: DriverLocation[]) => void): Subscription {
    this.locationCallbacks.push(callback);
    return {
      unsubscribe: () => {
        this.locationCallbacks = this.locationCallbacks.filter((cb) => cb !== callback);
      },
    };
  }

  subscribeToAlerts(callback: (alert: Alert) => void): Subscription {
    this.alertCallbacks.push(callback);
    return {
      unsubscribe: () => {
        this.alertCallbacks = this.alertCallbacks.filter((cb) => cb !== callback);
      },
    };
  }

  subscribeToTripUpdates(callback: (trip: Trip) => void): Subscription {
    this.tripCallbacks.push(callback);
    return {
      unsubscribe: () => {
        this.tripCallbacks = this.tripCallbacks.filter((cb) => cb !== callback);
      },
    };
  }

  // ============================================================
  // Simulation
  // ============================================================
  startSimulation(): void {
    // Driver location updates every 3 seconds
    const locInterval = window.setInterval(() => {
      if (!this.isOnline()) return;

      this.simulationTick++;
      const trips = this.getActiveTrips();
      const drivers = this.getDrivers();
      const locations: DriverLocation[] = [];

      trips.forEach((trip) => {
        const route = this.getRoute(trip.routeId);
        if (!route || trip.status === 'planned') return;

        const routeCoords = route.geometry.coordinates;
        if (routeCoords.length < 2) return;

        // Calculate position along route based on progress
        const totalSegments = routeCoords.length - 1;
        const progressFloat = (trip.currentProgress / 100) * totalSegments;
        const segIdx = Math.min(Math.floor(progressFloat), totalSegments - 1);
        const segProgress = progressFloat - segIdx;

        const currentPos = interpolatePoint(
          routeCoords[segIdx],
          routeCoords[Math.min(segIdx + 1, totalSegments)],
          segProgress
        );

        // Calculate heading
        const nextIdx = Math.min(segIdx + 1, totalSegments);
        const dx = routeCoords[nextIdx][0] - routeCoords[segIdx][0];
        const dy = routeCoords[nextIdx][1] - routeCoords[segIdx][1];
        const heading = (Math.atan2(dx, dy) * 180) / Math.PI;

        const location: DriverLocation = {
          driverId: trip.driverId,
          tripId: trip.id,
          location: { type: 'Point', coordinates: currentPos },
          heading: heading,
          speed: 25 + Math.random() * 15,
          elevation: 1900 + Math.sin(trip.currentProgress / 10) * 500,
          timestamp: new Date().toISOString(),
          accuracy: 5 + Math.random() * 10,
        };

        locations.push(location);

        // Update driver's current location
        const driverIdx = drivers.findIndex((d) => d.id === trip.driverId);
        if (driverIdx >= 0) {
          drivers[driverIdx].currentLocation = location.location;
        }
      });

      storage.set(KEYS.DRIVERS, drivers);
      storage.set(KEYS.DRIVER_LOCATIONS, locations);

      // Advance trip progress slowly
      const allTrips = this.getTrips();
      let tripsChanged = false;
      allTrips.forEach((trip) => {
        if (trip.status === 'en_route' || trip.status === 'delayed' || trip.status === 'at_risk') {
          trip.currentProgress = Math.min(100, trip.currentProgress + 0.3 + Math.random() * 0.2);
          trip.updatedAt = new Date().toISOString();

          if (trip.currentProgress >= 100) {
            trip.status = 'completed';
            trip.completedAt = new Date().toISOString();
            trip.events.push({
              id: uid('evt'),
              tripId: trip.id,
              type: 'arrived',
              timestamp: new Date().toISOString(),
              description: `Arrived at ${trip.destination.name}`,
              location: trip.destination.location,
            });
          }
          tripsChanged = true;
        }
      });
      if (tripsChanged) {
        storage.set(KEYS.TRIPS, allTrips);
      }

      // Notify location subscribers
      if (locations.length > 0) {
        this.locationCallbacks.forEach((cb) => cb(locations));
      }
    }, 3000) as unknown as number;

    this.intervals.push(locInterval);
  }

  stopSimulation(): void {
    this.intervals.forEach((id) => window.clearInterval(id));
    this.intervals = [];
  }

  // ============================================================
  // Offline / Sync
  // ============================================================
  getSyncQueue(): SyncEvent[] {
    return storage.get<SyncEvent[]>(KEYS.SYNC_QUEUE, []);
  }

  addToSyncQueue(event: Omit<SyncEvent, 'id' | 'createdAt' | 'status' | 'retryCount'>): SyncEvent {
    const syncEvent: SyncEvent = {
      id: uid('sync'),
      ...event,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    const queue = this.getSyncQueue();
    queue.push(syncEvent);
    storage.set(KEYS.SYNC_QUEUE, queue);
    return syncEvent;
  }

  async processSyncQueue(): Promise<SyncEvent[]> {
    const queue = this.getSyncQueue();
    const processed: SyncEvent[] = [];

    for (const event of queue) {
      if (event.status === 'synced') continue;

      event.status = 'syncing';
      storage.set(KEYS.SYNC_QUEUE, queue);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));

      event.status = 'synced';
      event.syncedAt = new Date().toISOString();
      processed.push(event);

      storage.set(KEYS.SYNC_QUEUE, queue);
    }

    // Clear synced items after a delay
    setTimeout(() => {
      const currentQueue = this.getSyncQueue();
      const remaining = currentQueue.filter((e) => e.status !== 'synced');
      storage.set(KEYS.SYNC_QUEUE, remaining);
    }, 2000);

    return processed;
  }

  isOnline(): boolean {
    return storage.get<boolean>(KEYS.ONLINE, true);
  }

  setOnline(online: boolean): void {
    storage.set(KEYS.ONLINE, online);
    if (online) {
      // Auto-process sync queue on reconnect
      this.processSyncQueue();
    }
  }
}

// ============================================================
// Singleton instance
// ============================================================
let instance: MockClient | null = null;

export function getMockClient(): DataClient {
  if (!instance) {
    instance = new MockClient();
  }
  return instance;
}
