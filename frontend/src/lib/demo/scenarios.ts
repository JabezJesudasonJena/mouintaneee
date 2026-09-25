import { SEED_DATA } from '@/lib/data/seed';
import type { Scenario, DemoState } from './simulation-engine';

function createBaseState(): Omit<DemoState, 'narrative' | 'isComplete'> {
  // Use route 1 (Valley Road) and route 2 (High Pass)
  const routeA = SEED_DATA.routes[0];
  const routeB = SEED_DATA.routes[1];

  return {
    routes: [{ ...routeA, riskScore: 25 }, { ...routeB, riskScore: 40 }],
    hazards: [],
    alerts: [],
    driverLocations: [],
    activeRouteId: routeA.id,
  };
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'landslide-ahead',
    name: 'Landslide Ahead',
    description: 'En route mid-trip, landslide reported 1.2km ahead. System recalculates risk and reroutes.',
    initialState: createBaseState(),
    events: [
      {
        progressThreshold: 5,
        narrative: 'Truck departs carrying critical supplies via the primary Valley route.',
        action: (state) => state,
      },
      {
        progressThreshold: 35,
        narrative: 'Landslide reported 1.2km ahead. Without MountainRoute, the driver finds out on arrival.',
        action: (state) => {
          const loc = state.routes[0].geometry.coordinates[Math.floor(state.routes[0].geometry.coordinates.length * 0.45)] as [number, number];
          return {
            ...state,
            hazards: [
              {
                id: 'haz_demo_1',
                type: 'landslide',
                severity: 'critical',
                title: 'Landslide Detected',
                description: 'Major landslide blocking Valley Road.',
                location: { type: 'Point', coordinates: loc },
                affectedRadius: 2,
                affectedRoutes: [state.routes[0].id],
                reportedAt: new Date().toISOString(),
                status: 'confirmed',
                organizationId: 'demo',
                reportedBy: 'system',
                affectedTrips: [],
              },
            ],
            alerts: [
              {
                id: 'alt_demo_1',
                category: 'hazard',
                priority: 'critical',
                title: 'Critical: Landslide Ahead',
                message: 'Landslide blocking active route. Recalculating risk.',
                timestamp: new Date().toISOString(),
                read: false,
                dismissed: false,
                duplicateCount: 0,
                organizationId: 'demo',
                mergedAlertIds: [],
                actionRequired: false,
              },
            ],
          };
        },
      },
      {
        progressThreshold: 36,
        narrative: 'Recalculating route risk now.',
        action: (state) => {
          const r0 = { ...state.routes[0], riskScore: 92, comparisonNotes: ['- Blocked by landslide', '- Severe delay'] };
          const r1 = { ...state.routes[1], comparisonNotes: ['+ Clear path', '+ Adds 22 mins', 'Safe alternative'], isRecommended: true };
          return {
            ...state,
            routes: [r0, r1],
          };
        },
      },
      {
        progressThreshold: 38,
        narrative: 'System recommends alternate High Pass route. Driver accepts.',
        action: (state) => {
          return {
            ...state,
            activeRouteId: state.routes[1].id,
            alerts: [
              {
                id: 'alt_demo_2',
                category: 'route_change',
                priority: 'info',
                title: 'Route Updated',
                message: 'Rerouted to High Pass. Delivery deadline still met.',
                timestamp: new Date().toISOString(),
                read: false,
                dismissed: false,
                duplicateCount: 0,
                organizationId: 'demo',
                mergedAlertIds: [],
                actionRequired: false,
              },
              ...state.alerts,
            ],
          };
        },
      },
      {
        progressThreshold: 80,
        narrative: 'Driver safely bypassing the hazard area via alternate route.',
        action: (state) => state,
      },
    ],
    summary: {
      without: { delay: 'Unknown until arrival', risk: 'Undetected', deadline: 'Missed' },
      with: { delay: '+22 min, flagged in advance', risk: '25 → 92, caught and rerouted', deadline: 'Still met' }
    }
  },
  {
    id: 'storm-timing',
    name: 'Storm Timing',
    description: 'Weather intelligence recommends earlier departure to beat incoming rainfall.',
    initialState: createBaseState(),
    events: [
      {
        progressThreshold: 0,
        narrative: 'Trip planned for 14:00. Weather intelligence predicts heavy rain at 15:30 on high-slope segment.',
        action: (state) => {
          return {
            ...state,
            routes: [
              { ...state.routes[0], riskScore: 65, comparisonNotes: ['- Washout risk after 15:00', '- High slope segment'] },
              { ...state.routes[1], riskScore: 80, comparisonNotes: ['- Severe wind risk'] },
            ],
            alerts: [
              {
                id: 'alt_demo_3',
                category: 'weather',
                priority: 'high',
                title: 'High Risk: Planned Departure',
                message: 'Washout risk on primary route at planned time.',
                timestamp: new Date().toISOString(),
                read: false,
                dismissed: false,
                duplicateCount: 0,
                organizationId: 'demo',
                mergedAlertIds: [],
                actionRequired: false,
              }
            ]
          };
        }
      },
      {
        progressThreshold: 10,
        narrative: 'System proposes moving departure up by 90 minutes. Risk drops to safe levels.',
        action: (state) => {
          return {
            ...state,
            routes: [
              { ...state.routes[0], riskScore: 15, comparisonNotes: ['+ Beats incoming storm', '+ Safe traversal window', 'Recommended time: 12:30'], isRecommended: true },
              { ...state.routes[1], riskScore: 80 },
            ],
            alerts: [
              {
                id: 'alt_demo_4',
                category: 'delay',
                priority: 'info',
                title: 'Schedule Updated',
                message: 'Departure moved to 12:30. Route safe.',
                timestamp: new Date().toISOString(),
                read: false,
                dismissed: false,
                duplicateCount: 0,
                organizationId: 'demo',
                mergedAlertIds: [],
                actionRequired: false,
              },
              ...state.alerts,
            ]
          }
        }
      },
      {
        progressThreshold: 50,
        narrative: 'Driver crosses the high-slope segment safely before the storm hits.',
        action: (state) => state,
      }
    ],
    summary: {
      without: { delay: 'Trapped by washout', risk: 'Severe during storm', deadline: 'Indefinitely delayed' },
      with: { delay: '-90 min departure time', risk: '65 → 15 (Avoided storm)', deadline: 'Arrived early' }
    }
  },
  {
    id: 'signal-lost',
    name: 'Signal Lost',
    description: 'Truck enters a dead zone. Driver app works offline, then syncs when reconnected.',
    initialState: createBaseState(),
    events: [
      {
        progressThreshold: 10,
        narrative: 'Truck enters known connectivity dead zone.',
        action: (state) => {
          return {
            ...state,
            alerts: [
              {
                id: 'alt_demo_5',
                category: 'system',
                priority: 'medium',
                title: 'Offline Mode Active',
                message: 'Driver entered dead zone. Operating from cached data.',
                timestamp: new Date().toISOString(),
                read: false,
                dismissed: false,
                duplicateCount: 0,
                organizationId: 'demo',
                mergedAlertIds: [],
                actionRequired: false,
              }
            ]
          };
        }
      },
      {
        progressThreshold: 40,
        narrative: 'Driver encounters minor road damage and files report offline. Queued for sync.',
        action: (state) => {
          return {
            ...state,
            alerts: [
              {
                id: 'alt_demo_6',
                category: 'system',
                priority: 'info',
                title: 'Offline Report Queued',
                message: '1 incident report pending sync.',
                timestamp: new Date().toISOString(),
                read: false,
                dismissed: false,
                duplicateCount: 0,
                organizationId: 'demo',
                mergedAlertIds: [],
                actionRequired: false,
              },
              ...state.alerts
            ]
          };
        }
      },
      {
        progressThreshold: 70,
        narrative: 'Signal restored. Queue flushes. Ops team receives report instantly.',
        action: (state) => {
          const loc = state.routes[0].geometry.coordinates[Math.floor(state.routes[0].geometry.coordinates.length * 0.4)] as [number, number];
          return {
            ...state,
            hazards: [
              {
                id: 'haz_demo_2',
                type: 'road_damage',
                severity: 'moderate',
                title: 'Road Damage (Synced)',
                description: 'Driver reported minor pothole damage.',
                location: { type: 'Point', coordinates: loc },
                affectedRadius: 0.5,
                affectedRoutes: [],
                reportedAt: new Date().toISOString(),
                status: 'confirmed',
                organizationId: 'demo',
                reportedBy: 'system',
                affectedTrips: [],
              }
            ],
            alerts: [
              {
                id: 'alt_demo_7',
                category: 'system',
                priority: 'info',
                title: 'Connection Restored',
                message: 'Queue synced successfully. 1 report processed.',
                timestamp: new Date().toISOString(),
                read: false,
                dismissed: false,
                duplicateCount: 0,
                organizationId: 'demo',
                mergedAlertIds: [],
                actionRequired: false,
              },
              ...state.alerts.map(a => a.id === 'alt_demo_6' ? { ...a, message: 'Queue empty.' } : a)
            ]
          };
        }
      }
    ],
    summary: {
      without: { delay: 'Manual reporting delayed 3h', risk: 'Ops team blind to location', deadline: 'Unknown status' },
      with: { delay: 'Instant sync upon reconnect', risk: 'Last known location cached', deadline: 'Tracked seamlessly' }
    }
  }
];
