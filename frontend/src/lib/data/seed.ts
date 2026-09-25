// ============================================================
// Seed Data — deterministic mock data generator
// Based on PRD's "Killer Demo Scenario":
// Remote Village → Collection Center → Mountain Road → Regional Market
// 800kg cargo, small truck, 14:00 deadline
// Route A: high-risk (shorter, mountain pass)
// Route B: low-risk (longer, valley road)
// ============================================================

import type {
  Organization,
  User,
  Driver,
  Vehicle,
  Shipment,
  Trip,
  Route,
  RouteSegment,
  HazardEvent,
  Incident,
  Alert,
  Hub,
  GeoPoint,
  ElevationPoint,
  TripEvent,
} from './types';

// ============================================================
// Helper — deterministic IDs
// ============================================================
const id = (prefix: string, n: number) => `${prefix}_${String(n).padStart(3, '0')}`;

// Coordinates roughly modeled on a fictional mountain region
// (loosely based on Nepal/Bhutan terrain for realism)
const coords = {
  remoteVillage: [85.324, 27.717] as [number, number],
  collectionCenter: [85.362, 27.695] as [number, number],
  mountainPassPeak: [85.410, 27.672] as [number, number],
  valleyJunction: [85.385, 27.650] as [number, number],
  bridgeCrossing: [85.420, 27.640] as [number, number],
  regionalMarket: [85.460, 27.620] as [number, number],
  fuelStation: [85.390, 27.660] as [number, number],
  servicePoint: [85.440, 27.635] as [number, number],
  hazardZone: [85.405, 27.668] as [number, number],
  // Valley route waypoints (Route B)
  valleyStart: [85.350, 27.680] as [number, number],
  valleyMid: [85.400, 27.630] as [number, number],
  valleyEnd: [85.445, 27.625] as [number, number],
};

function point(c: [number, number]): GeoPoint {
  return { type: 'Point', coordinates: c };
}

// ============================================================
// Organization
// ============================================================
export const SEED_ORG: Organization = {
  id: id('org', 1),
  name: 'Highland Logistics Co.',
  region: 'Central Mountain District',
  createdAt: '2024-01-15T08:00:00Z',
};

// ============================================================
// Users
// ============================================================
export const SEED_USERS: User[] = [
  {
    id: id('usr', 1),
    organizationId: SEED_ORG.id,
    name: 'Kiran Thapa',
    email: 'kiran@highland-logistics.com',
    role: 'ops_manager',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: id('usr', 2),
    organizationId: SEED_ORG.id,
    name: 'Pemba Sherpa',
    email: 'pemba@highland-logistics.com',
    role: 'driver',
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    id: id('usr', 3),
    organizationId: SEED_ORG.id,
    name: 'Dawa Tamang',
    email: 'dawa@highland-logistics.com',
    role: 'driver',
    createdAt: '2024-02-10T08:00:00Z',
  },
  {
    id: id('usr', 4),
    organizationId: SEED_ORG.id,
    name: 'Anita Gurung',
    email: 'anita@highland-logistics.com',
    role: 'driver',
    createdAt: '2024-03-05T08:00:00Z',
  },
  {
    id: id('usr', 5),
    organizationId: SEED_ORG.id,
    name: 'Rajesh Rai',
    email: 'rajesh@highland-logistics.com',
    role: 'admin',
    createdAt: '2024-01-10T08:00:00Z',
  },
];

