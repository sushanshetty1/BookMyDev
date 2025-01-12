"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Video, VideoOff, Mic, MicOff } from "lucide-react";

const VideoConference = ({ roomId, participantName, onLeave }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.origin.includes("https://meet.jit.si/")) return;

      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "loaded":
            setIframeLoaded(true);
            break;
          case "error":
            setError(data.message);
            break;
          case "participantLeft":
            if (data.participant === "host") {
              onLeave();
            }
            break;
          // Add more message handlers as needed
        }
      } catch (err) {
        console.error("Error processing message:", err);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLeave]);

  const toggleAudio = () => {
    const iframe = document.getElementById("video-conference-frame");
    if (iframe) {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          type: "toggleAudio",
          enabled: !audioEnabled,
        }),
        "*"
      );
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleVideo = () => {
    const iframe = document.getElementById("video-conference-frame");
    if (iframe) {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          type: "toggleVideo",
          enabled: !videoEnabled,
        }),
        "*"
      );
      setVideoEnabled(!videoEnabled);
    }
  };

  const confirmLeave = () => {
    const iframe = document.getElementById("video-conference-frame");
    if (iframe) {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          type: "leave",
        }),
        "*"
      );
    }
    onLeave();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl bg-gray-900 p-4 relative z-50">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
          <iframe
            id="video-conference-frame"
            src={`https://meet.jit.si/room/${roomId}?name=${encodeURIComponent(
              participantName
            )}`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
            onLoad={() => setIframeLoaded(true)}
          />

          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full ${
              !audioEnabled && "bg-red-500 hover:bg-red-600"
            }`}
          >
            {audioEnabled ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full ${
              !videoEnabled && "bg-red-500 hover:bg-red-600"
            }`}
          >
            {videoEnabled ? (
              <Video className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="destructive"
            onClick={() => setShowLeaveModal(true)}
            className="px-6"
          >
            Leave Session
          </Button>
        </div>
      </Card>

      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg text-center space-y-4">
            <p className="text-white">
              Are you sure you want to leave the session? Once disconnected, you
              cannot rejoin.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="destructive"
                onClick={confirmLeave}
                className="px-6"
              >
                Yes, Leave
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowLeaveModal(false)}
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoConference;
