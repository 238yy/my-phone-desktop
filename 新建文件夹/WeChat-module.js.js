/**
 * 微信模块 - Netlify 部署版
 */
(function() {
    'use strict';

    let currentChatId = '';
    let chatHistories = {};
    let isVoiceMode = false;
    let wechatContainer = null;
    let isInitialized = false;

    function showToast(message) {
        let toast = document.getElementById('wechat-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'wechat-toast';
            toast.style.cssText = 'position:fixed; top:30px; left:50%; transform:translateX(-50%); background:#323232; color:#fff; padding:10px 24px; border-radius:8px; font-size:14px; z-index:20000; opacity:0; transition:opacity 0.3s; pointer-events:none;';
            document.body.appendChild(toast);
        }
        toast.innerText = message;
        toast.style.opacity = '1';
        setTimeout(() => toast.style.opacity = '0', 1500);
    }

    function saveData() {
        try {
            localStorage.setItem('wechatData', JSON.stringify({ chatHistories }));
        } catch (e) {
            console.error('保存失败:', e);
        }
    }

    function loadData() {
        try {
            const data = JSON.parse(localStorage.getItem('wechatData') || '{}');
            chatHistories = data.chatHistories || {};
        } catch (e) {
            console.error('加载失败:', e);
        }
    }

    function updateWechatTime() {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        const timeEl = document.getElementById('wechat-status-time');
        if (timeEl) timeEl.textContent = h + ':' + m;
    }

    function loadChatHistory(chatId) {
        const body = document.getElementById('chatBody');
        if (!body) return;
        body.innerHTML = '';
        
        const msgs = chatHistories[chatId] || [];
        if (msgs.length === 0) {
            const defaultMsg = document.createElement('div');
            defaultMsg.className = 'msg-left';
            defaultMsg.innerText = '你好呀！我是AI助手，有什么可以帮你的？';
            body.appendChild(defaultMsg);
            chatHistories[chatId] = [{ isUser: false, content: '你好呀！我是AI助手，有什么可以帮你的？', timestamp: Date.now() }];
            saveData();
        } else {
            msgs.forEach(msg => {
                const div = document.createElement('div');
                div.className = msg.isUser ? 'msg-right' : 'msg-left';
                div.innerHTML = msg.content;
                body.appendChild(div);
            });
        }
        body.scrollTop = body.scrollHeight;
    }

    function saveCurrentChat() {
        if (!currentChatId) return;
        const body = document.getElementById('chatBody');
        if (!body) return;
        
        const msgs = [];
        body.querySelectorAll('.msg-left, .msg-right').forEach(msg => {
            msgs.push({
                isUser: msg.classList.contains('msg-right'),
                content: msg.innerHTML,
                timestamp: Date.now()
            });
        });
        chatHistories[currentChatId] = msgs;
        saveData();
    }

    function getAIResponse(chatId) {
        const responses = {
            'ai_assistant': ['我明白了', '让我想想这个问题', '有趣的话题', '谢谢你的提问', '希望能帮到你'],
            'friend1': ['嗯好的', '知道了', '不错哦', '同意你的看法', '下次再聊'],
            'friend2': ['听起来不错', '有同感', '好主意', '试试看吧', '期待']
        };
        const list = responses[chatId] || responses['ai_assistant'];
        return list[Math.floor(Math.random() * list.length)];
    }

    function sendMsg() {
        const input = document.getElementById('chatInput');
        const body = document.getElementById('chatBody');
        const txt = input.value.trim();
        if (!txt) return;

        const userDiv = document.createElement('div');
        userDiv.className = 'msg-right';
        userDiv.innerText = txt;
        body.appendChild(userDiv);
        chatHistories[currentChatId].push({ isUser: true, content: txt, timestamp: Date.now() });
        input.value = '';
        toggleSendBtn();

        const loading = document.createElement('div');
        loading.className = 'msg-loading';
        loading.innerHTML = '<div class="loading"></div>';
        body.appendChild(loading);
        body.scrollTop = body.scrollHeight;

        setTimeout(() => {
            loading.remove();
            const aiDiv = document.createElement('div');
            aiDiv.className = 'msg-left';
            aiDiv.innerText = getAIResponse(currentChatId);
            body.appendChild(aiDiv);
            chatHistories[currentChatId].push({ isUser: false, content: aiDiv.innerText, timestamp: Date.now() });
            body.scrollTop = body.scrollHeight;
            saveData();
        }, 600);
    }

    function openChat(chatId, name) {
        currentChatId = chatId;
        const chatWindow = document.getElementById('chatWindow');
        if (chatWindow) chatWindow.style.display = 'flex';
        
        const chatTitle = document.getElementById('chatTitle');
        const wechatTitle = document.getElementById('wechatTitle');
        if (chatTitle) chatTitle.innerText = name;
        if (wechatTitle) wechatTitle.innerText = name;
        
        loadChatHistory(chatId);
    }

    function closeChat() {
        saveCurrentChat();
        const chatWindow = document.getElementById('chatWindow');
        if (chatWindow) chatWindow.style.display = 'none';
        currentChatId = '';
        const wechatTitle = document.getElementById('wechatTitle');
        if (wechatTitle) wechatTitle.innerText = '微信';
    }

    function switchTab(tabId) {
        document.querySelectorAll('.wechat-tab-content').forEach(c => c.classList.remove('active'));
        const target = document.getElementById(tabId);
        if (target) target.classList.add('active');
        
        document.querySelectorAll('.wechat-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.wechat-tab').forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            }
        });
    }

    function toggleSendBtn() {
        const btn = document.getElementById('sendBtn');
        const input = document.getElementById('chatInput');
        const voiceBtn = document.getElementById('voiceBtn');
        
        if (input && input.value.trim()) {
            if (btn) btn.classList.add('show');
            if (voiceBtn) voiceBtn.style.display = 'none';
        } else {
            if (btn) btn.classList.remove('show');
            if (voiceBtn && !isVoiceMode) voiceBtn.style.display = 'block';
        }
    }

    function toggleInputType() {
        isVoiceMode = !isVoiceMode;
        const input = document.getElementById('chatInput');
        const voiceBtn = document.getElementById('voiceBtn');
        const sendBtn = document.getElementById('sendBtn');
        const icon = document.querySelector('.voice-switch-btn i');
        
        if (isVoiceMode) {
            if (input) input.style.display = 'none';
            if (voiceBtn) voiceBtn.style.display = 'block';
            if (sendBtn) sendBtn.style.display = 'none';
            if (icon) icon.classList.replace('fa-volume-high', 'fa-keyboard');
        } else {
            if (input) input.style.display = 'block';
            if (voiceBtn) voiceBtn.style.display = 'none';
            toggleSendBtn();
            if (icon) icon.classList.replace('fa-keyboard', 'fa-volume-high');
        }
    }

    function toggleEmoji() {
        const emoji = document.getElementById('emojiPanel');
        const plus = document.getElementById('plusPanel');
        if (emoji) emoji.style.display = emoji.style.display === 'block' ? 'none' : 'block';
        if (plus) plus.style.display = 'none';
    }

    function togglePlusPanel() {
        const plus = document.getElementById('plusPanel');
        const emoji = document.getElementById('emojiPanel');
        if (plus) plus.style.display = plus.style.display === 'grid' ? 'none' : 'grid';
        if (emoji) emoji.style.display = 'none';
    }

    function openTransfer() {
        const plusPanel = document.getElementById('plusPanel');
        const transferModal = document.getElementById('transferModal');
        if (plusPanel) plusPanel.style.display = 'none';
        if (transferModal) transferModal.style.display = 'flex';
    }

    function doTransfer() {
        const money = document.getElementById('transferMoney').value;
        const note = document.getElementById('transferNote').value;
        if (!money) { alert('请输入金额'); return; }
        
        const card = document.createElement('div');
        card.className = 'transfer-card-send';
        card.innerHTML = `<div class="transfer-header"><div class="transfer-icon"><i class="fas fa-paper-plane"></i></div><div class="transfer-title">微信转账</div></div><div class="transfer-money">¥${money}</div><div class="transfer-note">${note || '无备注'}</div><div class="transfer-status">等待对方确认收款</div>`;
        document.getElementById('chatBody').appendChild(card);
        chatHistories[currentChatId].push({ isUser: true, content: card.outerHTML, timestamp: Date.now() });
        
        setTimeout(() => {
            const receiveCard = document.createElement('div');
            receiveCard.className = 'transfer-card-receive';
            receiveCard.innerHTML = `<div class="transfer-header"><div class="receive-icon"><i class="fas fa-money-bill-wave"></i></div><div class="receive-title">微信转账</div></div><div class="receive-money">¥${money}</div><div class="transfer-note">${note || '无备注'}</div><button class="receive-btn" onclick="window.WechatModule.receiveTransfer(this, ${money})">确认收款</button>`;
            document.getElementById('chatBody').appendChild(receiveCard);
            chatHistories[currentChatId].push({ isUser: false, content: receiveCard.outerHTML, timestamp: Date.now() });
            document.getElementById('chatBody').scrollTop = document.getElementById('chatBody').scrollHeight;
        }, 500);
        
        document.getElementById('transferModal').style.display = 'none';
        document.getElementById('transferMoney').value = '';
        document.getElementById('transferNote').value = '';
        saveData();
    }

    function receiveTransfer(btn, money) {
        const card = btn.parentElement;
        card.innerHTML = `<div class="transfer-header"><div class="receive-icon"><i class="fas fa-money-bill-wave"></i></div><div class="receive-title">微信转账</div></div><div class="receive-money">¥${money}</div><div class="received-status">已收款</div>`;
        saveData();
        showToast('已收款');
    }

    function selectImage() {
        const plusPanel = document.getElementById('plusPanel');
        if (plusPanel) plusPanel.style.display = 'none';
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                const img = document.createElement('img');
                img.src = ev.target.result;
                img.className = 'chat-img';
                document.getElementById('chatBody').appendChild(img);
                chatHistories[currentChatId].push({ isUser: true, content: img.outerHTML, timestamp: Date.now() });
                document.getElementById('chatBody').scrollTop = document.getElementById('chatBody').scrollHeight;
                saveData();
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    function openSettings() {
        alert('设置功能开发中\n\n后续可以扩展：\n- 字体大小\n- 聊天背景\n- 消息提醒');
    }

    function showWechat() {
        if (!wechatContainer) {
            initWechatDOM();
        }
        if (wechatContainer) {
            wechatContainer.style.display = 'flex';
            updateWechatTime();
            if (currentChatId) {
                loadChatHistory(currentChatId);
            }
        }
    }

    function hideWechat() {
        if (wechatContainer) {
            saveCurrentChat();
            wechatContainer.style.display = 'none';
        }
    }

    function initWechatDOM() {
        if (isInitialized) return;
        if (document.getElementById('wechat-full-container')) return;
        
        const container = document.createElement('div');
        container.id = 'wechat-full-container';
        container.className = 'wechat-full-container';
        
        const style = document.createElement('style');
        style.textContent = `
            .wechat-full-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #f7f7f7;
                z-index: 10000;
                display: none;
                flex-direction: column;
                overflow: hidden;
            }
            .wechat-status-bar {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 26px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 15px;
                font-size: 12px;
                color: #333;
                background: #fff;
                z-index: 10001;
            }
            .wechat-app {
                margin-top: 26px;
                height: calc(100% - 26px);
                display: flex;
                flex-direction: column;
                background: #f7f7f7;
            }
            .wechat-header {
                background: #fff;
                padding: 12px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #e5e5e5;
            }
            .wechat-back, .wechat-add { font-size: 18px; color: #333; cursor: pointer; }
            .wechat-title { font-size: 17px; font-weight: 600; }
            .wechat-content { flex: 1; overflow-y: auto; padding: 10px; }
            .wechat-tabs {
                display: flex;
                background: #fff;
                border-top: 1px solid #e5e5e5;
            }
            .wechat-tab {
                flex: 1;
                padding: 10px 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                color: #888;
                font-size: 12px;
                cursor: pointer;
            }
            .wechat-tab.active { color: #d8b4c0; }
            .wechat-tab i { font-size: 20px; margin-bottom: 4px; }
            .wechat-tab-content { display: none; }
            .wechat-tab-content.active { display: block; }
            .chat-item {
                display: flex;
                align-items: center;
                padding: 12px;
                background: #fff;
                border-radius: 10px;
                margin-bottom: 8px;
                cursor: pointer;
            }
            .chat-avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: #d8b4c0;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                font-size: 18px;
            }
            .chat-info { flex: 1; }
            .chat-name { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
            .chat-last { font-size: 13px; color: #999; }
            .chat-window {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #f7f7f7;
                display: none;
                flex-direction: column;
                z-index: 11000;
            }
            .chat-head {
                background: #fff;
                padding: 12px 15px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid #e5e5e5;
            }
            .chat-head-left { display: flex; align-items: center; }
            .chat-back { margin-right: 15px; cursor: pointer; font-size: 18px; }
            .chat-settings { font-size: 18px; cursor: pointer; }
            .chat-body {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                background: #f7f7f7;
            }
            .msg-left, .msg-right {
                max-width: 75%;
                padding: 10px 14px;
                border-radius: 18px;
                margin-bottom: 10px;
                word-break: break-word;
            }
            .msg-left { background: #fff; align-self: flex-start; }
            .msg-right { background: #d8b4c0; color: #fff; align-self: flex-end; }
            .chat-bottom-bar {
                background: #f7f7f7;
                border-top: 1px solid #e5e5e5;
                padding: 8px 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .voice-switch-btn { font-size: 22px; color: #666; cursor: pointer; }
            .chat-input-wrapper {
                flex: 1;
                background: #fff;
                border-radius: 20px;
                padding: 8px 15px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .chat-input { flex: 1; border: none; outline: none; font-size: 16px; }
            .send-btn {
                background: #d0d0d0;
                color: #fff;
                border: none;
                width: 50px;
                height: 36px;
                border-radius: 18px;
                font-size: 15px;
                cursor: pointer;
                display: none;
            }
            .send-btn.show { display: block; }
            .voice-btn { font-size: 20px; color: #666; cursor: pointer; display: none; }
            .emoji-btn, .plus-btn { font-size: 22px; color: #666; cursor: pointer; }
            .plus-panel {
                background: #fff;
                padding: 15px;
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                border-top: 1px solid #eee;
                display: none;
            }
            .plus-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                cursor: pointer;
            }
            .plus-icon {
                width: 45px;
                height: 45px;
                border-radius: 8px;
                background: #f0f0f0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                color: #666;
            }
            .plus-label { font-size: 12px; color: #666; }
            .emoji-panel {
                background: #fff;
                padding: 10px;
                max-height: 220px;
                overflow-y: auto;
                border-top: 1px solid #eee;
                display: none;
            }
            .msg-loading {
                background: #fff;
                align-self: flex-start;
                max-width: 60px;
                padding: 8px 12px;
                border-radius: 18px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .loading {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(0,0,0,0.1);
                border-radius: 50%;
                border-top-color: #d8b4c0;
                animation: spin 1s ease-in-out infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            .transfer-card-send, .transfer-card-receive {
                background: #fff;
                border-radius: 14px;
                padding: 16px;
                width: 230px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.06);
                margin: 5px 0;
            }
            .transfer-card-send { align-self: flex-end; }
            .transfer-card-receive { align-self: flex-start; }
            .transfer-money, .receive-money { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
            .receive-money { color: #07c160; }
            .receive-btn {
                background: #07c160;
                color: #fff;
                border: none;
                padding: 6px 12px;
                border-radius: 12px;
                cursor: pointer;
                font-size: 13px;
                margin-top: 8px;
            }
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 12000;
            }
            .transfer-box {
                background: #fff;
                width: 280px;
                border-radius: 16px;
                padding: 20px;
            }
            .chat-img { max-width: 180px; border-radius: 12px; margin: 4px 0; }
            .received-status { color: #07c160; font-size: 12px; margin-top: 8px; }
        `;
        document.head.appendChild(style);
        
        container.innerHTML = `
            <div class="wechat-status-bar">
                <div id="wechat-status-time">--:--</div>
                <div><i class="fas fa-signal"></i> <i class="fas fa-wifi"></i> <i class="fas fa-battery-three-quarters"></i></div>
            </div>
            <div class="wechat-app">
                <div class="wechat-header">
                    <div class="wechat-back" id="wechatCloseBtn"><i class="fas fa-chevron-left"></i></div>
                    <div class="wechat-title" id="wechatTitle">微信</div>
                    <div class="wechat-add"><i class="fas fa-plus"></i></div>
                </div>
                <div class="wechat-content">
                    <div class="wechat-tab-content active" id="chatsTab">
                        <div class="chat-item" data-chat-id="ai_assistant">
                            <div class="chat-avatar">AI</div>
                            <div class="chat-info"><div class="chat-name">AI助手</div><div class="chat-last">有什么可以帮你的？</div></div>
                        </div>
                        <div class="chat-item" data-chat-id="friend1">
                            <div class="chat-avatar">友</div>
                            <div class="chat-info"><div class="chat-name">好友1</div><div class="chat-last">在吗？</div></div>
                        </div>
                        <div class="chat-item" data-chat-id="friend2">
                            <div class="chat-avatar">友</div>
                            <div class="chat-info"><div class="chat-name">好友2</div><div class="chat-last">今天吃什么</div></div>
                        </div>
                    </div>
                    <div class="wechat-tab-content" id="momentsTab">
                        <div style="padding:20px; text-align:center; color:#999;">朋友圈功能开发中</div>
                    </div>
                    <div class="wechat-tab-content" id="profileTab">
                        <div style="padding:20px; text-align:center;">
                            <div style="width:80px; height:80px; border-radius:50%; background:#d8b4c0; margin:0 auto 15px; display:flex; align-items:center; justify-content:center; font-size:32px;"><i class="fas fa-user"></i></div>
                            <div>微信用户</div>
                            <div style="margin-top:20px; padding:12px; background:#fff; border-radius:10px; cursor:pointer;" id="profileSettingsBtn">设置</div>
                        </div>
                    </div>
                </div>
                <div class="wechat-tabs">
                    <div class="wechat-tab active" data-tab="chatsTab"><i class="fas fa-comment"></i><span>聊天</span></div>
                    <div class="wechat-tab" data-tab="momentsTab"><i class="fas fa-image"></i><span>朋友圈</span></div>
                    <div class="wechat-tab" data-tab="profileTab"><i class="fas fa-user"></i><span>我</span></div>
                </div>
            </div>
            <div class="chat-window" id="chatWindow">
                <div class="chat-head">
                    <div class="chat-head-left"><div class="chat-back" id="closeChatBtn">←</div><div id="chatTitle">聊天中</div></div>
                    <div class="chat-settings" id="openSettingsBtn"><i class="fas fa-ellipsis-v"></i></div>
                </div>
                <div class="chat-body" id="chatBody"></div>
                <div class="chat-bottom-bar">
                    <div class="voice-switch-btn" id="voiceSwitchBtn"><i class="fas fa-volume-high"></i></div>
                    <div class="chat-input-wrapper">
                        <input class="chat-input" id="chatInput" placeholder="输入消息..." autocomplete="off">
                        <button class="send-btn" id="sendBtn">发送</button>
                        <div class="voice-btn" id="voiceBtn"><i class="fas fa-microphone"></i></div>
                    </div>
                    <div class="emoji-btn" id="emojiBtn"><i class="far fa-smile"></i></div>
                    <div class="plus-btn" id="plusBtn"><i class="fas fa-plus"></i></div>
                </div>
                <div class="emoji-panel" id="emojiPanel"><div style="padding:8px;">😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🥰 😍 🤩</div></div>
                <div class="plus-panel" id="plusPanel">
                    <div class="plus-item" id="transferBtn"><div class="plus-icon"><i class="fas fa-money-bill"></i></div><div class="plus-label">转账</div></div>
                    <div class="plus-item" id="imageBtn"><div class="plus-icon"><i class="fas fa-image"></i></div><div class="plus-label">图片</div></div>
                </div>
            </div>
            <div class="modal-overlay" id="transferModal">
                <div class="transfer-box">
                    <h3 style="margin-bottom:15px;">微信转账</h3>
                    <input type="number" id="transferMoney" placeholder="金额" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #eee; border-radius:8px;">
                    <input type="text" id="transferNote" placeholder="添加备注" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #eee; border-radius:8px;">
                    <button id="confirmTransferBtn" style="width:100%; padding:12px; background:#d8b4c0; border:none; border-radius:8px; color:#fff; cursor:pointer;">确认转账</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        wechatContainer = container;
        isInitialized = true;
        
        bindEvents();
        loadData();
        updateWechatTime();
    }
    
    function bindEvents() {
        document.getElementById('wechatCloseBtn').onclick = hideWechat;
        
        document.querySelectorAll('.chat-item').forEach(item => {
            item.onclick = () => {
                const chatId = item.getAttribute('data-chat-id');
                const name = item.querySelector('.chat-name')?.innerText || '聊天';
                openChat(chatId, name);
            };
        });
        
        document.getElementById('closeChatBtn').onclick = closeChat;
        document.getElementById('openSettingsBtn').onclick = openSettings;
        document.getElementById('profileSettingsBtn').onclick = openSettings;
        document.getElementById('sendBtn').onclick = sendMsg;
        
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendMsg(); };
            chatInput.oninput = toggleSendBtn;
        }
        
        document.getElementById('voiceSwitchBtn').onclick = toggleInputType;
        document.getElementById('emojiBtn').onclick = toggleEmoji;
        document.getElementById('plusBtn').onclick = togglePlusPanel;
        document.getElementById('transferBtn').onclick = openTransfer;
        document.getElementById('confirmTransferBtn').onclick = doTransfer;
        document.getElementById('imageBtn').onclick = selectImage;
        
        document.querySelectorAll('.wechat-tab').forEach(tab => {
            tab.onclick = () => {
                const tabId = tab.getAttribute('data-tab');
                if (tabId) switchTab(tabId);
            };
        });
    }
    
    window.WechatModule = {
        show: showWechat,
        hide: hideWechat,
        receiveTransfer: receiveTransfer
    };
    
    console.log('微信模块加载完成');
})();