// ============================================================
// Drivers
// ============================================================
export const SEED_DRIVERS: Driver[] = [
  {
    id: id('drv', 1),
    organizationId: SEED_ORG.id,
    userId: id('usr', 2),
    name: 'Pemba Sherpa',
    phone: '+977-9801234567',
    licenseClass: 'B',
    status: 'on_trip',
    currentLocation: point([85.380, 27.670]),
    rating: 4.8,
    totalTrips: 142,
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    id: id('drv', 2),
    organizationId: SEED_ORG.id,
    userId: id('usr', 3),
    name: 'Dawa Tamang',
    phone: '+977-9807654321',
    licenseClass: 'C',
    status: 'on_trip',
    currentLocation: point([85.400, 27.640]),
    rating: 4.5,
    totalTrips: 98,
    createdAt: '2024-02-10T08:00:00Z',
  },
  {
    id: id('drv', 3),
    organizationId: SEED_ORG.id,
    userId: id('usr', 4),
    name: 'Anita Gurung',
    phone: '+977-9812345678',
    licenseClass: 'B',
    status: 'available',
    currentLocation: point(coords.collectionCenter),
    rating: 4.9,
    totalTrips: 67,
    createdAt: '2024-03-05T08:00:00Z',
  },
];

// ============================================================
// Vehicles
// ============================================================
export const SEED_VEHICLES: Vehicle[] = [
  {
    id: id('veh', 1),
    organizationId: SEED_ORG.id,
    name: 'Tata 407 — Mountain Runner',
    type: 'small_truck',
    plateNumber: 'BA 1 KHA 2345',
    maxWeightKg: 2500,
    maxVolumeCbm: 12,
    fuelType: 'diesel',
    status: 'in_use',
    terrainCapability: ['paved', 'gravel', 'dirt', 'mountain'],
    createdAt: '2024-01-20T08:00:00Z',
  },
  {
    id: id('veh', 2),
    organizationId: SEED_ORG.id,
    name: 'Mahindra Bolero Pickup',
    type: 'pickup',
    plateNumber: 'BA 2 KHA 5678',
    maxWeightKg: 1000,
    maxVolumeCbm: 4,
    fuelType: 'diesel',
    status: 'in_use',
    terrainCapability: ['paved', 'gravel', 'dirt'],
    createdAt: '2024-01-25T08:00:00Z',
  },
  {
    id: id('veh', 3),
    organizationId: SEED_ORG.id,
    name: 'Eicher 10.59 — Heavy Hauler',
    type: 'medium_truck',
    plateNumber: 'BA 3 KHA 9012',
    maxWeightKg: 5000,
    maxVolumeCbm: 20,
    fuelType: 'diesel',
    status: 'available',
    terrainCapability: ['paved', 'gravel'],
    createdAt: '2024-02-15T08:00:00Z',
  },
  {
    id: id('veh', 4),
    organizationId: SEED_ORG.id,
    name: 'Tata Ace — Light Express',
    type: 'van',
    plateNumber: 'BA 4 KHA 3456',
    maxWeightKg: 750,
    maxVolumeCbm: 3,
    fuelType: 'petrol',
    status: 'available',
    terrainCapability: ['paved', 'gravel'],
    createdAt: '2024-03-01T08:00:00Z',
  },
];

// ============================================================
// Route A — Mountain Pass (shorter, high-risk)
// ============================================================
const routeASegments: RouteSegment[] = [
  {
    id: id('seg', 1),
    routeId: id('rte', 1),
    order: 0,
    geometry: {
      type: 'LineString',
      coordinates: [coords.collectionCenter, [85.375, 27.688], [85.390, 27.682]],
    },
    distanceKm: 3.2,
    estimatedMinutes: 12,
    terrainType: 'paved',
    elevationGain: 120,
    elevationLoss: 20,
    maxGrade: 6,
    surfaceCondition: 'good',
    riskFactors: [],
  },
  {
    id: id('seg', 2),
    routeId: id('rte', 1),
    order: 1,
    geometry: {
      type: 'LineString',
      coordinates: [[85.390, 27.682], [85.398, 27.678], coords.mountainPassPeak],
    },
    distanceKm: 4.1,
    estimatedMinutes: 25,
    terrainType: 'mountain_pass',
    elevationGain: 580,
    elevationLoss: 40,
    maxGrade: 18,
    surfaceCondition: 'fair',
    riskFactors: ['steep_grade', 'narrow_road', 'rockfall_zone'],
  },
  {
    id: id('seg', 3),
    routeId: id('rte', 1),
    order: 2,
    geometry: {
      type: 'LineString',
      coordinates: [coords.mountainPassPeak, [85.425, 27.655], [85.440, 27.638]],
    },
    distanceKm: 5.5,
    estimatedMinutes: 20,
    terrainType: 'gravel',
    elevationGain: 30,
    elevationLoss: 490,
    maxGrade: 14,
    surfaceCondition: 'fair',
    riskFactors: ['loose_gravel', 'limited_guardrails'],
  },
  {
    id: id('seg', 4),
    routeId: id('rte', 1),
    order: 3,
    geometry: {
      type: 'LineString',
      coordinates: [[85.440, 27.638], [85.452, 27.628], coords.regionalMarket],
    },
    distanceKm: 2.8,
    estimatedMinutes: 10,
    terrainType: 'paved',
    elevationGain: 10,
    elevationLoss: 60,
    maxGrade: 3,
    surfaceCondition: 'good',
    riskFactors: [],
  },
];

