import { VideoResource } from '../types/resources';
import { FarmingType } from '../types/farming';

interface VideoChannel {
    name: string;
    url: string;
    topics: string[];
    expertise: 'beginner' | 'intermediate' | 'advanced';
    languages: string[];
}

interface PlaylistCategory {
    name: string;
    description: string;
    farmingTypes: FarmingType[];
    videoIds: string[];
}

export class VideoResourceSystem {
    private channels: Map<string, VideoChannel>;
    private playlists: Map<string, PlaylistCategory>;

    constructor() {
        this.channels = new Map();
        this.playlists = new Map();
        this.initializeChannels();
        this.initializePlaylists();
    }

    private initializeChannels() {
        const channels: VideoChannel[] = [
            {
                name: "Justin Rhodes",
                url: "https://youtube.com/@JustinRhodes",
                topics: ['permaculture', 'homesteading', 'regenerative'],
                expertise: 'intermediate',
                languages: ['English']
            },
            {
                name: "Farmer's Life",
                url: "https://youtube.com/@FarmersLife",
                topics: ['daily farming', 'practical techniques'],
                expertise: 'beginner',
                languages: ['English']
            },
            {
                name: "Epic Gardening",
                url: "https://youtube.com/@epicgardening",
                topics: ['gardening', 'sustainable agriculture'],
                expertise: 'beginner',
                languages: ['English']
            },
            {
                name: "Hemp University",
                url: "https://youtube.com/@HempUniversity",
                topics: ['hemp farming', 'processing', 'sustainability'],
                expertise: 'advanced',
                languages: ['English']
            }
        ];

        channels.forEach(channel => {
            this.channels.set(channel.name, channel);
        });
    }

    private initializePlaylists() {
        const playlists: { [key: string]: PlaylistCategory } = {
            'beginner_basics': {
                name: 'Farming Basics for Beginners',
                description: 'Essential knowledge for starting your farming journey',
                farmingTypes: ['traditional', 'organic'],
                videoIds: ['basic_soil', 'starter_tools', 'first_crops']
            },
            'hemp_farming': {
                name: 'Hemp Farming Masterclass',
                description: 'Comprehensive guide to hemp cultivation and processing',
                farmingTypes: ['hemp', 'sustainable'],
                videoIds: ['hemp_basics', 'soil_prep', 'cultivation', 'processing']
            },
            'therapeutic_gardening': {
                name: 'Therapeutic Gardening Guide',
                description: 'Gardening for cognitive health and well-being',
                farmingTypes: ['therapeutic', 'sensory'],
                videoIds: ['memory_gardens', 'sensory_design', 'accessibility']
            },
            'advanced_techniques': {
                name: 'Advanced Farming Technologies',
                description: 'Cutting-edge farming methods and technologies',
                farmingTypes: ['smart_farming', 'hydroponic', 'vertical'],
                videoIds: ['smart_sensors', 'automation', 'data_analytics']
            },
            'hemp_processing': {
                name: 'Hemp Processing and Products',
                description: 'Converting hemp into various products including wood alternatives',
                farmingTypes: ['hemp', 'industrial'],
                videoIds: ['fiber_extraction', 'hempwood_making', 'product_development']
            }
        };

        Object.entries(playlists).forEach(([key, playlist]) => {
            this.playlists.set(key, playlist);
        });
    }

    public getChannelsByTopic(topic: string): VideoChannel[] {
        return Array.from(this.channels.values())
            .filter(channel => channel.topics.includes(topic));
    }

    public getChannelsByExpertise(level: 'beginner' | 'intermediate' | 'advanced'): VideoChannel[] {
        return Array.from(this.channels.values())
            .filter(channel => channel.expertise === level);
    }

    public getPlaylistsByFarmingType(type: FarmingType): PlaylistCategory[] {
        return Array.from(this.playlists.values())
            .filter(playlist => playlist.farmingTypes.includes(type));
    }

    public getHempResources(): {
        channels: VideoChannel[];
        playlists: PlaylistCategory[];
    } {
        return {
            channels: this.getChannelsByTopic('hemp farming'),
            playlists: this.getPlaylistsByFarmingType('hemp')
        };
    }

    public getTherapeuticResources(): {
        channels: VideoChannel[];
        playlists: PlaylistCategory[];
    } {
        return {
            channels: this.getChannelsByTopic('therapeutic'),
            playlists: this.getPlaylistsByFarmingType('therapeutic')
        };
    }
}
