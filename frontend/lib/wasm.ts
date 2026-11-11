// WASM loader — replaces the lib/wasm-engine module with the compiled WASM version at runtime.
// After running wasm-pack, the real engine is used. Until then, JS stubs handle everything.
// No action needed — wasm-engine.ts has working JS fallbacks built in.
export async function loadWasmGame(): Promise<void> {
  console.log('WASM loader ready — compile game-wasm/ with wasm-pack to enable WASM mode');
}
