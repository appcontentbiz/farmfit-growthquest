export class SearchSystem {
    constructor() {
        this.searchInput = null;
        this.filterControls = null;
        this.searchResults = null;
        this.voiceButton = null;
        this.isListening = false;
        this.recognition = null;
        this.setupVoiceRecognition();
    }

    initialize() {
        this.createSearchInterface();
        this.setupEventListeners();
        this.setupVoiceButton();
    }

    createSearchInterface() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <div class="search-bar">
                <input type="text" id="feature-search" 
                       placeholder="Search features, metrics, or farming styles..."
                       data-tooltip="Type to search or click microphone for voice search">
                <button id="voice-search" class="voice-btn" data-tooltip="Click to search by voice">
                    <i class="fas fa-microphone"></i>
                </button>
            </div>
            <div class="filter-controls">
                <select id="category-filter" data-tooltip="Filter by category">
                    <option value="">All Categories</option>
                    <option value="operations">Operations</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="analytics">Analytics</option>
                    <option value="automation">Automation</option>
                </select>
                <select id="style-filter" data-tooltip="Filter by farming style">
                    <option value="">All Styles</option>
                    <option value="organic">Organic Farming</option>
                    <option value="hydroponic">Hydroponics</option>
                    <option value="vertical">Vertical Farming</option>
                    <option value="aquaponic">Aquaponics</option>
                    <option value="permaculture">Permaculture</option>
                </select>
                <select id="metric-filter" data-tooltip="Filter by metric type">
                    <option value="">All Metrics</option>
                    <option value="efficiency">Efficiency</option>
                    <option value="yield">Yield</option>
                    <option value="sustainability">Sustainability</option>
                    <option value="financial">Financial</option>
                </select>
            </div>
            <div id="search-results" class="search-results"></div>
        `;

        document.querySelector('.container').insertBefore(
            searchContainer,
            document.getElementById('category-nav')
        );

        this.searchInput = document.getElementById('feature-search');
        this.filterControls = document.querySelector('.filter-controls');
        this.searchResults = document.getElementById('search-results');
        this.voiceButton = document.getElementById('voice-search');
    }

    setupEventListeners() {
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.filterControls.addEventListener('change', () => this.handleSearch());
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.searchInput.focus();
            }
            // Esc to clear search
            if (e.key === 'Escape' && document.activeElement === this.searchInput) {
                this.searchInput.value = '';
                this.handleSearch();
                this.searchInput.blur();
            }
        });
    }

    setupVoiceButton() {
        this.voiceButton.addEventListener('click', () => {
            if (this.isListening) {
                this.stopVoiceRecognition();
            } else {
                this.startVoiceRecognition();
            }
        });
    }

    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.voiceButton.classList.add('listening');
                this.showNotification('Listening...', 'info');
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.voiceButton.classList.remove('listening');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.searchInput.value = transcript;
                this.handleSearch();
                this.showNotification('Voice search: ' + transcript);
            };

            this.recognition.onerror = (event) => {
                this.showNotification('Voice recognition error: ' + event.error, 'error');
                this.isListening = false;
                this.voiceButton.classList.remove('listening');
            };
        } else {
            this.voiceButton.style.display = 'none';
        }
    }

    startVoiceRecognition() {
        if (this.recognition) {
            this.recognition.start();
        }
    }

    stopVoiceRecognition() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const styleFilter = document.getElementById('style-filter').value;
        const metricFilter = document.getElementById('metric-filter').value;

        // Get all feature cards
        const features = document.querySelectorAll('.feature-card');
        let hasResults = false;

        features.forEach(feature => {
            const category = feature.dataset.category;
            const style = feature.dataset.style;
            const metrics = feature.dataset.metrics;
            const title = feature.querySelector('.feature-title').textContent.toLowerCase();
            const description = feature.querySelector('.feature-description').textContent.toLowerCase();

            const matchesSearch = !searchTerm || 
                title.includes(searchTerm) || 
                description.includes(searchTerm);
            
            const matchesCategory = !categoryFilter || category === categoryFilter;
            const matchesStyle = !styleFilter || style === styleFilter;
            const matchesMetric = !metricFilter || metrics.includes(metricFilter);

            if (matchesSearch && matchesCategory && matchesStyle && matchesMetric) {
                feature.style.display = 'block';
                hasResults = true;
            } else {
                feature.style.display = 'none';
            }
        });

        // Show/hide no results message
        this.updateNoResultsMessage(hasResults);
    }

    updateNoResultsMessage(hasResults) {
        let noResults = document.querySelector('.no-results');
        if (!hasResults) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.innerHTML = `
                    <i class="fas fa-search"></i>
                    <p>No matching features found</p>
                    <button class="clear-search">Clear Search</button>
                `;
                this.searchResults.appendChild(noResults);

                noResults.querySelector('.clear-search').addEventListener('click', () => {
                    this.searchInput.value = '';
                    document.getElementById('category-filter').value = '';
                    document.getElementById('style-filter').value = '';
                    document.getElementById('metric-filter').value = '';
                    this.handleSearch();
                });
            }
            noResults.style.display = 'flex';
        } else if (noResults) {
            noResults.style.display = 'none';
        }
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
