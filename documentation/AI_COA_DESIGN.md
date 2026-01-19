# Neural Net–Based Course of Action (COA) — Design Notes

We will use ONNX Runtime Web to run COA models in-browser.

Plan:

1. Add `onnxruntime-web` to apps/web and load a small policy network (e.g., MLP) for maneuver suggestion.
2. Inputs: state vector (r, v, phase, fuel, targets). Outputs: delta-v suggestion or discrete action.
3. Provide a toggle in the UI to preview COA alongside MPC output.
4. Use `env.wasm.wasmPaths` to host wasm assets under `/public/ort/` for reliable loading.

Security and UX:

- No external calls at runtime; models loaded from local assets.
- Display model version and confidence; allow operator override.
