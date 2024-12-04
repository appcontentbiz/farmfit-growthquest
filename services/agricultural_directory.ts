import { GeoLocation } from '../types/location';

interface ServiceRating {
    overall: number;
    reliability: number;
    quality: number;
    value: number;
    reviews: Review[];
}

interface Review {
    userId: string;
    rating: number;
    comment: string;
    date: Date;
    verified: boolean;
}

interface OperatingHours {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
    holidays: string;
    emergency: boolean;
}

interface ServiceProvider {
    id: string;
    name: string;
    type: ServiceType;
    specialties: string[];
    location: GeoLocation;
    contact: {
        phone: string;
        email: string;
        website?: string;
        emergency?: string;
    };
    hours: OperatingHours;
    ratings: ServiceRating;
    certifications: string[];
    insuranceAccepted?: string[];
    emergencyService: boolean;
}

enum ServiceType {
    VETERINARY = 'veterinary',
    FARMERS_MARKET = 'farmers_market',
    FEED_STORE = 'feed_store',
    SUPPLY_STORE = 'supply_store',
    EQUIPMENT_DEALER = 'equipment_dealer',
    LIVESTOCK_AUCTION = 'livestock_auction',
    COOPERATIVE = 'cooperative'
}

export class AgriculturalDirectory {
    private providers: Map<string, ServiceProvider> = new Map();
    private locationIndex: Map<string, Set<string>> = new Map();
    private typeIndex: Map<ServiceType, Set<string>> = new Map();
    private specialtyIndex: Map<string, Set<string>> = new Map();

    constructor() {
        this.initializeIndices();
    }

    private initializeIndices(): void {
        Object.values(ServiceType).forEach(type => {
            this.typeIndex.set(type, new Set());
        });
    }

    public addProvider(provider: ServiceProvider): void {
        this.providers.set(provider.id, provider);
        
        // Index by location
        const locationKey = this.getLocationKey(provider.location);
        if (!this.locationIndex.has(locationKey)) {
            this.locationIndex.set(locationKey, new Set());
        }
        this.locationIndex.get(locationKey)?.add(provider.id);

        // Index by type
        this.typeIndex.get(provider.type)?.add(provider.id);

        // Index by specialties
        provider.specialties.forEach(specialty => {
            if (!this.specialtyIndex.has(specialty)) {
                this.specialtyIndex.set(specialty, new Set());
            }
            this.specialtyIndex.get(specialty)?.add(provider.id);
        });
    }

    public findNearbyProviders(location: GeoLocation, radius: number): ServiceProvider[] {
        const nearbyProviders: ServiceProvider[] = [];
        this.providers.forEach(provider => {
            if (this.calculateDistance(location, provider.location) <= radius) {
                nearbyProviders.push(provider);
            }
        });
        return nearbyProviders;
    }

    public findByType(type: ServiceType, location?: GeoLocation): ServiceProvider[] {
        const providers = Array.from(this.typeIndex.get(type) || [])
            .map(id => this.providers.get(id))
            .filter((provider): provider is ServiceProvider => provider !== undefined);

        if (location) {
            return this.sortByDistance(providers, location);
        }
        return providers;
    }

    public findEmergencyVets(location: GeoLocation): ServiceProvider[] {
        return this.findByType(ServiceType.VETERINARY, location)
            .filter(provider => provider.emergencyService);
    }

    public findFarmersMarkets(location: GeoLocation, radius: number): ServiceProvider[] {
        return this.findByType(ServiceType.FARMERS_MARKET, location)
            .filter(provider => 
                this.calculateDistance(location, provider.location) <= radius
            );
    }

    public searchBySpecialty(specialty: string, location?: GeoLocation): ServiceProvider[] {
        const providers = Array.from(this.specialtyIndex.get(specialty) || [])
            .map(id => this.providers.get(id))
            .filter((provider): provider is ServiceProvider => provider !== undefined);

        if (location) {
            return this.sortByDistance(providers, location);
        }
        return providers;
    }

    public getHighestRated(type: ServiceType, minimumReviews: number = 5): ServiceProvider[] {
        return this.findByType(type)
            .filter(provider => provider.ratings.reviews.length >= minimumReviews)
            .sort((a, b) => b.ratings.overall - a.ratings.overall);
    }

    public addReview(providerId: string, review: Review): void {
        const provider = this.providers.get(providerId);
        if (provider) {
            provider.ratings.reviews.push(review);
            this.updateOverallRating(provider);
        }
    }

    private updateOverallRating(provider: ServiceProvider): void {
        const reviews = provider.ratings.reviews;
        if (reviews.length === 0) return;

        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        provider.ratings.overall = sum / reviews.length;
    }

    private getLocationKey(location: GeoLocation): string {
        return `${Math.floor(location.latitude)},${Math.floor(location.longitude)}`;
    }

    private calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
        // Haversine formula implementation
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRad(loc2.latitude - loc1.latitude);
        const dLon = this.toRad(loc2.longitude - loc1.longitude);
        const lat1 = this.toRad(loc1.latitude);
        const lat2 = this.toRad(loc2.latitude);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    private toRad(degrees: number): number {
        return degrees * Math.PI / 180;
    }

    private sortByDistance(providers: ServiceProvider[], location: GeoLocation): ServiceProvider[] {
        return providers.sort((a, b) => 
            this.calculateDistance(location, a.location) - 
            this.calculateDistance(location, b.location)
        );
    }
}
