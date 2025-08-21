import { LaunchPhase, LaunchState } from '@gnc/core'
import { useState } from 'react'

/**
 * Comprehensive Scientific Display Component
 *
 * Shows GNC formulas, physics equations, and educational content
 * throughout all mission phases
 */
export function ScientificDisplay({
  launchState
}: {
  launchState: LaunchState | null
}) {
  const [activeTab, setActiveTab] = useState<'formulas' | 'guidance' | 'navigation' | 'control'>('formulas')

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-zinc-800 rounded p-1">
        {(['formulas', 'guidance', 'navigation', 'control'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-xs rounded capitalize ${
              activeTab === tab
                ? 'bg-zinc-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div className="text-xs">
        {activeTab === 'formulas' && <FormulasPanel launchState={launchState} />}
        {activeTab === 'guidance' && <GuidancePanel launchState={launchState} />}
        {activeTab === 'navigation' && <NavigationPanel launchState={launchState} />}
        {activeTab === 'control' && <ControlPanel launchState={launchState} />}
      </div>

      {/* Mission Phase Information */}
      {launchState && (
        <PhaseInformation phase={launchState.phase} state={launchState} />
      )}
    </div>
  )
}

/**
 * Physics & Mathematics Formulas Panel
 */
function FormulasPanel({ launchState }: { launchState: LaunchState | null }) {
  if (!launchState) return null

  const earthRadius = 6371000 // m
  const altitude = launchState.altitude
  const velocity = launchState.velocity_magnitude
  const orbitalVelocity = Math.sqrt(3.986004418e14 / (earthRadius + altitude))

  return (
    <div className="space-y-4 font-mono">
      <div className="bg-blue-900/30 p-3 rounded border border-blue-600">
        <h4 className="text-blue-300 font-bold mb-2">🧮 ORBITAL MECHANICS</h4>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-blue-200 font-semibold">Gravitational Force:</div>
            <div className="ml-2">F = GMm/r²</div>
            <div className="ml-2 text-gray-400">Current: {((3.986004418e14 * launchState.mass) / Math.pow(earthRadius + altitude, 2) / 1000).toFixed(0)} kN</div>
          </div>
          <div>
            <div className="text-blue-200 font-semibold">Orbital Velocity:</div>
            <div className="ml-2">v = √(μ/r)</div>
            <div className="ml-2 text-gray-400">Target: {(orbitalVelocity / 1000).toFixed(2)} km/s</div>
          </div>
          <div>
            <div className="text-blue-200 font-semibold">Kinetic Energy:</div>
            <div className="ml-2">KE = ½mv²</div>
            <div className="ml-2 text-gray-400">Current: {(0.5 * launchState.mass * velocity * velocity / 1e9).toFixed(1)} GJ</div>
          </div>
          <div>
            <div className="text-blue-200 font-semibold">Potential Energy:</div>
            <div className="ml-2">PE = -GMm/r</div>
            <div className="ml-2 text-gray-400">Current: {(-3.986004418e14 * launchState.mass / (earthRadius + altitude) / 1e9).toFixed(1)} GJ</div>
          </div>
        </div>
      </div>

      <div className="bg-purple-900/30 p-3 rounded border border-purple-600">
        <h4 className="text-purple-300 font-bold mb-2">🌪️ ATMOSPHERIC PHYSICS</h4>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-purple-200 font-semibold">Atmospheric Density:</div>
            <div className="ml-2">ρ(h) = ρ₀ × e^(-h/H)</div>
            <div className="ml-2 text-gray-400">Current: {launchState.atmosphere.density.toFixed(4)} kg/m³</div>
          </div>
          <div>
            <div className="text-purple-200 font-semibold">Dynamic Pressure:</div>
            <div className="ml-2">q = ½ρv²</div>
            <div className="ml-2 text-gray-400">Current: {(0.5 * launchState.atmosphere.density * velocity * velocity / 1000).toFixed(1)} kPa</div>
          </div>
          <div>
            <div className="text-purple-200 font-semibold">Drag Force:</div>
            <div className="ml-2">F_drag = ½ρv²C_dA</div>
            <div className="ml-2 text-gray-400">Current: {(Math.hypot(...launchState.drag) / 1000).toFixed(1)} kN</div>
          </div>
        </div>
      </div>

      <div className="bg-orange-900/30 p-3 rounded border border-orange-600">
        <h4 className="text-orange-300 font-bold mb-2">🚀 PROPULSION</h4>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-orange-200 font-semibold">Rocket Equation:</div>
            <div className="ml-2">Δv = I_sp × g₀ × ln(m₀/m_f)</div>
          </div>
          <div>
            <div className="text-orange-200 font-semibold">Thrust Equation:</div>
            <div className="ml-2">F = ṁ × v_e + (p_e - p_a) × A_e</div>
            <div className="ml-2 text-gray-400">Current: {(Math.hypot(...launchState.thrust) / 1000).toFixed(0)} kN</div>
          </div>
          <div>
            <div className="text-orange-200 font-semibold">Mass Flow Rate:</div>
            <div className="ml-2">ṁ = F / (I_sp × g₀)</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Guidance Systems Panel
 */
function GuidancePanel({ launchState }: { launchState: LaunchState | null }) {
  if (!launchState) return null

  return (
    <div className="space-y-4 font-mono">
      <div className="bg-green-900/30 p-3 rounded border border-green-600">
        <h4 className="text-green-300 font-bold mb-2">🎯 GRAVITY TURN GUIDANCE</h4>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-green-200 font-semibold">Pitch Program:</div>
            <div className="ml-2">θ(t) = θ₀ - k × (v - v_start)</div>
            <div className="ml-2 text-gray-400">Current: {(launchState.guidance.pitch_program * 180 / Math.PI).toFixed(1)}°</div>
          </div>
          <div>
            <div className="text-green-200 font-semibold">Launch Azimuth:</div>
            <div className="ml-2">β = arcsin(cos(i) / cos(φ))</div>
            <div className="ml-2 text-gray-400">Current: {(launchState.guidance.yaw_program * 180 / Math.PI).toFixed(1)}°</div>
          </div>
          <div>
            <div className="text-green-200 font-semibold">Flight Path Angle:</div>
            <div className="ml-2">γ = arcsin((r⃗ · v⃗) / (|r⃗| × |v⃗|))</div>
            <div className="ml-2 text-gray-400">Current: {(launchState.flight_path_angle * 180 / Math.PI).toFixed(1)}°</div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-900/30 p-3 rounded border border-yellow-600">
        <h4 className="text-yellow-300 font-bold mb-2">📐 TRAJECTORY OPTIMIZATION</h4>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-yellow-200 font-semibold">Gravity Losses:</div>
            <div className="ml-2">Δv_grav = ∫ g × sin(γ) dt</div>
          </div>
          <div>
            <div className="text-yellow-200 font-semibold">Drag Losses:</div>
            <div className="ml-2">Δv_drag = ∫ (D/m) dt</div>
          </div>
          <div>
            <div className="text-yellow-200 font-semibold">Steering Losses:</div>
            <div className="ml-2">Δv_steer = ∫ (T/m) × (1 - cos(α)) dt</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Navigation Systems Panel
 */
function NavigationPanel({ launchState }: { launchState: LaunchState | null }) {
  if (!launchState) return null

  return (
    <div className="space-y-4 font-mono">
      <div className="bg-cyan-900/30 p-3 rounded border border-cyan-600">
        <h4 className="text-cyan-300 font-bold mb-2">🧭 INERTIAL NAVIGATION</h4>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-cyan-200 font-semibold">Position Integration:</div>
            <div className="ml-2">r⃗(t) = r⃗₀ + ∫ v⃗(τ) dτ</div>
            <div className="ml-2 text-gray-400">Current: [{(launchState.r[0]/1000).toFixed(0)}, {(launchState.r[1]/1000).toFixed(0)}, {(launchState.r[2]/1000).toFixed(0)}] km</div>
          </div>
          <div>
            <div className="text-cyan-200 font-semibold">Velocity Integration:</div>
            <div className="ml-2">v⃗(t) = v⃗₀ + ∫ a⃗(τ) dτ</div>
            <div className="ml-2 text-gray-400">Current: {(launchState.velocity_magnitude/1000).toFixed(2)} km/s</div>
          </div>
          <div>
            <div className="text-cyan-200 font-semibold">Specific Force:</div>
            <div className="ml-2">f⃗ = a⃗_measured - g⃗</div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-900/30 p-3 rounded border border-indigo-600">
        <h4 className="text-indigo-300 font-bold mb-2">📡 GPS NAVIGATION</h4>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-indigo-200 font-semibold">Pseudorange:</div>
            <div className="ml-2">ρ = c × (t_r - t_s) + clock_bias</div>
          </div>
          <div>
            <div className="text-indigo-200 font-semibold">Position Solution:</div>
            <div className="ml-2">min Σ(ρ_measured - ρ_calculated)²</div>
          </div>
          <div>
            <div className="text-indigo-200 font-semibold">Dilution of Precision:</div>
            <div className="ml-2">GDOP = √(trace(H^T H)^-1)</div>
          </div>
        </div>
      </div>

      <div className="bg-pink-900/30 p-3 rounded border border-pink-600">
        <h4 className="text-pink-300 font-bold mb-2">🔄 KALMAN FILTERING</h4>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-pink-200 font-semibold">Prediction:</div>
            <div className="ml-2">x̂ₖ = F × x̂ₖ₋₁ + B × uₖ</div>
          </div>
          <div>
            <div className="text-pink-200 font-semibold">Update:</div>
            <div className="ml-2">x̂ₖ = x̂ₖ + K × (zₖ - H × x̂ₖ)</div>
          </div>
          <div>
            <div className="text-pink-200 font-semibold">Kalman Gain:</div>
            <div className="ml-2">K = P × H^T × (H × P × H^T + R)^-1</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Control Systems Panel
 */
function ControlPanel({ launchState }: { launchState: LaunchState | null }) {
  if (!launchState) return null

  return (
    <div className="space-y-4 font-mono">
      <div className="bg-red-900/30 p-3 rounded border border-red-600">
        <h4 className="text-red-300 font-bold mb-2">🎮 ATTITUDE CONTROL</h4>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-red-200 font-semibold">PID Controller:</div>
            <div className="ml-2">u(t) = K_p×e(t) + K_i×∫e(τ)dτ + K_d×de/dt</div>
          </div>
          <div>
            <div className="text-red-200 font-semibold">Thrust Vector Control:</div>
            <div className="ml-2">δ = gimbal_angle × max_deflection</div>
          </div>
          <div>
            <div className="text-red-200 font-semibold">Angular Momentum:</div>
            <div className="ml-2">H⃗ = I × ω⃗</div>
          </div>
        </div>
      </div>

      <div className="bg-emerald-900/30 p-3 rounded border border-emerald-600">
        <h4 className="text-emerald-300 font-bold mb-2">🔥 THRUST CONTROL</h4>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-emerald-200 font-semibold">Throttle Control:</div>
            <div className="ml-2">F_cmd = throttle × F_max</div>
            <div className="ml-2 text-gray-400">Current: {(launchState.guidance.throttle * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-emerald-200 font-semibold">Mass Flow Control:</div>
            <div className="ml-2">ṁ = F / (I_sp × g₀)</div>
          </div>
          <div>
            <div className="text-emerald-200 font-semibold">Mixture Ratio:</div>
            <div className="ml-2">MR = ṁ_oxidizer / ṁ_fuel</div>
          </div>
        </div>
      </div>

      <div className="bg-violet-900/30 p-3 rounded border border-violet-600">
        <h4 className="text-violet-300 font-bold mb-2">⚡ RCS CONTROL</h4>
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-violet-200 font-semibold">Torque Generation:</div>
            <div className="ml-2">τ⃗ = r⃗ × F⃗</div>
          </div>
          <div>
            <div className="text-violet-200 font-semibold">Thruster Allocation:</div>
            <div className="ml-2">[M] × [T] = [τ_desired]</div>
          </div>
          <div>
            <div className="text-violet-200 font-semibold">Bang-Bang Control:</div>
            <div className="ml-2">u = sign(error) × u_max</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Phase-Specific Information and Notes
 */
function PhaseInformation({ phase, state }: { phase: LaunchPhase, state: LaunchState }) {
  const getPhaseInfo = (currentPhase: LaunchPhase) => {
    switch (currentPhase) {
      case LaunchPhase.PRELAUNCH:
        return {
          title: "Pre-Launch",
          icon: "🔧",
          description: "Final system checks and countdown",
          notes: [
            "All systems nominal check",
            "Weather conditions evaluated",
            "Range safety armed",
            "Propellant loading complete"
          ],
          keyFormulas: [
            "Total ΔV required: ~9.4 km/s to LEO",
            "Launch window: Based on orbital mechanics"
          ]
        }

      case LaunchPhase.LIFTOFF:
        return {
          title: "Liftoff",
          icon: "🚀",
          description: "Vehicle clearing the launch tower",
          notes: [
            "Maximum thrust applied",
            "Tower clearance critical",
            "Initial pitch maneuver begins",
            "Engine performance monitored"
          ],
          keyFormulas: [
            "Thrust-to-Weight: T/W > 1.2",
            "Initial acceleration: a = (T - mg)/m"
          ]
        }

      case LaunchPhase.STAGE1_BURN:
        return {
          title: "First Stage Burn",
          icon: "🔥",
          description: "Primary propulsion through atmosphere",
          notes: [
            "Gravity turn guidance active",
            "Atmospheric flight regime",
            "Maximum structural loads",
            "Pitch program executed"
          ],
          keyFormulas: [
            "Gravity losses: ∫g×sin(γ)dt",
            "Dynamic pressure: q = ½ρv²"
          ]
        }

      case LaunchPhase.MAX_Q:
        return {
          title: "Maximum Dynamic Pressure",
          icon: "💨",
          description: "Peak aerodynamic stress on vehicle",
          notes: [
            "Throttle reduction to limit loads",
            "Maximum bending moments",
            "Critical structural phase",
            "Typically occurs at ~12 km altitude"
          ],
          keyFormulas: [
            "q_max ≈ 35 kPa for typical launch",
            "Structural load: L = q × S × C_L"
          ]
        }

      case LaunchPhase.STAGE1_SEPARATION:
        return {
          title: "Stage Separation",
          icon: "✂️",
          description: "First stage jettisoned",
          notes: [
            "Explosive bolts fired",
            "Stage 1 falls back to Earth",
            "Brief coast phase",
            "Attitude maintained by RCS"
          ],
          keyFormulas: [
            "Separation velocity: Δv ≈ 2-5 m/s",
            "Mass ratio: λ = m_dry / m_total"
          ]
        }

      case LaunchPhase.STAGE2_IGNITION:
        return {
          title: "Second Stage Ignition",
          icon: "🔥",
          description: "Upper stage engine start",
          notes: [
            "Ullage motors fired first",
            "Propellant settling ensured",
            "Engine restart sequence",
            "Vacuum-optimized nozzle"
          ],
          keyFormulas: [
            "Vacuum thrust higher than sea level",
            "Specific impulse: I_sp ≈ 450s (vacuum)"
          ]
        }

      case LaunchPhase.FAIRING_JETTISON:
        return {
          title: "Payload Fairing Jettison",
          icon: "🛡️",
          description: "Protective shroud removed",
          notes: [
            "Above dense atmosphere (>100 km)",
            "Payload exposed to space",
            "Fairing halves separate",
            "Reduced vehicle mass"
          ],
          keyFormulas: [
            "Atmospheric density: ρ < 10⁻⁷ kg/m³",
            "Kármán line: h = 100 km"
          ]
        }

      case LaunchPhase.STAGE2_BURN:
        return {
          title: "Second Stage Burn",
          icon: "🌌",
          description: "Final acceleration to orbital velocity",
          notes: [
            "Vacuum flight regime",
            "Orbital velocity targeted",
            "Guidance to insertion point",
            "Payload deployment preparation"
          ],
          keyFormulas: [
            "Orbital velocity: v = √(μ/r)",
            "Circular orbit: v ≈ 7.8 km/s at 400 km"
          ]
        }

      case LaunchPhase.ORBITAL_INSERTION:
        return {
          title: "Orbital Insertion",
          icon: "🛰️",
          description: "Achieving orbital velocity and altitude",
          notes: [
            "Target orbit parameters met",
            "Orbital mechanics take over",
            "Mission success criteria achieved",
            "Spacecraft separation ready"
          ],
          keyFormulas: [
            "Orbital period: T = 2π√(a³/μ)",
            "Specific orbital energy: ε = -μ/(2a)"
          ]
        }

      case LaunchPhase.ORBIT_CIRCULARIZATION:
        return {
          title: "Orbit Circularization",
          icon: "⭕",
          description: "Fine-tuning orbital parameters",
          notes: [
            "Elliptical orbit circularized",
            "Final orbit achieved",
            "Spacecraft systems activated",
            "Mission operations begin"
          ],
          keyFormulas: [
            "Circularization burn: Δv = v_circ - v_perigee",
            "Hohmann transfer complete"
          ]
        }

      default:
        return {
          title: "Unknown Phase",
          icon: "❓",
          description: "Phase information not available",
          notes: [],
          keyFormulas: []
        }
    }
  }

  const phaseInfo = getPhaseInfo(phase)

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-600">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{phaseInfo.icon}</span>
        <div>
          <h3 className="text-white font-bold">{phaseInfo.title}</h3>
          <p className="text-zinc-400 text-sm">{phaseInfo.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-yellow-400 font-semibold mb-2 text-sm">📝 Phase Notes</h4>
          <ul className="text-xs text-zinc-300 space-y-1">
            {phaseInfo.notes.map((note, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-blue-400 font-semibold mb-2 text-sm">📐 Key Formulas</h4>
          <ul className="text-xs text-zinc-300 space-y-1 font-mono">
            {phaseInfo.keyFormulas.map((formula, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{formula}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Real-time calculations for current phase */}
      <div className="mt-4 pt-4 border-t border-zinc-600">
        <h4 className="text-green-400 font-semibold mb-2 text-sm">⚡ Real-time Calculations</h4>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <span className="text-zinc-400">Time in Phase:</span>
            <span className="ml-2 text-green-300">{state.mission_time.toFixed(1)}s</span>
          </div>
          <div>
            <span className="text-zinc-400">Altitude Rate:</span>
            <span className="ml-2 text-green-300">{(state.v[2]).toFixed(0)} m/s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
