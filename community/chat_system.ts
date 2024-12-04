import { UserProfile } from '../types/user';
import { FarmingType } from '../types/farming';

interface ChatMessage {
    id: string;
    senderId: string;
    content: string;
    timestamp: Date;
    attachments?: {
        type: 'image' | 'video' | 'document';
        url: string;
        name: string;
    }[];
    tags?: string[];
}

interface ChatRoom {
    id: string;
    name: string;
    description: string;
    type: 'public' | 'private' | 'expert' | 'support';
    topics: string[];
    participants: string[];
    moderators: string[];
    messages: ChatMessage[];
    farmingTypes?: FarmingType[];
    therapeuticFocus?: string[];
}

interface ExpertProfile extends UserProfile {
    expertise: string[];
    certifications: string[];
    yearsOfExperience: number;
    availableHours?: {
        start: string;
        end: string;
        timezone: string;
    }[];
}

export class ChatSystem {
    private rooms: Map<string, ChatRoom>;
    private experts: Map<string, ExpertProfile>;
    private activeUsers: Map<string, UserProfile>;

    constructor() {
        this.rooms = new Map();
        this.experts = new Map();
        this.activeUsers = new Map();
        this.initializeDefaultRooms();
    }

    private initializeDefaultRooms() {
        const defaultRooms: ChatRoom[] = [
            {
                id: 'hemp_general',
                name: 'Hemp Farming General',
                description: 'General discussion about hemp cultivation and processing',
                type: 'public',
                topics: ['hemp', 'cultivation', 'processing'],
                participants: [],
                moderators: [],
                messages: [],
                farmingTypes: ['hemp', 'organic']
            },
            {
                id: 'therapeutic_garden',
                name: 'Therapeutic Gardening',
                description: 'Discussion about therapeutic applications of gardening',
                type: 'public',
                topics: ['therapy', 'gardening', 'mental_health'],
                participants: [],
                moderators: [],
                messages: [],
                therapeuticFocus: ['dementia', 'anxiety', 'depression']
            },
            {
                id: 'expert_corner',
                name: 'Expert Corner',
                description: 'Get advice from certified farming and therapy experts',
                type: 'expert',
                topics: ['expert_advice', 'consultation'],
                participants: [],
                moderators: [],
                messages: []
            },
            {
                id: 'support_group',
                name: 'Therapeutic Support Group',
                description: 'Safe space for sharing experiences and support',
                type: 'support',
                topics: ['support', 'experiences', 'community'],
                participants: [],
                moderators: [],
                messages: [],
                therapeuticFocus: ['emotional_support', 'community_building']
            }
        ];

        defaultRooms.forEach(room => {
            this.rooms.set(room.id, room);
        });
    }

    public async joinRoom(
        userId: string,
        roomId: string
    ): Promise<boolean> {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            await this.sendSystemMessage(roomId, `New member joined the room`);
        }
        return true;
    }

    public async sendMessage(
        roomId: string,
        message: ChatMessage
    ): Promise<boolean> {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        room.messages.push(message);
        await this.notifyParticipants(room, message);
        return true;
    }

    public async createExpertRoom(
        expert: ExpertProfile,
        topic: string
    ): Promise<string> {
        const roomId = `expert_${expert.id}_${Date.now()}`;
        const room: ChatRoom = {
            id: roomId,
            name: `Expert Session: ${topic}`,
            description: `Expert consultation with ${expert.name}`,
            type: 'expert',
            topics: [topic],
            participants: [expert.id],
            moderators: [expert.id],
            messages: []
        };

        this.rooms.set(roomId, room);
        this.experts.set(expert.id, expert);
        return roomId;
    }

    public async createSupportGroup(
        focus: string[],
        moderators: string[]
    ): Promise<string> {
        const roomId = `support_${Date.now()}`;
        const room: ChatRoom = {
            id: roomId,
            name: `Support Group: ${focus.join(', ')}`,
            description: 'A safe space for sharing and support',
            type: 'support',
            topics: focus,
            participants: [...moderators],
            moderators,
            messages: [],
            therapeuticFocus: focus
        };

        this.rooms.set(roomId, room);
        return roomId;
    }

    public getRoomsByTopic(topic: string): ChatRoom[] {
        return Array.from(this.rooms.values())
            .filter(room => room.topics.includes(topic));
    }

    public getExpertsByExpertise(expertise: string): ExpertProfile[] {
        return Array.from(this.experts.values())
            .filter(expert => expert.expertise.includes(expertise));
    }

    private async sendSystemMessage(
        roomId: string,
        content: string
    ): Promise<void> {
        const message: ChatMessage = {
            id: `system_${Date.now()}`,
            senderId: 'system',
            content,
            timestamp: new Date(),
            tags: ['system']
        };

        const room = this.rooms.get(roomId);
        if (room) {
            room.messages.push(message);
            await this.notifyParticipants(room, message);
        }
    }

    private async notifyParticipants(
        room: ChatRoom,
        message: ChatMessage
    ): Promise<void> {
        // Implement notification logic
    }

    public getTherapeuticChatFeatures(): {
        supportFeatures: string[];
        communityFeatures: string[];
        expertFeatures: string[];
        safetyFeatures: string[];
    } {
        return {
            supportFeatures: [
                'Moderated support groups',
                'Expert-led sessions',
                'Peer support networks',
                'Progress sharing spaces'
            ],
            communityFeatures: [
                'Interest-based rooms',
                'Experience sharing',
                'Resource exchange',
                'Community events'
            ],
            expertFeatures: [
                'Certified expert access',
                'Scheduled consultations',
                'Knowledge sharing sessions',
                'Expert Q&A forums'
            ],
            safetyFeatures: [
                'Content moderation',
                'Safe space guidelines',
                'Support resources',
                'Crisis intervention protocols'
            ]
        };
    }

    public async createHempDiscussionRoom(
        topic: string,
        expertIds: string[]
    ): Promise<string> {
        const roomId = `hemp_${Date.now()}`;
        const room: ChatRoom = {
            id: roomId,
            name: `Hemp Discussion: ${topic}`,
            description: 'Focused discussion on hemp farming and processing',
            type: 'public',
            topics: ['hemp', topic],
            participants: [...expertIds],
            moderators: expertIds,
            messages: [],
            farmingTypes: ['hemp']
        };

        this.rooms.set(roomId, room);
        return roomId;
    }
}
