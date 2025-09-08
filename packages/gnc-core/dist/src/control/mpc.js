/**
 * solveMPC: Placeholder receding horizon controller using greedy LQR-like step.
 * This is NOT a true MPC QP solve; it approximates a single control step via u = -K (x - xRef).
 */
export function solveMPC(problem) {
    const { model, x0, xRef } = problem;
    const nx = model.A.length;
    const nu = model.B[0].length;
    const ref = xRef ?? Array(nx).fill(0);
    const err = x0.map((v, i) => v - ref[i]);
    // Heuristic gain from diagonal of R (larger R -> smaller control)
    const rdiag = Array(nu).fill(1).map((_, i) => model.R[i]?.[i] ?? 1);
    const gain = rdiag.map(v => 1 / Math.max(v, 1e-3));
    const u = Array(nu).fill(0).map((_, i) => -gain[i] * clamp(err[i] ?? 0, -10, 10));
    // Apply bounds
    const bounded = u.map((ui, i) => clamp(ui, model.uMin?.[i] ?? -Infinity, model.uMax?.[i] ?? Infinity));
    return { u0: bounded, cost: quadraticCost(err, bounded, model.Q, model.R), status: 'OK' };
}
function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
function quadraticCost(x, u, Q, R) {
    const xQx = x.reduce((s, xi, i) => s + xi * (Q[i]?.[i] ?? 0) * xi, 0);
    const uRu = u.reduce((s, ui, i) => s + ui * (R[i]?.[i] ?? 0) * ui, 0);
    return xQx + uRu;
}
