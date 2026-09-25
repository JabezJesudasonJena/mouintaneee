// ============================================================
// MountainRoute — Core Data Types
// All geospatial data modeled as GeoJSON for PostGIS compatibility
// ============================================================

export type GeoPoint = {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
};

export type GeoLineString = {
  type: 'LineString';
  coordinates: [number, number][]; // array of [lng, lat]
};

export type GeoPolygon = {
  type: 'Polygon';
  coordinates: [number, number][][];
};

// ============================================================
// Organizations & Users
// ============================================================

export interface Organization {
  id: string;
  name: string;
  region: string;
  createdAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: 'admin' | 'ops_manager' | 'driver';
  avatarUrl?: string;
  createdAt: string;
}

// ============================================================
// Drivers & Vehicles
// ============================================================

export interface Driver {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  phone: string;
  licenseClass: string;
  status: 'available' | 'on_trip' | 'off_duty' | 'unavailable';
  currentLocation?: GeoPoint;
  avatarUrl?: string;
  rating: number; // 1-5
  totalTrips: number;
  createdAt: string;
}

export type VehicleType = 'small_truck' | 'medium_truck' | 'large_truck' | 'van' | 'pickup';

export interface Vehicle {
  id: string;
  organizationId: string;
  name: string;
  type: VehicleType;
  plateNumber: string;
  maxWeightKg: number;
  maxVolumeCbm: number;
  fuelType: 'diesel' | 'petrol' | 'electric' | 'hybrid';
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  currentLocation?: GeoPoint;
  terrainCapability: ('paved' | 'gravel' | 'dirt' | 'mountain')[];
  createdAt: string;
}

// ============================================================
// Shipments
// ============================================================

export type ShipmentPriority = 'standard' | 'express' | 'urgent' | 'critical';
export type SpecialHandling = 'fragile' | 'temperature_controlled' | 'hazmat' | 'livestock' | 'perishable';

