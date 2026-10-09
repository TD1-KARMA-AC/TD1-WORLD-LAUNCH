/**
 * Voice Interface Engine
 * 
 * Handles voice input and output for Atlas navigation.
 */

export class VoiceEngine {
    constructor() {
        this.recognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.onResultCallback = null;
        
        this.initializeSpeech();
    }

    /**
     * Initialize Web Speech API
     */
    initializeSpeech() {
        // Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onresult = (event) => {
                if (event.results.length > 0) {
                    const transcript = event.results[0][0].transcript;
                    this.isListening = false; // Stop listening immediately
                    if (this.onResultCallback) {
                        const callback = this.onResultCallback;
                        this.onResultCallback = null; // Clear callback to prevent loops
                        callback(transcript);
                    }
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                this.onResultCallback = null; // Clear callback on error
            };

            this.recognition.onend = () => {
                this.isListening = false; // Ensure flag is reset when recognition ends
            };
        }

        // Speech Synthesis
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }

    /**
     * Start listening for voice input
     */
    startListening(callback) {
        if (!this.recognition) {
            console.warn('Speech recognition not available');
            return false;
        }

        this.onResultCallback = callback;
        this.isListening = true;
        this.recognition.start();
        return true;
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    /**
     * Speak text
     */
    speak(text, options = {}) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not available');
            return;
        }

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        utterance.lang = options.lang || 'en-US';

        this.synthesis.speak(utterance);
    }

    /**
     * Check if voice is available
     */
    isAvailable() {
        return !!(this.recognition && this.synthesis);
    }
}

