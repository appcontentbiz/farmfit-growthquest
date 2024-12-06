export class SharingSystem {
    constructor() {
        this.currentSession = null;
        this.collaborators = new Map();
        this.setupShareControls();
    }

    setupShareControls() {
        const shareContainer = document.createElement('div');
        shareContainer.className = 'share-container';
        shareContainer.innerHTML = `
            <div class="share-controls">
                <button id="share-demo" class="share-btn" data-tooltip="Share demo with other users">
                    <i class="fas fa-share-alt"></i> Share Demo
                </button>
                <div class="collaborators-list"></div>
            </div>
            <div class="session-info" style="display: none">
                <span class="session-id"></span>
                <span class="active-users"></span>
            </div>
        `;

        document.querySelector('.container').insertBefore(
            shareContainer,
            document.querySelector('.search-container')
        );

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('share-demo').addEventListener('click', () => {
            this.showShareModal();
        });
    }

    showShareModal() {
        const modal = document.createElement('div');
        modal.className = 'modal share-modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Share Demo</h3>
                <div class="share-options">
                    <div class="session-creation">
                        <button id="create-session" class="primary-btn">
                            <i class="fas fa-plus"></i> Create New Session
                        </button>
                    </div>
                    <div class="session-join">
                        <input type="text" id="session-id-input" 
                               placeholder="Enter Session ID"
                               data-tooltip="Enter a session ID to join">
                        <button id="join-session" class="secondary-btn">
                            <i class="fas fa-sign-in-alt"></i> Join Session
                        </button>
                    </div>
                </div>
                <div class="current-session" style="display: none">
                    <h4>Current Session</h4>
                    <div class="session-details">
                        <p>Session ID: <span class="session-id-display"></span></p>
                        <button class="copy-btn" data-tooltip="Copy session ID">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div class="collaborators">
                        <h5>Active Users</h5>
                        <ul class="collaborators-list"></ul>
                    </div>
                    <div class="permissions">
                        <h5>Permissions</h5>
                        <label class="permission-toggle">
                            <input type="checkbox" id="allow-edit">
                            Allow collaborators to edit
                        </label>
                        <label class="permission-toggle">
                            <input type="checkbox" id="allow-control">
                            Allow collaborators to control demo
                        </label>
                    </div>
                </div>
                <div class="share-actions">
                    <button class="leave-session" style="display: none">
                        <i class="fas fa-sign-out-alt"></i> Leave Session
                    </button>
                </div>
                <button class="close-modal">&times;</button>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModalListeners(modal);
    }

    setupModalListeners(modal) {
        const createBtn = modal.querySelector('#create-session');
        const joinBtn = modal.querySelector('#join-session');
        const sessionInput = modal.querySelector('#session-id-input');
        const copyBtn = modal.querySelector('.copy-btn');
        const leaveBtn = modal.querySelector('.leave-session');
        const closeBtn = modal.querySelector('.close-modal');

        createBtn.addEventListener('click', () => {
            this.createSession();
            this.updateSessionDisplay(modal);
        });

        joinBtn.addEventListener('click', () => {
            const sessionId = sessionInput.value.trim();
            if (sessionId) {
                this.joinSession(sessionId);
                this.updateSessionDisplay(modal);
            }
        });

        copyBtn?.addEventListener('click', () => {
            this.copySessionId();
        });

        leaveBtn?.addEventListener('click', () => {
            this.leaveSession();
            modal.remove();
        });

        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Permission toggles
        modal.querySelector('#allow-edit')?.addEventListener('change', (e) => {
            this.updatePermissions({ allowEdit: e.target.checked });
        });

        modal.querySelector('#allow-control')?.addEventListener('change', (e) => {
            this.updatePermissions({ allowControl: e.target.checked });
        });
    }

    createSession() {
        const sessionId = this.generateSessionId();
        this.currentSession = {
            id: sessionId,
            owner: true,
            permissions: {
                allowEdit: false,
                allowControl: false
            },
            users: [{
                id: 'user-' + Math.random().toString(36).substr(2, 9),
                name: 'You (Owner)',
                color: this.getRandomColor()
            }]
        };
        
        this.showNotification('New session created! Share the ID with others to collaborate.');
        this.updateShareControls();
    }

    joinSession(sessionId) {
        // In a real implementation, this would validate the session with a backend
        this.currentSession = {
            id: sessionId,
            owner: false,
            permissions: {
                allowEdit: true,
                allowControl: true
            },
            users: [{
                id: 'user-' + Math.random().toString(36).substr(2, 9),
                name: 'You',
                color: this.getRandomColor()
            }]
        };

        this.showNotification('Joined session successfully!');
        this.updateShareControls();
    }

    leaveSession() {
        if (this.currentSession) {
            // In a real implementation, notify other users
            this.currentSession = null;
            this.showNotification('Left the session');
            this.updateShareControls();
        }
    }

    updateSessionDisplay(modal) {
        const sessionCreation = modal.querySelector('.session-creation');
        const sessionJoin = modal.querySelector('.session-join');
        const currentSession = modal.querySelector('.current-session');
        const leaveBtn = modal.querySelector('.leave-session');

        if (this.currentSession) {
            sessionCreation.style.display = 'none';
            sessionJoin.style.display = 'none';
            currentSession.style.display = 'block';
            leaveBtn.style.display = 'block';

            const sessionIdDisplay = modal.querySelector('.session-id-display');
            sessionIdDisplay.textContent = this.currentSession.id;

            this.updateCollaboratorsList(modal);
        }
    }

    updateCollaboratorsList(modal) {
        const list = modal.querySelector('.collaborators-list');
        list.innerHTML = this.currentSession.users.map(user => `
            <li class="collaborator" style="--user-color: ${user.color}">
                <span class="user-status"></span>
                ${user.name}
            </li>
        `).join('');
    }

    updateShareControls() {
        const shareBtn = document.getElementById('share-demo');
        const sessionInfo = document.querySelector('.session-info');

        if (this.currentSession) {
            shareBtn.innerHTML = `<i class="fas fa-users"></i> Active Session`;
            shareBtn.classList.add('active');
            
            sessionInfo.style.display = 'flex';
            sessionInfo.querySelector('.session-id').textContent = 
                `Session: ${this.currentSession.id}`;
            sessionInfo.querySelector('.active-users').textContent = 
                `${this.currentSession.users.length} active`;
        } else {
            shareBtn.innerHTML = `<i class="fas fa-share-alt"></i> Share Demo`;
            shareBtn.classList.remove('active');
            sessionInfo.style.display = 'none';
        }
    }

    updatePermissions(permissions) {
        if (this.currentSession && this.currentSession.owner) {
            this.currentSession.permissions = {
                ...this.currentSession.permissions,
                ...permissions
            };
            // In a real implementation, notify other users of permission changes
            this.showNotification('Permissions updated');
        }
    }

    copySessionId() {
        if (this.currentSession) {
            navigator.clipboard.writeText(this.currentSession.id)
                .then(() => this.showNotification('Session ID copied to clipboard!'))
                .catch(() => this.showNotification('Failed to copy session ID', 'error'));
        }
    }

    generateSessionId() {
        return 'demo-' + Math.random().toString(36).substr(2, 9);
    }

    getRandomColor() {
        const colors = [
            '#2196F3', '#4CAF50', '#FF9800', '#E91E63', 
            '#9C27B0', '#00BCD4', '#009688', '#FFC107'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }, 100);
    }
}
