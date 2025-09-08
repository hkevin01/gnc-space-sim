import { MU_EARTH } from '../math/constants';
/**
 * Coordinate System Transformations
 */
export class CoordinateTransforms {
    /**
     * Convert ECEF to Geodetic (WGS84)
     *
     * Using Bowring's method for iterative solution
     */
    static ecefToGeodetic(ecef) {
        const [x, y, z] = ecef;
        const a = 6378137.0; // WGS84 semi-major axis
        const f = 1 / 298.257223563; // WGS84 flattening
        const e2 = 2 * f - f * f; // First eccentricity squared
        const p = Math.sqrt(x * x + y * y);
        const lon = Math.atan2(y, x);
        // Iterative solution for latitude
        let lat = Math.atan2(z, p * (1 - e2));
        let h = 0;
        for (let i = 0; i < 5; i++) {
            const sinLat = Math.sin(lat);
            const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
            h = p / Math.cos(lat) - N;
            lat = Math.atan2(z, p * (1 - e2 * N / (N + h)));
        }
        return { lat, lon, alt: h };
    }
    /**
     * Convert Geodetic to ECEF
     */
    static geodeticToEcef(lat, lon, alt) {
        const a = 6378137.0; // WGS84 semi-major axis
        const f = 1 / 298.257223563; // WGS84 flattening
        const e2 = 2 * f - f * f; // First eccentricity squared
        const sinLat = Math.sin(lat);
        const cosLat = Math.cos(lat);
        const sinLon = Math.sin(lon);
        const cosLon = Math.cos(lon);
        const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
        const x = (N + alt) * cosLat * cosLon;
        const y = (N + alt) * cosLat * sinLon;
        const z = (N * (1 - e2) + alt) * sinLat;
        return [x, y, z];
    }
    /**
     * ECEF to ENU (East-North-Up) transformation matrix
     */
    static ecefToEnuMatrix(lat, lon) {
        const sinLat = Math.sin(lat);
        const cosLat = Math.cos(lat);
        const sinLon = Math.sin(lon);
        const cosLon = Math.cos(lon);
        return [
            [-sinLon, cosLon, 0],
            [-sinLat * cosLon, -sinLat * sinLon, cosLat],
            [cosLat * cosLon, cosLat * sinLon, sinLat]
        ];
    }
}
/**
 * Extended Kalman Filter for Launch Navigation
 *
 * State vector: [pos_x, pos_y, pos_z, vel_x, vel_y, vel_z, roll, pitch, yaw, accel_bias_x, accel_bias_y, accel_bias_z, gyro_bias_x, gyro_bias_y, gyro_bias_z]
 */
