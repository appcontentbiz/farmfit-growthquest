// API Service for FarmFit
const API_BASE_URL = 'http://localhost:5000/api';

const FarmFitAPI = {
    // Equipment Management
    async getEquipment() {
        try {
            const response = await fetch(`${API_BASE_URL}/equipment`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching equipment:', error);
            return [];
        }
    },

    // Market Data
    async getMarketData() {
        try {
            const response = await fetch(`${API_BASE_URL}/market-data`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching market data:', error);
            return [];
        }
    },

    // Heritage Crops
    async getHeritageCrops() {
        try {
            const response = await fetch(`${API_BASE_URL}/heritage-crops`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching heritage crops:', error);
            return [];
        }
    },

    // Resources
    async getResources() {
        try {
            const response = await fetch(`${API_BASE_URL}/resources`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching resources:', error);
            return {
                grants: [],
                youtube_channels: [],
                learning_resources: []
            };
        }
    }
};

// State Management
class FarmFitState {
    constructor() {
        this.equipment = [];
        this.marketData = [];
        this.heritageCrops = [];
        this.resources = {
            grants: [],
            youtube_channels: [],
            learning_resources: []
        };
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this));
    }

    async loadInitialData() {
        try {
            const [equipment, marketData, heritageCrops, resources] = await Promise.all([
                FarmFitAPI.getEquipment(),
                FarmFitAPI.getMarketData(),
                FarmFitAPI.getHeritageCrops(),
                FarmFitAPI.getResources()
            ]);

            this.equipment = equipment;
            this.marketData = marketData;
            this.heritageCrops = heritageCrops;
            this.resources = resources;
            this.notify();
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }
}

// Create global state instance
window.farmFitState = new FarmFitState();
