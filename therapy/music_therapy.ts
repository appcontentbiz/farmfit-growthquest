import { TherapeuticBenefit } from '../types/health';

interface MusicTherapySession {
    focus: string[];
    duration: number;
    tempo: number;
    instruments: string[];
    natureSound: boolean;
}

export class MusicTherapy {
    private readonly tempoRanges = {
        relaxation: { min: 60, max: 80 },
        focus: { min: 80, max: 100 },
        energy: { min: 100, max: 120 }
    };

    private readonly therapeuticPlaylists = {
        cognitive: [
            'Memory Enhancement Melodies',
            'Focus and Attention Tunes',
            'Brain Stimulation Rhythms'
        ],
        emotional: [
            'Calming Garden Sounds',
            'Mood Lifting Melodies',
            'Stress Relief Harmonies'
        ],
        physical: [
            'Movement Motivation',
            'Exercise Rhythms',
            'Activity Beats'
        ],
        social: [
            'Group Activity Themes',
            'Social Interaction Music',
            'Community Garden Sounds'
        ]
    };

    private readonly natureSounds = [
        'rainfall',
        'birdsong',
        'flowing water',
        'gentle breeze',
        'leaves rustling'
    ];

    public async generatePlaylist(
        therapeuticFocus: string[],
        duration: number
    ): Promise<string[]> {
        const session = this.createTherapySession(therapeuticFocus, duration);
        return this.selectMusic(session);
    }

    private createTherapySession(
        focus: string[],
        duration: number
    ): MusicTherapySession {
        const tempo = this.determineOptimalTempo(focus);
        const instruments = this.selectInstruments(focus);
        
        return {
            focus,
            duration,
            tempo,
            instruments,
            natureSound: this.shouldIncludeNatureSounds(focus)
        };
    }

    private determineOptimalTempo(focus: string[]): number {
        if (focus.includes('relaxation')) {
            return this.getRandomTempo(this.tempoRanges.relaxation);
        } else if (focus.includes('focus')) {
            return this.getRandomTempo(this.tempoRanges.focus);
        } else {
            return this.getRandomTempo(this.tempoRanges.energy);
        }
    }

    private getRandomTempo(range: { min: number; max: number }): number {
        return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    }

    private selectInstruments(focus: string[]): string[] {
        const instruments = new Set<string>();
        
        if (focus.includes('cognitive')) {
            instruments.add('piano');
            instruments.add('violin');
        }
        
        if (focus.includes('emotional')) {
            instruments.add('harp');
            instruments.add('flute');
        }
        
        if (focus.includes('physical')) {
            instruments.add('drums');
            instruments.add('percussion');
        }
        
        if (focus.includes('social')) {
            instruments.add('guitar');
            instruments.add('marimba');
        }

        return Array.from(instruments);
    }

    private shouldIncludeNatureSounds(focus: string[]): boolean {
        return focus.includes('relaxation') || focus.includes('emotional');
    }

    private selectMusic(session: MusicTherapySession): string[] {
        const playlist: string[] = [];
        const totalTracks = Math.ceil(session.duration / 5); // Assuming average track length of 5 minutes

        // Add therapeutic music tracks
        session.focus.forEach(focus => {
            if (this.therapeuticPlaylists[focus]) {
                playlist.push(...this.therapeuticPlaylists[focus]);
            }
        });

        // Add nature sounds if appropriate
        if (session.natureSound) {
            const natureSoundTrack = this.natureSounds[
                Math.floor(Math.random() * this.natureSounds.length)
            ];
            playlist.push(`Nature: ${natureSoundTrack}`);
        }

        // Ensure we have enough tracks
        while (playlist.length < totalTracks) {
            const randomFocus = session.focus[
                Math.floor(Math.random() * session.focus.length)
            ];
            if (this.therapeuticPlaylists[randomFocus]) {
                playlist.push(
                    this.therapeuticPlaylists[randomFocus][
                        Math.floor(Math.random() * this.therapeuticPlaylists[randomFocus].length)
                    ]
                );
            }
        }

        return playlist.slice(0, totalTracks);
    }

    public getRecommendedActivities(
        focus: string[]
    ): { activity: string; music: string }[] {
        const activities = [];

        if (focus.includes('cognitive')) {
            activities.push({
                activity: 'Memory Garden Walk',
                music: 'Memory Enhancement Melodies'
            });
        }

        if (focus.includes('emotional')) {
            activities.push({
                activity: 'Sensory Garden Experience',
                music: 'Calming Garden Sounds'
            });
        }

        if (focus.includes('physical')) {
            activities.push({
                activity: 'Rhythmic Gardening',
                music: 'Movement Motivation'
            });
        }

        if (focus.includes('social')) {
            activities.push({
                activity: 'Group Planting Session',
                music: 'Community Garden Sounds'
            });
        }

        return activities;
    }
}
