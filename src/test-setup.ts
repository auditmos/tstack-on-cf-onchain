import { EventEmitter } from "node:events";

// @walletconnect/heartbeat (pulled in by wagmi/ConnectKit) attaches a
// `heartbeat_pulse` listener per module load. With multiple web3 test files
// loaded in the same worker, the count crosses Node's default cap of 10.
// Raise the per-emitter default so the warning doesn't mask real ones.
EventEmitter.defaultMaxListeners = 20;
