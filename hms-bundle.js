// hms-bundle.js (entry for Rollup build)
import * as HMS from "@100mslive/hms-video";
import { HMSReactiveStore } from "@100mslive/hms-video-store";

// Attach to window so they are available in <script> on your HTML
window.HMS = HMS;
window.HMSReactiveStore = HMSReactiveStore;

console.log("✅ Local HMS Bundle Loaded (window.HMS + window.HMSReactiveStore available)");
