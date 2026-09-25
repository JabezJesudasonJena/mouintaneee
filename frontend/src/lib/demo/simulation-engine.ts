import { SEED_DATA } from '@/lib/data/seed';
import type { Route, HazardEvent, Alert, DriverLocation } from '@/lib/data/types';

export type DemoState = {
  routes: Route[];
  hazards: HazardEvent[];
  alerts: Alert[];
  driverLocations: DriverLocation[];
  activeRouteId: string;
  narrative: string;
  isComplete: boolean;
};

export type ScenarioEvent = {
  progressThreshold: number; // 0 to 100
  action: (state: DemoState) => DemoState;
  narrative: string;
};

export type Scenario = {
  id: string;
  name: string;
  description: string;
  initialState: Omit<DemoState, 'narrative' | 'isComplete'>;
  events: ScenarioEvent[];
  summary: {
    without: { delay: string; risk: string; deadline: string };
    with: { delay: string; risk: string; deadline: string };
  };
};

export class SimulationEngine {
  private state: DemoState;
  private scenario: Scenario;
  private onUpdate: (state: DemoState) => void;
  private animationFrameId?: number;
  private isRunning: boolean = false;
  private progress: number = 0;
  private speed: number = 1;
  private lastEventIndex: number = -1;
  private prefersReducedMotion: boolean = false;

  constructor(
    scenario: Scenario,
    onUpdate: (state: DemoState) => void,
    prefersReducedMotion: boolean = false
  ) {
    this.scenario = scenario;
    this.onUpdate = onUpdate;
    this.prefersReducedMotion = prefersReducedMotion;
    this.state = {
      ...scenario.initialState,
      narrative: 'Simulation ready.',
      isComplete: false,
    };
  }

  public getState() {
    return this.state;
  }

  public setSpeed(speed: number) {
    this.speed = speed;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.state = { ...this.state, isComplete: false };
    this.lastEventIndex = -1;
    this.progress = 0;
    this.onUpdate(this.state);
    
    let lastTime = performance.now();
    
    const loop = (time: number) => {
      if (!this.isRunning) return;
      
      const deltaTime = time - lastTime;
      lastTime = time;

      // Base speed: 1 unit of progress per 150ms -> 15 seconds full trip
      const deltaProgress = (deltaTime / 150) * this.speed;
      
      if (this.prefersReducedMotion) {
        // Jump to next event
        const nextEvent = this.scenario.events[this.lastEventIndex + 1];
        if (nextEvent) {
          this.progress = nextEvent.progressThreshold;
        } else {
          this.progress = 100;
        }
      } else {
        this.progress += deltaProgress;
      }

      if (this.progress >= 100) {
        this.progress = 100;
      }

      // Update location
      const activeRoute = this.state.routes.find((r) => r.id === this.state.activeRouteId);
      if (activeRoute) {
        const coord = this.getCoord(activeRoute, this.progress);
        this.state.driverLocations = [
          {
            driverId: 'demo-driver',
            tripId: 'demo-trip',
            location: { type: 'Point', coordinates: coord },
            speed: 45,
            heading: 0,
            elevation: 1900,
            accuracy: 10,
            timestamp: new Date().toISOString(),
          },
        ];
      }

      // Check for events
      const pendingEvents = this.scenario.events.filter(
        (e, i) => i > this.lastEventIndex && this.progress >= e.progressThreshold
      );

      for (const event of pendingEvents) {
        this.state = event.action({ ...this.state });
        this.state.narrative = event.narrative;
        this.lastEventIndex++;
        
        if (this.prefersReducedMotion) {
          // Pause briefly so user can read narrative
          this.isRunning = false;
          setTimeout(() => {
            if (this.progress < 100) {
              this.isRunning = true;
              lastTime = performance.now();
              this.animationFrameId = requestAnimationFrame(loop);
            }
          }, 2000);
          break; // Process one at a time when reduced motion
        }
      }

      if (this.progress >= 100) {
        this.isRunning = false;
        this.state.isComplete = true;
      }

      this.onUpdate({ ...this.state });

      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public pause() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.onUpdate(this.state);
  }

  public reset() {
    this.pause();
    this.state = {
      ...this.scenario.initialState,
      narrative: 'Simulation ready.',
      isComplete: false,
    };
    this.progress = 0;
    this.lastEventIndex = -1;
    this.onUpdate(this.state);
  }

  public getProgress() {
    return this.progress;
  }
  
  public getIsRunning() {
    return this.isRunning;
  }

  private getCoord(route: Route, progressPct: number): [number, number] {
    const coords = route.geometry.coordinates;
    if (coords.length === 0) return [0, 0];
    if (progressPct <= 0) return coords[0] as [number, number];
    if (progressPct >= 100) return coords[coords.length - 1] as [number, number];

    const totalSegs = coords.length - 1;
    const exactSeg = (progressPct / 100) * totalSegs;
    const segIdx = Math.floor(exactSeg);
    const segT = exactSeg - segIdx;

    const p1 = coords[segIdx] as [number, number];
    const p2 = coords[segIdx + 1] as [number, number];

    return [
      p1[0] + (p2[0] - p1[0]) * segT,
      p1[1] + (p2[1] - p1[1]) * segT,
    ];
  }
}
