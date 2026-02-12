import { io } from "socket.io-client";

export const socket = io("https://api.tripmatefyp.uk", {
  autoConnect: false,  // prevent auto-connect until you explicitly want
  reconnection: false,  // allows automatic reconnect
});