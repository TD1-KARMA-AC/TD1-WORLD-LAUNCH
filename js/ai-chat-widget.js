// TD1.WORLD AI Chat Widget (Karma AC Integration)
(function() {
    'use strict';
    
    const ChatWidget = {
        widget: null,
        isOpen: false,
        messages: [],
        apiEndpoint: '/api/karma/stream', // Adjust to your Karma AC endpoint
        
        init() {
            this.createWidget();
            this.loadHistory();
        },
        
        createWidget() {
            // Chat button - K ORB SYMBOL (Karma AC style)
            const button = document.createElement('button');
            button.id = 'td1-chat-button';
            button.innerHTML = '<span style="font-size: 32px; font-weight: 800; color: #C1A2FF; text-shadow: 0 0 20px rgba(193, 162, 255, 0.8);">K</span>';
            button.title = 'Chat with Karma AC';
            button.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(193, 162, 255, 0.2), rgba(18, 24, 40, 0.9));
                backdrop-filter: blur(20px);
                border: 2px solid rgba(193, 162, 255, 0.5);
                cursor: pointer;
                z-index: 999995;
                box-shadow: 
                    0 0 40px rgba(193, 162, 255, 0.6),
                    inset 0 0 30px rgba(193, 162, 255, 0.2),
                    0 8px 32px rgba(0, 0, 0, 0.4);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: pulseGlow 3s ease-in-out infinite;
            `;
            
            // Add pulse animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulseGlow {
                    0%, 100% { 
                        box-shadow: 0 0 40px rgba(193, 162, 255, 0.6), inset 0 0 30px rgba(193, 162, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.4);
                    }
                    50% { 
                        box-shadow: 0 0 60px rgba(193, 162, 255, 0.9), inset 0 0 40px rgba(193, 162, 255, 0.4), 0 12px 48px rgba(0, 0, 0, 0.5);
                    }
                }
            `;
            document.head.appendChild(style);
            
            button.addEventListener('click', () => this.toggle());
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'scale(1.1)';
                button.style.boxShadow = '0 12px 40px rgba(193, 162, 255, 0.6)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
                button.style.boxShadow = '0 8px 32px rgba(193, 162, 255, 0.4)';
            });
            
            document.body.appendChild(button);
            
            // Chat window
            this.widget = document.createElement('div');
            this.widget.id = 'td1-chat-widget';
            this.widget.style.cssText = `
                position: fixed;
                bottom: 100px;
                right: 20px;
                width: 400px;
                max-width: calc(100vw - 40px);
                height: 600px;
                max-height: calc(100vh - 140px);
                background: rgba(18, 24, 40, 0.95);
                backdrop-filter: blur(32px);
                border: 1px solid rgba(193, 162, 255, 0.3);
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                z-index: 999994;
                display: flex;
                flex-direction: column;
                opacity: 0;
                pointer-events: none;
                transform: translateY(20px) scale(0.95);
                transition: all 0.3s ease;
            `;
            
            this.widget.innerHTML = `
                <div style="padding: 20px; border-bottom: 1px solid rgba(193, 162, 255, 0.2); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0; color: #C1A2FF; font-size: 18px;">Karma AC</h3>
                        <p style="margin: 4px 0 0 0; color: #A0A0A0; font-size: 12px;">AI Assistant</p>
                    </div>
                    <button id="td1-chat-close" style="background: none; border: none; color: #A0A0A0; cursor: pointer; font-size: 24px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">×</button>
                </div>
                <div id="td1-chat-messages" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;">
                    <div style="text-align: center; color: #A0A0A0; font-size: 14px; padding: 20px;">
                        <p>👋 Hi! I'm Karma AC, your AI assistant.</p>
                        <p style="margin-top: 8px;">How can I help you today?</p>
                    </div>
                </div>
                <div style="padding: 20px; border-top: 1px solid rgba(193, 162, 255, 0.2);">
                    <form id="td1-chat-form" style="display: flex; gap: 8px;">
                        <input 
                            type="text" 
                            id="td1-chat-input" 
                            placeholder="Type your message..." 
                            style="
                                flex: 1;
                                padding: 12px 16px;
                                background: rgba(255, 255, 255, 0.05);
                                border: 1px solid rgba(193, 162, 255, 0.3);
                                border-radius: 12px;
                                color: #EAEAEA;
                                font-size: 14px;
                            "
                        />
                        <button 
                            type="submit" 
                            style="
                                padding: 12px 24px;
                                background: linear-gradient(135deg, #C1A2FF, #B38DFF);
                                border: none;
                                border-radius: 12px;
                                color: white;
                                cursor: pointer;
                                font-weight: 600;
                            "
                        >
                            Send
                        </button>
                    </form>
                </div>
            `;
            
            document.body.appendChild(this.widget);
            
            document.getElementById('td1-chat-close').addEventListener('click', () => this.toggle());
            document.getElementById('td1-chat-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        },
        
        toggle() {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.widget.style.opacity = '1';
                this.widget.style.pointerEvents = 'all';
                this.widget.style.transform = 'translateY(0) scale(1)';
                document.getElementById('td1-chat-input').focus();
            } else {
                this.widget.style.opacity = '0';
                this.widget.style.pointerEvents = 'none';
                this.widget.style.transform = 'translateY(20px) scale(0.95)';
            }
        },
        
        sendMessage() {
            const input = document.getElementById('td1-chat-input');
            const message = input.value.trim();
            if (!message) return;
            
            input.value = '';
            this.addMessage(message, 'user');
            this.addMessage('Thinking...', 'assistant', true);
            
            // Simulate API call (replace with actual Karma AC API)
            this.callKarmaAC(message);
        },
        
        async callKarmaAC(message) {
            try {
                // Try to call actual API
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, context: this.messages })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.updateLastMessage(data.response || 'I received your message.');
                } else {
                    throw new Error('API not available');
                }
            } catch (error) {
                // Fallback to simulated response
                setTimeout(() => {
                    const responses = [
                        "That's an interesting question! Let me help you with that.",
                        "I understand. Here's what I think...",
                        "Great question! Based on TD1.WORLD's capabilities...",
                        "I'd be happy to help. Let me explain...",
                        "That's a good point. Here's my perspective..."
                    ];
                    const response = responses[Math.floor(Math.random() * responses.length)];
                    this.updateLastMessage(response);
                }, 1000);
            }
        },
        
        addMessage(text, role, isTyping = false) {
            const messagesContainer = document.getElementById('td1-chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `td1-chat-message td1-chat-${role}`;
            messageDiv.style.cssText = `
                display: flex;
                ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
                margin-bottom: 8px;
            `;
            
            const bubble = document.createElement('div');
            bubble.style.cssText = `
                max-width: 70%;
                padding: 12px 16px;
                border-radius: 16px;
                background: ${role === 'user' 
                    ? 'linear-gradient(135deg, #C1A2FF, #B38DFF)' 
                    : 'rgba(255, 255, 255, 0.05)'};
                color: ${role === 'user' ? 'white' : '#EAEAEA'};
                font-size: 14px;
                line-height: 1.5;
                ${role === 'user' ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}
            `;
            
            if (isTyping) {
                bubble.id = 'td1-chat-typing';
                bubble.innerHTML = '<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';
            } else {
                bubble.textContent = text;
            }
            
            messageDiv.appendChild(bubble);
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            if (!isTyping) {
                this.messages.push({ role, text });
                this.saveHistory();
            }
            
            return messageDiv;
        },
        
        updateLastMessage(text) {
            const typingEl = document.getElementById('td1-chat-typing');
            if (typingEl) {
                typingEl.id = '';
                typingEl.textContent = text;
            }
            this.messages[this.messages.length - 1] = { role: 'assistant', text };
            this.saveHistory();
        },
        
        saveHistory() {
            localStorage.setItem('td1_chat_history', JSON.stringify(this.messages.slice(-20))); // Keep last 20
        },
        
        loadHistory() {
            const history = localStorage.getItem('td1_chat_history');
            if (history) {
                try {
                    this.messages = JSON.parse(history);
                    // Optionally restore messages to UI
                } catch (e) {
                    console.warn('Failed to load chat history');
                }
            }
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ChatWidget.init());
    } else {
        ChatWidget.init();
    }
    
    // Export for external access
    window.TD1ChatWidget = ChatWidget;
})();

