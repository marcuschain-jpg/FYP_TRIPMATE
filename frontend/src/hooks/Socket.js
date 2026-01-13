import { io } from "socket.io-client";

export const socket = io("http://localhost:8080", {
  autoConnect: false,  // prevent auto-connect until you explicitly want
  reconnection: false,  // allows automatic reconnect
});