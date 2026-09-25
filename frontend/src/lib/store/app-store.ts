// ============================================================
// Global Zustand store — thin wrapper around DataClient
// Manages UI state + reactive data subscriptions
// ============================================================

import { create } from 'zustand';
import type { DataClient, Subscription } from '../data/client';
import type {
  Trip,
  Driver,
  Vehicle,
  Shipment,
  Route,
  HazardEvent,
  Incident,
  Alert,
  Hub,
  DriverLocation,
  SyncEvent,
  User,
} from '../data/types';
import { getMockClient } from '../data/mock-client';

interface AppState {
  // Client reference
  client: DataClient;

  // Session
  currentUser: User | null;
  login: (role: 'ops_manager' | 'driver') => void;
  logout: () => void;

  // Data (refreshed from client)
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  shipments: Shipment[];
  routes: Route[];
  hazards: HazardEvent[];
  incidents: Incident[];
  alerts: Alert[];
  hubs: Hub[];
  driverLocations: DriverLocation[];
  syncQueue: SyncEvent[];

  // UI state
  isOnline: boolean;
  sidebarOpen: boolean;
  selectedTripId: string | null;
  mapCenter: [number, number];
  mapZoom: number;

  // Actions
  refreshData: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedTrip: (id: string | null) => void;
  setMapView: (center: [number, number], zoom: number) => void;
  toggleOnline: () => void;
  markAlertRead: (id: string) => void;
  dismissAlert: (id: string) => void;

  // Subscriptions
  _subscriptions: Subscription[];
  startRealtimeUpdates: () => void;
  stopRealtimeUpdates: () => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const client = getMockClient();

  return {
    client,

    // Session
    currentUser: null,
    login: (role) => {
      const user = client.login(role);
      set({ currentUser: user });
      get().refreshData();
      get().startRealtimeUpdates();
      client.startSimulation();
    },
    logout: () => {
      client.logout();
      client.stopSimulation();
      get().stopRealtimeUpdates();
      set({ currentUser: null });
    },

    // Data
    trips: [],
    drivers: [],
    vehicles: [],
    shipments: [],
    routes: [],
    hazards: [],
    incidents: [],
    alerts: [],
    hubs: [],
    driverLocations: [],
    syncQueue: [],

    // UI
    isOnline: true,
    sidebarOpen: true,
    selectedTripId: null,
    mapCenter: [85.400, 27.670],
    mapZoom: 12,

    refreshData: () => {
      set({
        trips: client.getTrips(),
        drivers: client.getDrivers(),
        vehicles: client.getVehicles(),
        shipments: client.getShipments(),
        routes: client.getRoutes(),
        hazards: client.getHazards(),
        incidents: client.getIncidents(),
        alerts: client.getAlerts(),
        hubs: client.getHubs(),
        syncQueue: client.getSyncQueue(),
        isOnline: client.isOnline(),
      });
    },

    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setSelectedTrip: (id) => set({ selectedTripId: id }),
    setMapView: (center, zoom) => set({ mapCenter: center, mapZoom: zoom }),

    toggleOnline: () => {
      const isOnline = !get().isOnline;
      client.setOnline(isOnline);
      set({ isOnline });
      if (isOnline) {
        // Refresh after sync
        setTimeout(() => get().refreshData(), 3000);
      }
    },

    markAlertRead: (id) => {
      client.markAlertRead(id);
      set({ alerts: client.getAlerts() });
    },

    dismissAlert: (id) => {
      client.dismissAlert(id);
      set({ alerts: client.getAlerts() });
    },

    _subscriptions: [],

    startRealtimeUpdates: () => {
      const subs: Subscription[] = [];

      subs.push(
        client.subscribeToDriverLocations((locations) => {
          set({ driverLocations: locations });
          // Also refresh trips for progress updates
          set({ trips: client.getTrips() });
        })
      );

      subs.push(
        client.subscribeToAlerts(() => {
          set({ alerts: client.getAlerts() });
        })
      );

      subs.push(
        client.subscribeToTripUpdates(() => {
          set({ trips: client.getTrips() });
        })
      );

      set({ _subscriptions: subs });
    },

    stopRealtimeUpdates: () => {
      get()._subscriptions.forEach((sub) => sub.unsubscribe());
      set({ _subscriptions: [] });
    },
  };
});