const ROUTE_A: Route = {
  id: id('rte', 1),
  name: 'Mountain Pass Direct',
  geometry: {
    type: 'LineString',
    coordinates: routeASegments.flatMap((s) => s.geometry.coordinates),
  },
  segments: routeASegments,
  totalDistanceKm: 15.6,
  estimatedMinutes: 67,
  totalElevationGain: 740,
  totalElevationLoss: 610,
  maxElevation: 3420,
  minElevation: 1850,
  riskScore: 72,
  riskBreakdown: {
    terrain: 28,
    weather: 15,
    hazard: 20,
    historical: 9,
  },
  isRecommended: false,
  comparisonNotes: [
    '−23 min vs Valley Route',
    '+18% grade on mountain pass',
    'Active rockfall zone (Seg 2)',
    'No cell coverage for 4.1km',
    'Limited turnaround points',
  ],
};

// ============================================================
// Route B — Valley Road (longer, low-risk)
// ============================================================
const routeBSegments: RouteSegment[] = [
  {
    id: id('seg', 5),
    routeId: id('rte', 2),
    order: 0,
    geometry: {
      type: 'LineString',
      coordinates: [coords.collectionCenter, coords.valleyStart, [85.365, 27.665]],
    },
    distanceKm: 4.0,
    estimatedMinutes: 15,
    terrainType: 'paved',
    elevationGain: 60,
    elevationLoss: 80,
    maxGrade: 4,
    surfaceCondition: 'good',
    riskFactors: [],
  },
  {
    id: id('seg', 6),
    routeId: id('rte', 2),
    order: 1,
    geometry: {
      type: 'LineString',
      coordinates: [[85.365, 27.665], [85.380, 27.650], coords.valleyMid],
    },
    distanceKm: 5.5,
    estimatedMinutes: 22,
    terrainType: 'paved',
    elevationGain: 90,
    elevationLoss: 120,
    maxGrade: 6,
    surfaceCondition: 'good',
    riskFactors: [],
  },
  {
    id: id('seg', 7),
    routeId: id('rte', 2),
    order: 2,
    geometry: {
      type: 'LineString',
      coordinates: [coords.valleyMid, [85.415, 27.628], coords.bridgeCrossing],
    },
    distanceKm: 4.2,
    estimatedMinutes: 18,
    terrainType: 'bridge',
    elevationGain: 30,
    elevationLoss: 40,
    maxGrade: 3,
    surfaceCondition: 'good',
    riskFactors: ['single_lane_bridge'],
  },
  {
    id: id('seg', 8),
    routeId: id('rte', 2),
    order: 3,
    geometry: {
      type: 'LineString',
      coordinates: [coords.bridgeCrossing, coords.valleyEnd, coords.regionalMarket],
    },
    distanceKm: 5.0,
    estimatedMinutes: 18,
    terrainType: 'paved',
    elevationGain: 20,
    elevationLoss: 50,
    maxGrade: 2,
    surfaceCondition: 'good',
    riskFactors: [],
  },
];

