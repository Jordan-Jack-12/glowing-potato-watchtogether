"use client";

import { TimeString } from "@/utils/second-to-time-string";
// import { io, Socket } from "socket.io-client";
import { socket } from "../socket.js";

import Hls from "hls.js";

import {
  FastForward,
  Maximize,
  Minimize,
  Pause,
  Play,
  Rewind,
  RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// const socket: typeof Socket = io("https://gentle-heads-tap.loca.lt"); // Initialize Socket.IO client
//

type PlayBackType = {
  eventType: "play" | "pause" | "restart" | "seek";
  currentTime: number;
};

export default function Home() {
  const videoRef = useRef<null | HTMLVideoElement>(null);
  const videoContainerRef = useRef<null | HTMLDivElement>(null);
  const hlsRef = useRef<null | Hls>(null);
  const [url, setUrl] = useState("");
  const [isMaximize, setIsMaximize] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoTotalTime, setVideoTotalTime] = useState(0);

  // PLAYBACK FUNCTIONS FOR BUTTON =============================================
  const handlePlayPause = () => {
    console.log("Play or Pause");
    if (!isPlaying) {
      socket.emit("playback", { eventType: "play", currentTime: currentTime });
    } else {
      socket.emit("playback", { eventType: "pause", currentTime: currentTime });
    }
  };

  const handleSeekBack = () => {
    if (currentTime <= 10) {
      socket.emit("playback", { eventType: "seek", currentTime: 0 });
    } else {
      socket.emit("playback", {
        eventType: "seek",
        currentTime: currentTime - 10,
      });
    }
  };

  const handleRestart = () => {
    socket.emit("playback", { eventType: "restart", currentTime: 0 });
  };

  const handleSeekForward = () => {
    if (videoTotalTime - currentTime <= 10) {
      socket.emit("playback", {
        eventType: "seek",
        currentTime: videoTotalTime,
      });
    } else {
      socket.emit("playback", {
        eventType: "seek",
        currentTime: currentTime + 10,
      });
    }
  };

  // MAXIMIZE MINIMIZE ==========================================================
  const handleMaximizeUnmaximize = () => {
    const videoContainer = videoContainerRef.current;
    if (videoContainer) {
      if (!isMaximize && document.fullscreenElement == null) {
        setIsMaximize(true);
        videoContainer.requestFullscreen();
      } else {
        setIsMaximize(false);
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement != null) {
        setIsMaximize(true);
      } else {
        setIsMaximize(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  });

  useEffect(() => {
    const fecthVideoUrl = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_DEV_ENV === "1"
            ? "http://localhost:3001"
            : process.env.NEXT_PUBLIC_SOCKETURL;
        const res = await fetch(`${apiUrl}/video-url`, {
          method: "GET",
        });

        const data = await res.json();
        setUrl(data.videoUrl);
        loadSource(url);
      } catch (error) {
        console.log(error);
      }
    };
    fecthVideoUrl();
  }, [url]);

  // HLS VIDEO PLAYER ===========================================================
  const loadSource = (url: string) => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }
    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(videoRef.current!);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const updateCurrentTime = () => {
        setCurrentTime(video.currentTime);
      };
      const loadMetaData = () => {
        setVideoTotalTime(video.duration);
      };
      video.addEventListener("timeupdate", updateCurrentTime);
      video.addEventListener("loadedmetadata", loadMetaData);
    }
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connection established");
    });

    // LISTENING FROM THE SERVER ===================================================
    socket.on("playback", (data: PlayBackType) => {
      const video = videoRef.current;
      if (video) {
        if (data.eventType == "pause") {
          video.currentTime = data.currentTime;
          video.pause();
          setIsPlaying(false);
        } else if (data.eventType == "play") {
          video.currentTime = data.currentTime;
          video.play();
          setIsPlaying(true);
        } else if (data.eventType == "restart") {
          video.pause();
          video.currentTime = 0;
        } else if (data.eventType == "seek") {
          video.currentTime = data.currentTime;
        }
      }
    });

    socket.on("videourlchange", (data: { videoUrl: string }) => {
      setUrl(data.videoUrl);
      console.log("url changed", data.videoUrl);
      loadSource(url);
    });

    return () => {
      socket.off("connect");
      socket.off("playback");
    };
  }, [url]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "20px",
        background: "#000000",
        height: "100%",
      }}
    >
      <div
        className="relative"
        ref={videoContainerRef}
        onDoubleClick={(e) => e.preventDefault()} // Disable double-click fullscreen
        onKeyDown={(e) => e.preventDefault()} // Prevent keyboard fullscreen triggers
      >
        <video
          ref={videoRef}
          className={`${isMaximize ? "w-full h-full" : "w-[720px] md:h-[70vh] mb-8 outline-2 outline-white border-2 border-white rounded-md"}`}
        ></video>
        <div
          className={`${!isMaximize ? "hidden" : "absolute bottom-0 left-0 w-full flex items-center p-4 bg-black/60 text-white transition-opacity duration-300"}`}
        >
          {/*Left side*/}
          <div className="flex">
            <button
              onClick={handleSeekBack}
              className="text-white py-2 px-4 rounded-md"
            >
              <Rewind />
            </button>
            <button
              onClick={handlePlayPause}
              className="text-white py-2 px-4 rounded-md"
            >
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button
              onClick={handleSeekForward}
              className="text-white py-2 px-4 rounded-md"
            >
              <FastForward />
            </button>
          </div>

          {/* Timeline bar*/}
          <div className="rounded-md flex-1 flex justify-between items-center">
            <h1 className="text-white">{TimeString(currentTime)}</h1>
            <div className="w-full m-2 h-2 bg-slate-700 rounded-md flex items-start flex-1">
              <div
                className="bg-slate-50 h-full rounded-md"
                style={{ width: `${(currentTime / videoTotalTime) * 100}%` }}
              ></div>
            </div>
            <h1 className="text-white">{TimeString(videoTotalTime)}</h1>
          </div>

          {/* Right side */}
          <div className="flex justify-end items-center">
            <button
              onClick={handleRestart}
              className="text-white py-2 px-4 rounded-md"
            >
              <RotateCcw />
            </button>
            <button
              onClick={handleMaximizeUnmaximize}
              className="text-white py-2 px-4 rounded-md"
            >
              {isMaximize ? <Minimize /> : <Maximize />}
            </button>
          </div>
        </div>
      </div>

      <div className="min-w-full rounded-md">
        <div className="w-full m-2 h-5 bg-slate-700 rounded-md flex items-start">
          <div
            className="bg-slate-50 h-full rounded-md"
            style={{ width: `${(currentTime / videoTotalTime) * 100}%` }}
          ></div>
        </div>
        <div className="w-full flex justify-between mx-2">
          <h1 className="text-white">{TimeString(currentTime)}</h1>
          <h1 className="text-white">{TimeString(videoTotalTime)}</h1>
        </div>
      </div>

      <div className="*:m-2 flex">
        <button
          onClick={handleRestart}
          className="bg-white text-black py-2 px-4 rounded-md"
        >
          <RotateCcw />
        </button>
        <button
          onClick={handleSeekBack}
          className="bg-white text-black py-2 px-4 rounded-md"
        >
          <Rewind />
        </button>
        <button
          onClick={handlePlayPause}
          className="bg-white text-black py-2 px-4 rounded-md"
        >
          {isPlaying ? <Pause /> : <Play />}
        </button>
        <button
          onClick={handleSeekForward}
          className="bg-white text-black py-2 px-4 rounded-md"
        >
          <FastForward />
        </button>
        <button
          onClick={handleMaximizeUnmaximize}
          className="bg-white text-black py-2 px-4 rounded-md"
        >
          {isMaximize ? <Minimize /> : <Maximize />}
        </button>
      </div>
    </div>
  );
}