export interface Shipment {
  id: string;
  organizationId: string;
  origin: {
    name: string;
    location: GeoPoint;
  };
  destination: {
    name: string;
    location: GeoPoint;
  };
  cargo: {
    description: string;
    weightKg: number;
    volumeCbm: number;
    specialHandling: SpecialHandling[];
  };
  priority: ShipmentPriority;
  deadline: string; // ISO datetime
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
  tripId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Routes & Segments
// ============================================================

export type TerrainType = 'paved' | 'gravel' | 'dirt' | 'mountain_pass' | 'bridge' | 'tunnel';

export interface RouteSegment {
  id: string;
  routeId: string;
  order: number;
  geometry: GeoLineString;
  distanceKm: number;
  estimatedMinutes: number;
  terrainType: TerrainType;
  elevationGain: number; // meters
  elevationLoss: number; // meters
  maxGrade: number; // percentage
  surfaceCondition: 'good' | 'fair' | 'poor' | 'impassable';
  riskFactors: string[];
}

export interface Route {
  id: string;
  name: string;
  geometry: GeoLineString;
  segments: RouteSegment[];
  totalDistanceKm: number;
  estimatedMinutes: number;
  totalElevationGain: number;
  totalElevationLoss: number;
  maxElevation: number;
  minElevation: number;
  riskScore: number; // 0-100
  riskBreakdown: {
    terrain: number;
    weather: number;
    hazard: number;
    historical: number;
  };
  isRecommended: boolean;
  comparisonNotes?: string[]; // "+20 min but avoids landslide zone"
}

// ============================================================
// Trips
// ============================================================

export type TripStatus = 'planned' | 'en_route' | 'delayed' | 'at_risk' | 'completed' | 'cancelled';

export interface Trip {
  id: string;
  organizationId: string;
  shipmentId: string;
  driverId: string;
  vehicleId: string;
  routeId: string;
  alternateRouteId?: string;
  origin: {
    name: string;
    location: GeoPoint;
  };
  destination: {
    name: string;
    location: GeoPoint;
  };
  status: TripStatus;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  eta: string; // ISO datetime
  originalEta: string; // ISO datetime
  departedAt?: string;
  completedAt?: string;
  currentProgress: number; // 0-100 percentage
  events: TripEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface TripEvent {
  id: string;
  tripId: string;
  type: 'departed' | 'checkpoint' | 'hazard_detected' | 'route_changed' | 'delay' | 'incident' | 'arrived' | 'alert';
  timestamp: string;
  description: string;
  location?: GeoPoint;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Hazard Events
// ============================================================

export type HazardType = 'landslide' | 'flooding' | 'road_damage' | 'snow_ice' | 'rockfall' | 'bridge_damage' | 'road_closure' | 'weather_severe';
export type HazardSeverity = 'low' | 'moderate' | 'high' | 'critical';

export interface HazardEvent {
  id: string;
  organizationId: string;
  type: HazardType;
  severity: HazardSeverity;
  title: string;
  description: string;
  location: GeoPoint;
  affectedRadius: number; // km
  affectedArea?: GeoPolygon;
  reportedBy: string; // driver ID or 'system'
  reportedAt: string;
  confirmedAt?: string;
  resolvedAt?: string;
  status: 'reported' | 'confirmed' | 'monitoring' | 'resolved';
  affectedRoutes: string[]; // route IDs
  affectedTrips: string[]; // trip IDs
}

// ============================================================
// Incidents (driver-reported)
// ============================================================

export type IncidentCategory = 'road_blockage' | 'vehicle_breakdown' | 'accident' | 'weather_hazard' | 'security_concern' | 'infrastructure_damage' | 'other';

export interface Incident {
  id: string;
  organizationId: string;
  tripId?: string;
  driverId: string;
  category: IncidentCategory;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  title: string;
  description: string;
  location: GeoPoint;
  timestamp: string;
  photoUrls?: string[];
  status: 'submitted' | 'acknowledged' | 'investigating' | 'resolved';
  clusterGroupId?: string; // for proximity-based clustering
}

// ============================================================
// Driver Location (realtime)
// ============================================================

export interface DriverLocation {
  driverId: string;
  tripId: string;
  location: GeoPoint;
  heading: number; // degrees
  speed: number; // km/h
  elevation: number; // meters
  timestamp: string;
  accuracy: number; // meters
}

// ============================================================
// Alerts
// ============================================================

export type AlertPriority = 'critical' | 'high' | 'medium' | 'info';
export type AlertCategory = 'hazard' | 'delay' | 'route_change' | 'vehicle' | 'weather' | 'incident' | 'system';

export interface Alert {
  id: string;
  organizationId: string;
  priority: AlertPriority;
  category: AlertCategory;
  title: string;
  message: string;
  tripId?: string;
  driverId?: string;
  hazardId?: string;
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  duplicateCount: number; // for dedup — 0 = unique, >0 = merged
  mergedAlertIds: string[];
  actionRequired: boolean;
  actionLabel?: string;
}

// ============================================================
// Sync Events (offline queue)
// ============================================================

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncEvent {
  id: string;
  type: 'location_update' | 'incident_report' | 'trip_status_change' | 'alert_acknowledgment';
  payload: Record<string, unknown>;
  createdAt: string;
  syncedAt?: string;
  status: SyncStatus;
  retryCount: number;
}

// ============================================================
// Hub / Infrastructure Points
// ============================================================

export type HubType = 'collection_center' | 'distribution_hub' | 'fuel_station' | 'service_point' | 'market' | 'village';

export interface Hub {
  id: string;
  name: string;
  type: HubType;
  location: GeoPoint;
  services: string[];
}

// ============================================================
// Elevation Profile Data Point
// ============================================================

export interface ElevationPoint {
  distanceKm: number;
  elevation: number; // meters
  grade: number; // percentage
  terrainType: TerrainType;
}