const ROUTE_B: Route = {
  id: id('rte', 2),
  name: 'Valley Road Scenic',
  geometry: {
    type: 'LineString',
    coordinates: routeBSegments.flatMap((s) => s.geometry.coordinates),
  },
  segments: routeBSegments,
  totalDistanceKm: 18.7,
  estimatedMinutes: 73,
  totalElevationGain: 200,
  totalElevationLoss: 290,
  maxElevation: 2180,
  minElevation: 1850,
  riskScore: 28,
  riskBreakdown: {
    terrain: 8,
    weather: 10,
    hazard: 5,
    historical: 5,
  },
  isRecommended: true,
  comparisonNotes: [
    '+23 min vs Mountain Pass',
    'Max 6% grade (safe for loaded truck)',
    'Full cell coverage',
    'Fuel station at km 9.5',
    'Bridge crossing (single lane, 3min wait)',
  ],
};

// ============================================================
// Route C — secondary trip route
// ============================================================
const ROUTE_C: Route = {
  id: id('rte', 3),
  name: 'Eastern Ridge Supply Route',
  geometry: {
    type: 'LineString',
    coordinates: [
      [85.430, 27.710],
      [85.445, 27.700],
      [85.455, 27.685],
      [85.462, 27.670],
      [85.470, 27.655],
      [85.475, 27.640],
    ],
  },
  segments: [],
  totalDistanceKm: 12.3,
  estimatedMinutes: 55,
  totalElevationGain: 320,
  totalElevationLoss: 380,
  maxElevation: 2650,
  minElevation: 1920,
  riskScore: 45,
  riskBreakdown: {
    terrain: 15,
    weather: 12,
    hazard: 10,
    historical: 8,
  },
  isRecommended: true,
  comparisonNotes: ['Moderate terrain', 'Paved most of the way'],
};

// ============================================================
// Shipments
// ============================================================
const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

export const SEED_SHIPMENTS: Shipment[] = [
  {
    id: id('shp', 1),
    organizationId: SEED_ORG.id,
    origin: { name: 'Remote Village', location: point(coords.remoteVillage) },
    destination: { name: 'Regional Market', location: point(coords.regionalMarket) },
    cargo: {
      description: 'Fresh produce and dairy — morning market delivery',
      weightKg: 800,
      volumeCbm: 3.5,
      specialHandling: ['perishable'],
    },
    priority: 'urgent',
    deadline: hoursFromNow(3),
    status: 'in_transit',
    tripId: id('trp', 1),
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(1),
  },
  {
    id: id('shp', 2),
    organizationId: SEED_ORG.id,
    origin: { name: 'Collection Center', location: point(coords.collectionCenter) },
    destination: { name: 'Bridge Crossing Hub', location: point(coords.bridgeCrossing) },
    cargo: {
      description: 'Construction materials — bridge repair',
      weightKg: 2200,
      volumeCbm: 8,
      specialHandling: [],
    },
    priority: 'standard',
    deadline: hoursFromNow(8),
    status: 'in_transit',
    tripId: id('trp', 2),
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(2),
  },
  {
    id: id('shp', 3),
    organizationId: SEED_ORG.id,
    origin: { name: 'Regional Market', location: point(coords.regionalMarket) },
    destination: { name: 'Remote Village', location: point(coords.remoteVillage) },
    cargo: {
      description: 'Medical supplies and equipment',
      weightKg: 350,
      volumeCbm: 1.5,
      specialHandling: ['fragile', 'temperature_controlled'],
    },
    priority: 'critical',
    deadline: hoursFromNow(5),
    status: 'pending',
    createdAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
  },
];

