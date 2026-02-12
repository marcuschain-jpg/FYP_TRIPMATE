import { io } from "socket.io-client";

export const socket = io("https://tripmatefyp2025.duckdns.org", {
  autoConnect: false,  // prevent auto-connect until you explicitly want
  reconnection: false,  // allows automatic reconnect
});