/**
 * Client-Side Prediction for Agent Arena
 * Predicts player movement locally before server confirmation
 * Reconciles with server state when updates arrive
 */

import * as THREE from 'three';

export interface PredictedState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  timestamp: number;
  sequenceNumber: number;
}

export interface ServerState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  timestamp: number;
  lastProcessedInput: number;
}

export interface InputCommand {
  sequenceNumber: number;
  timestamp: number;
  moveX: number;
  moveZ: number;
  deltaTime: number;
}

export class ClientPrediction {
  private predictedStates: Map<number, PredictedState> = new Map();
  private pendingInputs: InputCommand[] = [];
  private sequenceNumber = 0;
  
  // Reconciliation settings
  private reconciliationThreshold = 0.1; // meters
  private maxPredictionTime = 1000; // ms
  
  /**
   * Apply input locally and store for reconciliation
   */
  applyInput(
    currentPosition: THREE.Vector3,
    currentVelocity: THREE.Vector3,
    moveX: number,
    moveZ: number,
    deltaTime: number
  ): { position: THREE.Vector3; velocity: THREE.Vector3; sequenceNumber: number } {
    const seq = ++this.sequenceNumber;
    const timestamp = Date.now();
    
    // Store input for later reconciliation
    const input: InputCommand = {
      sequenceNumber: seq,
      timestamp,
      moveX,
      moveZ,
      deltaTime,
    };
    this.pendingInputs.push(input);
    
    // Apply movement locally (client prediction)
    const newVelocity = new THREE.Vector3(moveX, 0, moveZ);
    const newPosition = currentPosition.clone().add(
      newVelocity.multiplyScalar(deltaTime)
    );
    
    // Store predicted state
    this.predictedStates.set(seq, {
      position: newPosition.clone(),
      velocity: newVelocity.clone(),
      timestamp,
      sequenceNumber: seq,
    });
    
    // Cleanup old predictions
    this.cleanupOldStates(timestamp);
    
    return {
      position: newPosition,
      velocity: newVelocity,
      sequenceNumber: seq,
    };
  }
  
  /**
   * Reconcile with server state
   * Returns corrected position if server disagrees significantly
   */
  reconcile(serverState: ServerState): THREE.Vector3 | null {
    const { lastProcessedInput } = serverState;
    
    // Remove processed inputs
    this.pendingInputs = this.pendingInputs.filter(
      (input) => input.sequenceNumber > lastProcessedInput
    );
    
    // Get the predicted state at the time server processed
    const predictedState = this.predictedStates.get(lastProcessedInput);
    if (!predictedState) {
      // No prediction for this input, trust server
      return serverState.position.clone();
    }
    
    // Calculate prediction error
    const error = predictedState.position.distanceTo(serverState.position);
    
    if (error > this.reconciliationThreshold) {
      // Significant mismatch - need to reconcile
      console.log(`[Prediction] Reconciling (error: ${error.toFixed(3)}m)`);
      
      // Start from server position
      let correctedPosition = serverState.position.clone();
      let correctedVelocity = serverState.velocity.clone();
      
      // Re-apply pending inputs
      for (const input of this.pendingInputs) {
        const velocity = new THREE.Vector3(input.moveX, 0, input.moveZ);
        correctedPosition.add(velocity.clone().multiplyScalar(input.deltaTime));
        correctedVelocity = velocity;
      }
      
      return correctedPosition;
    }
    
    // Prediction was accurate, no correction needed
    return null;
  }
  
  /**
   * Get pending inputs to send to server
   */
  getPendingInputs(): InputCommand[] {
    return [...this.pendingInputs];
  }
  
  /**
   * Clear all pending inputs (e.g., on disconnect)
   */
  clearPendingInputs(): void {
    this.pendingInputs = [];
    this.predictedStates.clear();
  }
  
  /**
   * Cleanup old predicted states to prevent memory leak
   */
  private cleanupOldStates(currentTime: number): void {
    const cutoffTime = currentTime - this.maxPredictionTime;
    
    for (const [seq, state] of this.predictedStates.entries()) {
      if (state.timestamp < cutoffTime) {
        this.predictedStates.delete(seq);
      }
    }
  }
  
  /**
   * Get current sequence number
   */
  getCurrentSequence(): number {
    return this.sequenceNumber;
  }
  
  /**
   * Set reconciliation threshold (in meters)
   */
  setReconciliationThreshold(threshold: number): void {
    this.reconciliationThreshold = threshold;
  }
}