// ============================================================
// Trips
// ============================================================
const tripEvents1: TripEvent[] = [
  {
    id: id('evt', 1),
    tripId: id('trp', 1),
    type: 'departed',
    timestamp: hoursAgo(2),
    description: 'Departed Collection Center',
    location: point(coords.collectionCenter),
  },
  {
    id: id('evt', 2),
    tripId: id('trp', 1),
    type: 'checkpoint',
    timestamp: hoursAgo(1.5),
    description: 'Passed valley junction — road conditions good',
    location: point(coords.valleyJunction),
  },
  {
    id: id('evt', 3),
    tripId: id('trp', 1),
    type: 'checkpoint',
    timestamp: hoursAgo(0.5),
    description: 'Approaching fuel station area',
    location: point(coords.fuelStation),
  },
];

const tripEvents2: TripEvent[] = [
  {
    id: id('evt', 4),
    tripId: id('trp', 2),
    type: 'departed',
    timestamp: hoursAgo(3),
    description: 'Departed Collection Center via Eastern Ridge',
    location: point(coords.collectionCenter),
  },
  {
    id: id('evt', 5),
    tripId: id('trp', 2),
    type: 'delay',
    timestamp: hoursAgo(1),
    description: 'Slow traffic on ridge road — 15min delay expected',
  },
];