export class LaunchNavigationFilter {
    state; // 15-element state vector
    covariance; // 15x15 covariance matrix
    process_noise; // Process noise matrix
    dt; // Integration time step
    constructor(initial_state, dt = 0.1) {
        this.dt = dt;
        // Initialize state vector
        this.state = [
            ...initial_state.position,
            ...initial_state.velocity,
            initial_state.attitude.roll,
            initial_state.attitude.pitch,
            initial_state.attitude.yaw,
            ...initial_state.biases.accel_bias,
            ...initial_state.biases.gyro_bias
        ];
        // Initialize covariance matrix
        this.covariance = this.initializeCovariance();
        this.process_noise = this.initializeProcessNoise();
    }
    /**
     * Kalman Filter Prediction Step
     *
     * x_k = F * x_{k-1} + B * u_k + w_k
     * P_k = F * P_{k-1} * F^T + Q
     */
    predict(imu) {
        // State transition matrix (15x15)
        const F = this.computeStateTransition();
        // Control input matrix and IMU measurements
        const B = this.computeControlMatrix();
        const u = [...imu.acceleration, ...imu.angular_velocity];
        // Predict state
        this.state = this.matrixVectorMultiply(F, this.state);
        const Bu = this.matrixVectorMultiply(B, u);
        for (let i = 0; i < this.state.length; i++) {
            this.state[i] += Bu[i];
        }
        // Predict covariance
        const FP = this.matrixMultiply(F, this.covariance);
        const FPFt = this.matrixMultiply(FP, this.transpose(F));
        this.covariance = this.matrixAdd(FPFt, this.process_noise);
    }
    /**
     * Kalman Filter Update Step (GPS measurements)
     *
     * K = P * H^T * (H * P * H^T + R)^{-1}
     * x = x + K * (z - H * x)
     * P = (I - K * H) * P
     */
    update(gps) {
        if (!gps.available)
            return;
        // Measurement matrix H (6x15) - GPS measures position and velocity
        const H = this.computeMeasurementMatrix();
        // Measurement noise matrix R (6x6)
        const R = this.computeMeasurementNoise(gps);
        // Innovation: z - H*x
        const predicted_measurement = this.matrixVectorMultiply(H, this.state);
        const innovation = [
            gps.position[0] - predicted_measurement[0],
            gps.position[1] - predicted_measurement[1],
            gps.position[2] - predicted_measurement[2],
            gps.velocity[0] - predicted_measurement[3],
            gps.velocity[1] - predicted_measurement[4],
            gps.velocity[2] - predicted_measurement[5]
        ];
        // Innovation covariance: S = H*P*H^T + R
        const HP = this.matrixMultiply(H, this.covariance);
        const HPHt = this.matrixMultiply(HP, this.transpose(H));
        const S = this.matrixAdd(HPHt, R);
        // Kalman gain: K = P*H^T*S^{-1}
        const PHt = this.matrixMultiply(this.covariance, this.transpose(H));
        const K = this.matrixMultiply(PHt, this.matrixInverse(S));
        // State update
        const Kz = this.matrixVectorMultiply(K, innovation);
        for (let i = 0; i < this.state.length; i++) {
            this.state[i] += Kz[i];
        }
        // Covariance update: P = (I - K*H)*P
        const KH = this.matrixMultiply(K, H);
        const I_KH = this.matrixSubtract(this.identity(15), KH);
        this.covariance = this.matrixMultiply(I_KH, this.covariance);
    }
    /**
     * Get current navigation solution
     */
    getNavigationState() {
        return {
            position: [this.state[0], this.state[1], this.state[2]],
            velocity: [this.state[3], this.state[4], this.state[5]],
            attitude: {
                roll: this.state[6],
                pitch: this.state[7],
                yaw: this.state[8]
            },
            biases: {
                accel_bias: [this.state[9], this.state[10], this.state[11]],
                gyro_bias: [this.state[12], this.state[13], this.state[14]]
            },
            covariance: this.covariance,
            timestamp: Date.now() / 1000
        };
    }
    initializeCovariance() {
        const P = this.zeros(15, 15);
        // Position uncertainty: 10m
        P[0][0] = P[1][1] = P[2][2] = 100;
        // Velocity uncertainty: 1 m/s
        P[3][3] = P[4][4] = P[5][5] = 1;
        // Attitude uncertainty: 0.1 rad
        P[6][6] = P[7][7] = P[8][8] = 0.01;
        // Accelerometer bias: 0.1 m/s²
        P[9][9] = P[10][10] = P[11][11] = 0.01;
        // Gyroscope bias: 0.01 rad/s
        P[12][12] = P[13][13] = P[14][14] = 0.0001;
        return P;
    }
    initializeProcessNoise() {
        const Q = this.zeros(15, 15);
        const dt = this.dt;
        // Position process noise from velocity uncertainty
        Q[0][0] = Q[1][1] = Q[2][2] = 0.1 * dt * dt;
        // Velocity process noise from acceleration uncertainty
        Q[3][3] = Q[4][4] = Q[5][5] = 0.1 * dt;
        // Attitude process noise
        Q[6][6] = Q[7][7] = Q[8][8] = 0.001 * dt;
        // Bias random walk
        Q[9][9] = Q[10][10] = Q[11][11] = 1e-6 * dt;
        Q[12][12] = Q[13][13] = Q[14][14] = 1e-8 * dt;
        return Q;
    }
    computeStateTransition() {
        const F = this.identity(15);
        const dt = this.dt;
        // Position depends on velocity
        F[0][3] = F[1][4] = F[2][5] = dt;
        return F;
    }
    computeControlMatrix() {
        const B = this.zeros(15, 6);
        const dt = this.dt;
        // Velocity depends on acceleration (corrected for bias)
        B[3][0] = B[4][1] = B[5][2] = dt;
        // Attitude depends on angular velocity (corrected for bias)
        B[6][3] = B[7][4] = B[8][5] = dt;
        return B;
    }
    computeMeasurementMatrix() {
        const H = this.zeros(6, 15);
        // GPS measures position and velocity directly
        H[0][0] = H[1][1] = H[2][2] = 1; // Position
        H[3][3] = H[4][4] = H[5][5] = 1; // Velocity
        return H;
    }
    computeMeasurementNoise(gps) {
        const R = this.zeros(6, 6);
        const pos_var = gps.accuracy.position * gps.accuracy.position;
        const vel_var = gps.accuracy.velocity * gps.accuracy.velocity;
        R[0][0] = R[1][1] = R[2][2] = pos_var;
        R[3][3] = R[4][4] = R[5][5] = vel_var;
        return R;
    }
    // Matrix utility functions
    zeros(rows, cols) {
        return Array(rows).fill(0).map(() => Array(cols).fill(0));
    }
    identity(n) {
        const I = this.zeros(n, n);
        for (let i = 0; i < n; i++)
            I[i][i] = 1;
        return I;
    }
    matrixMultiply(A, B) {
        const result = this.zeros(A.length, B[0].length);
        for (let i = 0; i < A.length; i++) {
            for (let j = 0; j < B[0].length; j++) {
                for (let k = 0; k < B.length; k++) {
                    result[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        return result;
    }
    matrixVectorMultiply(A, x) {
        const result = new Array(A.length).fill(0);
        for (let i = 0; i < A.length; i++) {
            for (let j = 0; j < x.length; j++) {
                result[i] += A[i][j] * x[j];
            }
        }
        return result;
    }
    matrixAdd(A, B) {
        const result = this.zeros(A.length, A[0].length);
        for (let i = 0; i < A.length; i++) {
            for (let j = 0; j < A[0].length; j++) {
                result[i][j] = A[i][j] + B[i][j];
            }
        }
        return result;
    }
    matrixSubtract(A, B) {
        const result = this.zeros(A.length, A[0].length);
        for (let i = 0; i < A.length; i++) {
            for (let j = 0; j < A[0].length; j++) {
                result[i][j] = A[i][j] - B[i][j];
            }
        }
        return result;
    }
    transpose(A) {
        const result = this.zeros(A[0].length, A.length);
        for (let i = 0; i < A.length; i++) {
            for (let j = 0; j < A[0].length; j++) {
                result[j][i] = A[i][j];
            }
        }
        return result;
    }
    matrixInverse(A) {
        // Simplified inverse using Gauss-Jordan elimination
        // Note: In production, use a robust numerical library
        const n = A.length;
        const augmented = A.map((row, i) => [...row, ...this.identity(n)[i]]);
        // Forward elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = k;
                }
            }
            // Swap rows
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            // Make diagonal element 1
            const pivot = augmented[i][i];
            for (let j = 0; j < 2 * n; j++) {
                augmented[i][j] /= pivot;
            }
            // Eliminate column
            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = augmented[k][i];
                    for (let j = 0; j < 2 * n; j++) {
                        augmented[k][j] -= factor * augmented[i][j];
                    }
                }
            }
        }
        // Extract inverse matrix
        return augmented.map(row => row.slice(n));
    }
}
/**
 * Sensor Simulation for Testing
 */
