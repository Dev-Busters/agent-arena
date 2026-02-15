/**
 * Network Optimization Module
 * Client-side prediction, entity interpolation, and latency compensation
 */

export {
  ClientPrediction,
  type PredictedState,
  type ServerState,
  type InputCommand,
} from './clientPrediction';

export {
  EntityInterpolation,
  EntityInterpolationManager,
  type EntitySnapshot,
} from './entityInterpolation';