export const SEED_TRIPS: Trip[] = [
  {
    id: id('trp', 1),
    organizationId: SEED_ORG.id,
    shipmentId: id('shp', 1),
    driverId: id('drv', 1),
    vehicleId: id('veh', 1),
    routeId: id('rte', 2), // Taking the safe valley route
    alternateRouteId: id('rte', 1),
    origin: { name: 'Collection Center', location: point(coords.collectionCenter) },
    destination: { name: 'Regional Market', location: point(coords.regionalMarket) },
    status: 'en_route',
    riskLevel: 'medium',
    riskScore: 35,
    eta: hoursFromNow(1.5),
    originalEta: hoursFromNow(1),
    departedAt: hoursAgo(2),
    currentProgress: 55,
    events: tripEvents1,
    createdAt: hoursAgo(5),
    updatedAt: new Date().toISOString(),
  },
  {
    id: id('trp', 2),
    organizationId: SEED_ORG.id,
    shipmentId: id('shp', 2),
    driverId: id('drv', 2),
    vehicleId: id('veh', 2),
    routeId: id('rte', 3),
    origin: { name: 'Collection Center', location: point(coords.collectionCenter) },
    destination: { name: 'Bridge Crossing Hub', location: point(coords.bridgeCrossing) },
    status: 'delayed',
    riskLevel: 'high',
    riskScore: 62,
    eta: hoursFromNow(2.5),
    originalEta: hoursFromNow(1.5),
    departedAt: hoursAgo(3),
    currentProgress: 40,
    events: tripEvents2,
    createdAt: hoursAgo(4),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================
// Hazard Events
// ============================================================
export const SEED_HAZARDS: HazardEvent[] = [
  {
    id: id('hzd', 1),
    organizationId: SEED_ORG.id,
    type: 'rockfall',
    severity: 'high',
    title: 'Rockfall on Mountain Pass — Km 7.2',
    description: 'Active rockfall zone blocking outer lane. Single-lane passage possible with caution. Road crews notified.',
    location: point(coords.hazardZone),
    affectedRadius: 0.5,
    reportedBy: id('drv', 2),
    reportedAt: hoursAgo(6),
    confirmedAt: hoursAgo(5),
    status: 'confirmed',
    affectedRoutes: [id('rte', 1)],
    affectedTrips: [],
  },
];

// ============================================================
// Incidents
// ============================================================
export const SEED_INCIDENTS: Incident[] = [
  {
    id: id('inc', 1),
    organizationId: SEED_ORG.id,
    tripId: id('trp', 2),
    driverId: id('drv', 2),
    category: 'road_blockage',
    severity: 'moderate',
    title: 'Fallen tree partially blocking Eastern Ridge road',
    description: 'Large tree fell across half the road at KM 5.3 on Eastern Ridge. Passable on left side with care. Branches cleared enough for small vehicles.',
    location: point([85.455, 27.685]),
    timestamp: hoursAgo(1.5),
    status: 'acknowledged',
  },
];

// ============================================================
// Alerts
// ============================================================
export const SEED_ALERTS: Alert[] = [
  {
    id: id('alt', 1),
    organizationId: SEED_ORG.id,
    priority: 'high',
    category: 'hazard',
    title: 'Rockfall warning — Mountain Pass route',
    message: 'Active rockfall detected at KM 7.2 on Mountain Pass Direct. Route risk score elevated to 72. Consider Valley Road alternative for upcoming trips.',
    hazardId: id('hzd', 1),
    timestamp: hoursAgo(5),
    read: false,
    dismissed: false,
    duplicateCount: 2,
    mergedAlertIds: [id('alt', 10), id('alt', 11)],
    actionRequired: true,
    actionLabel: 'Review routes',
  },
  {
    id: id('alt', 2),
    organizationId: SEED_ORG.id,
    priority: 'medium',
    category: 'delay',
    title: 'Trip TRP-002 delayed — Eastern Ridge traffic',
    message: 'Dawa Tamang\'s trip to Bridge Crossing Hub is running ~15 minutes behind schedule due to slow traffic on ridge road.',
    tripId: id('trp', 2),
    driverId: id('drv', 2),
    timestamp: hoursAgo(1),
    read: false,
    dismissed: false,
    duplicateCount: 0,
    mergedAlertIds: [],
    actionRequired: false,
  },
  {
    id: id('alt', 3),
    organizationId: SEED_ORG.id,
    priority: 'info',
    category: 'weather',
    title: 'Weather advisory — afternoon rain expected',
    message: 'Light to moderate rain expected between 14:00–18:00 across the Central Mountain District. Road conditions may deteriorate on unpaved sections.',
    timestamp: hoursAgo(3),
    read: true,
    dismissed: false,
    duplicateCount: 0,
    mergedAlertIds: [],
    actionRequired: false,
  },
  {
    id: id('alt', 4),
    organizationId: SEED_ORG.id,
    priority: 'critical',
    category: 'incident',
    title: 'Tree blocking Eastern Ridge road',
    message: 'Driver-reported: fallen tree partially blocking road at KM 5.3 on Eastern Ridge. Vehicles can pass with caution. Road crew dispatched.',
    tripId: id('trp', 2),
    driverId: id('drv', 2),
    timestamp: hoursAgo(1.5),
    read: false,
    dismissed: false,
    duplicateCount: 3,
    mergedAlertIds: [id('alt', 12), id('alt', 13), id('alt', 14)],
    actionRequired: true,
    actionLabel: 'View incident',
  },
];

// ============================================================
// Hubs & Infrastructure
// ============================================================
export const SEED_HUBS: Hub[] = [
  {
    id: id('hub', 1),
    name: 'Remote Village',
    type: 'village',
    location: point(coords.remoteVillage),
    services: ['collection'],
  },
  {
    id: id('hub', 2),
    name: 'Collection Center',
    type: 'collection_center',
    location: point(coords.collectionCenter),
    services: ['storage', 'sorting', 'loading'],
  },
  {
    id: id('hub', 3),
    name: 'Regional Market',
    type: 'market',
    location: point(coords.regionalMarket),
    services: ['distribution', 'cold_storage', 'retail'],
  },
  {
    id: id('hub', 4),
    name: 'Mountain Fuel Station',
    type: 'fuel_station',
    location: point(coords.fuelStation),
    services: ['diesel', 'petrol', 'water', 'basic_repair'],
  },
  {
    id: id('hub', 5),
    name: 'Bridge Crossing Service Point',
    type: 'service_point',
    location: point(coords.servicePoint),
    services: ['repair', 'towing', 'emergency'],
  },
  {
    id: id('hub', 6),
    name: 'Bridge Crossing Hub',
    type: 'distribution_hub',
    location: point(coords.bridgeCrossing),
    services: ['transfer', 'storage'],
  },
];

// ============================================================
// Elevation profile data for Route A
// ============================================================
export const ROUTE_A_ELEVATION: ElevationPoint[] = [
  { distanceKm: 0, elevation: 1900, grade: 2, terrainType: 'paved' },
  { distanceKm: 1, elevation: 1940, grade: 4, terrainType: 'paved' },
  { distanceKm: 2, elevation: 1990, grade: 5, terrainType: 'paved' },
  { distanceKm: 3, elevation: 2050, grade: 6, terrainType: 'paved' },
  { distanceKm: 4, elevation: 2280, grade: 12, terrainType: 'mountain_pass' },
  { distanceKm: 5, elevation: 2650, grade: 16, terrainType: 'mountain_pass' },
  { distanceKm: 6, elevation: 3020, grade: 18, terrainType: 'mountain_pass' },
  { distanceKm: 7, elevation: 3320, grade: 15, terrainType: 'mountain_pass' },
  { distanceKm: 8, elevation: 3420, grade: 2, terrainType: 'mountain_pass' },
  { distanceKm: 9, elevation: 3200, grade: -12, terrainType: 'gravel' },
  { distanceKm: 10, elevation: 2900, grade: -14, terrainType: 'gravel' },
  { distanceKm: 11, elevation: 2620, grade: -13, terrainType: 'gravel' },
  { distanceKm: 12, elevation: 2350, grade: -11, terrainType: 'gravel' },
  { distanceKm: 13, elevation: 2100, grade: -8, terrainType: 'paved' },
  { distanceKm: 14, elevation: 1960, grade: -5, terrainType: 'paved' },
  { distanceKm: 15, elevation: 1870, grade: -3, terrainType: 'paved' },
  { distanceKm: 15.6, elevation: 1850, grade: -1, terrainType: 'paved' },
];

// ============================================================
// Elevation profile data for Route B
// ============================================================
export const ROUTE_B_ELEVATION: ElevationPoint[] = [
  { distanceKm: 0, elevation: 1900, grade: 1, terrainType: 'paved' },
  { distanceKm: 2, elevation: 1920, grade: 2, terrainType: 'paved' },
  { distanceKm: 4, elevation: 1880, grade: -2, terrainType: 'paved' },
  { distanceKm: 6, elevation: 1950, grade: 4, terrainType: 'paved' },
  { distanceKm: 8, elevation: 2060, grade: 6, terrainType: 'paved' },
  { distanceKm: 10, elevation: 2180, grade: 5, terrainType: 'paved' },
  { distanceKm: 12, elevation: 2100, grade: -4, terrainType: 'bridge' },
  { distanceKm: 14, elevation: 2020, grade: -3, terrainType: 'paved' },
  { distanceKm: 16, elevation: 1940, grade: -3, terrainType: 'paved' },
  { distanceKm: 18, elevation: 1870, grade: -2, terrainType: 'paved' },
  { distanceKm: 18.7, elevation: 1850, grade: -1, terrainType: 'paved' },
];

// ============================================================
// All seed data as a single export
// ============================================================
export const SEED_DATA = {
  organization: SEED_ORG,
  users: SEED_USERS,
  drivers: SEED_DRIVERS,
  vehicles: SEED_VEHICLES,
  shipments: SEED_SHIPMENTS,
  trips: SEED_TRIPS,
  routes: [ROUTE_A, ROUTE_B, ROUTE_C],
  hazards: SEED_HAZARDS,
  incidents: SEED_INCIDENTS,
  alerts: SEED_ALERTS,
  hubs: SEED_HUBS,
  elevationProfiles: {
    [ROUTE_A.id]: ROUTE_A_ELEVATION,
    [ROUTE_B.id]: ROUTE_B_ELEVATION,
  },
};
