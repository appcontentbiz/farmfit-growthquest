// Help & Guide System
class HelpGuideSystem {
    constructor() {
        this.faqData = {
            'operations': [
                {
                    question: 'How do I schedule farm tasks?',
                    answer: 'Use the Operations calendar to drag and drop tasks. Click the + button to add new tasks.'
                },
                {
                    question: 'Can I set recurring tasks?',
                    answer: 'Yes, when creating a task, check the "Recurring" option and set the frequency.'
                }
            ],
            'monitoring': [
                {
                    question: 'How to view crop health data?',
                    answer: 'Navigate to Monitoring > Crop Health and select your field from the map.'
                },
                {
                    question: 'Can I set alerts for crop issues?',
                    answer: 'Yes, go to Monitoring > Alerts to configure notification thresholds.'
                }
            ],
            'analytics': [
                {
                    question: 'Where can I find yield predictions?',
                    answer: 'Check Analytics > Yield Forecast for AI-powered predictions.'
                },
                {
                    question: 'How to export analytics data?',
                    answer: 'Use the Export button in any analytics chart view.'
                }
            ],
            'automation': [
                {
                    question: 'How to set up automated irrigation?',
                    answer: 'Go to Automation > Irrigation and follow the setup wizard.'
                },
                {
                    question: 'Can I control automation remotely?',
                    answer: 'Yes, use our mobile app or web interface for remote control.'
                }
            ]
        };

        this.initializeHelpSystem();
    }

    initializeHelpSystem() {
        // Add help button to header
        const header = document.querySelector('header');
        if (header) {
            const helpButton = document.createElement('button');
            helpButton.className = 'help-button';
            helpButton.innerHTML = '❓ Help & Guide';
            helpButton.onclick = () => this.showHelpModal();
            header.appendChild(helpButton);
        }
    }

    showHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'help-modal';
        modal.innerHTML = `
            <div class="help-content">
                <h2>Help & Guide</h2>
                <div class="help-tabs">
                    <button class="tab active" onclick="helpGuide.showTab('quick-start')">Quick Start</button>
                    <button class="tab" onclick="helpGuide.showTab('faq')">FAQ</button>
                    <button class="tab" onclick="helpGuide.showTab('features')">Features</button>
                </div>
                <div class="tab-content" id="help-tab-content"></div>
                <button class="close-button" onclick="helpGuide.closeModal()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
        this.showTab('quick-start');
    }

    showTab(tabName) {
        const content = document.getElementById('help-tab-content');
        switch(tabName) {
            case 'quick-start':
                content.innerHTML = this.getQuickStartGuide();
                break;
            case 'faq':
                content.innerHTML = this.getFAQContent();
                break;
            case 'features':
                content.innerHTML = this.getFeaturesGuide();
                break;
        }

        // Update active tab
        document.querySelectorAll('.help-tabs .tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.textContent.toLowerCase().includes(tabName)) {
                tab.classList.add('active');
            }
        });
    }

    getQuickStartGuide() {
        return `
            <div class="quick-start-guide">
                <h3>Getting Started</h3>
                <ol>
                    <li>
                        <h4>Set Up Your Farm Profile</h4>
                        <p>Click "Farm Profile" to add your farm details and fields.</p>
                    </li>
                    <li>
                        <h4>Configure Weather Alerts</h4>
                        <p>Enable weather notifications for your location.</p>
                    </li>
                    <li>
                        <h4>Start Monitoring</h4>
                        <p>Use the Monitoring section to track crop health.</p>
                    </li>
                    <li>
                        <h4>View Analytics</h4>
                        <p>Check the Analytics dashboard for insights.</p>
                    </li>
                </ol>
            </div>
        `;
    }

    getFAQContent() {
        let content = '<div class="faq-section">';
        Object.entries(this.faqData).forEach(([category, questions]) => {
            content += `
                <div class="faq-category">
                    <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                    ${questions.map(q => `
                        <div class="faq-item">
                            <h4>${q.question}</h4>
                            <p>${q.answer}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        });
        content += '</div>';
        return content;
    }

    getFeaturesGuide() {
        return `
            <div class="features-guide">
                <div class="feature-section" onclick="helpGuide.navigateToFeature('operations')">
                    <h3>🚜 Operations</h3>
                    <p>Manage daily farm tasks and scheduling</p>
                </div>
                <div class="feature-section" onclick="helpGuide.navigateToFeature('monitoring')">
                    <h3>🌱 Monitoring</h3>
                    <p>Track crop health and growth</p>
                </div>
                <div class="feature-section" onclick="helpGuide.navigateToFeature('analytics')">
                    <h3>📊 Analytics</h3>
                    <p>View farm performance metrics</p>
                </div>
                <div class="feature-section" onclick="helpGuide.navigateToFeature('automation')">
                    <h3>⚙️ Automation</h3>
                    <p>Control automated systems</p>
                </div>
            </div>
        `;
    }

    navigateToFeature(feature) {
        window.location.href = `charts/${feature}.html`;
        this.closeModal();
    }

    closeModal() {
        const modal = document.querySelector('.help-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Initialize help system
const helpGuide = new HelpGuideSystem();
export default helpGuide;
