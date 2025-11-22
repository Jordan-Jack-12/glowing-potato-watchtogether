"use client";

import { io } from "socket.io-client";

const devEnv = process.env.NEXT_PUBLIC_DEV_ENV;
const serverUrls =
  devEnv === "1" ? "http://localhost:3001/" : process.env.NEXT_PUBLIC_SOCKETURL;

const socketServerUrl = serverUrls;

export const socket = io(socketServerUrl, {
  transports: ["websocket"],
});
