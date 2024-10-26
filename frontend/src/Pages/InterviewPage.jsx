import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeOff } from 'lucide-react';
import VideoPreview from '../Components/VideoPreview';
import ChatMessage from '../Components/ChatMessage';
import useFaceDetection from '../Components/useFacedetection';
import { DashBoard } from '../Components/Dashboard';
import toast from 'react-hot-toast';

const InterviewPage = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([
        { role: 'ai', content: 'Hello! I\'m your AI interviewer. Let\'s begin with your introduction. Please tell me about yourself.' }
    ]);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const chatContainerRef = useRef(null);
    const screenShareRef = useRef(null);

    const [videoRecorder, setVideoRecorder] = useState(null);
    const [screenRecorder, setScreenRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [isTTSEnabled, setIsTTSEnabled] = useState(false);

    useFaceDetection(videoRef, canvasRef);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chat]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: isMicOn
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setRecordedChunks((prev) => [...prev, event.data]);
                }
            };
            setVideoRecorder(recorder);
        } catch (err) {
            console.error('Error accessing camera:', err);
        }
    };

    const stopCamera = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: isMicOn
            });
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        } catch (error) {
            console.log('Error stopping camera: ', error);
            toast.error('Error stopping camera');
        }
    };

    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            if (screenShareRef.current) {
                screenShareRef.current.srcObject = stream;
            }
            setIsScreenSharing(true);

            const screenRecorder = new MediaRecorder(stream);
            screenRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setRecordedChunks((prev) => [...prev, event.data]);
                }
            };
            setScreenRecorder(screenRecorder);
        } catch (err) {
            console.error('Error sharing screen:', err);
            setIsScreenSharing(false);
        }
    };

    const toggleCamera = () => {
        if (isCameraOn) {
            stopCamera();
        } else {
            startCamera();
        }
        setIsCameraOn(!isCameraOn);
    };

    const toggleMic = () => {
        setIsMicOn(!isMicOn);
    };

    const handleSend = () => {
        if (message.trim()) {
            setChat(prev => [...prev, { role: 'user', content: message }]);
            setTimeout(() => {
                setChat(prev => [...prev, {
                    role: 'ai',
                    content: 'Thank you for sharing that. Could you elaborate more on your experience with team collaboration?'
                }]);
            }, 1000);
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const startRecording = () => {
        if (videoRecorder) {
            videoRecorder.start();
        }
        if (screenRecorder && isScreenSharing) {
            screenRecorder.start();
        }
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (videoRecorder) {
            videoRecorder.stop();
        }
        if (screenRecorder && isScreenSharing) {
            screenRecorder.stop();
        }
        setIsRecording(false);
    };

    const saveRecording = () => {
        const blob = new Blob(recordedChunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'recording.mp4';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    };

    const speakText = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    const handleTTS = (text) => {
        if (isTTSEnabled) {
            speakText(text);
        }
    };

    return (
        <DashBoard>
            <div className="min-h-screen bg-gray-50 hideScrollbar">
                <div className="">
                    <div className="w-full h-auto p-6 text-xl font-bold text-gray-800 flex justify-between border-b border-b-[#e53935e6] items-center">
                        <p>Interview</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4">
                        <div className="space-y-4">
                            <VideoPreview
                                videoRef={videoRef}
                                canvasRef={canvasRef}
                                isCameraOn={isCameraOn}
                                isMicOn={isMicOn}
                                isRecording={isRecording}
                                isScreenSharing={isScreenSharing}
                                onToggleCamera={toggleCamera}
                                onToggleMic={toggleMic}
                                onToggleRecording={() => {
                                    if (isRecording) {
                                        stopRecording();
                                        saveRecording();
                                    } else {
                                        startRecording();
                                    }
                                }}
                                onStartScreenShare={startScreenShare}
                            />
                            {isScreenSharing && (
                                <div className="mt-4 bg-black rounded-xl overflow-hidden aspect-video">
                                    <video
                                        ref={screenShareRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}
                            <div className="bg-white p-6 rounded-xl shadow-sm">
                                <h2 className="text-lg font-semibold mb-2">Interview Progress</h2>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full w-1/3 bg-[#e53935e6] rounded-full"></div>
                                    </div>
                                    <span className="text-sm text-gray-600">5/15 mins</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-[600px]">
                            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">AI Interviewer</h2>
                                    <p className="text-sm text-gray-600">Respond via text or voice</p>
                                </div>
                                <button
                                    onClick={() => setIsTTSEnabled(!isTTSEnabled)}
                                    className={`p-3 rounded-full ${isTTSEnabled ? 'bg-[#e53935e6] text-white' : 'bg-gray-100 text-gray-600'
                                        } hover:bg-red-700 hover:text-white transition-colors duration-200`}
                                >
                                    {isTTSEnabled ? <Volume2 size={20} /> : <VolumeOff size={20} />}
                                </button>
                            </div>

                            <div
                                ref={chatContainerRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4"
                            >
                                {chat.map((msg, index) => (
                                    <ChatMessage key={index} role={msg.role} content={msg.content} />
                                ))}
                            </div>

                            <div className="p-4 border-t bg-white">
                                <div className="flex items-center gap-2">
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        placeholder="Type your response or click the mic to speak..."
                                        className="flex-1 resize-none rounded-lg border-gray-300 focus:ring-red-500 focus:border-red-500 min-h-[80px] focus:outline-0"
                                    />
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={toggleMic}
                                            className={`p-3 rounded-full ${isMicOn ? 'bg-[#e53935e6] text-white' : 'bg-gray-100 text-gray-600'
                                                } hover:bg-red-700 hover:text-white transition-colors duration-200`}
                                        >
                                            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                                        </button>
                                        <button
                                            onClick={handleSend}
                                            className="p-3 rounded-full bg-[#e53935e6] text-white hover:bg-red-700 transition-colors duration-200 hover:text-white"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashBoard>

    );
};

export default InterviewPage;