export class SensorSimulator {
    /**
     * Simulate IMU measurements with realistic noise and bias
     */
    static simulateIMU(true_state, dt) {
        // True specific force (acceleration - gravity)
        const r_mag = Math.hypot(true_state.r[0], true_state.r[1], true_state.r[2]);
        const gravity_accel = MU_EARTH / (r_mag * r_mag * r_mag);
        const gravity = [
            gravity_accel * true_state.r[0] / r_mag,
            gravity_accel * true_state.r[1] / r_mag,
            gravity_accel * true_state.r[2] / r_mag
        ];
        // Add noise and bias
        const accel_noise = 0.01; // m/s²
        const gyro_noise = 0.001; // rad/s
        const accel_bias = [0.05, -0.02, 0.03];
        const gyro_bias = [0.001, 0.0005, -0.0008];
        return {
            acceleration: [
                (true_state.thrust[0] / true_state.mass) - gravity[0] + accel_bias[0] + (Math.random() - 0.5) * 2 * accel_noise,
                (true_state.thrust[1] / true_state.mass) - gravity[1] + accel_bias[1] + (Math.random() - 0.5) * 2 * accel_noise,
                (true_state.thrust[2] / true_state.mass) - gravity[2] + accel_bias[2] + (Math.random() - 0.5) * 2 * accel_noise
            ],
            angular_velocity: [
                gyro_bias[0] + (Math.random() - 0.5) * 2 * gyro_noise,
                gyro_bias[1] + (Math.random() - 0.5) * 2 * gyro_noise,
                gyro_bias[2] + (Math.random() - 0.5) * 2 * gyro_noise
            ],
            timestamp: true_state.mission_time,
            bias: { accel_bias, gyro_bias },
            noise: { accel_noise, gyro_noise }
        };
    }
    /**
     * Simulate GPS measurements with realistic accuracy degradation
     */
    static simulateGPS(true_state) {
        const altitude = true_state.altitude;
        // GPS availability and accuracy vs altitude
        const available = altitude < 80000; // GPS typically works up to ~80km
        const base_pos_accuracy = 3.0; // meters
        const base_vel_accuracy = 0.1; // m/s
        // Accuracy degrades with altitude and dynamics
        const altitude_factor = Math.max(1, altitude / 20000);
        const pos_accuracy = base_pos_accuracy * altitude_factor;
        const vel_accuracy = base_vel_accuracy * altitude_factor;
        const pos_noise = [
            (Math.random() - 0.5) * 2 * pos_accuracy,
            (Math.random() - 0.5) * 2 * pos_accuracy,
            (Math.random() - 0.5) * 2 * pos_accuracy
        ];
        const vel_noise = [
            (Math.random() - 0.5) * 2 * vel_accuracy,
            (Math.random() - 0.5) * 2 * vel_accuracy,
            (Math.random() - 0.5) * 2 * vel_accuracy
        ];
        return {
            position: [
                true_state.r[0] + pos_noise[0],
                true_state.r[1] + pos_noise[1],
                true_state.r[2] + pos_noise[2]
            ],
            velocity: [
                true_state.v[0] + vel_noise[0],
                true_state.v[1] + vel_noise[1],
                true_state.v[2] + vel_noise[2]
            ],
            timestamp: true_state.mission_time,
            num_satellites: available ? Math.floor(8 + Math.random() * 4) : 0,
            hdop: available ? 1.2 + Math.random() * 0.8 : 99.9,
            accuracy: { position: pos_accuracy, velocity: vel_accuracy },
            available
        };
    }
}
